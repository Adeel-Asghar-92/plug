import { Heart, Menu, PlusCircle, X } from "react-feather";
import { Link, useNavigate } from "react-router-dom";
import React, { useState } from "react";

import UserDropdown from "./UserDropdown";

export default function RightSideNav({
  user,
  userToken,
  getFavoritesCount,
  logout,
  setIsSignupModalOpen,
  setIsLoginModalOpen,
  setIsContactModalOpen,
  setIsBuyerContactModalOpen,
}) {
  const navigate = useNavigate();

  const [selectedCustomYachtOption, setSelectedCustomYachtOption] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const handleCustomYachtChange = (e) => {
    const value = e.target.value;
    setSelectedCustomYachtOption(value);

    if (value === "builder-register" || value === "brokers") {
      setIsBuyerContactModalOpen(true);
    } else if (value === "our-process") {
      navigate("/customBuilder");
    }
  };

  const toggleMenu = () => setMenuOpen((open) => !open);

  return (
    <div className="flex items-center space-x-4 relative">
      {/* Hamburger - always visible */}
      <button
        onClick={toggleMenu}
        aria-label="Toggle navigation menu"
        className="text-gray-500 hover:text-gray-300 focus:outline-none hidden lg:flex"
      >
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Dropdown menu with links */}
      {menuOpen && (
        <div className="absolute right-0 top-full mt-2 w-60 bg-[#1A1A1A] border border-gray-700 rounded shadow-lg z-50 p-4 space-y-3">
          <Link
            to="/pricing"
            className="block text-gray-300 hover:text-white font-medium text-base"
            onClick={() => setMenuOpen(false)}
          >
            Pricing
          </Link>
          <Link
            to="/our-team"
            className="block text-gray-300 hover:text-white font-medium text-base"
            onClick={() => setMenuOpen(false)}
          >
            Our Team
          </Link>
          <Link
            to="/how-it-works"
            className="block text-gray-300 hover:text-white font-medium text-base"
            onClick={() => setMenuOpen(false)}
          >
            How It Works
          </Link>

          <select
            name="custom-yachts"
            className="w-full text-gray-300 bg-[#121212] font-medium text-base p-2 border border-gray-600 rounded"
            onChange={(e) => {
              handleCustomYachtChange(e);
              setMenuOpen(false);
            }}
            value={selectedCustomYachtOption}
          >
            <option value="" disabled>
              Custom Yachts
            </option>
            <option value="builder-register">Builder Register</option>
            <option value="brokers">Brokers</option>
            <option value="our-process">Our Process</option>
          </select>

          <button
            onClick={() => {
              setIsContactModalOpen(true);
              setMenuOpen(false);
            }}
            className="w-full text-left text-gray-300 font-medium text-base"
          >
            Contact
          </button>
        </div>
      )}

      {/* Desktop & Mobile: Other buttons (favorites, login/signup, user dropdown) */}
      <div className="hidden lg:flex items-center space-x-3 xl:space-x-4">
        <Link
          to="/favorites"
          className="text-gray-500 hover:text-gray-300 font-medium text-sm xl:text-base whitespace-nowrap relative"
        >
          <Heart size={20} />
          {getFavoritesCount() > 0 && (
            <span className="absolute -top-2 -right-5 bg-green-400 text-[#1A1A1A] text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {getFavoritesCount()}
            </span>
          )}
        </Link>

        {user && (
          <div className="flex items-center gap-2 text-white">
            {userToken}
            <Link
              to="/pricing"
              className="text-gray-500 hover:text-gray-300 font-medium text-sm xl:text-base whitespace-nowrap"
            >
              <PlusCircle size={20} />
            </Link>
          </div>
        )}

        {!user ? (
          <>
            <button
              onClick={() => setIsSignupModalOpen(true)}
              className="text-green-400 hover:text-green-300 font-medium text-sm xl:text-base whitespace-nowrap"
            >
              Sign up
            </button>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="text-green-400 hover:text-green-300 font-medium text-sm xl:text-base whitespace-nowrap"
            >
              Login
            </button>
          </>
        ) : (
          <UserDropdown user={user} logout={logout} navigate={navigate} />
        )}
      </div>
    </div>
  );
}
