import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/HomePage/Footer';
import { motion } from 'framer-motion';
import SignupModal from '../components/Modals/SignupModal';
import LoginModal from '../components/Modals/LoginModal';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Utility function to extract YouTube video ID from various URL formats
const getYouTubeVideoId = (url) => {
  if (!url) return null;
  // Handle various YouTube URL formats:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/v/VIDEO_ID
  // - Shortened or other query params
  const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|shorts\/)?([^#&?]{11}).*/;
  const match = url.match(regExp);
  return match && match[1].length === 11 ? match[1] : null;
};

// Commented-out static steps array with youtubeUrl
// const steps = [
//   {
//     number: "1",
//     title: "Sign Up",
//     description: "Create your account in minutes. Choose a plan that suits your needs, verify your identity, and gain instant access to our platform.",
//     isReverse: false,
//     image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
//     youtubeUrl: "https://www.youtube.com/watch?v=signupvideo"
//   },
//   {
//     number: "2",
//     title: "Explore Listings",
//     description: "Browse our curated selection of luxury assets, from yachts to real estate, or use our AI-powered search to find exactly what you need.",
//     isReverse: true,
//     image: "https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
//     youtubeUrl: "https://www.youtube.com/watch?v=exploringsvideo"
//   },
//   {
//     number: "3",
//     title: "List Your Assets",
//     description: "As a verified user, list your own luxury assets for sale. Our team helps optimize your listing for maximum visibility.",
//     isReverse: false,
//     image: "https://images.unsplash.com/photo-1580822184713-f2d6f23eb61d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
//     youtubeUrl: "https://www.youtube.com/watch?v=listingvideo"
//   },
//   {
//     number: "4",
//     title: "Connect & Negotiate",
//     description: "Engage directly with buyers or sellers through our secure messaging system. Our experts are available to facilitate negotiations.",
//     isReverse: true,
//     image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
//     youtubeUrl: "https://www.youtube.com/watch?v=negotiationvideo"
//   },
//   {
//     number: "5",
//     title: "Close the Deal",
//     description: "Complete your transaction with our secure payment systems and escrow services, ensuring a safe and seamless experience.",
//     isReverse: false,
//     image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
//     youtubeUrl: "https://www.youtube.com/watch?v=closingvideo"
//   },
//   {
//     number: "6",
//     title: "Ongoing Support",
//     description: "Benefit from post-transaction support, including market insights and dedicated assistance for your future trades.",
//     isReverse: true,
//     image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
//     youtubeUrl: "https://www.youtube.com/watch?v=supportvideo"
//   }
// ];

const Step = ({ number, title, description, isReverse, image, youtubeUrl }, index) => {
  const videoId = getYouTubeVideoId(youtubeUrl);

  return (
    <motion.div
      className={`flex flex-col md:flex-row ${isReverse ? 'md:flex-row-reverse' : ''} items-center gap-8 mb-12`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 * (index + 1) }}
    >
      <div className="w-full md:w-1/2 relative">
        <div className="bg-gray-800/50 p-6 rounded-2xl shadow-2xl backdrop-blur-md border border-gray-700/50 transition-all duration-500 hover:shadow-blue-500/50 hover:-translate-y-2 hover:scale-105">
          <div className="absolute -top-4 -left-4 w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
            {number}
          </div>
          <h3 className="text-xl font-semibold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">{title}</h3>
          <p className="text-gray-300">{description}</p>
        </div>
      </div>
      <div className="w-full md:w-1/2">
        <div className="bg-gray-900/80 border border-gray-700/50 p-6 rounded-2xl flex flex-col items-center space-y-4">
          {youtubeUrl && videoId ? (
            <div className="w-full aspect-video">
              <iframe
                className="w-full h-full rounded-lg"
                src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                title={`YouTube video for ${title}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <img
              src={image}
              alt={`Visualizing ${title}`}
              className="w-full h-60 object-cover bg-center rounded-lg"
            />
          )}
          <div className="flex items-center space-x-4">
            <p className="text-gray-300 italic">Step {number}: {title}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const FAQItem = ({ question, answer }, index) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <motion.div
      className="bg-gray-800/50 rounded-2xl mb-4 overflow-hidden border border-gray-700/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 * (index + 1) }}
    >
      <button
        className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-700/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-semibold text-white">{question}</h3>
        <svg
          className={`w-5 h-5 text-blue-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-4 bg-gray-900/80">
          <p className="text-gray-300">{answer}</p>
        </div>
      )}
    </motion.div>
  );
};

const Testimonial = ({ quote, author, role }, index) => (
  <motion.div
    className="bg-gray-800/50 p-6 rounded-2xl shadow-2xl backdrop-blur-md border border-gray-700/50 transition-all duration-500 hover:shadow-blue-500/50 hover:-translate-y-2 hover:scale-105"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5, delay: 0.2 * (index + 1) }}
  >
    <p className="text-gray-300 italic mb-4 leading-relaxed">"{quote}"</p>
    <p className="text-white font-semibold">{author}</p>
    <p className="text-gray-400 text-sm">{role}</p>
  </motion.div>
);

