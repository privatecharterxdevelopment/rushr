import React from 'react';

const LogoWordmark: React.FC = () => {
  return (
    <div className="flex items-center">
      <img 
        src="/rushr.png" 
        alt="RUSHR" 
        className="h-8 w-auto object-contain"
      />
    </div>
  );
};

export default LogoWordmark;