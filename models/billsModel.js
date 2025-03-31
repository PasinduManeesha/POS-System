import mongoose from "mongoose";
import Counter from "./counterModel.js"; 


const billSchema = new mongoose.Schema({
  billNumber: {
    type: Number,
    unique: true,
    index: true,
  },
  customerName: String,
  customerPhone: String,
  customerAddress: String,
  subTotal: Number,
  tax: Number,
  totalAmount: Number, 
  totalCost: Number,  
  profit: Number,    
  cartItems: [{
    productNo: String,
    itemDescription: String,
    unitPrice: Number,
    quantity: Number,
    cost: Number, 
    profit: Number,
    totalItemCost: Number 
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


billSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  try {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "billNumber" },
      { new: true, upsert: true }
    );

    console.log("Generated billNumber:", counter.seq); 
    this.billNumber = counter.seq;
    next();
  } catch (err) {
    next(err);
  }
});



const Bills = mongoose.model("Bills", billSchema);
export default Bills;
