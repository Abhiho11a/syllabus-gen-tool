import React from 'react';
import logo from "./assets/images/logo.jpg"; 

const Header = () => {

  const PRIMARY_COLOR = 'bg-blue-800'; 
  const INSTITUTION_COLOR = 'text-[#2C4A5F]';
  
  return (
    <div className="w-full relative pb-4 text-center bg-white">

      <img src={logo} alt="BIT Logo" className="w-20 h-20 mx-auto" />
      <h1 className={` text-2xl font-extrabold ${INSTITUTION_COLOR} tracking-wide uppercase -mt-3 mx-10`}>
        BANGALORE INSTITUTE OF TECHNOLOGY
      </h1>

      <p className="text-sm text-gray-500 mt-0.5 font-medium">
        An Autonomous Institution Under VTU
      </p>
      
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${PRIMARY_COLOR} opacity-75`}></div>
      
    </div>
  );
};

export default Header;