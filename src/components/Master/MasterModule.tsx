import React, { useState } from 'react';
import { Users, Layers } from 'lucide-react';
import { LabourManagement } from './LabourManagement';
import { WorkCategoryManagement } from './WorkCategoryManagement';

export const MasterModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'labour' | 'category'>('labour');

  const tabs = [
    {
      id: 'labour' as const,
      name: 'Labour Management',
      icon: Users,
      description: 'Manage worker profiles and contact information'
    },
    {
      id: 'category' as const,
      name: 'Work Categories',
      icon: Layers,
      description: 'Configure work types and category hierarchy'
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'labour':
        return <LabourManagement />;
      case 'category':
        return <WorkCategoryManagement />;
      default:
        return <LabourManagement />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Master Creation</h1>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-8 border-b">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <div className="text-left">
                    <div>{tab.name}</div>
                    <div className="text-xs text-gray-400">{tab.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>
    </div>
  );
};