import mongoose from "mongoose";
import Counter from "./counterModel.js"; 


const billSchema = new mongoose.Schema({
  billNumber: {
    type: Number,
    unique: true,
    index: true,
  },
  invoiceNumber: {
    type: String,
    required: true,
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
    
    const lastBill = await Bills.findOne().sort({ billNumber: -1 });

    if (lastBill) {
      this.billNumber = lastBill.billNumber + 1; 
    } else {
      this.billNumber = 1; 
    }

    console.log("Generated Bill Number:", this.billNumber);
    next();
  } catch (err) {
    console.error("Error generating bill number:", err);
    next(err);
  }
});


const Bills = mongoose.model("Bills", billSchema);
export default Bills;
