import mongoose from "mongoose";
import Counter from "./counterModel.js";

const billSchema = new mongoose.Schema({
  billNumber: {
    type: Number,
    unique: true,
    index: true
  },
  customerName: String,
  customerPhone: String,
  customerAddress: String,
  subTotal: Number,
  tax: Number,
  totalAmount: Number,
  cartItems: Array,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-increment hook
billSchema.pre('save', async function(next) {
  if (!this.isNew) return next();
  
  try {
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'billNumber' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    
    this.billNumber = counter.seq;
    next();
  } catch (err) {
    next(err);
  }
});

const Bills = mongoose.model("Bills", billSchema);
export default Bills;