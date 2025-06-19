import React, { useState, useRef, useEffect } from 'react';
import { User, UserPen, LogOut, ChevronDown, Crown, UsersRound } from 'lucide-react';
import axios from 'axios';

const UserDropdown = ({ user, logout, navigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userPlan, setUserPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [errorPlan, setErrorPlan] = useState(null);
  const dropdownRef = useRef(null);

  // Fetch user subscription details
  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        setLoadingPlan(true);
        setErrorPlan(null);
        const response = await axios.get(`${process.env.REACT_APP_API_BASEURL}/api/subscription/${user.email}`);
        if (response.data && response.data.subscription) {
          setUserPlan(response.data);
        } else {
          setUserPlan({ subscription: null, details: {} });
        }
      } catch (error) {
        console.error('Error fetching user plan:', error);
        setErrorPlan('Unable to load subscription details.');
        setUserPlan({ subscription: null, details: {} });
      } finally {
        setLoadingPlan(false);
      }
    };

    if (user.email) {
      fetchUserPlan();
    }
  }, [user.email]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex gap-10 items-center" ref={dropdownRef}>
      <div className='relative'>
        {/* Dropdown Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center px-3 py-2 space-x-2 text-white bg-[#3a2e7f] rounded-lg hover:bg-[#4d37cc]"
        >
          <div className="flex items-center">
            <User className="w-5 h-5" />
            <ChevronDown 
              className={`w-4 h-4 ml-2 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`} 
            />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 z-50 w-64 mt-2 bg-[#3a2e7f] shadow-lg rounded-xl">
            <div className="p-4">
              <div className="mb-4">
                <p className="text-sm text-gray-400">Signed in as</p>
                <p className="font-medium text-white truncate">{user.fullName || user.email}</p>
              </div>

              {errorPlan && (
                <p className="text-red-400 text-sm mb-2">{errorPlan}</p>
              )}

              <div className="space-y-2">
                <button
                  onClick={() => {
                    navigate('/profile');
                    setIsOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-gray-300 rounded-lg hover:text-white hover:bg-[#4d37cc]"
                >
                  <UserPen className="w-4 h-4 mr-2" />
                  Profile Settings
                </button>

                {!loadingPlan && (
                  <button
                    onClick={() => {
                      navigate('/dashboard');
                      setIsOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-gray-300 rounded-lg hover:text-white hover:bg-[#4d37cc]"
                  >
                    <UsersRound className="w-4 h-4 mr-2" />
                    User Dashboard
                  </button>
                )}

                {user.email === process.env.REACT_APP_ADMIN_EMAIL && (
                  <button
                    onClick={() => {
                      navigate('/admin/dashboard');
                      setIsOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-gray-300 rounded-lg hover:text-white hover:bg-[#4d37cc]"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Admin Dashboard
                  </button>
                )}

                <div className="my-2 border-t border-gray-700" />

                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-red-400 rounded-lg hover:text-red-300 hover:bg-[#4d37cc]"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDropdown;