// models/Supplier.js
import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
    supplierName: {
        type: String,
        required: true,
        trim: true
    },
    supplierPhone: {
        type: String,
        required: true,
        trim: true
    },
    supplierAddress: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

export default mongoose.model('Supplier', supplierSchema);