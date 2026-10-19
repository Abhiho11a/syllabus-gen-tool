import React from "react";
import logo from "./assets/images/logo.jpg";

const Header = () => {
  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-center gap-4">

          <img
            src={logo}
            alt="BIT Logo"
            className="w-[102px] h-[72px] object-contain"
          />

          <div className="text-left">
            <h1 className="text-2xl font-extrabold text-[#2C4A5F] tracking-wide">
              BANGALORE INSTITUTE OF TECHNOLOGY
            </h1>

            <p className="text-sm text-gray-500 font-medium mt-1 text-center">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-700 mr-2" />
              An Autonomous Institution Under VTU
            </p>
          </div>

        </div>
      </div>

      <div className="h-[3px] bg-blue-800" />
    </header>
  );
};

export default Header;