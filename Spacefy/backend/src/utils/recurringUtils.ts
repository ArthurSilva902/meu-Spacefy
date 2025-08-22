/**
 * Funções utilitárias para reservas recorrentes
 */

export const generateRecurringDates = (
  startDate: Date,
  endDate: Date,
  recurringType: 'weekly' | 'monthly',
  recurringEndDate: Date
): Array<{ start: Date; end: Date }> => {
  const dates: Array<{ start: Date; end: Date }> = [];
  let currentStart = new Date(startDate);
  let currentEnd = new Date(endDate);

  while (currentStart <= recurringEndDate) {
    dates.push({
      start: new Date(currentStart),
      end: new Date(currentEnd)
    });

    // Avança para a próxima data baseada no tipo de recorrência
    if (recurringType === 'weekly') {
      currentStart.setDate(currentStart.getDate() + 7);
      currentEnd.setDate(currentEnd.getDate() + 7);
    } else if (recurringType === 'monthly') {
      currentStart.setMonth(currentStart.getMonth() + 1);
      currentEnd.setMonth(currentEnd.getMonth() + 1);
    }
  }

  return dates;
};

export const calculateRecurringValue = (
  baseValue: number,
  recurringType: 'weekly' | 'monthly',
  recurringEndDate: Date,
  startDate: Date
): number => {
  const dates = generateRecurringDates(startDate, startDate, recurringType, recurringEndDate);
  return baseValue * dates.length;
};

export const validateRecurringDates = (
  startDate: Date,
  endDate: Date,
  recurringType: 'weekly' | 'monthly',
  recurringEndDate: Date,
  spaceId: string
): { isValid: boolean; message?: string } => {
  // Verificar se a data final da recorrência é válida
  if (recurringEndDate <= endDate) {
    return {
      isValid: false,
      message: "A data final da recorrência deve ser posterior à data de término da primeira reserva"
    };
  }

  // Verificar se não excede 1 ano de recorrência
  const maxRecurringDate = new Date(startDate);
  maxRecurringDate.setFullYear(maxRecurringDate.getFullYear() + 1);
  
  if (recurringEndDate > maxRecurringDate) {
    return {
      isValid: false,
      message: "A recorrência não pode exceder 1 ano"
    };
  }

  return { isValid: true };
};
