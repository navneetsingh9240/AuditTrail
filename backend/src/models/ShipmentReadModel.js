/**
 * WEEK 3 — Read Model (Projection) Schema
 * ------------------------------------------------------------
 * Highly optimized, denormalized read model collection for fast lookups.
 * Updated asynchronously by the projection worker when new events are appended.
 */

import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const ShipmentReadModelSchema = new Schema(
  {
    shipmentId: {
      type: String,
      required: [true, 'shipmentId is required'],
      unique: true,
      trim: true,
      index: true
    },
    origin: { type: String, default: '', trim: true },
    destination: { type: String, default: '', trim: true },
    carrier: { type: String, default: 'Standard Logistics', trim: true },
    currentLocation: { type: String, default: '', trim: true },
    status: {
      type: String,
      default: 'UNKNOWN',
      trim: true,
      uppercase: true,
      index: true
    },
    lastVersion: { type: Number, default: 0, min: 0 },
    eventsCount: { type: Number, default: 0, min: 0 },
    lastUpdated: { type: Date, default: Date.now }
  },
  {
    timestamps: true,
    collection: 'shipment_read_models'
  }
);

// Index for query filtering performance
ShipmentReadModelSchema.index({ status: 1, lastUpdated: -1 });

const ShipmentReadModel = model('ShipmentReadModel', ShipmentReadModelSchema);

export default ShipmentReadModel;
