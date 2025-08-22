import { Types } from "mongoose";

export interface IRental {
  _id?: Types.ObjectId;
  user: Types.ObjectId;      // referência ao usuário
  space: Types.ObjectId;     // referência ao espaço
  owner: Types.ObjectId;     // referência ao locador
  start_date: Date;          // data de início do aluguel
  end_date: Date;            // data de término do aluguel
  startTime: string;         // horário de início (ex: "14:00")
  endTime: string;           // horário de término (ex: "16:00")
  value: number;             // valor total do aluguel
  createdAt?: Date;          // data de criação do registro
  updatedAt?: Date;          // data da última atualização
  
  // Novos campos para reservas recorrentes
  isRecurring?: boolean;     // se é uma reserva recorrente
  recurringType?: 'weekly' | 'monthly'; // tipo de recorrência
  recurringEndDate?: Date;   // data final da recorrência
  parentRentalId?: Types.ObjectId; // ID da reserva pai (para reservas recorrentes)
  recurringInstances?: Types.ObjectId[]; // IDs das instâncias recorrentes criadas
}
