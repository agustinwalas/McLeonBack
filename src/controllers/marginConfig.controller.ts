import { Request, Response } from "express";
import { MarginConfig } from "../models/MarginConfig";

export const getMarginConfig = async (_req: Request, res: Response) => {
  try {
    const config = await MarginConfig.findOne();
    if (!config) {
      // Si no existe, crear con valores por defecto
      const defaultConfig = await MarginConfig.create({});
      res.json(defaultConfig);
      return;
    }
    res.json(config);
    return;
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al obtener la configuración de márgenes" });
    return;
  }
};

export const updateMarginConfig = async (req: Request, res: Response) => {
  try {
    const { wholesaleMargin, retailMargin } = req.body;
    let config = await MarginConfig.findOne();
    if (!config) {
      config = await MarginConfig.create({ wholesaleMargin, retailMargin });
    } else {
      config.wholesaleMargin = wholesaleMargin;
      config.retailMargin = retailMargin;
      await config.save();
    }
    res.json(config);
    return;
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al actualizar la configuración de márgenes" });
    return;
  }
};
