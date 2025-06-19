import { motion } from "framer-motion";

export const FeatureCard = ({ title, description }) => {
  return (
    <motion.div
      className="bg-[#2A2A2A] p-4 rounded-xl border border-gray-900 hover:border-l-gray-950 transition-colors"
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </motion.div>
  );
};