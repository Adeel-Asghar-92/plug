import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function PricingCard({ plan, onSelect }) {
  const navigate = useNavigate();
  return (
    <motion.div
      className="flex flex-col border rounded-lg overflow-hidden w-full h-full"
      whileHover={{
        y: -5,
        boxShadow:
          "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {/* Card Header */}
      <div
        className={`relative p-6 ${
          plan.highlight
            ? "border-b-2 border-blue-500 bg-gradient-to-br from-gray-800/80 via-gray-900/80 to-blue-900/80 text-white"
            : "bg-gradient-to-br from-gray-800/80 via-gray-900/80 to-blue-900/80 text-white"
        }`}
      >
        {plan.highlight && (
          <div className="absolute top-0 right-0 bg-blue-600 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
            POPULAR
          </div>
        )}
        <h3 className="text-xl font-bold mb-2">{plan.name}</h3>

        <motion.p
          className="text-2xl font-bold"
          key={plan.price} // This forces re-animation when price changes
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {plan?.name === "Enterprise Custom" ? "Custom" : plan.price}
        </motion.p>
      </div>

      {/* Card Body */}
      <div className="flex-grow p-6">
        <ul className="mb-6 space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              {feature.included ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span>{feature.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Card Footer */}
      <div className="p-6 mt-auto">
        <button
          onClick={() => {
            if (plan.name === "Free Trial") {
              toast("Select Any Plan you want to upgrade to");
            } else if (plan.name === "Enterprise Custom") {
              navigate("/?contact=true");
            } else {
              onSelect();
            }
          }}
          className={`w-full text-center px-4 py-2 ${plan.ctaColor} text-white rounded hover:opacity-90 transition-opacity`}
        >
          {plan.name === "Free Trial"
            ? "Upgrade"
            : plan.name === "Enterprise Custom"
            ? "Contact Us"
            : "Choose Plan"}
        </button>
      </div>
    </motion.div>
  );
}
