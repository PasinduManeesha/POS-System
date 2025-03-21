import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    customerPhone: { type: Number, required: true },
    customerAddress: { type: String, required: true }
});

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;