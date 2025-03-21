import Bills from "../models/billsModel.js";

// Add new bill
export const addBillsController = async (req, res) => {
  try {
    const newBill = new Bills(req.body);
    const savedBill = await newBill.save();
    
    res.status(201).json({
      success: true,
      message: "Bill created successfully",
      billNumber: savedBill.billNumber,
      data: savedBill
    });
    
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate bill number detected",
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error creating bill",
      error: error.message
    });
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