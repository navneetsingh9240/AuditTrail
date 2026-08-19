/**
 * WEEK 1 — Database Setup / Connection Layer
 * ------------------------------------------------------------
 * Single Mongoose connection shared by both the Command side
 * (writes to the Event Store) and the Query side (reads from
 * the Read Model). CQRS separates the ROUTES, not necessarily
 * the physical database — both routers use this same connection,
 * but only ever touch their own collection.
 */

const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/audit_trail";

async function connectDB() {
  mongoose.set("strictQuery", true);

  await mongoose.connect(MONGO_URI, {
    // Mongoose 8 no longer needs useNewUrlParser / useUnifiedTopology,
    // kept here as explicit documentation of intent.
    autoIndex: true,
  });

  console.log(`[db] connected -> ${MONGO_URI}`);

  mongoose.connection.on("error", (err) => {
    console.error("[db] connection error:", err);
  });

  return mongoose.connection;
}

module.exports = { connectDB, mongoose };
