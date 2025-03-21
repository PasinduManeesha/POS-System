// routes/supplierRoutes.js
import express from 'express';
import { 
    createSupplier,
    getAllSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier 
} from '../controllers/supplierController.js';

const router = express.Router();

router.post('/addsupplier', createSupplier);
router.get('/getsuppliers', getAllSuppliers);
router.get('/getsupplier/:id', getSupplierById);
router.put('/updatesupplier/:id', updateSupplier);
router.delete('/deletesupplier/:id', deleteSupplier);

export default router;