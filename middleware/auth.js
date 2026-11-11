const jwt = require('jsonwebtoken');

// 1. ตรวจสอบว่าผู้ใช้มี JWT Token ที่ถูกต้องหรือไม่
const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'ไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบก่อน' });
  }

  try {
    // ถอดรหัส Token แล้วดึงข้อมูล User ไปแปะไว้ใน req.user
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
  }
};

// 2. ตรวจสอบบทบาท (Role) ของผู้ใช้งาน
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `สิทธิ์ใช้งานเฉพาะบทบาท: ${roles.join(', ')}` });
    }
    next();
  };
};

module.exports = { protect, authorize };