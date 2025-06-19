import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/HomePage/Footer';
import { motion } from 'framer-motion';
import SignupModal from '../components/Modals/SignupModal';
import LoginModal from '../components/Modals/LoginModal';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { toast } from 'react-hot-toast';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const PricingCard = ({ plan, user, onSelectPlan, isSelected, loadingStates }) => {
  return (
    <motion.div
      className={`relative bg-gradient-to-br from-gray-800/80 via-gray-900/80 to-blue-900/80 text-white p-8 rounded-2xl shadow-2xl backdrop-blur-lg border border-gray-700/50 flex flex-col justify-between min-h-[600px] w-full max-w-[320px] mx-auto transition-all duration-500 hover:shadow-blue-500/50 hover:-translate-y-2 ${plan.isPopular ? 'ring-4 ring-blue-500' : ''} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {plan.isPopular && (
        <span className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-sm font-bold px-4 py-1 rounded-full shadow-lg">
          Most Popular
        </span>
      )}
      <div>
        <h3 className="text-3xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">{plan.name}</h3>
        <div className="flex items-baseline justify-center mb-6">
          <p className="text-5xl font-extrabold">${plan.price}</p>
          <span className="text-lg ml-2 text-gray-300">/month</span>
        </div>
        <ul className="mb-8 space-y-4 text-sm">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <svg className="w-6 h-6 text-blue-400 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          onClick={() => onSelectPlan(plan, 'stripe')}
          disabled={loadingStates[plan.id]?.stripe || false}
          className="block w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 rounded-full hover:from-blue-400 hover:to-blue-600 transition-all duration-300 font-semibold text-center shadow-lg hover:shadow-blue-500/50 disabled:opacity-50"
        >
          {loadingStates[plan.id]?.stripe ? 'Processing...' : `Choose ${plan.name} (Stripe)`}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectPlan(plan, 'paypal')}
          disabled={loadingStates[plan.id]?.paypal || false}
          className="block w-full bg-gradient-to-r from-yellow-500 to-yellow-700 text-white py-3 rounded-full hover:from-yellow-400 hover:to-yellow-600 transition-all duration-300 font-semibold text-center shadow-lg hover:shadow-yellow-500/50 disabled:opacity-50"
        >
          {loadingStates[plan.id]?.paypal ? 'Processing...' : `Choose ${plan.name} (PayPal)`}
        </motion.button>
      </div>
    </motion.div>
  );
};

const FAQItem = ({ question, answer }) => (
  <motion.div
    className="border-b border-gray-700/50 py-6"
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5 }}
  >
    <h3 className="text-xl font-semibold text-white mb-3">{question}</h3>
    <p className="text-gray-300 leading-relaxed">{answer}</p>
  </motion.div>
);

const Testimonial = ({ quote, author, role }) => (
  <motion.div
    className="bg-gray-800/50 p-6 rounded-xl shadow-lg backdrop-blur-md border border-gray-700/50 transition-transform hover:scale-105 hover:shadow-blue-500/30"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <p className="text-gray-300 italic mb-4 leading-relaxed">"{quote}"</p>
    <p className="text-white font-semibold">{author}</p>
    <p className="text-gray-400 text-sm">{role}</p>
  </motion.div>
);

export default function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isGlobalYearly, setIsGlobalYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [errorPlans, setErrorPlans] = useState(null);
  const [loadingStates, setLoadingStates] = useState({});
  const [error, setError] = useState(null);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const faqs = [
    {
      question: "Can I change plans later?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle."
    },
    {
      question: "Is there a free trial available?",
      answer: "We offer a 7-day free trial for the Premium plan, allowing you to explore all premium features before committing."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, and bank transfers for Enterprise plans."
    },
    {
      question: "Can I cancel my subscription?",
      answer: "Absolutely, you can cancel your subscription at any time with no cancellation fees."
    }
  ];

  const testimonials = [
    {
      quote: "The Premium plan's AI search transformed how we find luxury assets. It's worth every penny!",
      author: "Sarah Thompson",
      role: "Luxury Real Estate Investor"
    },
    {
      quote: "The Enterprise plan's dedicated support made our large-scale transactions seamless.",
      author: "James Rodriguez",
      role: "Yacht Broker"
    }
  ];

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
            geoListing: plan.geoListing,
            geoSearchSessions: plan.geoSearchSessions,
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
        setErrorPlans('Unable to load pricing plans. Please try again later.');
        toast.error('Failed to load pricing plans.');
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, []);

  const handleSelectPlan = async (plan, paymentProvider = 'stripe') => {
    if (!user) {
      setIsLoginModalOpen(true);
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
  };

  // Filter plans based on isGlobalYearly
  const displayedPlans = isGlobalYearly
    ? plans.filter((plan) => plan.isYearly)
    : plans.filter((plan) => !plan.isYearly);

  return (
    <Elements stripe={stripePromise}>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <button
              onClick={() => navigate(-1)}
              className="inline-block bg-gradient-to-r from-blue-500 to-blue-700 text-white py-2 px-6 rounded-full hover:from-blue-400 hover:to-blue-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-blue-500/50"
            >
              ← Back
            </button>
          </motion.div>

          {/* Header Section */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="text-5xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 mb-4">Pricing Plans</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">Choose the perfect plan to elevate your luxury marketplace presence with cutting-edge AI tools.</p>
          </motion.div>

          {/* Monthly/Yearly Toggle */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex rounded-full bg-gray-800/50 p-1.5 border border-gray-700/50">
              <button
                onClick={() => setIsGlobalYearly(false)}
                className={`px-8 py-2 rounded-full text-sm font-medium ${!isGlobalYearly ? 'bg-blue-500 text-white' : 'bg-transparent text-gray-300'} transition-colors duration-300`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsGlobalYearly(true)}
                className={`px-8 py-2 rounded-full text-sm font-medium ${isGlobalYearly ? 'bg-blue-500 text-white' : 'bg-transparent text-gray-300'} transition-colors duration-300`}
              >
                Yearly
              </button>
            </div>
          </div>

          {/* Error and Loading States */}
          {error && (
            <div className="p-4 mb-8 text-red-500 border border-red-500 rounded-lg bg-red-500/10">
              {error}
            </div>
          )}
          {errorPlans && (
            <div className="p-4 mb-8 text-red-500 border border-red-500 rounded-lg bg-red-500/10">
              {errorPlans}
            </div>
          )}
          {loadingPlans ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-10 h-10 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : displayedPlans.length === 0 ? (
            <div className="text-center py-12 text-gray-300">
              <p>No plans available for {isGlobalYearly ? 'yearly' : 'monthly'} billing. Please switch billing options or contact support.</p>
            </div>
          ) : (
            <>
              {/* Pricing Cards */}
              <div className={`mb-20 ${isGlobalYearly ? 'flex flex-wrap justify-center gap-8' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'}`}>
                {displayedPlans.map((plan, index) => (
                  <PricingCard
                    key={plan.id}
                    plan={plan}
                    user={user}
                    onSelectPlan={handleSelectPlan}
                    isSelected={selectedPlan === plan.id}
                    loadingStates={loadingStates}
                  />
                ))}
              </div>



              {/* FAQ Section */}
              <div className="mb-20">
                <h2 className="text-4xl font-bold text-center mb-10 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">Frequently Asked Questions</h2>
                <div className="max-w-4xl mx-auto bg-gray-800/50 p-10 rounded-2xl shadow-2xl backdrop-blur-md border border-gray-700/50">
                  {faqs.map((faq, index) => (
                    <FAQItem key={index} question={faq.question} answer={faq.answer} />
                  ))}
                </div>
              </div>

              {/* Testimonial Section */}
              <div className="mb-20">
                <h2 className="text-4xl font-bold text-center mb-10 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">What Our Customers Say</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                  {testimonials.map((testimonial, index) => (
                    <Testimonial key={index} {...testimonial} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <Footer />

        {/* Modals */}
        <SignupModal
          isOpen={isSignupModalOpen}
          onClose={() => setIsSignupModalOpen(false)}
          onSwitchToLogin={() => {
            setIsSignupModalOpen(false);
            setIsLoginModalOpen(true);
          }}
        />
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSwitchToSignup={() => {
            setIsLoginModalOpen(false);
            setIsSignupModalOpen(true);
          }}
        />
      </div>
    </Elements>
  );
}