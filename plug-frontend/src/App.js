// src/App.js

import "./App.css";

import { BrowserRouter, Route, Routes } from "react-router-dom";

import AboutUs from "./pages/Information/AboutUs";
import AdminDashboard from "./pages/AdminDashboard";
import { AuthProvider } from "./contexts/AuthContext";
import Category from "./pages/Category";
import CustomBuilderPage from "./pages/CustomBuilderPage";
import FavoritesList from "./pages/FavoritesList";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import GeoSearch from "./pages/GeoSearch";
import HomePage from "./pages/ShopPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import MainLayout from "./components/Layouts/Main";
import OurTeamPage from "./pages/OurTeamPage";
import PricingPage from "./pages/PricingPage";
import PrivacyPolicy from "./pages/Information/PrivacyPolicy";
import ProductDetails from "./pages/ProductDetails";
import ProductPage from "./pages/ProductPage";
import ProfileSettings from "./pages/UserBased/ProfileSettings";
import ProtectedRoute from "./components/ProtectedRoute";
import ResetPassword from "./pages/UserBased/ResetPassword";
import ScoreCard from "./pages/ScoreCard";
import ScrollToTop from "./components/HomePage/ScrollToTop";
import SubscriptionCancel from "./pages/UserBased/SubscriptionCancel";
import SubscriptionSuccess from "./pages/UserBased/SubscriptionSuccess";
import TermsConditions from "./pages/Information/TermsConditions";
import TestPage from "./pages/index";
import UserDashboard from "./pages/UserBased/UserDashboard";
import UserProfile from "./pages/UserBased/UserProfile";

function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/shop" element={<HomePage />} />
            <Route path="/" element={<MainLayout />}>
              <Route index element={<TestPage />} />
              <Route path="/geoSearch" element={<GeoSearch />} />
              <Route path="/product-details/:id" element={<ProductDetails />} />
              <Route path="/product/:productId" element={<ProductPage />} />
            </Route>
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/our-team" element={<OurTeamPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/category" element={<Category />} />
            <Route path="/favorites" element={<FavoritesList />} />
            <Route path="/aiResult" element={<ScoreCard />} />
            <Route path="/customBuilder" element={<CustomBuilderPage />} />

            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/:userId"
              element={
                <ProtectedRoute adminOnly={true}>
                  <UserProfile />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfileSettings />
                </ProtectedRoute>
              }
            />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/subscription/success"
              element={<SubscriptionSuccess />}
            />
            <Route
              path="/dashboard/subscription/cancel"
              element={<SubscriptionCancel />}
            />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-conditions" element={<TermsConditions />} />
            <Route path="/about-us" element={<AboutUs />} />
          </Routes>
        </BrowserRouter>
      </FavoritesProvider>
    </AuthProvider>
  );
}

export default App;
