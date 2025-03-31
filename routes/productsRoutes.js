import express from "express";
import { 
    getProductController, 
    addProductController, 
    updateProductController, 
    deleteProductController,
    searchProductByName,
    searchProductBySubNumber,
    updateQuantitiesController  
} from "../controllers/productController.js";


const productRouter = express.Router();

// Existing routes
productRouter.get("/getproducts", getProductController);
productRouter.post("/addproducts", addProductController);
productRouter.put("/updateproducts", updateProductController);
productRouter.post("/deleteproducts", deleteProductController);

// Search routes
productRouter.get('/search-by-name', searchProductByName);
productRouter.get('/search-by-subnumber', searchProductBySubNumber);
productRouter.post('/updateQuantities', updateQuantitiesController);

export default productRouter;