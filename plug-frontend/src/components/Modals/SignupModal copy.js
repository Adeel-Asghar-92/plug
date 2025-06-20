import React, { useState } from 'react';
import { X, AlertCircle, User, Mail, Lock, Building2, Phone, Globe, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import logo from "../../assets/img/navBarLogo.png";
import { useSearchParams, Link } from 'react-router-dom';

const SignupModal = ({ isOpen, onClose, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: '',
    phoneNumber: '',
    website: '',
  });

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { signup, signupWithGoogle, loginWithTwitter } = useAuth();
  const [searchParams] = useSearchParams();
  const referCode = searchParams.get('signupref');

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email) newErrors.email = 'Email is required';
    else if (!emailRegex.test(formData.email)) newErrors.email = 'Invalid email format';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.fullName) newErrors.fullName = 'Full name is required';

    if (formData.phoneNumber && !/^\+?[\d\s-]{10,}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number format';
    }

    if (formData.website && !/^https?:\/\/.*/.test(formData.website)) {
      newErrors.website = 'Website must start with http:// or https://';
    }

    if (!acceptedTerms) {
      newErrors.terms = 'You must accept the Terms and Conditions';
    }

    if (referCode !== null) {
      formData.referCode = referCode;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        setLoading(true);
        await signup(formData);
        onClose();
      } catch (error) {
        setErrors({ submit: error.message });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setErrors({});
      setLoading(true);
      await signupWithGoogle();
      onClose();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };
  const handleTwitterSignup = async () => {
    try {
      setErrors({});
      setLoading(true);
      await loginWithTwitter();
      onClose();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTermsChange = (e) => {
    setAcceptedTerms(e.target.checked);
    if (errors.terms) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.terms;
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl p-8 bg-gray-900 shadow-2xl rounded-2xl"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center w-max h-12 mb-4 rounded-xl"
              >
                <img src={logo} className='h-[21px] w-[128px] font-bold bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] text-transparent bg-clip-text' />
              </motion.div>
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-white"
              >
                Create Your Account
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-2 text-gray-400"
              >
                Join our community and start your journey
              </motion.p>
            </div>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={onClose}
              className="p-2 text-gray-400 transition-colors rounded-full hover:bg-gray-800 hover:text-white"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-700"
          >
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              {errors.submit && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center col-span-2 p-4 text-sm text-red-500 rounded-lg bg-red-500/10"
                >
                  <AlertCircle className="w-5 h-5 mr-2" />
                  {errors.submit}
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleGoogleSignup}
                disabled={loading}
                className="flex items-center justify-center col-span-2 py-3 font-semibold text-white transition-all duration-200 bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.60 3.30-4.53 6.16-4.53z"
                  />
                </svg>
                Sign up with Google
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleTwitterSignup}
                disabled={loading}
                className="flex items-center justify-center col-span-2 py-3 font-semibold text-white transition-all duration-200 bg-gray-600 rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0022.43.36a9.09 9.09 0 01-2.84 1.08A4.52 4.52 0 0016.11 0c-2.63 0-4.57 2.4-3.98 4.89A12.94 12.94 0 013 1.67a4.48 4.48 0 001.39 6.06A4.48 4.48 0 012 7.1v.06a4.51 4.51 0 003.63 4.42 4.52 4.52 0 01-2.04.08 4.52 4.52 0 004.21 3.13A9.06 9.06 0 012 19.54a12.82 12.82 0 006.95 2.04c8.32 0 12.88-7.14 12.58-13.55A9.18 9.18 0 0023 3z" />
                </svg>
                Sign up with Twitter
              </motion.button>

              <div className="relative col-span-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 text-gray-500 bg-gray-900">Or continue with email</span>
                </div>
              </div>

              <div className="col-span-2">
                <label className="block mb-2 text-sm font-medium text-gray-300">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ab6e4] text-white placeholder-gray-500 ${errors.fullName ? 'border-red-500' : ''
                      }`}
                    placeholder="John Doe"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
                  )}
                </div>
              </div>

              <div className="col-span-2">
                <label className="block mb-2 text-sm font-medium text-gray-300">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ab6e4] text-white placeholder-gray-500 ${errors.email ? 'border-red-500' : ''
                      }`}
                    placeholder="john@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="col-span-1">
                <label className="block mb-2 text-sm font-medium text-gray-300">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ab6e4] text-white placeholder-gray-500 ${errors.password ? 'border-red-500' : ''
                      }`}
                    placeholder="Enter password"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                  )}
                </div>
              </div>

              <div className="col-span-1">
                <label className="block mb-2 text-sm font-medium text-gray-300">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ab6e4] text-white placeholder-gray-500 ${errors.confirmPassword ? 'border-red-500' : ''
                      }`}
                    placeholder="Confirm password"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div className="col-span-2">
                <label className="block mb-2 text-sm font-medium text-gray-300">
                  Company Name <span className="text-gray-500">(Optional)</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ab6e4] text-white placeholder-gray-500"
                    placeholder="Your company name"
                  />
                </div>
              </div>

              <div className="col-span-1">
                <label className="block mb-2 text-sm font-medium text-gray-300">
                  Phone <span className="text-gray-500">(Optional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ab6e4] text-white placeholder-gray-500 ${errors.phoneNumber ? 'border-red-500' : ''
                      }`}
                    placeholder="+1 (555) 000-0000"
                  />
                  {errors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-500">{errors.phoneNumber}</p>
                  )}
                </div>
              </div>

              <div className="col-span-1">
                <label className="block mb-2 text-sm font-medium text-gray-300">
                  Website <span className="text-gray-500">(Required)</span>
                </label>
                <div className="relative">
                  <Globe className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    required
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ab6e4] text-white placeholder-gray-500 ${errors.website ? 'border-red-500' : ''
                      }`}
                    placeholder="https://example.com"
                  />
                  {errors.website && (
                    <p className="mt-1 text-sm text-red-500">{errors.website}</p>
                  )}
                </div>
              </div>

              <div className="col-span-2 mt-2">
                <div className={`flex items-start space-x-3 ${errors.terms ? 'border border-red-500 p-2 rounded-lg' : ''}`}>
                  <div className="flex items-center h-5 mt-1">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={handleTermsChange}
                      className="w-4 h-4 text-[#2ab6e4] bg-gray-800 border-gray-700 rounded focus:ring-[#2ab6e4] focus:ring-offset-gray-900"
                    />
                  </div>
                  <div className="text-sm">
                    <label htmlFor="terms" className="font-medium text-gray-300">
                      I accept the <Link to="/terms-conditions" className="text-[#2ab6e4] hover:text-[#a017c9]" target="_blank" rel="noopener noreferrer">Terms and Conditions</Link>*
                    </label>
                    <p className="text-gray-400">
                      By creating an account, you agree to our terms of service and privacy policy.
                    </p>
                    {errors.terms && (
                      <p className="mt-1 text-sm text-red-500">{errors.terms}</p>
                    )}
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: !loading && acceptedTerms ? 1.02 : 1 }}
                whileTap={{ scale: !loading && acceptedTerms ? 0.98 : 1 }}
                type="submit"
                disabled={loading || !acceptedTerms}
                className={`col-span-2 py-3 mt-4 font-semibold text-white rounded-lg transition-all duration-200 ${acceptedTerms
                    ? 'bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] hover:opacity-90 disabled:opacity-50'
                    : 'bg-gray-700 cursor-not-allowed opacity-50'
                  }`}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </motion.button>
            </form>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 text-sm text-center text-gray-400"
          >
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-[#2ab6e4] hover:text-[#a017c9] transition-colors"
            >
              Log In
            </button>
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SignupModal;