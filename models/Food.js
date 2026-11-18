const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['meal', 'bakery', 'dessert'],
    default: 'meal',
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String
  },
  originalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  discountPrice: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  expiredAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Available', 'Sold', 'Donated', 'Expired'],
    default: 'Available'
  }
}, { timestamps: true });

module.exports = mongoose.model('Food', foodSchema);