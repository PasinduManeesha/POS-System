import Product from '../models/productModel.js';

// Fetch all products
export const getProductController = async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).send(products);
    } catch (error) {
        console.log(error);
    }
};

// Add a new product
export const addProductController = async (req, res) => {
    try {
        const newProducts = new Product(req.body);
        await newProducts.save();
        res.status(200).send("Products Created Successfully!");
    } catch (error) {
        console.log(error);
    }
};

// Update a product
export const updateProductController = async (req, res) => {
    try {
        await Product.findOneAndUpdate({ _id: req.body.productId }, req.body, { new: true });
        res.status(201).json("Product Updated!");
    } catch (error) {
        res.status(400).send(error);
        console.log(error);
    }
};

// Delete a product
export const deleteProductController = async (req, res) => {
    try {
        await Product.findOneAndDelete({ _id: req.body.productId });
        res.status(200).json("Product Deleted!");
    } catch (error) {
        res.status(400).send(error);
        console.log(error);
    }
};

// Auto-complete search by product name
export const searchProductByName = async (req, res) => {
    try {
        const { name } = req.query;
        const products = await Product.find({
            productName: { $regex: name, $options: 'i' } // Case-insensitive search
        }).select('productName subNumber unitPrice');

        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Search by subNumber
export const searchProductBySubNumber = async (req, res) => {
    try {
        const { subNumber } = req.query;
        const product = await Product.findOne({ subNumber: subNumber }).select('productName subNumber unitPrice');
        if (product) {
            res.status(200).json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};