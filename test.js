const BASE_URL = process.env.API_URL || 'http://localhost:5000';

// ฟังก์ชันสำหรับทดสอบ API
async function testAPI(name, method, endpoint, expectedStatus, body = null, token = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json().catch(() => ({}));

    const passed = Array.isArray(expectedStatus)
      ? expectedStatus.includes(response.status)
      : response.status === expectedStatus;

    console.log(
      `${passed ? '✅ PASS' : '❌ FAIL'} | ${name} | Status: ${response.status}`
    );

    if (!passed) {
      console.log('   Expected:', expectedStatus, '| Response:', data);
    }

    return { passed, data };
  } catch (error) {
    console.log(`❌ ERROR | ${name} | ${error.message}`);
    return { passed: false, data: {} };
  }
}

async function runTests() {
  console.log('\n===== RESQ FOOD: 5 FEATURES SYSTEM TEST =====\n');

  let passed = 0;
  let failed = 0;
  const record = (res) => (res.passed ? passed++ : failed++);

  // สร้างข้อมูลสุ่มสำหรับเทส (ป้องกันอีเมลซ้ำเวลาเทสหลายรอบ)
  const timestamp = Date.now();
  const bizUser = {
    name: 'Test Bakery',
    email: `biz_${timestamp}@test.com`,
    password: 'password123',
    role: 'Business',
    storeDetails: { storeName: 'Bakery Test', address: 'Ladkrabang' }
  };
  const cusUser = {
    name: 'Test Customer',
    email: `cus_${timestamp}@test.com`,
    password: 'password123',
    role: 'Customer'
  };

  // ==========================================
  // Feature 1: User Registration & Authentication (ระบบสมาชิกและยืนยันตัวตน)
  // ==========================================
  console.log('--- Feature 1: Authentication (Register & Login) ---');
  const regBiz = await testAPI('1.1 Register Business (ข้อมูลถูกต้อง)', 'POST', '/api/v1/auth/register', 201, bizUser);
  record(regBiz);
  const bizToken = regBiz.data.token;

  const regCus = await testAPI('1.2 Register Customer (ข้อมูลถูกต้อง)', 'POST', '/api/v1/auth/register', 201, cusUser);
  record(regCus);
  const cusToken = regCus.data.token;

  const badLogin = await testAPI('1.3 Login Fail (รหัสผ่านผิด)', 'POST', '/api/v1/auth/login', [400, 401], {
    email: bizUser.email,
    password: 'wrongpassword'
  });
  record(badLogin);

  // ==========================================
  // Feature 2: Food Management (การลงขายอาหารส่วนเกิน)
  // ==========================================
  console.log('\n--- Feature 2: Create Food (Role: Business) ---');
  const createFood = await testAPI('2.1 POST Food สำเร็จ (Role: Business)', 'POST', '/api/v1/foods', 201, {
    title: 'ขนมปังถุงสุ่ม (Auto Test)',
    description: 'ทดสอบระบบอัตโนมัติ',
    originalPrice: 150,
    discountPrice: 50,
    quantity: 5,
    expiredAt: new Date(Date.now() + 86400000).toISOString()
  }, bizToken);
  record(createFood);
  const createdFoodId = createFood.data._id || (createFood.data.data && createFood.data.data._id);

  const forbidFood = await testAPI('2.2 POST Food ถูกบล็อก (Role: Customer ไม่มีสิทธิ์)', 'POST', '/api/v1/foods', [401, 403], {
    title: 'แอบลงขาย'
  }, cusToken);
  record(forbidFood);

  // ==========================================
  // Feature 3: Public Food Listing (การดึงรายการอาหาร)
  // ==========================================
  console.log('\n--- Feature 3: Get Available Foods (Public) ---');
  const getFoods = await testAPI('3.1 GET Foods ทั้งหมด (ไม่ต้อง Login)', 'GET', '/api/v1/foods', 200);
  record(getFoods);

  // ==========================================
  // Feature 4: Order & Auto Stock Deduction (การจองอาหารและตัดสต็อก)
  // ==========================================
  console.log('\n--- Feature 4: Create Order (Role: Customer) ---');
  if (createdFoodId) {
    const createOrder = await testAPI('4.1 POST Order จองอาหารสำเร็จ (Role: Customer)', 'POST', '/api/v1/orders', 201, {
      foodId: createdFoodId,
      type: 'Purchase',
      quantity: 1
    }, cusToken);
    record(createOrder);
  }

  const unauthOrder = await testAPI('4.2 POST Order ถูกบล็อก (ไม่ได้ Login)', 'POST', '/api/v1/orders', [401, 403], {
    foodId: createdFoodId,
    quantity: 1
  });
  record(unauthOrder);

  // ==========================================
  // Feature 5: Role-Based Access Control (การตรวจสอบสิทธิ์เข้าถึงข้อมูล)
  // ==========================================
  console.log('\n--- Feature 5: Role-Based Access Control (Admin / User) ---');
  const getMyOrders = await testAPI('5.1 GET /orders/me ดูประวัติตัวเอง (Login แล้ว)', 'GET', '/api/v1/orders/me', 200, null, cusToken);
  record(getMyOrders);

  const accessAdmin = await testAPI('5.2 GET /users เข้าหน้า Admin ถูกบล็อก (Normal User)', 'GET', '/api/v1/users', [401, 403], null, cusToken);
  record(accessAdmin);

  // สรุปผล
  console.log('\n===== TEST SUMMARY (5 FEATURES) =====');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total Cases: ${passed + failed}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

runTests();