import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    productNo: {
        type: String,
        required: [true, 'Product number is required'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Category is required']
    },
    cost: {
        type: Number,
        default: 0,
        min: [0, 'Cost cannot be negative']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    image: {
        type: String,
        default: 'no-image.jpg'
    },
    stockQuantity: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Stock cannot be negative']
    }
}, {
    timestamps: true // Auto-creates createdAt/updatedAt
});

// Stock adjustment method
productSchema.methods.adjustStock = async function(adjustment) {
    this.stockQuantity += adjustment;
    
    // Prevent negative stock
    if (this.stockQuantity < 0) this.stockQuantity = 0;
    
    return await this.save();
};

const Product = mongoose.model('Product', productSchema);
export default Product;
