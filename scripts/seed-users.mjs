// Seeds officer emails (department comes from this list) and demo contractors.
// Run after scripts/migrations/002_otp_contractors.sql:
//   node --env-file=.env.local scripts/seed-users.mjs
// Sign-in is by emailed code, so no passwords are set. Replace the example addresses with
// real inboxes you can read, otherwise the codes can't be delivered.
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// [email, department]. null department = admin. Department text must match lib/departments.ts exactly.
const AUTHORITIES = [
  ["admin@civicfix.in", null],
  ["roads@civicfix.in", "Roads (MCD/PWD)"],
  ["sanitation@civicfix.in", "Sanitation (MCD)"],
  ["djb@civicfix.in", "Delhi Jal Board"],
  ["lights@civicfix.in", "Street Lighting"],
  ["traffic@civicfix.in", "Traffic Police"],
  ["general@civicfix.in", "General Services"],
];

// [email, name, phone, departments, lat, lng, radiusKm]
const CONTRACTORS = [
  ["sharma.infra@example.com", "Sharma Infra Works", "+91 98100 00001", ["Roads (MCD/PWD)"], 28.6139, 77.209, 12],
  ["south.roads@example.com", "South Delhi Roadways", "+91 98100 00002", ["Roads (MCD/PWD)", "Traffic Police"], 28.5245, 77.2066, 8],
  ["cleancity@example.com", "CleanCity Services", "+91 98100 00003", ["Sanitation (MCD)", "General Services"], 28.6519, 77.2315, 15],
  ["aqua.fix@example.com", "AquaFix Plumbing", "+91 98100 00004", ["Delhi Jal Board"], 28.6304, 77.2177, 20],
  ["brightway@example.com", "Brightway Electricals", "+91 98100 00005", ["Street Lighting"], 28.6, 77.2, 25],
];

for (const [email, dept] of AUTHORITIES) {
  await pool.query(
    `insert into authority_emails (email, department) values ($1, $2)
     on conflict (email) do update set department = excluded.department`,
    [email, dept],
  );
}

for (const [email, name, phone, depts, lat, lng, radius] of CONTRACTORS) {
  await pool.query(
    `insert into contractors (email, name, phone, departments, lat, lng, radius_km)
     values ($1, $2, $3, $4, $5, $6, $7)
     on conflict (email) do update set name = excluded.name, phone = excluded.phone,
       departments = excluded.departments, lat = excluded.lat, lng = excluded.lng, radius_km = excluded.radius_km`,
    [email, name, phone, depts, lat, lng, radius],
  );
}

await pool.end();
console.log("seeded", AUTHORITIES.length, "officer emails and", CONTRACTORS.length, "contractors");
