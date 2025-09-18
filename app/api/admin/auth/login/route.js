import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { initializeDatabase, Admin } from "@/lib/sequelize";

export async function POST(request) {
  try {
    // Ensure DB is initialized (same pattern as submissions API)
    await initializeDatabase();

    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    // Find admin by email
    const admin = await Admin.findOne({ where: { email } });

    if (!admin) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    // Return admin data (without password)
    const adminData = {
      id: admin.id,
      username: admin.username,
      email: admin.email,
    };

    return NextResponse.json({
      success: true,
      message: "Login berhasil",
      admin: adminData,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
