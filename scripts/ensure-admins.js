const { sequelize, initializeDatabase, Admin } = require("../lib/sequelize");
const bcrypt = require("bcryptjs");

async function run() {
  try {
    await initializeDatabase();

    const defaults = [
      { username: "admin", email: "admin@diskominfo.bogorkab.go.id", rawPassword: "admin123" },
      { username: "operator", email: "operator@diskominfo.bogorkab.go.id", rawPassword: "operator123" },
    ];

    for (const item of defaults) {
      const existing = await Admin.findOne({ where: { email: item.email } });
      const hashed = await bcrypt.hash(item.rawPassword, 10);

      if (!existing) {
        await Admin.create({ username: item.username, email: item.email, password: hashed });
        console.log(`✅ Created admin ${item.email}`);
      } else {
        // ensure username is set and password is hashed as expected
        existing.username = existing.username || item.username;
        existing.password = hashed;
        await existing.save();
        console.log(`🔄 Updated admin ${item.email}`);
      }
    }

    console.log("🎉 Ensure admins completed.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to ensure admins:", err);
    process.exit(1);
  }
}

run();


