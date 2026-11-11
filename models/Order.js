const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['Purchase', 'Donation'], 
    required: true 
  },
  quantity: { type: Number, required: true, default: 1 },
  totalPrice: { type: Number, required: true },
  snapshot: {
    foodTitle: { type: String, required: true },
    pricePerUnit: { type: Number, required: true }
  },
  pickupStatus: { 
    type: String, 
    enum: ['Pending', 'Completed', 'Cancelled'], 
    default: 'Pending' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);