// Copies student accounts from your LAPTOP database to the ONLINE (Atlas) database.
// Use it once, for accounts you created before the app went online.
//
// Run from the backend folder (PowerShell):
//   $env:ATLAS_URI="mongodb+srv://...your Atlas link.../library_app?retryWrites=true&w=majority"
//   npm run copy-students
//
// - Reads from the MONGO_URI in backend/.env (your laptop MongoDB)
// - Writes to ATLAS_URI
// - Passwords stay the same (they are copied already hashed)
// - Students that already exist online (same roll number) are skipped
// - Only accounts are copied, not their old reservations
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const localUri = dotenv.parse(fs.readFileSync(path.join(__dirname, "..", ".env"))).MONGO_URI;
const atlasUri = process.env.ATLAS_URI;

const run = async () => {
  if (!atlasUri) throw new Error('Set ATLAS_URI first, e.g. $env:ATLAS_URI="mongodb+srv://..."');
  if (!localUri) throw new Error("MONGO_URI is missing in backend/.env");
  if (localUri === atlasUri) throw new Error("ATLAS_URI is the same as your laptop MONGO_URI");

  const local = await mongoose.createConnection(localUri).asPromise();
  const online = await mongoose.createConnection(atlasUri).asPromise();
  console.log(`From: ${local.host}  ->  To: ${online.host}`);

  const students = await local.collection("students").find().toArray();
  let copied = 0;
  for (const s of students) {
    const exists = await online.collection("students").findOne({ rollNumber: s.rollNumber });
    if (exists) {
      console.log(`  skip   ${s.rollNumber}  ${s.name} (already online)`);
      continue;
    }
    await online.collection("students").insertOne(s);
    console.log(`  copied ${s.rollNumber}  ${s.name}`);
    copied++;
  }

  console.log(`\nDone. Copied ${copied} of ${students.length} students.`);
  await local.close();
  await online.close();
};

run().catch((err) => {
  console.error("Copy failed:", err.message);
  process.exit(1);
});
