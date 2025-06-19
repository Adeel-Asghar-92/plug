import { Heart, Menu, X } from "lucide-react";
import { Link, Outlet, useNavigate, useParams, useSearchParams } from "react-router-dom";
import React, { useEffect, useState } from "react";

import BuyerContactModal from "../Modals/BuyerContactModal";
import ContactModal from "../Modals/ContactModal";
import Footer from "../HomePage/Footer";
import LoginModal from "../Modals/LoginModal";
import RightSideNav from "../HomePage/RightSideNav";
import SignupModal from "../Modals/SignupModal";
import axios from "axios";
import logo from "../../assets/img/navBarLogo.png";
import { useAuth } from "../../contexts/AuthContext";
import { useFavorites } from "../../contexts/FavoritesContext";
import { getViewedItemsCount } from "../../utils/localstorageUtils";

export default function MainLayout() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, logout, loading } = useAuth();

  const { getFavoritesCount } = useFavorites();

  const [token, setToken] = useState(0);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isBuyerContactModalOpen, setIsBuyerContactModalOpen] = useState(false);
  const [selectedCustomYachtOption, setSelectedCustomYachtOption] =
    useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const login = searchParams.get("login");
    const contact = searchParams.get("contact");
    const referCode = searchParams.get("signupref");

    if (login) setIsLoginModalOpen(true);
    if (contact) setIsContactModalOpen(true);
    debugger
    if (referCode && !user) setIsSignupModalOpen(true);
    if(user)  setIsSignupModalOpen(false);
  }, [searchParams, user]);

  useEffect(() => {
    if (getViewedItemsCount() >=3 && !user && !loading) setIsSignupModalOpen(true);
    // if (user) setIsSignupModalOpen(false);
  },[id, user,loading]);

  useEffect(() => {
    const getTokens = async () => {
      if (!user) {
        return;
      }
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API_BASEURL}/api/user/getTokens`,
          { email: user?.email },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (response.data) {
          setToken(response?.data?.data);
        }
      } catch (error) {
        console.error("Error fetching user token:", error);
      }
    };

    getTokens();
  }, [user]);

  return (
    <div className="flex flex-col min-h-screen text-[#CCCCCC] bg-[#000000] overflow-x-hidden">
      {/* Navigation Bar */}
      <div className="bg-[#000000] w-full sticky top-0 z-[51]">
        <nav className="flex justify-between items-center py-4 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 max-w-[1920px] mx-auto">
          <Link to="/">
            <img
              src={logo}
              alt="ValueVault"
              className="h-5 w-auto sm:h-6 md:h-7 lg:h-[21px] lg:w-[128px]"
            />
          </Link>

          <RightSideNav
            getFavoritesCount={getFavoritesCount}
            logout={logout}
            setIsSignupModalOpen={setIsSignupModalOpen}
            setIsLoginModalOpen={setIsLoginModalOpen}
            setIsContactModalOpen={setIsContactModalOpen}
            setIsBuyerContactModalOpen={setIsBuyerContactModalOpen}
            user={user}
            userToken={token}
          />

          <button
            className="lg:hidden text-[#CCCCCC] p-1"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#000000] fixed inset-0 z-40 mt-16 overflow-y-auto">
          <div className="flex flex-col space-y-4 p-6">
            <Link
              to="/favorites"
              className="flex items-center gap-2 text-[#CCCCCC] hover:text-gray-300 font-medium text-lg py-2 border-b border-gray-800 relative"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Heart size={24} />
              {getFavoritesCount() > 0 && (
                <span className="absolute right-0 top-2 bg-green-400 text-[#1A1A1A] text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {getFavoritesCount()}
                </span>
              )}
            </Link>

            <div className="pt-4">
              <label className="block text-gray-500 text-sm mb-1">
                Custom Yachts
              </label>
              <select
                name="custom-yachts-mobile"
                className="text-[#CCCCCC] bg-[#2A2A2A] font-medium text-base p-3 w-full border border-gray-600 rounded"
                onChange={(e) => {
                  setSelectedCustomYachtOption(e.target.value);
                  if (
                    e.target.value === "builder-register" ||
                    e.target.value === "brokers"
                  ) {
                    setIsBuyerContactModalOpen(true);
                  } else if (e.target.value === "our-process") {
                    navigate("/customBuilder");
                  }
                  setIsMobileMenuOpen(false);
                }}
                value=""
              >
                <option value="" disabled>
                  Select an option
                </option>
                <option value="builder-register">Builder Register</option>
                <option value="brokers">Brokers</option>
                <option value="our-process">Our Process</option>
              </select>
            </div>

            <Link
              to="/pricing"
              className="text-gray-500 hover:text-gray-300 font-medium text-lg py-2 border-b border-gray-800"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              to="/our-team"
              className="text-gray-500 hover:text-gray-300 font-medium text-lg py-2 border-b border-gray-800"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Our Team
            </Link>
            <Link
              to="/how-it-works"
              className="text-gray-500 hover:text-gray-300 font-medium text-lg py-2 border-b border-gray-800"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              How It Works
            </Link>
            <button
              onClick={() => {
                setIsContactModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="text-gray-500 hover:text-gray-300 font-medium text-lg py-2 border-b border-gray-800"
            >
              Contact
            </button>

            {!user ? (
              <>
                <button
                  onClick={() => {
                    setIsSignupModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-green-400 hover:text-green-300 font-medium text-lg py-2 border-b border-gray-800"
                >
                  Sign up
                </button>
                <button
                  onClick={() => {
                    setIsLoginModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-green-400 hover:text-green-300 font-medium text-lg py-2 border-b border-gray-800"
                >
                  Login
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="text-green-400 hover:text-green-300 font-medium text-lg py-2 border-b border-gray-800"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content goes here */}
      <Outlet />

      <Footer openContactModal={() => setIsContactModalOpen(true)} />

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToSignup={() => {
          setIsLoginModalOpen(false);
          setIsSignupModalOpen(true);
        }}
      />
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(getViewedItemsCount() >=2 && !user ? true : false)}
        onSwitchToLogin={() => {
          setIsSignupModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
      <BuyerContactModal
        isOpen={isBuyerContactModalOpen}
        onClose={() => setIsBuyerContactModalOpen(false)}
      />
    </div>
  );
}
