import mongoose from 'mongoose';
import Event from '../models/Event.js';

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/audit_trail";

export async function seedInitialEventsIfEmpty() {
  try {
    const count = await Event.countDocuments();
    if (count === 0) {
      const seedEvents = [
        {
          aggregateId: "SHP-1001",
          eventType: "SHIPMENT_CREATED",
          payload: {
            origin: "Port of Shanghai",
            destination: "Port of Los Angeles",
            carrier: "Oceanic Cargo Ltd",
            status: "CREATED"
          },
          version: 1,
          timestamp: new Date("2026-08-19T08:00:00.000Z")
        },
        {
          aggregateId: "SHP-1001",
          eventType: "SHIPMENT_MOVED",
          payload: {
            location: "Pacific Transit Zone A",
            status: "IN_TRANSIT",
            temperatureC: 4.2
          },
          version: 2,
          timestamp: new Date("2026-08-19T12:30:00.000Z")
        },
        {
          aggregateId: "SHP-1002",
          eventType: "SHIPMENT_CREATED",
          payload: {
            origin: "Rotterdam Terminal",
            destination: "Hamburg Hub",
            carrier: "EuroFreight Logistics",
            status: "CREATED"
          },
          version: 1,
          timestamp: new Date("2026-08-19T10:15:00.000Z")
        }
      ];
      await Event.insertMany(seedEvents);
      console.log("[db] Initial seed events populated into MongoDB Event Store.");
    }
  } catch (err) {
    console.warn("[db] Seed check warning:", err.message);
  }
}

export async function connectDB() {
  try {
    mongoose.set("strictQuery", true);
    const conn = await mongoose.connect(MONGO_URI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[db] Connected successfully -> ${MONGO_URI}`);
    await seedInitialEventsIfEmpty();
    return conn.connection;
  } catch (err) {
    console.warn(`[db] MongoDB connection notice: ${err.message}. Backend running in hybrid mode with in-memory fallback.`);
    return null;
  }
}

mongoose.connection.on("error", (err) => {
  console.error("[db] MongoDB connection error:", err.message);
});

export default connectDB;