import { Router } from "express";
import { getMarginConfig, updateMarginConfig } from "../controllers/marginConfig.controller";

const router = Router();

router.get("/", getMarginConfig);
router.put("/", updateMarginConfig);

export default router;
