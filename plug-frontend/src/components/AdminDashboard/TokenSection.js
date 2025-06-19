import { Edit, Plus, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";

import axios from "axios";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";

function TokenSection() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [change, setChange] = useState(false);
  const [planFormData, setPlanFormData] = useState({
    title: "",
    monthlyPrice: 0,
    features: "",
    isPopular: false,
    geoListing: "",
    geoSearchSessions: "",
    isYearly: false,
  });

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASEURL}/api/admin/token-plans`,
          {
            params: { email: user.email },
          }
        );
        if (response.data) {
          setPlans(response.data.tokenPlans);
        } else {
          throw new Error("Failed to fetch plans");
        }
      } catch (error) {
        console.error("Error fetching plans:", error);
        toast.error("Failed to load plans.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [user.email, change]);

  const handleSavePlan = async (e) => {
    e.preventDefault();
    try {
      const planData = {
        name: planFormData.name,
        price: parseFloat(planFormData.price),
        tokens: parseFloat(planFormData.tokens),
      };
      if (selectedPlan) {
        const response = await axios.put(
          `${process.env.REACT_APP_API_BASEURL}/api/admin/token-plans/${selectedPlan?._id}`,
          planData,
          {
            params: { email: user.email },
          }
        );
        if (response.data) {
          setIsPlanModalOpen(false);
          toast.success(
            `Plan ${selectedPlan?.name ? "updated" : "created"} successfully!`
          );
          setSelectedPlan(null);
        } else {
          throw new Error("Failed to save plan");
        }
      } else {
        const response = await axios.post(
          `${process.env.REACT_APP_API_BASEURL}/api/admin/addTokenPlan`,
          planData,
          {
            params: { email: user.email },
          }
        );
        if (response.data && response.data.success) {
          setIsPlanModalOpen(false);
          toast.success(
            `Plan ${selectedPlan?.name ? "updated" : "created"} successfully!`
          );
        } else {
          throw new Error("Failed to save plan");
        }
      }
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error(error.response?.data?.message || "Failed to save plan.");
    } finally {
      setChange(!change);
    }
  };

  const openPlanModal = (plan = null) => {
    setSelectedPlan(plan);
    if (plan) {
      setPlanFormData({
        name: plan.name,
        price: plan.price,
        tokens: plan.tokens,
      });
    } else {
      setPlanFormData({
        name: "",
        price: 0,
        tokens: 0,
      });
    }
    setIsPlanModalOpen(true);
  };

  const handleDeletePlan = async (id, title) => {
    if (
      window.confirm(`Are you sure you want to delete the "${title}" plan?`)
    ) {
      try {
        const response = await axios.delete(
          `${process.env.REACT_APP_API_BASEURL}/api/admin/token-plans/${id}`,
          {
            params: { email: user.email },
          }
        );
        if (response.data) {
          toast.success("Plan deleted successfully!");
        } else {
          throw new Error("Failed to delete plan");
        }
      } catch (error) {
        console.error("Error deleting plan:", error);
        toast.error(error.response?.data?.message || "Failed to delete plan.");
      } finally {
        setChange(!change);
      }
    }
  };

  const handlePlanInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPlanFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <>
      <div className="overflow-hidden bg-gray-800 rounded-xl mb-8">
        <div className="p-6 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Token List</h3>
          <button
            onClick={() => openPlanModal()}
            className="inline-flex items-center px-3 py-1 space-x-1 text-sm font-medium text黏white transition-colors rounded-md bg-blue-500 hover:bg-blue-600"
          >
            <Plus className="w-4 h-4" />
            <span>Add Plan</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-700">
                <th className="px-6 py-3 text-sm font-medium text-gray-400">
                  Name
                </th>
                <th className="px-6 py-3 text-sm font-medium text-gray-400">
                  Price
                </th>
                <th className="px-6 py-3 text-sm font-medium text-gray-400">
                  Tokens
                </th>
                <th className="px-6 py-3 text-sm font-medium text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {plans.map((plan) => (
                <tr key={plan?._id} className="hover:bg-gray-750">
                  <td className="px-6 py-4 text-white">{plan?.name}</td>
                  <td className="px-6 py-4 text-gray-300">{plan?.price}</td>
                  <td className="px-6 py-4 text-gray-300">{plan?.tokens}</td>
                  <td className="px-6 py-4 flex space-x-2">
                    <button
                      onClick={() => openPlanModal(plan)}
                      className="inline-flex items-center px-3 py-1 space-x-1 text-sm font-medium text-blue-500 transition-colors rounded-md bg-blue-500/10 hover:bg-blue-500/20"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan?._id, plan?.name)}
                      className="inline-flex items-center px-3 py-1 space-x-1 text-sm font-medium text-red-500 transition-colors rounded-md bg-red-500/10 hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-gray-800 rounded-xl p-6 max-w-lg w-full"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl font-bold text-white mb-4">
              {selectedPlan ? "Edit Token Plan" : "Add Token Plan"}
            </h3>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <form onSubmit={handleSavePlan}>
              <div className="mb-4">
                <label className="block text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={planFormData.name}
                  onChange={handlePlanInputChange}
                  className="w-full p-2 bg-gray-700 text-white rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-1">Price</label>
                <input
                  type="number"
                  name="price"
                  value={planFormData.price}
                  onChange={handlePlanInputChange}
                  className="w-full p-2 bg-gray-700 text-white rounded-md"
                  min="0"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-1">Tokens</label>
                <input
                  type="text"
                  name="tokens"
                  value={planFormData.tokens}
                  onChange={handlePlanInputChange}
                  className="w-full p-2 bg-gray-700 text-white rounded-md"
                  placeholder="e.g., 20"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                >
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </>
  );
}

export default TokenSection;
