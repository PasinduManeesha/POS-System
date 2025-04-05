import express from 'express';
const router = express.Router();
import Product from '../models/productModel.js';

router.post('/adjust-stock', async (req, res) => {
    try {
        const { productId, adjustment, cost } = req.body;

        if (!productId || adjustment === undefined || cost === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Product ID, adjustment amount, and cost are required'
            });
        }

        const numericAdjustment = Number(adjustment);
        const newCost = Number(cost);

        if (isNaN(numericAdjustment) || isNaN(newCost)) {
            return res.status(400).json({
                success: false,
                message: 'Adjustment and cost must be numeric values'
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if ((product.stockQuantity + numericAdjustment) < 0) {
            return res.status(400).json({
                success: false,
                message: 'Stock cannot go below zero'
            });
        }

        product.stockQuantity += numericAdjustment;
        product.cost = newCost;

        const updatedProduct = await product.save();

        res.status(200).json({
            success: true,
            message: 'Stock and cost adjusted successfully',
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
