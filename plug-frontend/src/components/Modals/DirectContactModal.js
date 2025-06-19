import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, Paperclip, Send, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { ExternalLink, Heart } from 'lucide-react';

const DirectContactModal = ({ isOpen, onClose, product }) => {
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
                                <div className="space-y-4">
                                    <motion.div className="grid grid-cols-1 gap-4 md:grid-cols-2" variants={itemVariants}>
                                        <div>
                                            <input
                                                type="text"
                                                name="name"
                                                placeholder='Name'
                                                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-[#2ab6e4] focus:outline-none focus:ring-2 focus:ring-[#2ab6e4]/50 transition-all"
                                                required
                                                readOnly
                                            />
                                        </div>
                                    </motion.div>

                                    <motion.div className="grid grid-cols-1 gap-4 md:grid-cols-2" variants={itemVariants}>
                                        <div>
                                            <input
                                                type="text"
                                                name="Email"
                                                placeholder='Phone'
                                                readOnly
                                                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-[#2ab6e4] focus:outline-none focus:ring-2 focus:ring-[#2ab6e4]/50 transition-all"
                                            />
                                        </div>
                                    </motion.div>

                                    <motion.div className="grid grid-cols-1 gap-4 md:grid-cols-2" variants={itemVariants}>
                                        <div>
                                            <input
                                                type="text"
                                                name="Email"
                                                placeholder='Email'
                                                readOnly
                                                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-[#2ab6e4] focus:outline-none focus:ring-2 focus:ring-[#2ab6e4]/50 transition-all"
                                            />
                                        </div>
                                    </motion.div>

                                    <motion.div variants={itemVariants}>
                                        <div className="bg-gray-400 text-white text-center text-sm p-20 rounded-lg shadow-md w-full mt-10">
                                            "Direct contact is not yet set up. Please check their official website for further contact information."
                                        </div>
                                    </motion.div>



                                    <motion.div className="flex justify-center" variants={itemVariants}>
                                        <a
                                            href={product?.detailUrl || ''}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex justify-center items-center"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <span className="flex items-center justify-center text-sm px-8 py-2 text-white gap-1 bg-blue-700 rounded-3xl">
                                                Visit <ExternalLink className="w-3 h-3" />
                                            </span>
                                        </a>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default DirectContactModal; 