require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectDB = require('./db');
const { protect, authorize } = require('./middleware/auth');

// Import Models
const User = require('./models/User');
const Food = require('./models/Food');
const Order = require('./models/Order');

const app = express();
app.use(express.json());

// เพิ่มไว้ด้านบนของ server.js (ใต้ app.use(express.json());)
app.use(express.urlencoded({ extended: true })); // รองรับ Form Data จาก HTML
app.use(express.static('public'));               // เปิดใช้งาน static file (CSS/JS)
app.set('view engine', 'ejs');                  // ตั้งค่า EJS เป็น View Engine

// 1. หน้าแรก ( Home Page ) - แสดงรายการอาหารส่วนเกินทั้งหมด
app.get('/', async (req, res) => {
  try {
    const foods = await Food.find({ status: 'Available' })
      .populate('businessId', 'name storeDetails phone')
      .sort({ createdAt: -1 });

    res.render('index', { foods });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// 2. หน้าเข้าสู่ระบบ ( Login Page )
app.get('/login', (req, res) => {
  res.render('login');
});

// 3. หน้าสมัครสมาชิก ( Register Page )
app.get('/register', (req, res) => {
  res.render('register');
});

// 4. หน้าลงรายการอาหาร ( Add Food Page )
app.get('/add-food', (req, res) => {
  res.render('add-food');
});

connectDB();

// ฟังก์ชันสำหรับสร้าง JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// ====================================================
// AUTHENTICATION ENDPOINTS
// ====================================================

// 1. สมัครสมาชิก (Hash Password) [POST /api/v1/auth/register]
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, storeDetails } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });

    // Hash รหัสผ่านก่อนบันทึกลงฐานข้อมูล
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      storeDetails
    });

    await user.save();

    // ออก Token ทันทีเมื่อสมัครสำเร็จ
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      message: 'สมัครสมาชิกสำเร็จ',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. เข้าสู่ระบบ (Verify Password & Return Token) [POST /api/v1/auth/login]
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

    // เปรียบเทียบรหัสผ่านที่ส่งมากับ Hash ใน DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ====================================================
// FOODS ENDPOINTS
// ====================================================

// 3. ลงรายการอาหารใหม่ (เฉพาะ Business) [POST /api/v1/foods]
app.post('/api/v1/foods', protect, authorize('Business'), async (req, res) => {
  try {
    const { title, description, image, originalPrice, discountPrice, quantity, expiredAt } = req.body;

    const food = new Food({
      businessId: req.user.id, // ใช้ ID จาก Token โดยตรง
      title, description, image, originalPrice, discountPrice, quantity, expiredAt, status: 'Available'
    });

    await food.save();
    res.status(201).json({ message: 'เพิ่มรายการอาหารสำเร็จ', food });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. ดึงรายการอาหารที่ยังไม่หมดอายุ (Public) [GET /api/v1/foods]
app.get('/api/v1/foods', async (req, res) => {
  try {
    const foods = await Food.find({ status: 'Available' })
      .populate('businessId', 'name phone storeDetails')
      .sort({ createdAt: -1 });
    res.status(200).json(foods);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. ดูรายละเอียดข้อมูลอาหาร (Public) [GET /api/v1/foods/:id]
app.get('/api/v1/foods/:id', async (req, res) => {
  try {
    const food = await Food.findById(req.params.id).populate('businessId', 'name phone storeDetails');
    if (!food) return res.status(404).json({ message: 'ไม่พบรายการอาหาร' });
    res.status(200).json(food);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. ลบรายการอาหาร (เฉพาะ Business / Admin) [DELETE /api/v1/foods/:id]
app.delete('/api/v1/foods/:id', protect, authorize('Business', 'Admin'), async (req, res) => {
  try {
    const deletedFood = await Food.findByIdAndDelete(req.params.id);
    if (!deletedFood) return res.status(404).json({ message: 'ไม่พบรายการอาหาร' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ====================================================
// ORDERS ENDPOINTS
// ====================================================

// 7. สั่งซื้อ / ขอรับบริจาค (เฉพาะ Customer / Foundation) [POST /api/v1/orders]
app.post('/api/v1/orders', protect, authorize('Customer', 'Foundation'), async (req, res) => {
  try {
    const { foodId, type, quantity } = req.body;
    const food = await Food.findById(foodId);
    if (!food || food.quantity < quantity) {
      return res.status(400).json({ message: 'สินค้าหมดหรือไม่เพียงพอ' });
    }

    const totalPrice = food.discountPrice * quantity;
    const order = new Order({
      foodId,
      buyerId: req.user.id, // ใช้ ID จาก Token ของผู้สั่งซื้อ
      type,
      quantity,
      totalPrice,
      snapshot: { foodTitle: food.title, pricePerUnit: food.discountPrice },
      pickupStatus: 'Pending'
    });

    await order.save();

    food.quantity -= quantity;
    if (food.quantity === 0) {
      food.status = type === 'Donation' ? 'Donated' : 'Sold';
    }
    await food.save();

    res.status(201).json({ message: 'สร้างคำสั่งซื้อสำเร็จ', order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. ดูประวัติการสั่งซื้อของตัวเอง (เฉพาะ Customer / Foundation) [GET /api/v1/orders/me]
app.get('/api/v1/orders/me', protect, authorize('Customer', 'Foundation'), async (req, res) => {
  try {
    const orders = await Order.find({ buyerId: req.user.id }).populate('foodId').sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9. ดูรายการคำสั่งซื้อของร้านค้าตัวเอง (เฉพาะ Business) [GET /api/v1/orders]
app.get('/api/v1/orders', protect, authorize('Business'), async (req, res) => {
  try {
    const storeFoods = await Food.find({ businessId: req.user.id }).select('_id');
    const foodIds = storeFoods.map(f => f._id);

    const orders = await Order.find({ foodId: { $in: foodIds } })
      .populate('buyerId', 'name phone')
      .populate('foodId')
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 10. อัปเดตสถานะการมารับอาหาร (เฉพาะ Business) [PATCH /api/v1/orders/:id/status]
app.patch('/api/v1/orders/:id/status', protect, authorize('Business'), async (req, res) => {
  try {
    const { pickupStatus } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { pickupStatus },
      { new: true }
    );

    if (!updatedOrder) return res.status(404).json({ message: 'ไม่พบรายการคำสั่งซื้อ' });
    res.status(200).json({ message: 'อัปเดตสถานะการรับอาหารสำเร็จ', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ====================================================
// USERS ENDPOINTS (ADMIN ONLY)
// ====================================================

// ดึงรายชื่อผู้ใช้ทั้งหมด (เฉพาะ Admin) [GET /api/v1/users]
app.get('/api/v1/users', protect, authorize('Admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));