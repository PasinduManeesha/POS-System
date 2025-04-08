import express from "express";
import { addBillsController, getBillsController, deleteAllBillsController } from "../controllers/billsController.js";

const billsRouter = express.Router();

billsRouter.post("/addbills", addBillsController);
billsRouter.get("/getbills", getBillsController);
billsRouter.delete("/deleteall", deleteAllBillsController); // New route for deleting all bills

export default billsRouter;