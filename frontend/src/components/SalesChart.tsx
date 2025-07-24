import React from 'react';

const SalesChart = () => {
  // In a real application, this would be a proper chart using a library like Chart.js or Recharts
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const values = [12500, 18200, 16800, 22000, 20500, 24000];
  const maxValue = Math.max(...values);
  
  return (
    <div className="h-64">
      <div className="flex h-52 items-end space-x-2">
        {months.map((month, index) => (
          <div key={month} className="flex flex-col items-center flex-1">
            <div 
              className="w-full bg-indigo-500 rounded-t"
              style={{ 
                height: `${(values[index] / maxValue) * 100}%`,
              }}
            ></div>
            <div className="text-xs mt-2">{month}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalesChart;