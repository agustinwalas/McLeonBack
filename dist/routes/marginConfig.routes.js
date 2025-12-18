"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const marginConfig_controller_1 = require("../controllers/marginConfig.controller");
const router = (0, express_1.Router)();
router.get("/", marginConfig_controller_1.getMarginConfig);
router.put("/", marginConfig_controller_1.updateMarginConfig);
exports.default = router;
