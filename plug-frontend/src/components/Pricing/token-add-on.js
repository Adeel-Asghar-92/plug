import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";

export default function TokenAddOn() {
  const stripePromise = loadStripe(
    process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
  );

  const { user } = useAuth();

  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASEURL}/api/plans/token-plans`
        );
        if (response.data) {
          setTokens(response?.data?.data);
          setSelectedToken(response?.data?.data[0]?._id);
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

    fetchTokens();
  }, []);

  const checkLogin = () => {
    if (!user) {
      navigate("/?login=true");
      return;
    }
  };

  const handleBuyWithStripe = async () => {
    checkLogin();
    try {
      setPurchaseLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_BASEURL}/api/create-token-stripe-checkout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: selectedToken,
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
    } catch (error) {
      console.log(error);
      toast.error("Failed to load plans.");
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleBuyWithPaypal = async () => {
    checkLogin();
    try {
      setPurchaseLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_BASEURL}/api/create-token-paypal-checkout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: selectedToken,
            userEmail: user?.email,
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
      toast.error(`Error initiating PayPal checkout: ${error.message}`);
      // Optionally update UI to show error message
    } finally {
      setPurchaseLoading(false);
    }
  };

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
    <section className="py-16 px-4 ">
      <div className="max-w-5xl mx-auto text-center">
        <motion.h2
          className="text-2xl font-semibold mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Need Just One Insight? Go Token-Only
        </motion.h2>

        <motion.p
          className="mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Access individual tools as you go—no subscription required.
        </motion.p>

        <motion.div
          className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {tokens.map((token, index) => (
            <motion.div
              key={index}
              className={`bg-gray-900 cursor-pointer text-white p-4 rounded shadow hover:shadow-md transition-all\
                ${token?._id === selectedToken ? "border border-blue-300" : ""}\
                `}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              onClick={() => setSelectedToken(token?._id)}
            >
              {console.log(token)}
              {token?.tokens} Tokens for ${token?.price}
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex gap-2 items-center justify-center"
        >
          <button
            disabled={purchaseLoading}
            onClick={handleBuyWithPaypal}
            className={`
              ${purchaseLoading ? "opacity-50 cursor-not-allowed" : ""}
              mt-6 inline-block px-6 py-3 bg-blue-800 text-white rounded-full hover:bg-blue-900 transition-colors`}
          >
            Buy With Paypal
          </button>
          <button
            disabled={purchaseLoading}
            onClick={handleBuyWithStripe}
            className={`
              ${purchaseLoading ? "opacity-50 cursor-not-allowed" : ""}
              mt-6 inline-block px-6 py-3 border border-blue-800  rounded-full  transition-colors`}
          >
            Buy With Stripe
          </button>
        </motion.div>
      </div>
    </section>
  );
}
