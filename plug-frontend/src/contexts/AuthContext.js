import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { auth } from '../firebase/config';
import { GoogleAuthProvider, signInWithPopup, TwitterAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';

export const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const initAuth = async () => {
    try {
      const response = await axios.get('/api/verify-token', {
        withCredentials: true
      });
      // Check if user is blocked during token verification
      if (response.data.user?.isBlocked) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        setUser(null);
        throw new Error('Your account has been blocked. Please contact support.');
      }
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }, []);

  // Helper function to handle user authentication response
  const handleAuthResponse = (response, rememberMe = false) => {
    if (response.data.user?.isBlocked) {
      // Clear any stored tokens
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      throw new Error('Your account has been blocked. Please contact support.');
    }

    if (response.data.token) {
      if (rememberMe) {
        localStorage.setItem('token', response.data.token);
      } else {
        sessionStorage.setItem('token', response.data.token);
      }
    }

    setUser(response.data.user);
    return response.data.user;
  };

  const loginWithGoogle = async (rememberMe = false) => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const { user: firebaseUser } = result;
      
      const response = await axios.post('/api/register', {
        email: firebaseUser.email,
        firebaseUid: firebaseUser.uid,
        fullName: firebaseUser.displayName,
        authProvider: 'google'
      }, {
        withCredentials: true
      });

      return handleAuthResponse(response, rememberMe);
    } catch (error) {
      console.error('Google login error:', error);
      throw new Error(error.message || 'Failed to login with Google');
    }
  };

  const loginWithTwitter = async (rememberMe = false) => {
    try {
      const provider = new TwitterAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const { user: firebaseUser } = result;
  
      const response = await axios.post('/api/register', {
        email: firebaseUser.email,
        firebaseUid: firebaseUser.uid,
        fullName: firebaseUser.displayName,
        authProvider: 'twitter'
      }, {
        withCredentials: true
      });

      return handleAuthResponse(response, rememberMe);
    } catch (error) {
      console.error('Twitter login error:', error);
      throw new Error(error.message || 'Failed to login with Twitter');
    }
  };

  const signupWithGoogle = async (rememberMe = false) => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const { user: firebaseUser } = result;
      
      const response = await axios.post('/api/register', {
        email: firebaseUser.email,
        firebaseUid: firebaseUser.uid,
        fullName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        authProvider: 'google'
      }, {
        withCredentials: true
      });

      return handleAuthResponse(response, rememberMe);
    } catch (error) {
      console.error('Google signup error:', error);
      throw new Error(error.message || 'Failed to sign up with Google');
    }
  };

  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await axios.post('/api/login', { 
        email, 
        password, 
        rememberMe 
      }, {
        withCredentials: true
      });

      if (response.data.user) {
        // Check if user is blocked
        if (response.data.user.isBlocked) {
          throw new Error('Your account has been blocked. Please contact support.');
        }

        const { token, user } = response.data;
        
        if (rememberMe) {
          localStorage.setItem('token', token);
        } else {
          sessionStorage.setItem('token', token);
        }
        
        setUser({ ...user, email });
        return user;
      }
      throw new Error(response.data.message || 'Login failed');
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Invalid credentials');
    }
  };

  const logout = async () => {
    try {
      await axios.get('/api/logout', {
        withCredentials: true
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state and tokens, even if API call fails
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      setUser(null);
    }
  };

  const signup = async (userData, rememberMe = false) => {
    try {
      const response = await axios.post('/api/register', {
        ...userData,
        authProvider: 'email'
      }, {
        withCredentials: true
      });

      // Check if user is blocked (though unlikely for new signups)
      if (response.data.user?.isBlocked) {
        throw new Error('Your account has been blocked. Please contact support.');
      }

      if (response.data.token) {
        if (rememberMe) {
          localStorage.setItem('token', response.data.token);
        } else {
          sessionStorage.setItem('token', response.data.token);
        }
      }

      setUser({ ...response.data.user, email: userData.email });
      return response.data.user;
    } catch (error) {
      throw error.response?.data || { message: error.message || 'Signup failed' };
    }
  };

  const updateUser = (userData) => {
    setUser(prev => ({
      ...prev,
      ...userData
    }));
  };

  const updateSubscription = async (planName) => {
    try {
      const response = await axios.put('/api/update-subscription', {
        email: user.email,
        subscription: planName
      });
      
      setUser(prev => ({
        ...prev, 
        subscription: response.data.user.subscription,
        subscriptionDetails: response.data.user.subscriptionDetails
      }));
      
      return response.data.user;
    } catch (error) {
      console.error('Subscription error:', error);
      throw error.response?.data || { message: 'Failed to update subscription' };
    }
  };

  const getSubscriptionStatus = async () => {
    if (!user?.email) {
      console.log("Current user:", user);
      return;
    }
  
    try {
      const response = await axios.get(`/api/subscription/${user.email}`);
      setUser(prev => ({
        ...prev,
        subscription: response.data.subscription,
        subscriptionDetails: response.data.details
      }));
      return response.data;
    } catch (error) {
      console.error('Subscription status error:', error);
      throw error;
    }
  };

  const cancelSubscription = async () => {
    try {
      await axios.post('/api/subscription/cancel', { email: user.email });
      setUser(prev => ({
        ...prev,
        subscriptionDetails: {
          ...prev.subscriptionDetails,
          status: 'cancelled'
        }
      }));
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  };

  const fetchAdminData = async () => {
    try {
      const [usersResponse, statsResponse] = await Promise.all([
        axios.get('/api/admin/users', { params: { email: user.email } }),
        axios.get('/api/admin/stats', { params: { email: user.email } })
      ]);
      return {
        users: usersResponse.data,
        stats: statsResponse.data
      };
    } catch (error) {
      console.error('Error fetching admin data:', error);
      throw error;
    }
  };

  const deleteUser = async (userId) => {
    try {
      const response = await axios.delete(`/api/admin/users/${userId}`, {
        params: { email: user.email }
      });
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const isAdmin = user?.email === process.env.REACT_APP_ADMIN_EMAIL;

  return (
    <AuthContext.Provider value={{
      user,
      signup,
      signupWithGoogle,
      loginWithTwitter,
      login,
      loginWithGoogle,
      logout,
      updateSubscription,
      getSubscriptionStatus,
      cancelSubscription,
      updateUser,
      fetchAdminData,
      deleteUser,
      isAdmin,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};