import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  isNegative?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, isNegative = false }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold">{value}</p>
        </div>
        <div className="p-3 rounded-full bg-gray-100">{icon}</div>
      </div>
      <div className="mt-4 flex items-center">
        {isNegative ? (
          <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
        ) : (
          <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
        )}
        <span className={`text-sm font-medium ${isNegative ? 'text-red-500' : 'text-green-500'}`}>
          {change}
        </span>
        <span className="text-sm text-gray-500 ml-2">from last month</span>
      </div>
    </div>
  );
};

export default StatCard;