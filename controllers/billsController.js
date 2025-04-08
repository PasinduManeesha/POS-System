import Bills from "../models/billsModel.js"; // Assuming you have a Bill model
import Product from '../models/productModel.js'; // Assuming you have a Product model

export const addBillsController = async (req, res) => {
  try {
    console.log("Request body:", req.body);

    const {
      customerName,
      customerPhone,
      customerAddress,
      subTotal,
      tax,
      totalAmount,
      totalCost, 
      cartItems,
      createdAt,
      invoiceNumber,
    } = req.body;

    // Calculate Profit
    const profit = totalAmount - totalCost;

    // Create new bill
    const newBill = new Bills({
      invoiceNumber,
      customerName,
      customerPhone,
      customerAddress,
      subTotal,
      tax,
      totalAmount,
      totalCost, 
      profit, 
      cartItems,
      createdAt,
    });

    // Process cart items and reduce stock
    for (let item of cartItems) {
      const product = await Product.findOne({ productNo: item.productNo });

      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.productNo} not found` });
      }

      // Ensure the quantity being sold does not exceed available stock
      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({ success: false, message: `Not enough stock for product ${item.productNo}` });
      }

      // Reduce the stock in the inventory
      await product.adjustStock(-item.quantity);
    }

    // Save the bill
    await newBill.save();

    // Send success response
    res.status(201).json({ success: true, message: "Bill added and stock updated successfully!" });
  } catch (error) {
    console.error("Error adding bill:", error);
    res.status(400).json({ success: false, message: "Error adding bill", error: error.message });
  }
};

// Get all bills
export const getBillsController = async (req, res) => {
  try {
    const bills = await Bills.find().sort({ billNumber: -1 });
    res.status(200).json({
      success: true,
      count: bills.length,
      data: bills
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching bills",
      error: error.message
    });
  }
};

export const deleteAllBillsController = async (req, res) => {
  try {
    // Delete all bills from the database
    await Bills.deleteMany({});

    // Send success response
    res.status(200).json({ success: true, message: "All bills deleted successfully!" });
  } catch (error) {
    console.error("Error deleting all bills:", error);
    res.status(500).json({ success: false, message: "Error deleting all bills", error: error.message });
  }
};