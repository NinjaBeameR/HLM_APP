import React from 'react';
import { Users, Edit3, CreditCard, BarChart3 } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex items-center justify-center">
    <div className="w-full max-w-sm mx-auto p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-gray-100">Hulimane Labour Management</h1>
      <div className="space-y-4">
        <button
          onClick={() => onNavigate('master')}
          className="w-full flex items-center justify-center space-x-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-800 dark:hover:bg-blue-900 text-white font-semibold py-4 rounded-lg shadow transition"
        >
          <Users className="h-6 w-6" />
          <span>Master</span>
        </button>
        <button
          onClick={() => onNavigate('entry')}
          className="w-full flex items-center justify-center space-x-3 bg-green-600 hover:bg-green-700 dark:bg-green-800 dark:hover:bg-green-900 text-white font-semibold py-4 rounded-lg shadow transition"
        >
          <Edit3 className="h-6 w-6" />
          <span>Daily Entry</span>
        </button>
        <button
          onClick={() => onNavigate('payments')}
          className="w-full flex items-center justify-center space-x-3 bg-orange-600 hover:bg-orange-700 dark:bg-orange-800 dark:hover:bg-orange-900 text-white font-semibold py-4 rounded-lg shadow transition"
        >
          <CreditCard className="h-6 w-6" />
          <span>Payment</span>
        </button>
        <button
          onClick={() => onNavigate('summary')}
          className="w-full flex items-center justify-center space-x-3 bg-purple-600 hover:bg-purple-700 dark:bg-purple-800 dark:hover:bg-purple-900 text-white font-semibold py-4 rounded-lg shadow transition"
        >
          <BarChart3 className="h-6 w-6" />
          <span>Summary</span>
        </button>
      </div>
    </div>
  </div>
);