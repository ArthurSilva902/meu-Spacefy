import mongoose, { Schema, Document, Types } from "mongoose";

export interface IRental extends Document {
  user: Types.ObjectId;
  space: Types.ObjectId;
  owner: Types.ObjectId;  // ID do locador
  start_date: Date;
  end_date: Date;
  startTime: string;
  endTime: string;
  value: number;
  // Novos campos para reservas recorrentes
  isRecurring?: boolean;
  recurringType?: 'weekly' | 'monthly';
  recurringEndDate?: Date;
  parentRentalId?: Types.ObjectId;
  recurringInstances?: Types.ObjectId[];
  // Campo para referência ao aluguel (usado em avaliações)
  rentalID?: Types.ObjectId;
}

const rentalSchema = new Schema<IRental>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "O usuário é obrigatório"],
    },
    space: {
      type: Schema.Types.ObjectId,
      ref: "Space",
      required: [true, "O espaço é obrigatório"],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "O locador é obrigatório"],
    },
    start_date: {
      type: Date,
      required: [true, "A data de início é obrigatória"],
      validate: {
        validator: function(value: Date) {
          return value >= new Date(new Date().setHours(0, 0, 0, 0));
        },
        message: "A data de início não pode ser anterior ao dia atual"
      }
    },
    end_date: {
      type: Date,
      required: [true, "A data de término é obrigatória"],
      validate: {
        validator: function(this: IRental, value: Date) {
          return value >= this.start_date;
        },
        message: "A data de término deve ser igual ou posterior à data de início"
      }
    },
    startTime: {
      type: String,
      required: [true, "O horário de início é obrigatório"],
      match: [/^([0-1]\d|2[0-3]):([0-5]\d)$/, "Formato de horário inválido (HH:MM)"],
    },
    endTime: {
      type: String,
      required: [true, "O horário de término é obrigatório"],
      match: [/^([0-1]\d|2[0-3]):([0-5]\d)$/, "Formato de horário inválido (HH:MM)"],
      validate: {
        validator: function(this: IRental, value: string) {
          if (this.start_date.getTime() === this.end_date.getTime()) {
            return value > this.startTime;
          }
          return true;
        },
        message: "O horário de término deve ser posterior ao horário de início quando for o mesmo dia"
      }
    },
    value: {
      type: Number,
      required: [true, "O valor é obrigatório"],
      min: [0, "O valor não pode ser negativo"],
      validate: {
        validator: function(value: number) {
          return Number.isFinite(value) && value > 0;
        },
        message: "O valor deve ser um número positivo"
      }
    },
    // Novos campos para reservas recorrentes
    isRecurring: {
      type: Boolean,
      default: false
    },
    recurringType: {
      type: String,
      enum: ['weekly', 'monthly'],
      required: function(this: IRental) {
        return this.isRecurring === true;
      }
    },
    recurringEndDate: {
      type: Date,
      required: function(this: IRental) {
        return this.isRecurring === true;
      },
      validate: {
        validator: function(this: IRental, value: Date) {
          if (this.isRecurring && value) {
            return value > this.end_date;
          }
          return true;
        },
        message: "A data final da recorrência deve ser posterior à data de término da primeira reserva"
      }
    },
    parentRentalId: {
      type: Schema.Types.ObjectId,
      ref: "Rental"
    },
    recurringInstances: [{
      type: Schema.Types.ObjectId,
      ref: "Rental"
    }],
    // Campo para referência ao próprio aluguel (usado em avaliações)
    rentalID: {
      type: Schema.Types.ObjectId,
      ref: "Rental"
    }
  },
  {
    timestamps: true
  }
);

// Middleware para definir o rentalID automaticamente
rentalSchema.pre('save', function(next) {
  if (!this.rentalID) {
    this.rentalID = this._id;
  }
  next();
});

// Índices para melhorar a performance das consultas
rentalSchema.index({ space: 1, start_date: 1, end_date: 1 });
rentalSchema.index({ user: 1 });
rentalSchema.index({ start_date: 1, end_date: 1 });
rentalSchema.index({ isRecurring: 1 });
rentalSchema.index({ parentRentalId: 1 });
rentalSchema.index({ rentalID: 1 });

const RentalModel = mongoose.model<IRental>("Rental", rentalSchema);

export default RentalModel;
