import { Router } from "express";
import {
  getAllExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../controllers/expense.controller";
import { verifyToken } from "../middleware/verifyToken";

const router = Router();

router.get("/", verifyToken, getAllExpenses);
router.post("/", verifyToken, createExpense);
router.put("/:id", verifyToken, updateExpense);
router.delete("/:id", verifyToken, deleteExpense);

export default router;
