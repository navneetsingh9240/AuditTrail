/**
 * Standalone Database Seeder
 * Usage: node src/seed.js
 * Populates MongoDB Event Store with initial logistics ledger events.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Event from './models/Event.js';
import ShipmentReadModel from './models/ShipmentReadModel.js';
import projectionWorker from './services/projectionWorker.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/audit_trail";

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
    aggregateId: "SHP-1001",
    eventType: "TEMPERATURE_SPIKE",
    payload: {
      location: "Pacific Transit Zone B",
      status: "ALERT_TEMPERATURE_SPIKE",
      temperatureC: 12.8,
      notes: "Reefer cooling compressor power interruption detected"
    },
    version: 3,
    timestamp: new Date("2026-08-20T04:15:00.000Z")
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
  },
  {
    aggregateId: "CONT-9082",
    eventType: "CONTAINER_CREATED",
    payload: {
      origin: "Shenzhen Port",
      destination: "Port of Long Beach",
      carrier: "Global Shipping Co",
      status: "CREATED"
    },
    version: 1,
    timestamp: new Date("2026-08-18T06:00:00.000Z")
  },
  {
    aggregateId: "CONT-9082",
    eventType: "LOADED_ON_SHIP",
    payload: {
      location: "Vessel Pacific Empress",
      carrier: "Global Shipping Co",
      status: "LOADED_ON_SHIP"
    },
    version: 2,
    timestamp: new Date("2026-08-18T14:20:00.000Z")
  },
  {
    aggregateId: "CONT-9082",
    eventType: "TEMPERATURE_SPIKE",
    payload: {
      location: "Mid-Pacific Co-ordinates 32N 165W",
      status: "ALERT_TEMPERATURE_SPIKE",
      temperatureC: 14.5,
      humidity: 88,
      notes: "Critical cold-chain threshold breached"
    },
    version: 3,
    timestamp: new Date("2026-08-21T02:10:00.000Z")
  },
  {
    aggregateId: "CONT-9082",
    eventType: "ARRIVED_AT_PORT",
    payload: {
      location: "Port of Long Beach Terminal 4",
      status: "ARRIVED_AT_PORT"
    },
    version: 4,
    timestamp: new Date("2026-08-24T18:45:00.000Z")
  }
];

async function runSeed() {
  try {
    console.log(`[Seed] Connecting to MongoDB -> ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI, { autoIndex: true, serverSelectionTimeoutMS: 5000 });
    console.log(`[Seed] Connected.`);

    console.log(`[Seed] Clearing existing events and read models...`);
    // Note: We bypass Mongoose middleware by using native collection drops/deleteMany for seed reset script
    await mongoose.connection.collection('events').deleteMany({});
    await mongoose.connection.collection('shipment_read_models').deleteMany({});

    console.log(`[Seed] Inserting ${seedEvents.length} initial audit events...`);
    await Event.insertMany(seedEvents);

    console.log(`[Seed] Rebuilding denormalized Read Models...`);
    const result = await projectionWorker.rebuildAllProjections();
    console.log(`[Seed] Success! Projections rebuilt:`, result);

    await mongoose.disconnect();
    console.log(`[Seed] Done.`);
    process.exit(0);
  } catch (err) {
    console.error(`[Seed Error]`, err);
    process.exit(1);
  }
}

runSeed();
