// Importa os tipos Document e ObjectId do Mongoose para definir a estrutura dos documentos no banco de dados
import mongoose, { Document, ObjectId } from "mongoose";
import { IBaseUser } from "./user";

// Interface para avaliações, representando os campos comuns a todas as avaliações
export interface IAssessment extends Document {
  _id: ObjectId; // ID da avaliação
  score: number; // Nota da avaliação (1-5 estrelas)
  comment?: string; // Comentário opcional
  evaluation_date: Date; // Data da avaliação
  userID: mongoose.Types.ObjectId | IBaseUser; // ID do usuário avaliado
  spaceID: mongoose.Types.ObjectId; // ID do espaço
  rentalID: mongoose.Types.ObjectId; // ID do aluguel
  createdBy: mongoose.Types.ObjectId; // ID do usuário que criou a avaliação
  evaluationType: 'user_to_user' | 'owner_to_tenant' | 'tenant_to_space'; // Tipo de avaliação
  isOwnerEvaluation: boolean; // Se é avaliação do proprietário para o locatário
}

// Interface para criar nova avaliação
export interface ICreateAssessment {
  score: number;
  comment?: string;
  userID: mongoose.Types.ObjectId;
  spaceID: mongoose.Types.ObjectId;
  rentalID: mongoose.Types.ObjectId;
  evaluationType: 'user_to_user' | 'owner_to_tenant' | 'tenant_to_space';
}
