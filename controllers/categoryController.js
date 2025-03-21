import Category from "../models/categoryModel.js";

// Create a new category
export const createCategory = async (req, res) => {
    try {
        const { categoryName } = req.body;
        if (!categoryName) return res.status(400).json({ message: "Category name is required" });

        const category = new Category({ categoryName });
        await category.save();

        res.status(201).json({ message: "Category created successfully", category });
    } catch (error) {
        res.status(500).json({ message: "Error creating category", error: error.message });
    }
};

// Get all categories
export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: "Error fetching categories", error: error.message });
    }
};

// Get a category by ID
export const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: "Category not found" });

        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ message: "Error fetching category", error: error.message });
    }
};

// Update a category
export const updateCategory = async (req, res) => {
    try {
        const { categoryName } = req.body;
        const category = await Category.findByIdAndUpdate(req.params.id, { categoryName }, { new: true });

        if (!category) return res.status(404).json({ message: "Category not found" });

        res.status(200).json({ message: "Category updated successfully", category });
    } catch (error) {
        res.status(500).json({ message: "Error updating category", error: error.message });
    }
};

// Delete a category
export const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ message: "Category not found" });

        res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting category", error: error.message });
    }
};
