import React, { useState } from 'react';
import axios from 'axios';

const RecurringRentalModal = ({ isOpen, onClose, space, onSuccess }) => {
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    startTime: '',
    endTime: '',
    isRecurring: true,
    recurringType: 'weekly',
    recurringEndDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateValue = () => {
    if (!formData.start_date || !formData.end_date || !formData.startTime || !formData.endTime || !space?.price_per_hour) {
      return 0;
    }

    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    const [startHour, startMinute] = formData.startTime.split(':').map(Number);
    const [endHour, endMinute] = formData.endTime.split(':').map(Number);
    const hoursPerDay = (endHour - startHour) + (endMinute - startMinute) / 60;
    
    const baseValue = days * hoursPerDay * space.price_per_hour;
    
    // Calcular número de instâncias recorrentes
    if (formData.isRecurring && formData.recurringEndDate) {
      const recurringEnd = new Date(formData.recurringEndDate);
      const start = new Date(formData.start_date);
      
      let instances = 1; // Primeira instância
      
      if (formData.recurringType === 'weekly') {
        const weeks = Math.ceil((recurringEnd - start) / (1000 * 60 * 60 * 24 * 7));
        instances = weeks;
      } else if (formData.recurringType === 'monthly') {
        const months = Math.ceil((recurringEnd - start) / (1000 * 60 * 60 * 24 * 30));
        instances = months;
      }
      
      return baseValue * instances;
    }
    
    return baseValue;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      const requestData = {
        userId,
        spaceId: space._id,
        ...formData,
        value: calculateValue()
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/rentals/recurring`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      onSuccess(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar reserva recorrente');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Reserva Recorrente</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Data de Início</label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Data de Fim</label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Horário Início</label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Horário Fim</label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Recorrência</label>
            <select
              name="recurringType"
              value={formData.recurringType}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Data Final da Recorrência</label>
            <input
              type="date"
              name="recurringEndDate"
              value={formData.recurringEndDate}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="bg-gray-100 p-3 rounded">
            <p className="text-sm font-medium">Valor Total Estimado:</p>
            <p className="text-lg font-bold text-green-600">
              R$ {calculateValue().toFixed(2)}
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecurringRentalModal;
