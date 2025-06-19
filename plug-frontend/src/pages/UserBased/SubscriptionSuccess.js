import React, { useEffect, useContext, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader, AlertCircle } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import axios from "axios";

export const SubscriptionSuccess = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gray-900">
      <div className="w-full max-w-md p-8 text-center bg-gray-800 rounded-2xl">
        <>
          <CheckCircle className="w-20 h-20 mx-auto mb-6 text-green-500" />
          <h1 className="mb-4 text-2xl font-bold text-white">
            Subscription Successful!
          </h1>
          <p className="mb-6 text-gray-300">
            Thank you for subscribing. Your account has been upgraded to{" "}
            {user?.subscription}.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full py-3 text-white rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:opacity-90"
            >
              Go to Dashboard
            </button>
          </div>
        </>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;
