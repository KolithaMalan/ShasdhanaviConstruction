/* eslint-disable no-console */
import { config as loadEnv } from "dotenv";
import path from "node:path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Load env from .env.local first, then fall back to .env
loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

import { UserModel } from "../src/models/User";
import type { Role } from "../src/types";

interface SeedUser {
  name: string;
  email: string;
  role: Role;
  passwordEnv: string;
}

const seedUsers: SeedUser[] = [
  {
    name: "Sahas Super Admin",
    email: "SuperadminSahas@gmail.com",
    role: "SUPER_ADMIN",
    passwordEnv: "SEED_SUPER_ADMIN_PASSWORD",
  },
  {
    name: "Nuwan Rasika",
    email: "NuwanRasika@gmail.com",
    role: "ADMIN_HSEQ",
    passwordEnv: "SEED_ADMIN_PASSWORD",
  },
  {
    name: "Mahawatha",
    email: "Mahawatha@gmail.com",
    role: "MEDICAL_OFFICER",
    passwordEnv: "SEED_MEDICAL_PASSWORD",
  },
  {
    name: "Dinesh",
    email: "Dinesh@gmail.com",
    role: "HSEQ_OFFICER",
    passwordEnv: "SEED_HSEQ_PASSWORD",
  },
  {
    name: "Gate Security Officer",
    email: "securityGateOfficer@gmail.com",
    role: "SECURITY_OFFICER",
    passwordEnv: "SEED_SECURITY_PASSWORD",
  },
  {
    name: "Lak Internal",
    email: "LakInternal@gmail.com",
    role: "INTERNAL_SECURITY",
    passwordEnv: "SEED_INTERNAL_SECURITY_PASSWORD",
  },
];

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("✖ MONGODB_URI is not set in .env.local");
    process.exit(1);
  }

  console.log("→ Connecting to MongoDB…");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15_000 });
  console.log("✓ Connected");

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const user of seedUsers) {
    const rawPassword = process.env[user.passwordEnv];

    if (!rawPassword) {
      console.warn(
        `! Skipping ${user.email} — ${user.passwordEnv} is empty in .env.local`,
      );
      skipped += 1;
      continue;
    }

    const hashed = await bcrypt.hash(rawPassword, 10);
    const email = user.email.toLowerCase().trim();

    const existing = await UserModel.findOne({ email }).select("+password");

    if (!existing) {
      await UserModel.create({
        name: user.name,
        email,
        password: hashed,
        role: user.role,
        isActive: true,
      });
      console.log(`✓ Created  ${user.role.padEnd(20)} ${email}`);
      created += 1;
    } else {
      existing.name = user.name;
      existing.role = user.role;
      existing.isActive = true;
      existing.password = hashed;
      await existing.save();
      console.log(`↻ Updated  ${user.role.padEnd(20)} ${email}`);
      updated += 1;
    }
  }

  console.log("");
  console.log("─────────────────────────────────────");
  console.log(`Created: ${created}  Updated: ${updated}  Skipped: ${skipped}`);
  console.log("─────────────────────────────────────");

  await mongoose.disconnect();
  console.log("✓ Disconnected. Done.");
}

main().catch((err) => {
  console.error("✖ Seed failed:", err);
  void mongoose.disconnect().finally(() => process.exit(1));
});
