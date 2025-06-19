import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";

export default function Hero() {
  return (
    <section className="flex justify-between items-center pt-5 pb-1">
      <Link
        className="
       m-3 py-1 px-5 rounded-sm bg-blue-700 text-white transition-colors duration-300 ease-in-out"
        to="/"
      >
        Back
      </Link>
      <div className="mx-auto px-4 text-center">
        <motion.h1
          className="text-2xl font-bold mb-4m text-blue-600"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Unlock the True Power of Value Intelligence
        </motion.h1>

        <motion.p
          className="text-md mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Access exclusive listings, precision valuations, and verified global
          luxury buyers & sellers.
        </motion.p>
      </div>
      <div />
    </section>
  );
}
