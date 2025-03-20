import express from "express";
import { 
    createCustomerController, 
    getAllCustomersController, 
    getCustomerByIdController, 
    updateCustomerController, 
    deleteCustomerController 
} from "../controllers/customerController.js";

const customerRouter = express.Router();

customerRouter.post("/addcustomer", createCustomerController);
customerRouter.get("/getcustomers", getAllCustomersController);
customerRouter.get("/getcustomer/:id", getCustomerByIdController);
customerRouter.put("/updatecustomer/:id", updateCustomerController);
customerRouter.delete("/deletecustomer/:id", deleteCustomerController);

export default customerRouter;
