import { NextResponse } from "next/server";
import { Submission, initializeDatabase } from "@/lib/sequelize";
import { Op, fn, col, where as sequelizeWhere, literal } from "sequelize";

// Initialize database on first request
let dbInitialized = false;
const initDB = async () => {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
};

export async function GET(request) {
  try {
    await initDB();

    // In a real application, you would verify admin authentication here
    // For workshop purposes, we'll skip authentication

    // Parse cache-busting and search/sort query parameters
    const url = new URL(request.url);
    const queryTimestamp = url.searchParams.get("t");
    const queryRandom = url.searchParams.get("r");
    const queryForce = url.searchParams.get("force");
    const queryCacheBuster = url.searchParams.get("cb");
    const search = (url.searchParams.get("search") || "").trim();
    const sortBy = (url.searchParams.get("sortBy") || "created_at").trim();
    const sortDirRaw = (url.searchParams.get("sortDir") || "DESC").trim().toUpperCase();
    const sortDir = sortDirRaw === "ASC" ? "ASC" : "DESC";

    // Force fresh data dengan multiple strategies
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const forceRefresh = Date.now();

    console.log(
      `[${new Date().toISOString()}] Fetching submissions with force refresh: ${timestamp}-${random}-${forceRefresh}`
    );
    console.log(
      `[${new Date().toISOString()}] Query params: t=${queryTimestamp}, r=${queryRandom}, force=${queryForce}, cb=${queryCacheBuster}`
    );

    // Force fresh query dengan random order strategy
    const randomOrder = Math.random() > 0.5 ? "ASC" : "DESC";
    console.log(
      `[${new Date().toISOString()}] Using random order: ${randomOrder}`
    );

    // Determine LIKE operator based on dialect
    const dialect = Submission.sequelize.getDialect();
    const likeOperator = dialect === "postgres" ? Op.iLike : Op.like;

    // Optional: map human-readable status terms to enum values
    const normalized = search.toLowerCase();
    let statusSearch = undefined;
    if (["pengajuan baru", "baru", "PENGAJUAN_BARU".toLowerCase()].some((s) => normalized.includes(s))) {
      statusSearch = "PENGAJUAN_BARU";
    } else if (["diproses", "proses", "DIPROSES".toLowerCase()].some((s) => normalized.includes(s))) {
      statusSearch = "DIPROSES";
    } else if (["selesai", "SELESAI".toLowerCase()].some((s) => normalized.includes(s))) {
      statusSearch = "SELESAI";
    } else if (["ditolak", "DITOLAK".toLowerCase()].some((s) => normalized.includes(s))) {
      statusSearch = "DITOLAK";
    }

    // Build where clause for search: apply LIKE to text columns only; for status use equality if mapped
    const whereClause = search
      ? {
          [Op.or]: [
            { tracking_code: { [likeOperator]: `%${search}%` } },
            { nama: { [likeOperator]: `%${search}%` } },
            { jenis_layanan: { [likeOperator]: `%${search}%` } },
            ...(statusSearch ? [{ status: statusSearch }] : []),
          ],
        }
      : undefined;

    // Whitelist sortable fields
    const sortableFields = new Set([
      "created_at",
      "updated_at",
      "nama",
      "status",
      "jenis_layanan",
      "tracking_code",
    ]);
    const orderField = sortableFields.has(sortBy) ? sortBy : "created_at";

    const submissions = await Submission.findAll({
      where: whereClause,
      order: [[orderField, sortDir]],
      attributes: [
        "id",
        "tracking_code",
        "nama",
        "jenis_layanan",
        "status",
        "created_at",
        "updated_at",
      ],
      raw: false,
      logging: console.log,
    });

    console.log(
      `[${new Date().toISOString()}] Found ${submissions.length} submissions`
    );
    if (submissions.length > 0) {
      console.log(
        `[${new Date().toISOString()}] Latest submission: ${
          submissions[0].tracking_code
        } (${submissions[0].status})`
      );
    }

    // Vercel-specific no-cache headers
    const response = NextResponse.json(submissions);

    // Ultra-aggressive cache control
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate, private, max-age=0, s-maxage=0, stale-while-revalidate=0"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("Clear-Site-Data", '"cache"');

    // Vercel-specific headers
    response.headers.set("Surrogate-Control", "no-store");
    response.headers.set("CDN-Cache-Control", "no-cache");
    response.headers.set("Vercel-CDN-Cache-Control", "no-cache");
    response.headers.set("X-Vercel-Cache", "MISS");

    // Force fresh response dengan dynamic values dan query params
    response.headers.set("Last-Modified", new Date().toUTCString());
    response.headers.set(
      "ETag",
      `"${timestamp}-${random}-${forceRefresh}-${queryTimestamp}-${queryRandom}"`
    );
    response.headers.set("X-Response-Time", `${Date.now()}`);
    response.headers.set(
      "X-Cache-Buster",
      `${timestamp}-${random}-${queryCacheBuster}`
    );
    response.headers.set("X-Force-Refresh", "true");
    response.headers.set(
      "X-Query-Params",
      `${queryTimestamp}-${queryRandom}-${queryForce}`
    );

    return response;
  } catch (error) {
    console.error("Error fetching submissions:", error);

    const errorResponse = NextResponse.json(
      { message: "Terjadi kesalahan internal server" },
      { status: 500 }
    );

    // Same headers for errors
    errorResponse.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate, private"
    );
    errorResponse.headers.set("Pragma", "no-cache");
    errorResponse.headers.set("Expires", "0");
    errorResponse.headers.set("Surrogate-Control", "no-store");
    errorResponse.headers.set("CDN-Cache-Control", "no-cache");

    return errorResponse;
  }
}
