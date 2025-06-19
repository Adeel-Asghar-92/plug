
// SubscriptionCancel.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';

export const SubscriptionCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gray-900">
      <div className="w-full max-w-md p-8 text-center bg-gray-800 rounded-2xl">
        <XCircle className="w-20 h-20 mx-auto mb-6 text-red-500" />
        <h1 className="mb-4 text-2xl font-bold text-white">Subscription Cancelled</h1>
        <p className="mb-6 text-gray-300">Your subscription process was cancelled. No charges were made.</p>
        <button
          onClick={() => navigate('/')}
          className="w-full py-3 text-white rounded-lg bg-gradient-to-r from-gray-600 to-gray-700 hover:opacity-90"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default SubscriptionCancel;