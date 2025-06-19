import { useEffect, useState } from "react";

import PaymentModal from "./payment-modal";
import PricingCard from "./pricing-card";
import PricingToggle from "./pricing-toggle";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function  PricingTable() {
  const { user } = useAuth();
  const [isYearly, setIsYearly] = useState(true);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [errorPlans, setErrorPlans] = useState(null);
  const [toast, setToast] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loadingStates, setLoadingStates] = useState({});
  const [error, setError] = useState(null);

  const stripePromise = loadStripe(
    process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
  );

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);
        setErrorPlans(null);
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASEURL}/api/plans`
        );
        if (response.data && response.data.success) {
          const fetchedPlans = response.data.data.map((plan) => ({
            id: plan._id,
            name: plan.title,
            monthlyPrice: plan.monthlyPrice,
            yearlyPrice: plan.yearlyPrice,
            features: plan.features.map((feature) => ({
              text: feature,
              included: true,
            })),
            ctaText: "Choose Plan",
            ctaLink: "#",
            highlight: plan.isPopular,
            ctaColor: plan.isPopular ? "bg-blue-500" : "bg-gray-800",
            isYearly: plan.isYearly,
            geoListing: plan.geoListing,
            geoSearchSessions: plan.geoSearchSessions,
          }));
          setPlans(fetchedPlans);
          if (fetchedPlans.length > 0) {
            setSelectedPlan(fetchedPlans[0].id);
          }
        } else {
          throw new Error("Failed to fetch plans");
        }
      } catch (error) {
        console.error("Error fetching plans:", error);
        setErrorPlans("Unable to load pricing plans. Please try again later.");
        showToast("Failed to load pricing plans.", "error");
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePeriodChange = (yearly) => {
    setIsYearly(yearly);
  };

  const handleSelectPlan = (planId) => {
    const plan = plans.find((p) => p.id === planId);
    if (plan) {
      setCurrentPlan({
        ...plan,
        price: isYearly
          ? `$${plan.monthlyPrice * 12}/yr`
          : `$${plan.monthlyPrice}/mo`,
      });
      setPaymentModalOpen(true);
    }
  };
  const handlePaymentSelect = async (plan, paymentProvider = "stripe") => {
    if (!user) {
      navigate("/?login=true");
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

      if (paymentProvider === "stripe") {
        const response = await fetch(
          `${process.env.REACT_APP_API_BASEURL}/api/create-checkout-session`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              planName: plan.id.toLowerCase(),
              price: isYearly ? plan.price * 12 : plan.price,
              yearly: isYearly,
              userEmail: user.email,
            }),
          }
        );

        const { sessionId } = await response.json();
        if (!sessionId)
          throw new Error("Failed to create Stripe checkout session");

        const stripe = await stripePromise;
        const { error } = await stripe.redirectToCheckout({ sessionId });

        if (error) throw new Error(error.message);
      } else if (paymentProvider === "paypal") {
        try {
          const response = await fetch(
            `${process.env.REACT_APP_API_BASEURL}/api/create-paypal-checkout`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                planName: plan.id.toLowerCase(),
                price: isYearly ? plan.price * 12 : plan.price,
                yearly: isYearly,
                userEmail: user.email,
              }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.error || "Failed to create PayPal checkout session"
            );
          }

          const { approvalUrl, orderId } = await response.json();
          if (!approvalUrl) {
            throw new Error("No approval URL returned from PayPal");
          }

          // Optionally store orderId in localStorage or state for later use (e.g., after redirect)
          localStorage.setItem("paypalOrderId", orderId);

          // Redirect to PayPal approval URL
          window.location.href = approvalUrl;
        } catch (error) {
          console.error("PayPal checkout error:", error);
          alert(`Error initiating PayPal checkout: ${error.message}`);
          // Optionally update UI to show error message
        }
      }
    } catch (err) {
      setError(err.message);
      console.error("Payment error:", err);
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

  const filteredPlans = plans.filter((plan) => {
    console.log(plan)
    if (isYearly) {
      return plan.isYearly === true;
    } else {
      return plan.isYearly === false;
    }
  });
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <section id="plans" className="pt-0 pb-20 px-4 relative">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          className="text-3xl font-semibold text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Membership Plans
        </motion.h2>

        <PricingToggle onPeriodChange={handlePeriodChange} />

        {loadingPlans ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
            <span className="ml-2 text-lg">Loading plans...</span>
          </div>
        ) : errorPlans ? (
          <div className="text-center py-10 text-red-500">
            <p>{errorPlans}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
            >
              Retry
            </button>
          </div>
        ) : (
          // <div className="w-screen flex items-center justify-center">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredPlans.map((plan) => (
              <motion.div
                key={plan.id}
                variants={itemVariants}
                className="flex"
              >
                <PricingCard
                  plan={{
                    ...plan,
                    price: isYearly
                      ? `$${plan.monthlyPrice}/mo`
                      : `$${plan.monthlyPrice}/mo`,
                    isSelected: selectedPlan === plan.id,
                    ctaColor: plan?.highlight ? "bg-blue-500" : "bg-gray-800",
                  }}
                  onSelect={() => handleSelectPlan(plan.id)}
                />
              </motion.div>
            ))}
          </motion.div>
          // </div>
        )}
      </div>

      {/* Payment Method Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSelectPayment={handlePaymentSelect}
        plan={currentPlan}
        isLoading={loadingPayment}
      />
    </section>
  );
}
