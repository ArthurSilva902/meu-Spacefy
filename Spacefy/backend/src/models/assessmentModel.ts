import mongoose, { Schema } from "mongoose";
import { IAssessment } from "../types/assessment";

const assessmentSchema = new Schema<IAssessment>({
  score: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: function(value: number) {
        return Number.isInteger(value) && value >= 1 && value <= 5;
      },
      message: "A nota deve ser um número inteiro entre 1 e 5"
    }
  },
  comment: {
    type: String,
    required: false,
    maxlength: [500, "O comentário não pode ter mais de 500 caracteres"]
  },
  evaluation_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  spaceID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Space",
    required: true
  },
  rentalID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Rental",
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  evaluationType: {
    type: String,
    enum: ['user_to_user', 'owner_to_tenant', 'tenant_to_space'],
    required: true,
    default: 'user_to_user'
  },
  isOwnerEvaluation: {
    type: Boolean,
    required: true,
    default: false
  }
}, {
  timestamps: true,
  autoIndex: false
});

// Remove todos os índices existentes
assessmentSchema.indexes().forEach(index => {
  assessmentSchema.index(index[0], { ...index[1], unique: false });
});

// Adiciona índices otimizados para as novas funcionalidades
assessmentSchema.index({ spaceID: 1 });
assessmentSchema.index({ userID: 1 });
assessmentSchema.index({ evaluation_date: -1 });
assessmentSchema.index({ rentalID: 1 });
assessmentSchema.index({ evaluationType: 1 });
assessmentSchema.index({ isOwnerEvaluation: 1 });
assessmentSchema.index({ userID: 1, spaceID: 1, rentalID: 1 }); // Índice composto para evitar duplicatas

// Middleware para validar se não há avaliação duplicada
assessmentSchema.pre('save', async function(next) {
  try {
    const existingAssessment = await mongoose.model('Assessment').findOne({
      rentalID: this.rentalID,
      createdBy: this.createdBy,
      evaluationType: this.evaluationType
    });

    if (existingAssessment && !this.isNew) {
      return next();
    }

    if (existingAssessment) {
      const error = new Error('Você já avaliou este aluguel com este tipo de avaliação');
      return next(error as any);
    }

    next();
  } catch (error) {
    next(error as any);
  }
});

export default mongoose.model<IAssessment>("Assessment", assessmentSchema);
