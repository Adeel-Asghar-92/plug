import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link} from 'react-router-dom';
import { Crown } from 'lucide-react';
import SubscriptionModal from '../../components/Modals/SubscriptionModal';
import axios from 'axios';

// Add this at the top with other imports
const CancelSubscriptionButton = ({ user, onCancel }) => {
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? This will stop automatic renewals, but you can still use premium features until the end of your billing period.')) {
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/subscription/cancel', {
        email: user.email
      });
      onCancel();
      window.location.reload(); // Reload to update subscription status
    } catch (error) {
      console.error('Error canceling subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="flex items-center justify-center w-full px-4 py-2 mt-4 font-medium text-red-500 transition-colors rounded-lg bg-red-500/10 hover:bg-red-500/20"
    >
      {loading ? 'Canceling...' : 'Cancel Subscription'}
    </button>
  );
};


  const ProfileSettings = () => {
    const { user, updateUser, updateSubscription } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
    const isPremiumUser = ['premium','enterpriseMax' ,'enterprisePlus','enterprise', 'basic'].includes(user?.subscription);


    const [formData, setFormData] = useState({
      fullName: user?.fullName || '',
      companyName: user?.companyName || '',
      phoneNumber: user?.phoneNumber || '',
      website: user?.website || ''
    });


    const handleChange = (e) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    };

    const handleSubscribe = async (planName) => {
      try {
        await updateSubscription(planName);
        setIsSubscriptionModalOpen(false);
        // Reload the page to reflect new subscription status
        window.location.reload();
      } catch (error) {
        console.error('Subscription error:', error);
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        const response = await axios.put(
          '/api/user/profile',  // Remove localhost URL
          { ...formData, email: user.email }  // Include email
        );
        updateUser(response.data.user);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to update profile' });
      }
      setLoading(false);
    };

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };




    return (
      <div className="min-h-screen bg-gray-900">
        <div className="container px-4 py-8 mx-auto">
          <div className="max-w-2xl mx-auto">
            {/* Add this header section */}
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
              <Link
                to="/"
                className="px-4 py-2 text-gray-300 transition-colors border rounded-lg border-[#2ab6e4] hover:text-white"
              >
                Back to Home
              </Link>
            </div>

            {/* Subscription Details Section */}
            <div className="p-6 mb-6 bg-gray-800 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Subscription Details</h2>
                {!isPremiumUser && (
                  <button
                    onClick={() => setIsSubscriptionModalOpen(true)}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] hover:opacity-90"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Premium
                  </button>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-gray-700 rounded-lg">
                  <h3 className="mb-2 text-sm font-medium text-gray-400">Plan Type</h3>
                  <p className="text-lg font-semibold text-white capitalize">{user?.subscription || 'Free'}</p>
                </div>
                <div className="p-4 bg-gray-700 rounded-lg">
                  <h3 className="mb-2 text-sm font-medium text-gray-400">Status</h3>
                  <p className="inline-flex items-center px-2.5 py-1 text-sm font-medium text-green-500 bg-green-500/10 rounded-full">
                    {user?.subscriptionDetails?.status || 'active'}
                  </p>
                </div>
                {isPremiumUser && (
                  <>
                    <div className="p-4 bg-gray-700 rounded-lg">
                      <h3 className="mb-2 text-sm font-medium text-gray-400">Start Date</h3>
                      <p className="text-white">{formatDate(user?.subscriptionDetails?.startDate)}</p>
                    </div>
                    <div className="p-4 bg-gray-700 rounded-lg">
                      <h3 className="mb-2 text-sm font-medium text-gray-400">End Date</h3>
                      <p className="text-white">{formatDate(user?.subscriptionDetails?.endDate)}</p>
                    </div>
                    <div className="p-4 bg-gray-700 rounded-lg">
                      <h3 className="mb-2 text-sm font-medium text-gray-400">Last Payment</h3>
                      <p className="text-white">{formatDate(user?.subscriptionDetails?.lastPaymentDate)}</p>
                    </div>
                    <div className="p-4 bg-gray-700 rounded-lg">
                      <h3 className="mb-2 text-sm font-medium text-gray-400">Stripe ID</h3>
                      <p className="text-sm text-gray-300">{user?.subscriptionDetails?.stripeCustomerId}</p>
                    </div>
                    {/* Add Cancel Subscription Button for premium users */}
                  <div className="md:col-span-2">
                    <CancelSubscriptionButton 
                      user={user} 
                      onCancel={() => {
                        setMessage({ 
                          type: 'success', 
                          text: 'Subscription successfully canceled. You can continue using premium features until the end of your billing period.' 
                        });
                      }} 
                    />
                  </div>
                  </>
                )}
              </div>


              {/* Referal Link */}
              <div className='mt-4'>
              <h2 className="text-xl font-semibold text-white">Referal Link</h2>
              <div className="p-4 leading-none bg-gray-700 rounded-lg mt-4 text-gray-300">https://plugspace.io/?signupref={user?.email}</div>

                </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="p-6 bg-gray-800 rounded-xl">
              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-gray-400">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email}
                  disabled
                  className="w-full px-4 py-2 text-gray-300 bg-gray-700 border border-gray-600 rounded-lg"
                />
                <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
              </div>

              {/* Full Name */}
              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-gray-400">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ab6e4]"
                />
              </div>

              {/* Company Name */}
              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-gray-400">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ab6e4]"
                />
              </div>

              {/* Phone Number */}
              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-gray-400">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ab6e4]"
                />
              </div>

              {/* Website */}
              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-gray-400">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ab6e4]"
                />
              </div>

              {message.text && (
                <div className={`p-4 mb-6 rounded-lg ${message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                  {message.text}
                </div>
              )}

              <div className="flex flex-col gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 font-medium text-white transition-colors rounded-lg bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Subscription Modal */}
        <SubscriptionModal
          isOpen={isSubscriptionModalOpen}
          onClose={() => setIsSubscriptionModalOpen(false)}
          onSubscribe={handleSubscribe}
        />
      </div>
    );
  };

  export default ProfileSettings;