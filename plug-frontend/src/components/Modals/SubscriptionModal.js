import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { AuthContext } from '../../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const SubscriptionModal = ({ isOpen, onClose }) => {
  const { user } = useContext(AuthContext);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loadingStates, setLoadingStates] = useState({});
  const [error, setError] = useState(null);
  const [isYearlyBilling, setIsYearlyBilling] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [errorPlans, setErrorPlans] = useState(null);

  // Fetch plans from backend
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);
        setErrorPlans(null);
        const response = await axios.get(`${process.env.REACT_APP_API_BASEURL}/api/plans`);
        if (response.data && response.data.success) {
          const fetchedPlans = response.data.data.map((plan) => ({
            id: plan._id,
            name: plan.title,
            price: plan.monthlyPrice,
            features: plan.features,
            isPopular: plan.isPopular,
            isYearly: plan.isYearly,
          }));
          setPlans(fetchedPlans);
          if (fetchedPlans.length > 0) {
            setSelectedPlan(fetchedPlans[0].id);
          }
        } else {
          throw new Error('Failed to fetch plans');
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
        setErrorPlans('Unable to load plans. Please try again later.');
        toast.error('Failed to load plans.');
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, []);

  const handleSubscribe = async (plan, paymentProvider = 'stripe') => {
    if (!user) {
      console.error('User not authenticated');
      toast.error('Please log in to subscribe.');
      return;
    }

    try {
      // Set loading state for the specific plan and provider
      setLoadingStates((prev) => ({
        ...prev,
        [plan.id]: {
          ...prev[plan.id],
          [paymentProvider]: true,
        },
      }));
      setError(null);

      if (paymentProvider === 'stripe') {
        const response = await fetch(`${process.env.REACT_APP_API_BASEURL}/api/create-checkout-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planName: plan.id.toLowerCase(),
            price: isYearlyBilling ? plan.price * 12 : plan.price,
            yearly: isYearlyBilling,
            userEmail: user.email,
          }),
        });

        const { sessionId } = await response.json();
        if (!sessionId) throw new Error('Failed to create Stripe checkout session');

        const stripe = await stripePromise;
        const { error } = await stripe.redirectToCheckout({ sessionId });

        if (error) throw new Error(error.message);
      } else if (paymentProvider === 'paypal') {
        const response = await fetch(`${process.env.REACT_APP_API_BASEURL}/api/create-paypal-checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planName: plan.id.toLowerCase(),
            price: isYearlyBilling ? plan.price * 12 : plan.price,
            yearly: isYearlyBilling,
            userEmail: user.email,
          }),
        });

        const { approvalUrl } = await response.json();
        if (!approvalUrl) throw new Error('Failed to create PayPal checkout session');

        window.location.href = approvalUrl; // Redirect to PayPal approval
      }
    } catch (err) {
      setError(err.message);
      console.error('Payment error:', err);
      toast.error(err.message);
    } finally {
      // Reset loading state for the specific plan and provider
      setLoadingStates((prev) => ({
        ...prev,
        [plan.id]: {
          ...prev[plan.id],
          [paymentProvider]: false,
        },
      }));
    }
  };

  if (!isOpen) return null;

  // Filter plans based on isYearlyBilling
  const displayedPlans = isYearlyBilling
    ? plans.filter((plan) => plan.isYearly)
    : plans.filter((plan) => !plan.isYearly);

  return (
    <Elements stripe={stripePromise}>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-[90vw] md:max-w-5xl lg:max-w-6xl max-h-[90vh] p-4 md:p-6 lg:p-8 bg-gray-900/80 shadow-2xl rounded-2xl backdrop-blur-md border border-gray-700/50 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-800"
          >
            {error && (
              <div className="p-4 mb-4 text-red-500 border border-red-500 rounded-lg bg-red-500/10">
                {error}
              </div>
            )}
            {errorPlans && (
              <div className="p-4 mb-4 text-red-500 border border-red-500 rounded-lg bg-red-500/10">
                {errorPlans}
              </div>
            )}
            {/* Header */}
            <div className="flex items-center justify-between mb-4 md:mb-8">
              <div>
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">Choose Your Plan</h2>
                <p className="mt-2 text-sm md:text-base text-gray-300">Select the perfect plan to elevate your luxury marketplace presence with cutting-edge AI tools.</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="inline-block bg-gradient-to-r from-blue-500 to-blue-700 text-white py-1 px-3 md:py-1.5 md:px-4 lg:py-2 lg:px-6 rounded-full hover:from-blue-400 hover:to-blue-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-blue-500/50"
              >
                ← Back
              </motion.button>
            </div>

            {/* Monthly/Yearly Toggle */}
            <div className="flex justify-center mb-4 md:mb-8">
              <div className="inline-flex rounded-full bg-gray-800/50 p-1 border border-gray-700/50 w-[180px] md:w-[200px]">
                <button
                  onClick={() => setIsYearlyBilling(false)}
                  className={`px-3 md:px-6 py-1 rounded-full text-xs md:text-sm font-medium ${!isYearlyBilling ? 'bg-blue-500 text-white' : 'bg-transparent text-gray-300'} transition-colors duration-300`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsYearlyBilling(true)}
                  className={`px-3 md:px-6 py-1 rounded-full text-xs md:text-sm font-medium ${isYearlyBilling ? 'bg-blue-500 text-white' : 'bg-transparent text-gray-300'} transition-colors duration-300`}
                >
                  Yearly
                </button>
              </div>
            </div>

            {/* Plans Grid */}
            {loadingPlans ? (
              <div className="flex justify-center items-center h-40">
                <div className="w-10 h-10 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : displayedPlans.length === 0 ? (
              <div className="text-center py-12 text-gray-300">
                <p>No plans available for {isYearlyBilling ? 'yearly' : 'monthly'} billing. Please switch billing options or contact support.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mb-4 md:mb-8">
                {displayedPlans.map((plan, index) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 * index }}
                    className={`relative bg-gradient-to-br from-gray-800/80 via-gray-900/80 to-blue-900/80 p-4 md:p-6 lg:p-8 rounded-2xl shadow-2xl backdrop-blur-lg border border-gray-700/50 flex flex-col justify-between min-h-[450px] md:min-h-[500px] w-full transition-all duration-500 hover:shadow-blue-500/50 hover:-translate-y-2 ${plan.isPopular ? 'ring-4 ring-blue-500' : ''} ${selectedPlan === plan.id ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    {plan.isPopular && (
                      <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs md:text-sm font-bold px-2 md:px-3 py-0.5 rounded-full shadow-lg">
                        Most Popular
                      </span>
                    )}
                    <div>
                      <h3 className="text-2xl md:text-3xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">{plan.name}</h3>
                      <div className="flex items-baseline justify-center mb-4 md:mb-6">
                        <p className="text-3xl md:text-4xl font-extrabold">${plan.price}</p>
                        <span className="text-base ml-2 text-gray-300">/month</span>
                      </div>
                      <ul className="mb-4 space-y-3 text-sm">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start">
                            <svg className="w-5 h-5 text-blue-400 mr-2 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-gray-200">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-col gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSubscribe(plan, 'stripe')}
                        disabled={loadingStates[plan.id]?.stripe || false}
                        className="block w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 rounded-full hover:from-blue-400 hover:to-blue-600 transition-all duration-300 font-semibold text-center shadow-lg hover:shadow-blue-500/50 disabled:opacity-50"
                      >
                        {loadingStates[plan.id]?.stripe ? 'Processing...' : `Choose ${plan.name} (Stripe)`}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSubscribe(plan, 'paypal')}
                        disabled={loadingStates[plan.id]?.paypal || false}
                        className="block w-full bg-gradient-to-r from-yellow-500 to-yellow-700 text-white py-3 rounded-full hover:from-yellow-400 hover:to-yellow-600 transition-all duration-300 font-semibold text-center shadow-lg hover:shadow-yellow-500/50 disabled:opacity-50"
                      >
                        {loadingStates[plan.id]?.paypal ? 'Processing...' : `Choose ${plan.name} (PayPal)`}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            {!loadingPlans && displayedPlans.length > 0 && (
              <div className="flex flex-col md:flex-row justify-end space-y-4 md:space-y-0 md:space-x-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="w-full md:w-auto px-6 py-3 text-gray-300 transition-colors bg-gray-800 rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </motion.button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Elements>
  );
};

export default SubscriptionModal;