import React from 'react';
import { Upload, MessageCircle, FileText, Settings } from 'lucide-react';

interface NavbarProps {
  activeTab: 'upload' | 'chat' | 'documents';
  onTabChange: (tab: 'upload' | 'chat' | 'documents') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'upload' as const, label: 'Upload', icon: Upload },
    { id: 'documents' as const, label: 'Documentos', icon: FileText },
    { id: 'chat' as const, label: 'Chat', icon: MessageCircle },
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Settings className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">RAG Pentesting Tool</h1>
          </div>
          
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
