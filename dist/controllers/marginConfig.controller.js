"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMarginConfig = exports.getMarginConfig = void 0;
const MarginConfig_1 = require("../models/MarginConfig");
const getMarginConfig = async (_req, res) => {
    try {
        const config = await MarginConfig_1.MarginConfig.findOne();
        if (!config) {
            // Si no existe, crear con valores por defecto
            const defaultConfig = await MarginConfig_1.MarginConfig.create({});
            res.json(defaultConfig);
            return;
        }
        res.json(config);
        return;
    }
    catch (error) {
        res
            .status(500)
            .json({ error: "Error al obtener la configuración de márgenes" });
        return;
    }
};
exports.getMarginConfig = getMarginConfig;
const updateMarginConfig = async (req, res) => {
    try {
        const { wholesaleMargin, retailMargin } = req.body;
        let config = await MarginConfig_1.MarginConfig.findOne();
        if (!config) {
            config = await MarginConfig_1.MarginConfig.create({ wholesaleMargin, retailMargin });
        }
        else {
            config.wholesaleMargin = wholesaleMargin;
            config.retailMargin = retailMargin;
            await config.save();
        }
        res.json(config);
        return;
    }
    catch (error) {
        res
            .status(500)
            .json({ error: "Error al actualizar la configuración de márgenes" });
        return;
    }
};
exports.updateMarginConfig = updateMarginConfig;
