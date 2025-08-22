import express from "express";
import {
  createAssessment,
  updateAssessment,
  deleteAssessment,
  getAllAssessments,
  getAssessmentsBySpace,
  getTopRatedSpaces,
  getAssessmentsByUser,
  getAverageScoreBySpace,
  createOwnerAssessment,
  getUserAssessments,
  getUserRating
} from "../controllers/assessmentController";
import { validateAndGetTokenData } from "../middlewares/token";

const router = express.Router();

// Rotas existentes
router.post("/create", validateAndGetTokenData, createAssessment);
router.put("/update/:id", validateAndGetTokenData, updateAssessment);
router.delete("/delete/:id", validateAndGetTokenData, deleteAssessment);
router.get("/getAll", validateAndGetTokenData, getAllAssessments);
router.get("/space/:spaceId", getAssessmentsBySpace);
router.get("/top-rated", getTopRatedSpaces);
router.get("/user/:userId", validateAndGetTokenData, getAssessmentsByUser);
router.get("/average/:spaceId", getAverageScoreBySpace);

// NOVAS ROTAS PARA AVALIAÇÃO BIDIRECIONAL
router.post("/owner-assessment", validateAndGetTokenData, createOwnerAssessment); // Proprietário avalia locatário
router.get("/user-assessments/:userId", getUserAssessments); // Obter avaliações de um usuário
router.get("/user-rating/:userId", getUserRating); // Obter rating médio de um usuário

export default router; 