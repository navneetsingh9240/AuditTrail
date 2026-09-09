/**
 * Master Comprehensive Automated Test Suite — Audit Trail CQRS Backend
 * ---------------------------------------------------------------------
 * Tests end-to-end functionality across all project milestone requirements:
 * 1. Health check & system status
 * 2. CQRS Command Router & Payload Validation
 * 3. Optimistic Concurrency Control (OCC) & 409 Conflict Rejection
 * 4. Event Store Immutability Enforcement Audit
 * 5. Forensic Sensor Telemetry & Temperature Spike Recording
 * 6. Read Model Projections & Fast Read Path Performance
 * 7. Point-in-Time Historical State Scrubbing
 * 8. Event Replay State Reconstruction Proof
 */

import http from 'http';
import app from '../src/app.js';

const PORT = 5098;
const BASE_URL = `http://localhost:${PORT}`;

async function runTestSuite() {
  const server = http.createServer(app);

  server.listen(PORT, async () => {
    console.log(`\n===========================================================`);
    console.log(`🧪 Starting Audit Trail Backend Final Master Test Suite`);
    console.log(`===========================================================\n`);

    let passed = 0;
    let failed = 0;

    const assert = (condition, testName, details = '') => {
      if (condition) {
        console.log(`  ✅ PASSED: ${testName}`);
        passed++;
      } else {
        console.error(`  ❌ FAILED: ${testName} - ${details}`);
        failed++;
      }
    };

    try {
      // Test 1: Health Check Endpoint
      const resHealth = await fetch(`${BASE_URL}/health`);
      const bodyHealth = await resHealth.json();
      assert(
        resHealth.status === 200 && bodyHealth.status === 'UP',
        'GET /health announces service UP',
        `Status: ${resHealth.status}`
      );

      // Test 2: Immutability Audit Endpoint
      const resImmutability = await fetch(`${BASE_URL}/api/queries/audit/immutability`);
      const bodyImmutability = await resImmutability.json();
      assert(
        resImmutability.status === 200 && bodyImmutability.auditPassed === true,
        'GET /api/queries/audit/immutability proves UPDATE & DELETE blocked',
        `Status: ${resImmutability.status}, AuditPassed: ${bodyImmutability.auditPassed}`
      );

      // Test 3: OCC Audit Endpoint
      const resOCC = await fetch(`${BASE_URL}/api/queries/audit/occ`);
      const bodyOCC = await resOCC.json();
      assert(
        resOCC.status === 200 && bodyOCC.occActive === true,
        'GET /api/queries/audit/occ proves Optimistic Concurrency Control is active',
        `Status: ${resOCC.status}`
      );

      const testId = `CONT-TEST-${Date.now()}`;

      // Test 4: Create Shipment Aggregate Command
      const resCreate = await fetch(`${BASE_URL}/api/commands/shipment/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: testId,
          origin: 'Yokohama Port',
          destination: 'Seattle Terminal',
          carrier: 'Pacific ColdChain Express'
        })
      });
      const bodyCreate = await resCreate.json();
      assert(
        resCreate.status === 201 && bodyCreate.event.version === 1,
        'POST /api/commands/shipment/create appends initial event (version 1)',
        `Status: ${resCreate.status}, Version: ${bodyCreate?.event?.version}`
      );

      // Test 5: Move Shipment Command with matching expectedVersion: 1
      const resMove = await fetch(`${BASE_URL}/api/commands/shipment/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: testId,
          location: 'Mid-Pacific Waypoint 1',
          expectedVersion: 1
        })
      });
      const bodyMove = await resMove.json();
      assert(
        resMove.status === 202 && bodyMove.event.version === 2,
        'POST /api/commands/shipment/move with expectedVersion: 1 appends version 2',
        `Status: ${resMove.status}, Version: ${bodyMove?.event?.version}`
      );

      // Test 6: OCC Conflict Rejection with STALE expectedVersion: 1
      const resStale = await fetch(`${BASE_URL}/api/commands/shipment/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: testId,
          location: 'Stale Attempt',
          expectedVersion: 1
        })
      });
      const bodyStale = await resStale.json();
      assert(
        resStale.status === 409 && bodyStale.code === 'CONCURRENCY_CONFLICT',
        'POST /api/commands/shipment/move with STALE expectedVersion returns HTTP 409 Conflict',
        `Status: ${resStale.status}, Error Code: ${bodyStale.code}`
      );

      // Test 7: Record Sensor Telemetry Command (Temperature Spike) with expectedVersion: 2
      const resSensor = await fetch(`${BASE_URL}/api/commands/shipment/sensor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: testId,
          temperatureC: 13.4,
          humidity: 82,
          location: 'Mid-Pacific Waypoint 2',
          expectedVersion: 2,
          notes: 'Reefer power fluctuation warning'
        })
      });
      const bodySensor = await resSensor.json();
      assert(
        resSensor.status === 202 && bodySensor.event.version === 3 && bodySensor.event.eventType === 'TEMPERATURE_SPIKE',
        'POST /api/commands/shipment/sensor records TEMPERATURE_SPIKE event (version 3)',
        `Status: ${resSensor.status}, Type: ${bodySensor?.event?.eventType}`
      );

      // Test 8: Query aggregate current state snapshot
      const resQuery = await fetch(`${BASE_URL}/api/queries/shipment/${testId}`);
      const bodyQuery = await resQuery.json();
      assert(
        resQuery.status === 200 && bodyQuery.data.version === 3 && bodyQuery.data.hasTemperatureAlert === true,
        'GET /api/queries/shipment/:id calculates aggregate state with sensor alerts',
        `Status: ${resQuery.status}, Version: ${bodyQuery?.data?.version}, Alert: ${bodyQuery?.data?.hasTemperatureAlert}`
      );

      // Test 9: State Scrubbing (Point-in-Time Time Travel) up to version 2
      const resScrub = await fetch(`${BASE_URL}/api/queries/shipment/${testId}/scrub?version=2`);
      const bodyScrub = await resScrub.json();
      assert(
        resScrub.status === 200 && bodyScrub.data.version === 2 && bodyScrub.data.isHistoricalSnapshot === true,
        'GET /api/queries/shipment/:id/scrub?version=2 rewinds state back to version 2',
        `Status: ${resScrub.status}, Scrub Version: ${bodyScrub?.data?.version}`
      );

      // Test 10: Event Replay Reconstruction Check
      const resReconstruct = await fetch(`${BASE_URL}/api/queries/shipment/${testId}/reconstruct`);
      const bodyReconstruct = await resReconstruct.json();
      assert(
        resReconstruct.status === 200 && bodyReconstruct.totalEventsReplayed === 3,
        'GET /api/queries/shipment/:id/reconstruct replays all events step-by-step',
        `Status: ${resReconstruct.status}, Replayed Count: ${bodyReconstruct.totalEventsReplayed}`
      );

      // Test 11: Dashboard Summary Query API
      const resDashboard = await fetch(`${BASE_URL}/api/queries/dashboard`);
      const bodyDashboard = await resDashboard.json();
      assert(
        resDashboard.status === 200 && bodyDashboard.data.stats.totalEvents > 0,
        'GET /api/queries/dashboard returns full dashboard telemetry dataset',
        `Status: ${resDashboard.status}, Events: ${bodyDashboard?.data?.stats?.totalEvents}`
      );

      console.log(`\n===========================================================`);
      console.log(`🏁 Master Test Results: ${passed} Passed, ${failed} Failed`);
      console.log(`===========================================================\n`);

      server.close(() => {
        if (failed > 0) {
          process.exit(1);
        } else {
          process.exit(0);
        }
      });
    } catch (err) {
      console.error('Master Test Suite Exception:', err);
      server.close(() => process.exit(1));
    }
  });
}

runTestSuite();
