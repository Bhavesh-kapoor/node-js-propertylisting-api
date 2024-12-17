import express from "express";
import {
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from "../controller/transaction.controller.js";
const router = express.Router();

router.get("/get/:id", getTransactionById);
router.get("/get-list", getTransactions);
router.put("/update/:id", updateTransaction);
router.delete("/delete/:id", deleteTransaction);

export default router;
