import { motion } from "framer-motion"
import { useState } from "react"

export default function PricingToggle({ onPeriodChange }) {
  const [isYearly, setIsYearly] = useState(true)

  const handleToggle = () => {
    const newValue = !isYearly
    setIsYearly(newValue)
    onPeriodChange(newValue)
  }

  return (
    <motion.div
      id="plans"
      className="flex flex-col items-center justify-center mb-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center space-x-4 mb-2">
        <span className={`text-lg transition-all duration-300 ${!isYearly ? "font-semibold" : "opacity-70"}`}>
          Monthly
        </span>

        <button
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${
            isYearly ? "bg-blue-500" : "bg-gray-300"
          }`}
          role="switch"
          aria-checked={isYearly}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isYearly ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>

        <span className={`text-lg transition-all duration-300 ${isYearly ? "font-semibold" : "opacity-70"}`}>
          Yearly
        </span>
      </div>

      {isYearly && (
        <motion.div
          className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
        >
          Save 20% with annual billing
        </motion.div>
      )}
    </motion.div>
  )
}
