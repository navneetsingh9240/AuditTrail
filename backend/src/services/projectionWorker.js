/**
 * WEEK 3 — Projection Worker (Background Read Model Synchronizer)
 * ------------------------------------------------------------
 * Listens to newly appended events and updates the denormalized
 * MongoDB ShipmentReadModel collection asynchronously.
 */

import EventEmitter from 'events';
import mongoose from 'mongoose';
import ShipmentReadModel from '../models/ShipmentReadModel.js';
import Event from '../models/Event.js';
import { foldEventsToShipmentState } from '../store/eventSourcingEngine.js';

class ProjectionWorker extends EventEmitter {
  constructor() {
    super();
    // Register background worker listener for event streams
    this.on('event:appended', this.handleEventAppended.bind(this));
  }

  /**
   * Handle incoming event asynchronously without blocking the write command path.
   */
  async handleEventAppended(event) {
    if (!event || !event.aggregateId) return;

    try {
      if (mongoose.connection.readyState !== 1) return;
      await this.projectSingleEvent(event);
    } catch (err) {
      console.error(`[ProjectionWorker Error] Failed to project event for aggregate '${event.aggregateId}':`, err.message);
    }
  }

  /**
   * Project a single aggregate's event stream into the ShipmentReadModel collection
   */
  async projectSingleEvent(event) {
    const { aggregateId, timestamp } = event;

    const events = await Event.find({ aggregateId }).sort({ version: 1 }).lean();
    if (!events || events.length === 0) return;

    const projectedState = foldEventsToShipmentState(events, aggregateId);
    if (!projectedState) return;

    await ShipmentReadModel.findOneAndUpdate(
      { shipmentId: aggregateId },
      {
        shipmentId: aggregateId,
        origin: projectedState.origin,
        destination: projectedState.destination,
        carrier: projectedState.carrier,
        currentLocation: projectedState.currentLocation,
        status: projectedState.status,
        lastVersion: projectedState.version,
        eventsCount: projectedState.eventsCount,
        lastUpdated: projectedState.lastUpdated || timestamp || new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  /**
   * Full rebuild trigger: Reads all events and syncs/rebuilds read models
   */
  async rebuildAllProjections() {
    if (mongoose.connection.readyState !== 1) {
      return { success: false, message: 'MongoDB not connected' };
    }

    const allEvents = await Event.find({}).sort({ aggregateId: 1, version: 1 }).lean();
    const eventsByAggregate = new Map();

    for (const evt of allEvents) {
      if (!eventsByAggregate.has(evt.aggregateId)) {
        eventsByAggregate.set(evt.aggregateId, []);
      }
      eventsByAggregate.get(evt.aggregateId).push(evt);
    }

    let projectedCount = 0;
    for (const [aggId, aggEvents] of eventsByAggregate.entries()) {
      const state = foldEventsToShipmentState(aggEvents, aggId);
      if (state) {
        await ShipmentReadModel.findOneAndUpdate(
          { shipmentId: aggId },
          {
            shipmentId: aggId,
            origin: state.origin,
            destination: state.destination,
            carrier: state.carrier,
            currentLocation: state.currentLocation,
            status: state.status,
            lastVersion: state.version,
            eventsCount: state.eventsCount,
            lastUpdated: state.lastUpdated || new Date()
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        projectedCount++;
      }
    }

    return {
      success: true,
      totalAggregates: eventsByAggregate.size,
      projectedCount
    };
  }
}

const projectionWorker = new ProjectionWorker();
export default projectionWorker;
