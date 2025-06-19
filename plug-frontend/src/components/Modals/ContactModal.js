import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, Paperclip, Send, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const ContactModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    lastname: '',
    email: '',
    phone: '',
    message: '',
    category: '',
  });
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Replace categories hooks with static categories
  const categories = [
    { _id: '1', name: 'Custom Yachts' },
    { _id: '2', name: 'Ads' },
    { _id: '3', name: 'General Inquiry' },
    { _id: '4', name: 'Partnership' },
    { _id: '5', name: 'Jets' },
    { _id: '6', name: 'Other' }
  ];
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create form data for submission
      const submitData = new FormData();
      
      // Append form fields to match the backend API
      submitData.append('name', formData.name);
      submitData.append('lastname', formData.lastname);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('category', formData.category);
      submitData.append('message', formData.message);
      
      if (attachment) {
        submitData.append('attachment', attachment);
      }

      // Send to backend
      const response = await axios.post('/api/contact', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setSuccess('Your message has been sent successfully!');
        // Reset form
        setFormData({
          name: '',
          lastname: '',
          email: '',
          phone: '',
          message: '',
          category: '',
        });
        setAttachment(null);
      } else {
        setError(response.data.message || 'Failed to send message. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
    },
    exit: {
      opacity: 0,
      transition: {
        when: "afterChildren",
        staggerChildren: 0.05,
        staggerDirection: -1
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
    },
    exit: { 
      y: -20, 
      opacity: 0,
      transition: { 
        type: "tween", 
        ease: "easeInOut", 
        duration: 0.3 
      }
    }
  };

  const buttonVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.05,
      boxShadow: "0px 0px 8px rgba(59, 130, 246, 0.6)",
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 10 
      }
    },
    tap: { scale: 0.95 },
    exit: { 
      scale: 0, 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const backgroundVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  const modalVariants = {
    hidden: { 
      scale: 0.8, 
      opacity: 0,
      y: 50
    },
    visible: { 
      scale: 1, 
      opacity: 1,
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 25,
        duration: 0.4
      }
    },
    exit: { 
      scale: 0.8, 
      opacity: 0,
      y: 50,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 25,
        duration: 0.4
      }
    }
  };

  const inputVariants = {
    focus: { 
      scale: 1.02,
      boxShadow: "0px 0px 8px rgba(59, 130, 246, 0.4)",
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 15 
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Background overlay */}
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            variants={backgroundVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl shadow-xl border border-gray-700"
              variants={modalVariants}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h3 className="text-2xl font-bold text-white flex items-center">
                  <span className="mr-2">Contact Us</span>
                </h3>
                <button 
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5">
                {error && (
                  <motion.div 
                    className="p-3 mb-4 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm flex items-start"
                    variants={itemVariants}
                  >
                    <div className="mr-2 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p>{error}</p>
                  </motion.div>
                )}

                {success && (
                  <motion.div 
                    className="p-3 mb-4 bg-green-900/30 border border-green-700 rounded-lg text-green-400 text-sm flex items-start"
                    variants={itemVariants}
                  >
                    <div className="mr-2 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p>{success}</p>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <motion.div className="grid grid-cols-1 gap-4 md:grid-cols-2" variants={itemVariants}>
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-1">
                          First Name<span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-[#2ab6e4] focus:outline-none focus:ring-2 focus:ring-[#2ab6e4]/50 transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          name="lastname"
                          value={formData.lastname}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-[#2ab6e4] focus:outline-none focus:ring-2 focus:ring-[#2ab6e4]/50 transition-all"
                        />
                      </div>
                    </motion.div>

                    <motion.div className="grid grid-cols-1 gap-4 md:grid-cols-2" variants={itemVariants}>
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-1">
                          Email<span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-[#2ab6e4] focus:outline-none focus:ring-2 focus:ring-[#2ab6e4]/50 transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-[#2ab6e4] focus:outline-none focus:ring-2 focus:ring-[#2ab6e4]/50 transition-all"
                        />
                      </div>
                    </motion.div>

                    {/* Category Selection - Make it full width by removing md:grid-cols-2 */}
                    <motion.div className="grid grid-cols-1 gap-4" variants={itemVariants}>
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-1">
                          Option
                        </label>
                        <div className="relative">
                          <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-[#2ab6e4] focus:outline-none focus:ring-2 focus:ring-[#2ab6e4]/50 transition-all appearance-none"
                          >
                            <option value="">Select Option</option>
                            {categories.map(category => (
                              <option key={category._id} value={category.name}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <label className="block text-gray-300 text-sm font-medium mb-1">
                        Message<span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={5}
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-[#2ab6e4] focus:outline-none focus:ring-2 focus:ring-[#2ab6e4]/50 transition-all resize-none"
                        required
                      ></textarea>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <label className="block text-gray-300 text-sm font-medium mb-1">
                        Attachment
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          name="attachment"
                          id="attachment"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="attachment"
                          className="flex items-center justify-between w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 hover:border-[#2ab6e4] hover:bg-gray-600 cursor-pointer transition-all"
                        >
                          <span className="flex items-center">
                            <Paperclip className="w-5 h-5 mr-2 text-gray-400" />
                            {attachment ? attachment.name : 'Choose a file'}
                          </span>
                          <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                            Browse
                          </span>
                        </label>
                      </div>
                      <p className="mt-1 text-xs text-gray-400">
                        Supported file types: PDF, JPG, PNG, DOC, DOCX (max 10MB)
                      </p>
                    </motion.div>

                    <motion.div className="flex justify-end" variants={itemVariants}>
                      <motion.button
                        type="submit"
                        disabled={loading}
                        className={`px-6 py-2.5 rounded-lg flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-[#2ab6e4] ${
                          loading
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] hover:shadow-lg hover:shadow-[#2ab6e4]/20'
                        }`}
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        {loading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5 mr-2" />
                            Send Message
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ContactModal; 