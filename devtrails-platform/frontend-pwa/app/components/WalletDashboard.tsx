import React from "react";

export function WalletDashboard() {
  return (
    <div className="p-4 bg-white shadow rounded-lg w-full max-w-md">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Worker Wallet Dashboard</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-3 rounded">
          <p className="text-sm text-gray-500 mb-1">Active Balance</p>
          <p className="font-semibold text-2xl text-blue-600">₹8,450.00</p>
        </div>

        <div className="bg-green-50 p-3 rounded">
          <p className="text-sm text-gray-500 mb-1">Weekly Premium</p>
          <p className="font-semibold text-2xl text-green-600">₹22.00</p>
        </div>
      </div>

      <div className="mt-4 border-t pt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Active Tier:</span>
          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-semibold">Tier 2</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Current Zone:</span>
          <span className="font-semibold">south_delhi_h3_index</span>
        </div>
      </div>
    </div>
  );
}
