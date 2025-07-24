import React from 'react';

const StockStatusChart = () => {
  // In a real application, this would be a proper chart using a library like Chart.js or Recharts
  return (
    <div className="h-64 flex items-center justify-center">
      <div className="text-center">
        <div className="flex space-x-8 justify-center">
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full border-8 border-green-500 flex items-center justify-center">
              <span className="text-2xl font-bold">65%</span>
            </div>
            <span className="mt-2 text-sm font-medium">In Stock</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full border-8 border-yellow-500 flex items-center justify-center">
              <span className="text-2xl font-bold">25%</span>
            </div>
            <span className="mt-2 text-sm font-medium">Low Stock</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full border-8 border-red-500 flex items-center justify-center">
              <span className="text-2xl font-bold">10%</span>
            </div>
            <span className="mt-2 text-sm font-medium">Out of Stock</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockStatusChart;