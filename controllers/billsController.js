import Bills from "../models/billsModel.js";


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
    } = req.body;

    // Calculate Profit
    const profit = totalAmount - totalCost;

    const newBill = new Bills({
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

    await newBill.save();
    res.status(201).json({ message: "Bill added successfully!" });
  } catch (error) {
    console.error("Error adding bill:", error);
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