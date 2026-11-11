const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  originalPrice: { type: Number, required: true },
  discountPrice: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  expiredAt: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['Available', 'Reserved', 'Sold', 'Donated'], 
    default: 'Available' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Food', foodSchema);