import express from "express";
import { 
    createCustomer, 
    getAllCustomers, 
    getCustomerById, 
    updateCustomer, 
    deleteCustomer 
} from "../controllers/customerController.js";

const customerRouter = express.Router();

customerRouter.post("/addcustomer", createCustomer);
customerRouter.get("/getcustomers", getAllCustomers);
customerRouter.get("/getcustomer/:id", getCustomerById);
customerRouter.put("/updatecustomer/:id", updateCustomer);
customerRouter.delete("/deletecustomer/:id", deleteCustomer);

export default customerRouter;
