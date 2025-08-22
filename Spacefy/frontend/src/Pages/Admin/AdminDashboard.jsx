import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    spaceId: '',
    page: 1,
    limit: 10
  });
  const [spaces, setSpaces] = useState([]);

  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    fetchMetrics();
    fetchSpaces();
  }, [filters]);

  const fetchMetrics = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.spaceId) params.append('spaceId', filters.spaceId);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/metrics/${userId}?${params}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      setMetrics(response.data);
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpaces = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/spaces/owner/${userId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      setSpaces(response.data);
    } catch (error) {
      console.error('Erro ao buscar espaços:', error);
    }
  };

  const fetchRentals = async () => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/rentals/${userId}?${params}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      setRentals(response.data.rentals);
    } catch (error) {
      console.error('Erro ao buscar aluguéis:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset page when filters change
    }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Carregando métricas...</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">Erro ao carregar métricas</div>
      </div>
    );
  }

  // Preparar dados para gráficos
  const monthlyData = Object.entries(metrics.rentalsByMonth).map(([month, data]) => ({
    month,
    reservas: data.count,
    faturamento: data.revenue
  }));

  const spaceData = Object.entries(metrics.rentalsBySpace).map(([spaceName, data]) => ({
    name: spaceName,
    reservas: data.count,
    faturamento: data.revenue
  }));

  const pieData = spaceData.map(space => ({
    name: space.name,
    value: space.faturamento
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Painel Administrativo</h1>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Data Início</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data Fim</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Espaço</label>
              <select
                value={filters.spaceId}
                onChange={(e) => handleFilterChange('spaceId', e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Todos os espaços</option>
                {spaces.map(space => (
                  <option key={space._id} value={space._id}>
                    {space.space_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchRentals}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Buscar Aluguéis
              </button>
            </div>
          </div>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total de Reservas</h3>
            <p className="text-3xl font-bold text-blue-600">{metrics.totalRentals}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Faturamento Total</h3>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(metrics.totalRevenue)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Espaços Ativos</h3>
            <p className="text-3xl font-bold text-purple-600">{metrics.spaces.length}</p>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Faturamento Mensal */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Faturamento Mensal</h3>
            <LineChart width={400} height={300} data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="faturamento" stroke="#8884d8" />
            </LineChart>
          </div>

          {/* Gráfico de Reservas por Espaço */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Reservas por Espaço</h3>
            <BarChart width={400} height={300} data={spaceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="reservas" fill="#8884d8" />
            </BarChart>
          </div>
        </div>

        {/* Gráfico de Pizza - Distribuição de Faturamento */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Distribuição de Faturamento por Espaço</h3>
          <div className="flex justify-center">
            <PieChart width={400} height={300}>
              <Pie
                data={pieData}
                cx={200}
                cy={150}
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </div>
        </div>

        {/* Lista de Aluguéis */}
        {rentals.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Últimos Aluguéis</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Espaço
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rentals.map((rental) => (
                    <tr key={rental._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {rental.user?.name} {rental.user?.surname}
                        </div>
                        <div className="text-sm text-gray-500">{rental.user?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{rental.space?.space_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(rental.start_date)} - {formatDate(rental.end_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(rental.value)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