const Benefit = ({ title, description }, index) => (
  <motion.div
    className="flex items-center space-x-4 bg-gray-800/50 p-4 rounded-2xl border border-gray-700/50 transition-all duration-500 hover:shadow-blue-500/50 hover:-translate-y-2 hover:scale-105"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5, delay: 0.2 * (index + 1) }}
  >
    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <div>
      <h3 className="text-lg font-semibold text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">{title}</h3>
      <p className="text-gray-300 text-sm">{description}</p>
    </div>
  </motion.div>
);

export default function HowItWorksPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const faqs = [
    {
      question: "How long does it take to sign up?",
      answer: "Signing up takes just a few minutes. Simply provide your details, choose a plan, and you're ready to start exploring."
    },
    {
      question: "Is my data secure on the platform?",
      answer: "Yes, we use state-of-the-art encryption and security protocols to protect your data and transactions."
    },
    {
      question: "Can I list my own assets?",
      answer: "Absolutely! Verified users can list their luxury assets for sale, with support from our team to optimize your listing."
    },
    {
      question: "What kind of support is available?",
      answer: "We offer email support for Basic plans, priority support for Pro plans, and dedicated account managers for Enterprise plans."
    }
  ];

  const testimonials = [
    {
      quote: "ValueVault's platform made finding my dream yacht effortless. The process was clear and secure!",
      author: "Michael Brown",
      role: "Luxury Yacht Buyer"
    },
    {
      quote: "Selling my property through ValueVault was a breeze, thanks to their expert guidance.",
      author: "Sophie Lee",
      role: "Real Estate Seller"
    }
  ];

  const benefits = [
    {
      title: "Global Reach",
      description: "Connect with buyers and sellers worldwide through our extensive network."
    },
    {
      title: "AI-Powered Insights",
      description: "Leverage advanced AI to find the best opportunities tailored to your needs."
    },
    {
      title: "Expert Support",
      description: "Our team of luxury market experts is here to guide you every step of the way."
    }
  ];

  useEffect(() => {
    const fetchSteps = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${process.env.REACT_APP_API_BASEURL}/api/steps`);
        if (response.data && response.data.success) {
          setSteps(response.data.data);
        } else {
          throw new Error('Failed to fetch steps');
        }
      } catch (error) {
        console.error('Error fetching steps:', error);
        setError('Unable to load steps. Please try again later.');
        toast.error('Failed to load steps.');
      } finally {
        setLoading(false);
      }
    };

    fetchSteps();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-[#2ab6e4]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
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
          className="text-center mb-12"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 mb-4">How It Works</h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">Discover how ValueVault simplifies luxury asset trading with a seamless, secure process</p>
        </motion.div>

        {/* Steps Section */}
        <div className="mb-16">
          {steps.map((step, index) => (
            <Step key={step._id} {...step} index={index} />
          ))}
        </div>

        {/* Why Choose ValueVault Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 mb-6">Why Choose ValueVault</h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {benefits.map((benefit, index) => (
              <Benefit key={index} {...benefit} index={index} />
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 mb-6">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
              <FAQItem key={index} {...faq} index={index} />
            ))}
          </div>
        </div>

        {/* Testimonial Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 mb-6">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Testimonial key={index} {...testimonial} index={index} />
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <motion.div
          className="bg-gradient-to-r from-blue-600 to-blue-800 py-12 px-6 text-center mb-16 rounded-2xl shadow-2xl border border-gray-700/50 transition-all duration-500 hover:shadow-blue-500/50 hover:-translate-y-2"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Trade Luxury Assets?</h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Join ValueVault today and experience a smarter, safer way to buy and sell high-end assets.
          </p>
          {!user && (
            <button
              onClick={() => setIsSignupModalOpen(true)}
              className="inline-block bg-gray-800/50 text-white py-3 px-8 rounded-full hover:bg-gray-700/50 transition-all duration-300 font-semibold shadow-lg hover:shadow-blue-500/50"
            >
              Get Started Now
            </button>
          )}
        </motion.div>
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
  );
}