/**
 * Week 4 Automated Optimistic Concurrency Control (OCC) Test Suite
 * ------------------------------------------------------------
 * Tests endpoint responses for expected version matches and stale version 409 Conflict rejections.
 */

import http from 'http';
import app from '../src/app.js';

const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}`;

function runTest() {
  const server = http.createServer(app);

  server.listen(PORT, async () => {
    console.log(`\n===========================================================`);
    console.log(`🧪 Starting Week 4 Optimistic Concurrency Control (OCC) Tests`);
    console.log(`===========================================================\n`);

    let passedTests = 0;
    let failedTests = 0;

    const assert = (condition, testName, details = '') => {
      if (condition) {
        console.log(`  ✅ PASSED: ${testName}`);
        passedTests++;
      } else {
        console.error(`  ❌ FAILED: ${testName} - ${details}`);
        failedTests++;
      }
    };

    try {
      // Test 1: Health Check Endpoint
      const resHealth = await fetch(`${BASE_URL}/health`);
      const bodyHealth = await resHealth.json();
      assert(
        resHealth.status === 200 && bodyHealth.week.includes('Week 4'),
        'GET /health announces Week 4 OCC Complete',
        `Status: ${resHealth.status}, Week: ${bodyHealth.week}`
      );

      // Test 2: OCC Audit Endpoint
      const resAudit = await fetch(`${BASE_URL}/api/queries/audit/occ`);
      const bodyAudit = await resAudit.json();
      assert(
        resAudit.status === 200 && bodyAudit.occActive === true,
        'GET /api/queries/audit/occ returns active OCC status',
        `Status: ${resAudit.status}`
      );

      const testShipmentId = `SHP-OCC-${Date.now()}`;

      // Test 3: Create Shipment Aggregate
      const resCreate = await fetch(`${BASE_URL}/api/commands/shipment/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: testShipmentId,
          origin: 'Origin Dock A',
          destination: 'Dest Warehouse B',
          carrier: 'OCC Express Logistics'
        })
      });
      const bodyCreate = await resCreate.json();
      assert(
        resCreate.status === 201 && bodyCreate.event.version === 1,
        'POST /shipment/create creates initial aggregate at version 1',
        `Status: ${resCreate.status}, Version: ${bodyCreate?.event?.version}`
      );

      // Test 4: Move Shipment with valid expectedVersion: 1
      const resMoveValid = await fetch(`${BASE_URL}/api/commands/shipment/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: testShipmentId,
          location: 'Checkpoint 1 - Port',
          expectedVersion: 1
        })
      });
      const bodyMoveValid = await resMoveValid.json();
      assert(
        resMoveValid.status === 202 && bodyMoveValid.event.version === 2,
        'POST /shipment/move with matching expectedVersion: 1 succeeds -> version 2',
        `Status: ${resMoveValid.status}, Version: ${bodyMoveValid?.event?.version}`
      );

      // Test 5: Move Shipment with STALE expectedVersion: 1 (should be rejected with 409 Conflict)
      const resMoveStale = await fetch(`${BASE_URL}/api/commands/shipment/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: testShipmentId,
          location: 'Stale Location Attempt',
          expectedVersion: 1
        })
      });
      const bodyMoveStale = await resMoveStale.json();
      assert(
        resMoveStale.status === 409 && bodyMoveStale.code === 'CONCURRENCY_CONFLICT',
        'POST /shipment/move with STALE expectedVersion: 1 is REJECTED with HTTP 409 Conflict',
        `Status: ${resMoveStale.status}, Error: ${bodyMoveStale.error}, Message: ${bodyMoveStale.message}`
      );

      // Test 6: Update Status with valid expectedVersion: 2
      const resStatusValid = await fetch(`${BASE_URL}/api/commands/shipment/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: testShipmentId,
          status: 'IN_TRANSIT',
          expectedVersion: 2
        })
      });
      const bodyStatusValid = await resStatusValid.json();
      assert(
        resStatusValid.status === 202 && bodyStatusValid.event.version === 3,
        'POST /shipment/status with matching expectedVersion: 2 succeeds -> version 3',
        `Status: ${resStatusValid.status}, Version: ${bodyStatusValid?.event?.version}`
      );

      // Test 7: Update Status with STALE expectedVersion: 2 via Header x-expected-version
      const resStatusHeaderStale = await fetch(`${BASE_URL}/api/commands/shipment/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-expected-version': '2'
        },
        body: JSON.stringify({
          shipmentId: testShipmentId,
          status: 'DELIVERED'
        })
      });
      const bodyStatusHeaderStale = await resStatusHeaderStale.json();
      assert(
        resStatusHeaderStale.status === 409 && bodyStatusHeaderStale.code === 'CONCURRENCY_CONFLICT',
        'POST /shipment/status with STALE x-expected-version header is REJECTED with HTTP 409 Conflict',
        `Status: ${resStatusHeaderStale.status}`
      );

      // Test 8: Query final projected state
      const resQuery = await fetch(`${BASE_URL}/api/queries/shipment/${testShipmentId}`);
      const bodyQuery = await resQuery.json();
      assert(
        resQuery.status === 200 && bodyQuery.data.version === 3,
        'GET /shipment/:id confirms final aggregate version is 3 after rejecting stale commands',
        `Status: ${resQuery.status}, Aggregate Version: ${bodyQuery?.data?.version}`
      );

      console.log(`\n===========================================================`);
      console.log(`🏁 Test Results: ${passedTests} Passed, ${failedTests} Failed`);
      console.log(`===========================================================\n`);

      server.close(() => {
        if (failedTests > 0) {
          process.exit(1);
        } else {
          process.exit(0);
        }
      });
    } catch (err) {
      console.error('Test Suite Exception:', err);
      server.close(() => process.exit(1));
    }
  });
}

runTest();
