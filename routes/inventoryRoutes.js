import express from 'express';
const router = express.Router();
import Product from '../models/productModel.js';

router.post('/adjust-stock', async (req, res) => {
    try {
        const { productId, adjustment } = req.body;
        
        // Validate input
        if (!productId || adjustment === undefined) {
            return res.status(400).json({ 
                success: false,
                message: 'Product ID and adjustment amount are required'
            });
        }

        // Convert to number
        const numericAdjustment = Number(adjustment);
        if (isNaN(numericAdjustment)) {
            return res.status(400).json({
                success: false,
                message: 'Adjustment must be a numeric value'
            });
        }

        // Find product
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ 
                success: false,
                message: 'Product not found'
            });
        }

        // Validate stock
        if ((product.stockQuantity + numericAdjustment) < 0) {
            return res.status(400).json({
                success: false,
                message: 'Stock cannot go below zero'
            });
        }

        // Update stock
        const updatedProduct = await product.adjustStock(numericAdjustment);
        
        res.status(200).json({
            success: true,
            message: 'Stock adjusted successfully',
            product: updatedProduct
        });

    } catch (error) {
        console.error('Adjust stock error:', error);
        res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
        });
    }
});

export default router;
