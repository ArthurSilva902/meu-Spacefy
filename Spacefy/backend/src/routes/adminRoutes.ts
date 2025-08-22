import express from "express";
import {
  getOwnerMetrics,
  getRentalsWithFilters,
  getRevenueReport
} from "../controllers/adminController";
import { validateAndGetTokenData } from "../middlewares/token";

const router = express.Router();

// Todas as rotas requerem autenticação
router.get("/metrics/:ownerId", validateAndGetTokenData, getOwnerMetrics);
router.get("/rentals/:ownerId", validateAndGetTokenData, getRentalsWithFilters);
router.get("/revenue/:ownerId", validateAndGetTokenData, getRevenueReport);

export default router;
