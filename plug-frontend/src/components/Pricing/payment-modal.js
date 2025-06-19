import { AnimatePresence, motion } from "framer-motion";

import { useState } from "react";

export default function PaymentModal({
  isOpen,
  onClose,
  onSelectPayment,
  plan,
  isLoading,
}) {
  const [selectedMethod, setSelectedMethod] = useState(null);

  const handlePaymentSelect = (provider) => {
    setSelectedMethod(provider);
    onSelectPayment(plan, provider);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 20 }}
            className="rounded-lg shadow-xl max-w-md w-full p-6 bg-[#00081e]"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Select Payment Method</h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                disabled={isLoading}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                You've selected the{" "}
                <span className="font-semibold">{plan?.name}</span> plan at{" "}
                <span className="font-semibold">{plan?.price}</span>
              </p>
              <p className="text-sm text-gray-500">
                Please select your preferred payment method to continue.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handlePaymentSelect("stripe")}
                disabled={isLoading}
                className={`w-full flex items-center justify-between p-4 border rounded-lg transition-all
                }`}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 mr-3 flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-full h-full"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"
                        fill="#6772E5"
                      />
                    </svg>
                  </div>
                  <span className="font-medium">Pay with Stripe</span>
                </div>
                {isLoading && selectedMethod === "stripe" ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
                ) : (
                  <svg
                    className={`h-5 w-5 ${
                      selectedMethod === "stripe"
                        ? "text-black"
                        : "text-gray-400"
                    }`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>

              <button
                onClick={() => handlePaymentSelect("paypal")}
                disabled={isLoading}
                className={`w-full flex items-center justify-between p-4 border rounded-lg transition-all `}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 mr-3 flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-full h-full"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19c-.018 0-.034.002-.051.005L8.16 21.337H12.683c.045 0 .085-.004.127-.011.074-.012.136-.043.188-.082a.4.4 0 0 0 .09-.115c.023-.051.035-.103.035-.162l.002-.016.977-6.178.002-.01c.004-.06.015-.111.038-.162a.4.4 0 0 1 .09-.115.37.37 0 0 1 .188-.082 1.026 1.026 0 0 1 .127-.011h.805c3.681 0 6.57-1.498 7.413-5.828.36-1.846.174-3.388-.717-4.471z"
                        fill="#003087"
                      />
                      <path
                        d="M20.615 6.374c-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106-.316 2.011c-.069.44.27.84.714.84h4.185c.592 0 1.094-.431 1.187-1.014l.05-.248 1.045-6.633.032-.182c.092-.583.595-1.014 1.187-1.014h.746c4.849 0 8.647-1.97 9.76-7.667.459-2.37.222-4.348-1.015-5.734-.368-.415-.813-.757-1.356-1.037.132.891.097 1.825-.135 2.938z"
                        fill="#3086C8"
                      />
                    </svg>
                  </div>
                  <span className="font-medium">Pay with PayPal</span>
                </div>
                {isLoading && selectedMethod === "paypal" ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
                ) : (
                  <svg
                    className={`h-5 w-5 ${
                      selectedMethod === "paypal"
                        ? "text-black"
                        : "text-gray-400"
                    }`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </div>

            <div className="text-xs text-gray-500 mb-4">
              Your payment information is processed securely. We do not store
              your credit card details.
            </div>

            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 mr-2"
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
