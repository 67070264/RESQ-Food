# 🌱 ResQ Food - Server-Side Web Development Project

ระบบเว็บแอปพลิเคชันจัดการและส่งต่ออาหารส่วนเกิน (Food Waste Management Platform) สำหรับเชื่อมโยงระหว่าง **ร้านค้า (Business)**, **ผู้ซื้อทั่วไป (Customer)** และ **องค์กรการกุศล/มูลนิธิ (Foundation)** เพื่อลดปริมาณขยะอาหารและสร้างประโยชน์ต่อสังคม

---

## 🛠️ Tech Stack & Technologies

- **Backend Framework:** Node.js, Express.js
- **Database:** MongoDB Atlas (M0 Free Tier) + Mongoose ODM
- **Authentication & Security:** JSON Web Token (JWT), `bcryptjs` (Password Hashing)
- **Front-end Views:** EJS (Embedded JavaScript Templates), Bootstrap 5, Custom CSS
- **API Testing:** Postman

---

## ✨ สรุปฟีเจอร์และการพัฒนาตามข้อกำหนดอาจารย์ (Requirements & Improvements)

ได้ทำการพัฒนาและปรับปรุงระบบ Backend API และ Front-end ตามข้อกำหนดอาจารย์ (Core Endpoints 10 รายการ) เรียบร้อยแล้ว ดังนี้:

1. **Prefix URL Standard:** ปรับปรุง Route ทุกเส้นให้ใช้ Prefix `/api/v1` ตามมาตรฐาน RESTful API
2. **JWT Authentication & Authorization:**
   - สมัครสมาชิกและเข้าสู่ระบบด้วยการ Hash รหัสผ่านด้วย `bcryptjs`
   - ใช้ JWT Token ในการยืนยันตัวตนผ่าน `Authorization: Bearer <token>` Header
   - สร้าง Middleware (`protect`, `authorize`) ตรวจสอบสิทธิ์แยกตาม Role (`Business`, `Customer`, `Foundation`, `Admin`)
3. **Inventory Auto-Deduction System:** เมื่อเกิดการสั่งซื้อ (`POST /api/v1/orders`) ระบบจะคำนวณราคารวม บันทึก Snapshot ข้อมูลอาหาร และตัดสต็อกสินค้าใน MongoDB ให้อัตโนมัติ หากสินค้าเหลือ 0 จะอัปเดตสถานะเป็น `Sold` หรือ `Donated` ทันที
4. **Correct HTTP Status Codes:** กำหนด HTTP Status Code ที่ถูกต้องสำหรับทุก Response เช่น `200 OK`, `201 Created`, `204 No Content` (กรณีลบอาหาร), `400 Bad Request`, `401 Unauthorized`, `403 Forbidden` และ `404 Not Found`
5. **EJS Front-end Integration:** พัฒนาหน้าเว็บ EJS Views ทำงานร่วมกับ Bootstrap 5 และ `localStorage` บนเบราว์เซอร์เพื่อจัดเก็บ JWT Token และเรียกใช้งาน API ได้จริง

---

## 📌 Core Endpoints (10+ API Endpoints)

| # | Method | Endpoint Path | Access Role | Target Status | Description |
| :---: | :---: | :--- | :---: | :---: | :--- |
| 1 | `POST` | `/api/v1/auth/register` | Public | `201 Created` | สมัครสมาชิกผู้ใช้งานใหม่ (Hash รหัสผ่าน + ออก Token) |
| 2 | `POST` | `/api/v1/auth/login` | Public | `200 OK` | เข้าสู่ระบบ และรับ JWT Token |
| 3 | `POST` | `/api/v1/foods` | Business | `201 Created` | ลงรายการอาหารส่วนเกินใหม่ |
| 4 | `GET` | `/api/v1/foods` | Public | `200 OK` | ดึงรายการอาหารส่วนเกินที่ยังไม่หมดอายุ (`status: Available`) |
| 5 | `GET` | `/api/v1/foods/:id` | Public | `200 OK` | ดูรายละเอียดข้อมูลอาหารส่วนเกินแบบเฉพาะเจาะจง |
| 6 | `DELETE` | `/api/v1/foods/:id` | Business / Admin | `204 No Content` | ลบหรือยกเลิกรายการอาหารส่วนเกิน |
| 7 | `POST` | `/api/v1/orders` | Customer / Foundation | `201 Created` | สั่งซื้ออาหารราคาถูก หรือกดรับบริจาคอาหาร (ตัดสต็อกอัตโนมัติ) |
| 8 | `GET` | `/api/v1/orders/me` | Customer / Foundation | `200 OK` | ดูประวัติการสั่งซื้อหรือรับบริจาคของตัวเอง |
| 9 | `GET` | `/api/v1/orders` | Business | `200 OK` | ดูรายการคำสั่งซื้อหรือการบริจาคทั้งหมดของร้านค้าตัวเอง |
| 10 | `PATCH` | `/api/v1/orders/:id/status` | Business | `200 OK` | ร้านค้าอัปเดตสถานะการมารับอาหาร (`Pending`, `Completed`, `Cancelled`) |
| 11 | `GET` | `/api/v1/users` | Admin | `200 OK` | ดึงรายชื่อผู้ใช้งานทั้งหมดในระบบเพื่อตรวจสอบ |

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
RESQ-Food/
├── middleware/
│   └── auth.js             # Middleware ตรวจสอบ JWT Token และ Role
├── models/
│   ├── User.js             # User Schema (Customer, Business, Foundation, Admin)
│   ├── Food.js             # Food Schema (รายการอาหาร, สต็อก, สถานะ)
│   └── Order.js            # Order Schema (ประวัติคำสั่งซื้อ, Snapshot ข้อมูล)
├── public/
│   └── style.css           # Custom Static Styles
├── views/
│   ├── partials/
│   │   ├── header.ejs      # Component Navbar + Bootstrap CDN
│   │   └── footer.ejs      # Component Footer
│   ├── index.ejs           # หน้าแรก (แสดงรายการอาหาร + กดสั่งซื้อ)
│   ├── login.ejs           # หน้าเข้าสู่ระบบ
│   ├── register.ejs        # หน้าสมัครสมาชิก (Dynamic Form ตาม Role)
│   └── add-food.ejs        # หน้าลงรายการอาหารใหม่สำหรับร้านค้า
├── .env                    # Environment Variables (Database URI, JWT Secret)
├── db.js                   # เชื่อมต่อ MongoDB Atlas
├── server.js               # Main App entry point & Web/API Routes
└── package.json
