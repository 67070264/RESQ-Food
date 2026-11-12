
const BASE_URL = process.env.API_URL || 'http://localhost:5000';

// ฟังก์ชันสำหรับทดสอบ API
async function testAPI(name, method, endpoint, expectedStatus, body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);

    const passed = Array.isArray(expectedStatus)
      ? expectedStatus.includes(response.status)
      : response.status === expectedStatus;

    console.log(
      `${passed ? '✅ PASS' : '❌ FAIL'} | ${name} | Status: ${response.status}`
    );

    if (!passed) {
      const result = await response.text();
      console.log('Expected:', expectedStatus);
      console.log('Response:', result);
    }

    return passed;
  } catch (error) {
    console.log(`❌ ERROR | ${name} | ${error.message}`);
    return false;
  }
}

// เริ่มทดสอบ
async function runTests() {
  console.log('\n===== RESQ FOOD API TEST =====\n');

  let passed = 0;
  let failed = 0;

  const tests = [
    {
      name: 'GET Foods - ดูรายการอาหารทั้งหมด',
      method: 'GET',
      endpoint: '/api/v1/foods',
      expected: 200,
      checkArray: true
    },
    {
      name: 'GET Orders - ต้อง Login ก่อน',
      method: 'GET',
      endpoint: '/api/v1/orders/me',
      expected: [401, 403]
    },
    {
      name: 'GET Users - ต้องเป็น Admin',
      method: 'GET',
      endpoint: '/api/v1/users',
      expected: [401, 403]
    },
    {
      name: 'POST Foods - ต้อง Login ก่อน',
      method: 'POST',
      endpoint: '/api/v1/foods',
      expected: [401, 403],
      body: {}
    }
  ];

  for (const test of tests) {
    const result = await testAPI(
      test.name,
      test.method,
      test.endpoint,
      test.expected,
      test.body
    );

    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log('\n===== TEST SUMMARY =====');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

runTests();
