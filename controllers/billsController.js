import Bills from "../models/billsModel.js";

// Add new bill
export const addBillsController = async (req, res) => {
  try {
    console.log("Request body:", req.body); // Debugging

    const {
      customerName,
      customerPhone,
      customerAddress,
      subTotal,
      tax,
      totalAmount,
      cartItems,
      createdAt,
    } = req.body;

    const newBill = new Bills({
      customerName,
      customerPhone,
      customerAddress,
      subTotal,
      tax,
      totalAmount,
      cartItems,
      createdAt,
    });

    await newBill.save();
    res.status(201).json({ message: "Bill added successfully!" });
  } catch (error) {
    console.error("Error adding bill:", error); // Log the error for debugging
    res.status(400).json({ message: "Error adding bill", error });
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