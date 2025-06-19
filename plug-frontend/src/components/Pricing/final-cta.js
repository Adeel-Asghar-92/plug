import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";

export default function FinalCTA() {
  const { user } = useAuth();
  return (
    <section className="text-center py-16 text-white bg-gradient-to-br from-gray-800/80 via-gray-900/80 to-blue-900/80">
      <div className="container mx-auto px-4">
        <motion.h2
          className="text-3xl font-bold mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Ready to unlock global luxury intelligence?
        </motion.h2>

        <motion.p
          className="mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Whether you're buying a $20M jet or selling a rare timepiece,
          ValueVault helps you price smarter and move faster.
        </motion.p>

        <motion.div
          className="flex flex-wrap justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {!user && (
            <Link
              to="/?login=true"
              className="px-6 py-3 bg-blue-800 rounded-full transition-colors"
            >
              Join for Free
            </Link>
          )}

          <a
            href="/pricing/#plans"
            className="px-6 py-3 border border-blue-500 rounded-full hover:bg-blue-800 transition-colors"
          >
            Compare Plans
          </a>
        </motion.div>
      </div>
    </section>
  );
}
