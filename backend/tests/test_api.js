const http = require('http');

const PORT = 5002; // Dedicated test port
process.env.PORT = PORT;

const { startServer } = require('../server');

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
        }
      },
      (res) => {
        let rawData = '';
        res.on('data', chunk => { rawData += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(rawData);
            resolve({ status: res.statusCode, data: parsed });
          } catch {
            resolve({ status: res.statusCode, raw: rawData });
          }
        });
      }
    );

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Rigorous Full-Stack Verification Suite...\n');
  const server = await startServer();

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await makeRequest('GET', '/api/health');
    assert(health.status === 200 && health.data.status === 'healthy', 'GET /api/health returns healthy');

    // 2. List tickets
    const listRes = await makeRequest('GET', '/api/tickets');
    assert(listRes.status === 200 && Array.isArray(listRes.data.data), 'GET /api/tickets returns array of tickets');

    // 3. Validation: missing title
    const missingTitle = await makeRequest('POST', '/api/tickets', {
      category: 'Billing',
      description: 'Missing title',
      priority: 'High'
    });
    assert(missingTitle.status === 400, 'POST /api/tickets rejects missing title with 400');

    // 4. Validation: whitespace-only title
    const whitespaceTitle = await makeRequest('POST', '/api/tickets', {
      title: '     ',
      category: 'Billing',
      description: 'Whitespace only',
      priority: 'High'
    });
    assert(whitespaceTitle.status === 400, 'POST /api/tickets rejects whitespace-only title with 400');

    // 5. Validation: title > 255 chars
    const longTitle = await makeRequest('POST', '/api/tickets', {
      title: 'A'.repeat(256),
      category: 'Billing',
      description: 'Too long title',
      priority: 'High'
    });
    assert(longTitle.status === 400, 'POST /api/tickets rejects title > 255 chars with 400');

    // 6. Validation: category > 100 chars
    const longCategory = await makeRequest('POST', '/api/tickets', {
      title: 'Valid Title',
      category: 'C'.repeat(101),
      description: 'Too long category',
      priority: 'High'
    });
    assert(longCategory.status === 400, 'POST /api/tickets rejects category > 100 chars with 400');

    // 7. Validation: description > 5000 chars
    const longDesc = await makeRequest('POST', '/api/tickets', {
      title: 'Valid Title',
      category: 'Billing',
      description: 'D'.repeat(5001),
      priority: 'High'
    });
    assert(longDesc.status === 400, 'POST /api/tickets rejects description > 5000 chars with 400');

    // 8. Validation: invalid priority
    const invalidPriority = await makeRequest('POST', '/api/tickets', {
      title: 'Valid Title',
      category: 'Billing',
      description: 'Some description',
      priority: 'UrgentSuper'
    });
    assert(invalidPriority.status === 400, 'POST /api/tickets rejects invalid priority with 400');

    // 9. Case-insensitivity: lowercase priority normalized
    const lowercasePriority = await makeRequest('POST', '/api/tickets', {
      title: 'Case Test Ticket',
      category: 'Technical Issue',
      description: 'Testing lowercase priority normalization',
      priority: 'high'
    });
    assert(lowercasePriority.status === 201 && lowercasePriority.data.data.priority === 'High', 'POST /api/tickets normalizes lowercase priority to High');
    const caseTicketId = lowercasePriority.data.data.id;

    // 10. Creation defaults to Open status
    assert(lowercasePriority.data.data.status === 'Open', 'POST /api/tickets creates ticket with default status Open');

    // 11. View ticket details by valid ID
    const detailRes = await makeRequest('GET', `/api/tickets/${caseTicketId}`);
    assert(detailRes.status === 200 && detailRes.data.data.id === caseTicketId, `GET /api/tickets/${caseTicketId} returns ticket details`);

    // 12. View ticket: invalid ID format
    const invalidIdRes = await makeRequest('GET', '/api/tickets/abc');
    assert(invalidIdRes.status === 400, 'GET /api/tickets/abc rejects invalid ID with 400');

    // 13. View ticket: non-existent ID
    const nonExistentRes = await makeRequest('GET', '/api/tickets/99999');
    assert(nonExistentRes.status === 404, 'GET /api/tickets/99999 returns 404 Not Found');

    // 14. Transition rejection: Open -> Resolved directly
    const directResolve = await makeRequest('PATCH', `/api/tickets/${caseTicketId}/status`, {
      status: 'Resolved'
    });
    assert(directResolve.status === 400, 'PATCH /api/tickets/:id/status rejects skipping In Progress (Open -> Resolved directly)');

    // 15. Transition rejection: Same status
    const sameStatus = await makeRequest('PATCH', `/api/tickets/${caseTicketId}/status`, {
      status: 'Open'
    });
    assert(sameStatus.status === 400, 'PATCH /api/tickets/:id/status rejects transition to identical status');

    // 16. Controlled transition: Open -> In Progress
    const toInProgress = await makeRequest('PATCH', `/api/tickets/${caseTicketId}/status`, {
      status: 'In Progress'
    });
    assert(toInProgress.status === 200 && toInProgress.data.data.status === 'In Progress', 'PATCH /api/tickets/:id/status allows Open -> In Progress');

    // 17. Transition rejection: In Progress -> Open (backward move)
    const backwardTransition = await makeRequest('PATCH', `/api/tickets/${caseTicketId}/status`, {
      status: 'Open'
    });
    assert(backwardTransition.status === 400, 'PATCH /api/tickets/:id/status rejects moving backward (In Progress -> Open)');

    // 18. Resolution note length validation (> 2000 chars)
    const longNoteRes = await makeRequest('PATCH', `/api/tickets/${caseTicketId}/status`, {
      status: 'Resolved',
      resolution_note: 'R'.repeat(2001)
    });
    assert(longNoteRes.status === 400, 'PATCH /api/tickets/:id/status rejects resolution note > 2000 chars');

    // 19. Controlled transition: In Progress -> Resolved with resolution note
    const toResolved = await makeRequest('PATCH', `/api/tickets/${caseTicketId}/status`, {
      status: 'Resolved',
      resolution_note: 'Resolved and verified by automated senior test suite.'
    });
    assert(toResolved.status === 200 && toResolved.data.data.status === 'Resolved' && toResolved.data.data.resolution_note.includes('verified by automated'), 'PATCH /api/tickets/:id/status allows In Progress -> Resolved with note');

    // 20. Terminal state rejection: Resolved cannot transition again
    const postResolved = await makeRequest('PATCH', `/api/tickets/${caseTicketId}/status`, {
      status: 'In Progress'
    });
    assert(postResolved.status === 400, 'PATCH /api/tickets/:id/status rejects transitions once ticket is Resolved');

    // 21. Query filter: status=Resolved
    const filterStatus = await makeRequest('GET', '/api/tickets?status=Resolved');
    const allResolved = filterStatus.data.data.every(t => t.status === 'Resolved');
    assert(filterStatus.status === 200 && allResolved, 'GET /api/tickets?status=Resolved filters accurately');

    // 22. Query filter: priority=High
    const filterPriority = await makeRequest('GET', '/api/tickets?priority=High');
    const allHigh = filterPriority.data.data.every(t => t.priority === 'High');
    assert(filterPriority.status === 200 && allHigh, 'GET /api/tickets?priority=High filters accurately');

    // 23. Query filter: invalid status value rejected with 400
    const invalidStatusFilter = await makeRequest('GET', '/api/tickets?status=NotAStatus');
    assert(invalidStatusFilter.status === 400, 'GET /api/tickets?status=invalid rejects invalid status with 400');

    // 24. Query filter: invalid priority value rejected with 400
    const invalidPriorityFilter = await makeRequest('GET', '/api/tickets?priority=NotAPriority');
    assert(invalidPriorityFilter.status === 400, 'GET /api/tickets?priority=invalid rejects invalid priority with 400');

    // 25. Search filter: handles SQL wildcard characters safely (%, _, \)
    const searchWildcard = await makeRequest('GET', '/api/tickets?search=100%_special\\char');
    assert(searchWildcard.status === 200 && Array.isArray(searchWildcard.data.data), 'GET /api/tickets?search handles wildcards %, _, \\ safely');

    console.log(`\n📊 Verification Suite Results: ${passed} Passed, ${failed} Failed.`);
    server.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution failed with error:', err);
    server.close();
    process.exit(1);
  }
}

runTests();
