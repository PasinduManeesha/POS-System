import express from "express";
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  findCustomerByPhone,
  addCreditPayment,
  getCustomerBalance,
  getCustomerCreditHistory,
} from "../controllers/customerController.js";

const customerRouter = express.Router();

customerRouter.post("/addcustomer", createCustomer);
customerRouter.get("/getcustomers", getAllCustomers);
customerRouter.get("/getcustomer/:id", getCustomerById);
customerRouter.put("/updatecustomer/:id", updateCustomer);
customerRouter.delete("/deletecustomer/:id", deleteCustomer);
customerRouter.get("/customers/phone/:phone", findCustomerByPhone);
customerRouter.get("/:id/balance", getCustomerBalance);
customerRouter.post("/:id/payments", addCreditPayment);
customerRouter.get("/:id/history", getCustomerCreditHistory);

export default customerRouter;