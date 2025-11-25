import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex justify-center items-start">
      <div className={`w-full max-w-md min-h-screen bg-white shadow-xl relative flex flex-col ${className}`}>
        {children}
      </div>
    </div>
  );
};
