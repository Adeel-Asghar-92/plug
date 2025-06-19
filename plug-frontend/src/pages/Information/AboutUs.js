// src/pages/Information/AboutUs.js
import React from 'react';
import { ChevronLeft, MapPin, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const AboutUs = () => {
  const navigate = useNavigate();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white">
      <div className="container px-4 py-12 mx-auto max-w-5xl">
        <motion.button
          onClick={() => navigate('/')}
          className="flex items-center mb-8 text-gray-300 hover:text-white transition-colors"
          whileHover={{ x: -5 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Back to Home
        </motion.button>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-16"
        >
          {/* Hero Section */}
          <motion.section variants={itemVariants} className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">About Us</h1>
            <h2 className="text-2xl md:text-3xl font-semibold mb-6">ValueVault.ai</h2>
            <div className="flex items-center justify-center gap-2 text-gray-300">
              <MapPin className="w-5 h-5 text-blue-400" />
              <p>Location: Dallas, Texas</p>
            </div>
          </motion.section>

          {/* Who We Are */}
          <motion.section variants={itemVariants}>
            <div className="relative">
              <h2 className="text-2xl font-bold mb-6 inline-block">
                Who We Are
                <div className="absolute bottom-0 left-0 h-1 w-20 bg-gradient-to-r from-purple-400 to-blue-500"></div>
              </h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              At ValueVault.ai, we're redefining how the world values and trades high-value assets. Based 
              in the vibrant heart of Dallas, Texas, we are a cutting-edge technology company specializing 
              in AI-driven asset valuation processing luxury assets—think yachts gliding across open waters, 
              private jets soaring through the skies, sprawling estates that define opulence, and rare 
              collectibles that capture history. Our mission is simple yet bold: to bring clarity, fairness, and 
              innovation to the complex world of luxury asset valuation and transactions.
            </p>
          </motion.section>

          {/* What We Do */}
          <motion.section variants={itemVariants}>
            <div className="relative">
              <h2 className="text-2xl font-bold mb-6 inline-block">
                What We Do
                <div className="absolute bottom-0 left-0 h-1 w-20 bg-gradient-to-r from-purple-400 to-blue-500"></div>
              </h2>
            </div>
            <p className="text-gray-300 leading-relaxed mb-6">
              ValueVault.ai combines advanced artificial intelligence with a seamless marketplace platform 
              to empower buyers, sellers, and enthusiasts of high-value assets. Our proprietary AI 
              technology analyzes a wealth of data—market trends, historical sales, asset specifics, and 
              behavioral insights—to deliver valuation estimates that cut through the noise of speculation.
              Whether you're looking to understand the worth of a prized possession or seeking the 
              perfect addition to your portfolio, our platform provides data-driven insights you can trust.
            </p>
            
            <p className="text-gray-300 leading-relaxed">
              Beyond valuations, we've built a dynamic marketplace where luxury meets opportunity. 
              We help users can buy luxury assets, connect with serious buyers or sellers, and navigate 
              transactions with confidence. We're not just a tool—we're a partner in helping you make 
              informed decisions in a market where precision matters.
            </p>
          </motion.section>

          {/* Our Technology */}
          <motion.section variants={itemVariants}>
            <div className="relative">
              <h2 className="text-2xl font-bold mb-6 inline-block">
                Our Technology
                <div className="absolute bottom-0 left-0 h-1 w-20 bg-gradient-to-r from-purple-400 to-blue-500"></div>
              </h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              At the core of ValueVault.ai lies our proprietary intelligence—a sophisticated blend of 
              machine learning, big data analytics, and industry expertise. Our AI doesn't just crunch 
              numbers. It learns from the ever-shifting landscapes of luxury markets, refining its approach 
              to deliver estimates that reflect real-world conditions. From the sleek design of a superyacht to 
              the intricate details of vintage timepieces, our system processes user-submitted data 
              alongside vast datasets to keep pace with the extraordinary.
            </p>
          </motion.section>

          {/* Why We Stand Out */}
          <motion.section variants={itemVariants}>
            <div className="relative">
              <h2 className="text-2xl font-bold mb-6 inline-block">
                Why We Stand Out
                <div className="absolute bottom-0 left-0 h-1 w-20 bg-gradient-to-r from-purple-400 to-blue-500"></div>
              </h2>
            </div>
            
            <ul className="space-y-6">
              <li className="bg-gray-800/50 p-6 rounded-lg border-l-4 border-blue-500">
                <h3 className="text-xl font-semibold text-blue-400 mb-2">Accuracy Meets Innovation</h3>
                <p className="text-gray-300">Our AI-driven valuations aim to prevent the pitfalls of overvaluation and undervaluation, offering a balanced perspective grounded in data.</p>
              </li>

              <li className="bg-gray-800/50 p-6 rounded-lg border-l-4 border-purple-500">
                <h3 className="text-xl font-semibold text-purple-400 mb-2">Transparency First</h3>
                <p className="text-gray-300">We believe in empowering our users with clear, actionable insights—no hidden agendas, just reliable information.</p>
              </li>
              
              <li className="bg-gray-800/50 p-6 rounded-lg border-l-4 border-pink-500">
                <h3 className="text-xl font-semibold text-pink-400 mb-2">Marketplace Simplicity</h3>
                <p className="text-gray-300">Connecting buyers and sellers shouldn't be complicated. Our platform streamlines the process, from listing to closing, with a commission applied only when a sale is successfully completed.</p>
              </li>
              
              <li className="bg-gray-800/50 p-6 rounded-lg border-l-4 border-green-500">
                <h3 className="text-xl font-semibold text-green-400 mb-2">Dallas Roots, Global Reach</h3>
                <p className="text-gray-300">From our headquarters in Texas, we serve a worldwide community of luxury asset owners and collectors, blending Southern hospitality with global ambition.</p>
              </li>
            </ul>
          </motion.section>

          {/* Our Vision */}
          <motion.section variants={itemVariants}>
            <div className="relative">
              <h2 className="text-2xl font-bold mb-6 inline-block">
                Our Vision
                <div className="absolute bottom-0 left-0 h-1 w-20 bg-gradient-to-r from-purple-400 to-blue-500"></div>
              </h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              We envision a future where the luxury asset market operates with unparalleled transparency 
              and efficiency. ValueVault.ai is here to bridge the gap between guesswork and certainty, 
              helping our users navigate high-stakes decisions with confidence. Whether you're a 
              seasoned collector, a first-time buyer, or a seller ready to move on to the next chapter, we're 
              committed to being your trusted guide in the world of extraordinary assets.
            </p>
          </motion.section>

          {/* Our Commitment */}
          <motion.section variants={itemVariants}>
            <div className="relative">
              <h2 className="text-2xl font-bold mb-6 inline-block">
                Our Commitment
                <div className="absolute bottom-0 left-0 h-1 w-20 bg-gradient-to-r from-purple-400 to-blue-500"></div>
              </h2>
            </div>
            
            <ul className="space-y-6">
              <li className="bg-gray-800/50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-blue-400 mb-2">To You</h3>
                <p className="text-gray-300">We provide a service that's easy to use, reliable, and focused on your needs. Our valuations are estimates, not guarantees, and we encourage you to pair our insights with your own research for the best outcomes.</p>
              </li>
              
              <li className="bg-gray-800/50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-purple-400 mb-2">To Integrity</h3>
                <p className="text-gray-300">We're not here to dictate your decisions—our role is advisory. We're not liable for losses tied to market shifts or transaction outcomes, but we're dedicated to giving you the tools to succeed.</p>
              </li>
              
              <li className="bg-gray-800/50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-pink-400 mb-2">To Excellence</h3>
                <p className="text-gray-300">Every feature we build, from our AI engine to our marketplace, is designed to elevate the standard of luxury asset management.</p>
              </li>
            </ul>
          </motion.section>

          {/* Get in Touch */}
          <motion.section variants={itemVariants} className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-8 rounded-xl border border-gray-800">
            <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
            <p className="text-gray-300 mb-6">
              Based in Dallas, Texas, ValueVault.ai is proud to serve a global audience of asset owners, 
              buyers, and enthusiasts. Have questions about our platform or are you ready to explore what 
              your assets are worth? Reach out to us:
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="w-5 h-5 mr-3 text-blue-400" />
                <span>Email: <a href="mailto:contact@valuevault.ai" className="text-blue-400 hover:underline">contact@valuevault.ai</a></span>
              </div>
              
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-3 text-blue-400" />
                <span>Address: ValueVault.ai, 539 W. Commerce St Suite 6614, Dallas TX 75208 United State</span>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-gray-300 italic">
                Join us at ValueVault.ai, where luxury meets intelligence, and every asset finds its true value.
              </p>
        </div>
          </motion.section>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutUs;
