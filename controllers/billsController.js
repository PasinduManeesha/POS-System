// import Bills from "../models/billsModel.js";
// import Product from '../models/productModel.js';


import Bills from "../models/billsModel.js";
import Product from '../models/productModel.js';
import Customer from '../models/Customer.js'; // Make sure to import your Customer model

export const addBillsController = async (req, res) => {
  try {
    const {
      customer,
      customerName,
      customerPhone,
      customerAddress,
      subTotal,
      tax = 0,
      totalAmount,
      totalCost,
      paymentMethod,
      amountPaid = 0,
      remainingAmount,
      creditAmount = 0,
      isCredit = false,
      cartItems,
      createdAt = new Date(),
      invoiceNumber,
    } = req.body;

    // Validate required fields
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart items are required"
      });
    }

    // Validate and format credit amount
    const parsedCreditAmount = parseFloat(creditAmount) || 0;
    if (isCredit && parsedCreditAmount < 0.01) {
      return res.status(400).json({
        success: false,
        message: "Credit amount must be at least 0.01"
      });
    }

    // Calculate profit if not provided
    const calculatedProfit = totalAmount - totalCost;

    // Create new bill
    const newBill = new Bills({
      invoiceNumber,
      customer,
      customerName,
      customerPhone,
      customerAddress,
      subTotal,
      tax,
      totalAmount,
      totalCost,
      profit: calculatedProfit,
      paymentMethod,
      amountPaid,
      remainingAmount,
      creditAmount: parsedCreditAmount,
      isCredit,
      cartItems: cartItems.map(item => ({
        productNo: item.productNo,
        itemDescription: item.itemDescription,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        cost: item.cost,
        profit: (item.unitPrice - item.cost) * item.quantity,
        totalItemCost: item.cost * item.quantity
      })),
      createdAt,
      status: 'completed'
    });

    for (const item of cartItems) {
      const product = await Product.findOne({ productNo: item.productNo });
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.productNo} not found`
        });
      }

      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product ${item.productNo} (Available: ${product.stockQuantity})`
        });
      }

      
      product.stockQuantity -= item.quantity;
      await product.save();
    }

    // Save the bill
    const savedBill = await newBill.save();

 
    if (isCredit && customer && parsedCreditAmount >= 0.01) {
      try {
        const customerDoc = await Customer.findById(customer);
        if (!customerDoc) {
          console.warn(`Customer ${customer} not found for credit update`);
        } else {
       
          customerDoc.creditBalance = (customerDoc.creditBalance || 0) + parsedCreditAmount;
          
          customerDoc.creditHistory.push({
            date: new Date(),
            billId: savedBill._id,
            amount: parsedCreditAmount,
            description: `Credit sale INV-${invoiceNumber}`,
            type: 'credit'
          });
          
          await customerDoc.save();
          console.log(`Updated credit for customer ${customer} by ${parsedCreditAmount}`);
        }
      } catch (error) {
        console.error("Customer credit update failed:", error);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Bill created successfully",
      data: {
        billNumber: savedBill.billNumber,
        invoiceNumber: savedBill.invoiceNumber,
        billId: savedBill._id,
        customer: savedBill.customer,
        totalAmount: savedBill.totalAmount,
        creditAmount: savedBill.creditAmount,
        isCredit: savedBill.isCredit
      }
    });

  } catch (error) {
    console.error("Error in addBillsController:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
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