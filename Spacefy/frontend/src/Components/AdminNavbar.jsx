import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaChartBar, FaUsers, FaCalendarAlt, FaStar, FaHome } from 'react-icons/fa';

const AdminNavbar = () => {
  const location = useLocation();

  const navItems = [
    {
      path: '/admin',
      label: 'Dashboard',
      icon: <FaChartBar className="w-5 h-5" />
    },
    {
      path: '/avaliacoes',
      label: 'Avaliações',
      icon: <FaStar className="w-5 h-5" />
    },
    {
      path: '/reservas',
      label: 'Reservas',
      icon: <FaCalendarAlt className="w-5 h-5" />
    },
    {
      path: '/',
      label: 'Voltar ao Site',
      icon: <FaHome className="w-5 h-5" />
    }
  ];

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Spacefy Admin</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location.pathname === item.path
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-sm text-gray-500">
                Painel Administrativo
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
