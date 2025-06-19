import React from 'react';
import { Link } from 'react-router-dom';
import logo from "../../assets/img/navBarLogo.png";

// Footer.js
const Footer = ({ openContactModal }) => {
  return (
    <footer className="w-full mt-16">
      

      {/* Add margin between layers to make the second rounded corner visible */}
      <div className="">
        {/* Second layer - Logo and links with #040404 background */}
        <div className="bg-[#040404] text-white py-8 rounded-t-[40px]">
          <div className="container mx-auto px-4 max-w-[1440px]">
            <div className="flex flex-col md:flex-row justify-between items-center">
              {/* Logo */}
              <div className="mb-6 md:mb-0">
                <Link to="/" className="text-white text-2xl font-bold">
                  <img src={logo} alt="ValueVault" className="h-[21px] w-[128px]" />
                </Link>
              </div>

              {/* Links */}
              <div className="flex flex-wrap justify-center gap-8">
                <Link to="/privacy-policy" className="text-white hover:text-green-400 transition-colors">Privacy Policy</Link>
                <Link to="/terms-conditions" className="text-white hover:text-green-400 transition-colors">Terms And Conditions</Link>
                <Link to="/about-us" className="text-white hover:text-green-400 transition-colors">About Us</Link>
                <button onClick={openContactModal} className="text-white hover:text-green-400 transition-colors">Contact Us</button>
                <button onClick={openContactModal} className="text-white hover:text-green-400 transition-colors">Help</button>
                <Link to="/services" className="text-white hover:text-green-400 transition-colors">ValueVault</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;