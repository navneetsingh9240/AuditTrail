/**
 * MID-PROJECT REVIEW — Immutability Audit
 * ------------------------------------------------------------
 * Proves the Event Store rejects UPDATE and DELETE operations.
 * Run with: npm run audit:immutability
 */

const { connectDB, mongoose } = require("../config/db");
const Event = require("../models/Event");
const { appendEvent } = require("../services/eventStore");

async function expectRejection(label, fn) {
  try {
    await fn();
    console.log(`❌ FAIL — ${label}: operation was NOT rejected (immutability broken!)`);
    return false;
  } catch (err) {
    console.log(`✅ PASS — ${label}: rejected as expected -> "${err.message}"`);
    return true;
  }
}

async function run() {
  await connectDB();

  const aggregateId = `AUDIT-TEST-${Date.now()}`;
  const seeded = await appendEvent(aggregateId, "CONTAINER_CREATED", { origin: "PORT_A" }, 0);
  console.log(`\nSeeded test event: ${seeded._id} (v${seeded.version})\n`);

  let allPassed = true;

  allPassed &= await expectRejection("updateOne", () =>
    Event.updateOne({ _id: seeded._id }, { $set: { eventType: "TAMPERED" } })
  );

  allPassed &= await expectRejection("findOneAndUpdate", () =>
    Event.findOneAndUpdate({ _id: seeded._id }, { $set: { eventType: "TAMPERED" } })
  );

  allPassed &= await expectRejection("deleteOne", () =>
    Event.deleteOne({ _id: seeded._id })
  );

  allPassed &= await expectRejection("findOneAndDelete", () =>
    Event.findOneAndDelete({ _id: seeded._id })
  );

  console.log(
    allPassed
      ? "\nImmutability audit: ALL CHECKS PASSED.\n"
      : "\nImmutability audit: ONE OR MORE CHECKS FAILED — investigate before review.\n"
  );

  await mongoose.disconnect();
  process.exit(allPassed ? 0 : 1);
}

run().catch((err) => {
  console.error("Audit script crashed:", err);
  process.exit(1);
});
