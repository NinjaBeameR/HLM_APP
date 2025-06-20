import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LabourManagement } from './LabourManagement';
import { WorkCategoryManagement } from './WorkCategoryManagement';

export const MasterPage: React.FC = () => {
  const navigate = useNavigate();
  const [showWageTable, setShowWageTable] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 rounded hover:bg-blue-300 dark:hover:bg-blue-900"
          >
            Home
          </button>
          <button
            onClick={() => setShowWageTable(false)}
            className={`px-4 py-2 rounded ${
              !showWageTable
                ? 'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 hover:bg-blue-300 dark:hover:bg-blue-900'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
            }`}
          >
            Labour Management
          </button>
          <button
            onClick={() => setShowWageTable(true)}
            className={`px-4 py-2 rounded ${
              showWageTable
                ? 'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 hover:bg-blue-300 dark:hover:bg-blue-900'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
            }`}
          >
            Work Category Management
          </button>
        </div>
        <h1 className="text-3xl font-bold text-center mb-10 tracking-tight text-blue-900 dark:text-blue-200">
          HULIMANE LABOUR MANAGEMENT
        </h1>
        <div className="space-y-10">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-6">
            {showWageTable ? <WorkCategoryManagement /> : <LabourManagement />}
          </div>
        </div>
      </div>
    </div>
  );
};