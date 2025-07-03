import mongoose from 'mongoose';
import Bills from '../models/billsModel.js';
import Product from '../models/productModel.js';
import Customer from '../models/Customer.js';

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
      status
    } = req.body;

    // Validate required fields
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart items are required',
      });
    }

    // Validate and format credit amount
    const parsedCreditAmount = parseFloat(creditAmount) || 0;
    if (isCredit && parsedCreditAmount < 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Credit amount must be at least 0.01',
      });
    }

    // Validate customer ID if isCredit
    if (isCredit && !mongoose.Types.ObjectId.isValid(customer)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID for credit bill',
      });
    }

    // Validate totalAmount
    const calculatedTotal = parseFloat(
      cartItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) + tax
    ).toFixed(2);
    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Total amount does not match calculated total',
      });
    }

    // Calculate profit
    const calculatedProfit = parseFloat(totalAmount - totalCost).toFixed(2);

    // Determine bill status
    const billStatus = isCredit && parsedCreditAmount > 0 ? 'pending' : 'completed';

    // Create new bill
    const newBill = new Bills({
      invoiceNumber,
      customer,
      customerName,
      customerPhone,
      customerAddress,
      subTotal: parseFloat(subTotal).toFixed(2),
      tax: parseFloat(tax).toFixed(2),
      totalAmount: parseFloat(totalAmount).toFixed(2),
      totalCost: parseFloat(totalCost).toFixed(2),
      profit: calculatedProfit,
      paymentMethod,
      amountPaid: parseFloat(amountPaid).toFixed(2),
      remainingAmount: parseFloat(remainingAmount || totalAmount - amountPaid).toFixed(2),
      creditAmount: parseFloat(parsedCreditAmount).toFixed(2),
      isCredit,
      cartItems: cartItems.map((item) => ({
        productNo: item.productNo,
        itemDescription: item.itemDescription,
        unitPrice: parseFloat(item.unitPrice).toFixed(2),
        quantity: item.quantity,
        cost: parseFloat(item.cost).toFixed(2),
        profit: parseFloat((item.unitPrice - item.cost) * item.quantity).toFixed(2),
        totalItemCost: parseFloat(item.cost * item.quantity).toFixed(2),
      })),
      createdAt,
      status: billStatus
    });

    // Update product stock
    for (const item of cartItems) {
      const product = await Product.findOne({ productNo: item.productNo });
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.productNo} not found`,
        });
      }
      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product ${item.productNo} (Available: ${product.stockQuantity})`,
        });
      }
      product.stockQuantity -= item.quantity;
      await product.save();
    }

    // Save the bill
    const savedBill = await newBill.save();

    // Handle credit bill
    if (isCredit && customer && parsedCreditAmount >= 0.01) {
      const customerDoc = await Customer.findById(customer);
      if (!customerDoc) {
        console.warn(`Customer ${customer} not found for credit update`);
        return res.status(201).json({
          success: true,
          message: 'Bill created, but customer not found for credit update',
          data: {
            billNumber: savedBill.billNumber,
            invoiceNumber: savedBill.invoiceNumber,
            billId: savedBill._id,
            customer: savedBill.customer,
            totalAmount: savedBill.totalAmount,
            creditAmount: savedBill.creditAmount,
            isCredit: savedBill.isCredit,
            status: savedBill.status
          },
        });
      }

      // Add credit entry
      const creditEntry = {
        date: new Date(),
        billId: savedBill._id,
        amount: parseFloat(parsedCreditAmount).toFixed(2),
        description: `Credit sale INV-${invoiceNumber}`,
        type: 'credit'
      };

      console.log(`Adding credit entry for customer ${customer}:`, creditEntry);

      customerDoc.creditHistory.push(creditEntry);
      customerDoc.creditBalance = parseFloat(
        customerDoc.creditHistory.reduce((total, entry) => total + entry.amount, 0).toFixed(2)
      );

      await customerDoc.save();
      console.log(`Updated credit for customer ${customer} by ${parsedCreditAmount}`);
    }

    return res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      data: {
        billNumber: savedBill.billNumber,
        invoiceNumber: savedBill.invoiceNumber,
        billId: savedBill._id,
        customer: savedBill.customer,
        totalAmount: savedBill.totalAmount,
        creditAmount: savedBill.creditAmount,
        isCredit: savedBill.isCredit,
        status: savedBill.status
      },
    });
  } catch (error) {
    console.error('Error in addBillsController:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

export const getBillsController = async (req, res) => {
  try {
    const bills = await Bills.find().sort({ billNumber: -1 });
    res.status(200).json({
      success: true,
      count: bills.length,
      data: bills,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bills',
      error: error.message,
    });
  }
};

export const deleteAllBillsController = async (req, res) => {
  try {
    await Bills.deleteMany({});
    res.status(200).json({ success: true, message: 'All bills deleted successfully!' });
  } catch (error) {
    console.error('Error deleting bills:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting all bills',
      error: error.message,
    });
  }
};