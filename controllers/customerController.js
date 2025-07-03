import mongoose from 'mongoose';
import Customer from '../models/Customer.js';
import Bill from '../models/billsModel.js';

// Utility functions
const sanitizePhone = (phone) => phone?.replace(/\D/g, '').slice(0, 10) || '';
const validatePhone = (phone) => /^\d{10}$/.test(phone);

// Response helpers
const errorResponse = (res, status, message, error = null) =>
  res.status(status).json({
    success: false,
    message,
    error: error?.message || error,
  });

const successResponse = (res, status, data) =>
  res.status(status).json({
    success: true,
    ...data,
  });

// Customer CRUD Operations
export const createCustomer = async (req, res) => {
  try {
    const { customerName, customerPhone, customerAddress } = req.body;

    if (!customerName || !customerPhone) {
      return errorResponse(res, 400, 'Customer name and phone number are required');
    }

    const cleanPhone = sanitizePhone(customerPhone);
    if (!validatePhone(cleanPhone)) {
      return errorResponse(res, 400, 'Phone number must be 10 digits');
    }

    const existingCustomer = await Customer.findOne({ customerPhone: cleanPhone });
    if (existingCustomer) {
      return errorResponse(res, 409, 'Customer with this phone number already exists');
    }

    const customer = await Customer.create({
      customerName,
      customerPhone: cleanPhone,
      customerAddress: customerAddress || '',
    });

    return successResponse(res, 201, {
      customer: {
        id: customer._id,
        customerName: customer.customerName,
        customerPhone: customer.customerPhone,
        customerAddress: customer.customerAddress,
        creditBalance: customer.creditBalance,
      },
    });
  } catch (error) {
    return errorResponse(res, 500, 'Server error while creating customer', error);
  }
};

export const getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const query = search
      ? {
          $or: [
            { customerName: { $regex: search, $options: 'i' } },
            { customerPhone: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [customers, count] = await Promise.all([
      Customer.find(query)
        .sort({ customerName: 1 })
        .skip(skip)
        .limit(limit)
        .select('-__v -creditHistory'),
      Customer.countDocuments(query),
    ]);

    return successResponse(res, 200, {
      customers,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: +page,
        itemsPerPage: +limit,
      },
    });
  } catch (error) {
    return errorResponse(res, 500, 'Server error while fetching customers', error);
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).select('-__v');
    if (!customer) {
      return errorResponse(res, 404, 'Customer not found');
    }

    const recentTransactions = await Bill.find({
      customer: customer._id,
      isCredit: true,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('invoiceNumber createdAt creditAmount');

    return successResponse(res, 200, {
      customer,
      creditSummary: {
        balance: customer.creditBalance,
        recentTransactions,
      },
    });
  } catch (error) {
    return errorResponse(res, 500, 'Server error while fetching customer', error);
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { customerPhone, ...updateData } = req.body;

    if (customerPhone) {
      const cleanPhone = sanitizePhone(customerPhone);
      if (!validatePhone(cleanPhone)) {
        return errorResponse(res, 400, 'Phone number must be 10 digits');
      }

      const existingCustomer = await Customer.findOne({
        customerPhone: cleanPhone,
        _id: { $ne: req.params.id },
      });

      if (existingCustomer) {
        return errorResponse(res, 409, 'Anotherjukes this phone number');
      }
      updateData.customerPhone = cleanPhone;
    }

    const customer = await Customer.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select('-__v');

    if (!customer) {
      return errorResponse(res, 404, 'Customer not found');
    }

    return successResponse(res, 200, { customer });
  } catch (error) {
    return errorResponse(res, 500, 'Server error while updating customer', error);
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const [customer, billCount] = await Promise.all([
      Customer.findById(req.params.id),
      Bill.countDocuments({ customer: req.params.id }),
    ]);

    if (!customer) {
      return errorResponse(res, 404, 'Customer not found');
    }

    if (customer.creditBalance > 0) {
      return errorResponse(res, 400, 'Cannot delete customer with outstanding credit balance');
    }

    if (billCount > 0) {
      return errorResponse(res, 400, 'Cannot delete customer with existing transaction history');
    }

    await Customer.findByIdAndDelete(req.params.id);
    return successResponse(res, 200, { message: 'Customer deleted successfully' });
  } catch (error) {
    return errorResponse(res, 500, 'Server error while deleting customer', error);
  }
};

// Customer Search Operations
export const findCustomerByPhone = async (req, res) => {
  try {
    const cleanPhone = sanitizePhone(req.params.phone);
    if (!validatePhone(cleanPhone)) {
      return errorResponse(res, 400, 'Phone number must be 10 digits');
    }

    const customer = await Customer.findOne({ customerPhone: cleanPhone }).select('-__v');
    if (!customer) {
      return errorResponse(res, 404, 'Customer not found');
    }

    return successResponse(res, 200, {
      customer: {
        id: customer._id,
        customerName: customer.customerName,
        customerPhone: customer.customerPhone,
        customerAddress: customer.customerAddress,
        creditBalance: customer.creditBalance,
      },
    });
  } catch (error) {
    return errorResponse(res, 500, 'Server error while finding customer', error);
  }
};

export const getCustomerCreditHistory = async (req, res) => {
  try {
    console.log('Fetching history for customer ID:', req.params.id);
    const customer = await Customer.findById(req.params.id).select('creditHistory creditBalance');

    if (!customer) {
      return errorResponse(res, 404, 'Customer not found');
    }

    return successResponse(res, 200, {
      history: customer.creditHistory.sort((a, b) => b.date - a.date),
      balance: customer.creditBalance,
    });
  } catch (error) {
    return errorResponse(res, 500, 'Server error while fetching credit history', error);
  }
};

export const getCustomerBalance = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).select('creditBalance');
    if (!customer) {
      return errorResponse(res, 404, 'Customer not found');
    }

    return successResponse(res, 200, {
      balance: customer.creditBalance || 0,
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to load customer balance', error);
  }
};

export const addCreditPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description = 'Credit payment' } = req.body;

    // Validate input
    if (!amount || isNaN(amount)) {
      return errorResponse(res, 400, 'Amount is required and must be a number');
    }

    const paymentAmount = parseFloat(amount);
    if (paymentAmount <= 0) {
      return errorResponse(res, 400, 'Amount must be greater than 0');
    }

    // Find customer
    const customer = await Customer.findById(id);
    if (!customer) {
      return errorResponse(res, 404, 'Customer not found');
    }

    // Create payment entry
    const paymentEntry = {
      date: new Date(),
      amount: -Math.abs(paymentAmount), // Ensure negative for payment
      description,
      type: 'payment',
    };

    // Update customer
    customer.creditHistory.push(paymentEntry);
    customer.creditBalance = parseFloat(
      (customer.creditBalance - paymentAmount).toFixed(2)
    );

    await customer.save();

    return successResponse(res, 200, {
      message: 'Payment recorded successfully',
      newBalance: customer.creditBalance,
    });
  } catch (error) {
    console.error('Error adding payment:', error);
    return errorResponse(res, 500, 'Failed to record payment', error);
  }
};