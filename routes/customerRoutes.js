import express from 'express';
import {
    createCustomer,
    getAllCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    findCustomerByPhone,
    addCreditPayment,
    getCustomerBalance,
    getCustomerCreditHistory
} from '../controllers/customerController.js';

const customerRouter = express.Router();

// Customer CRUD routes
customerRouter.post("/addcustomer", createCustomer);
customerRouter.get("/getcustomers", getAllCustomers);
customerRouter.get("/getcustomer/:id", getCustomerById);
customerRouter.put("/updatecustomer/:id", updateCustomer);
customerRouter.delete("/deletecustomer/:id", deleteCustomer);

// Customer search route
customerRouter.get('/customers/phone/:phone', findCustomerByPhone);

// Customer credit routes
customerRouter.get('/customers/:id/balance', getCustomerBalance);
customerRouter.post('/customers/:id/payments', addCreditPayment);
customerRouter.get('/customers/:id/history', getCustomerCreditHistory);

export default customerRouter;