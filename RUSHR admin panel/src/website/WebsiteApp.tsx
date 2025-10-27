import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';

const WebsiteApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/post-job" element={<div className="p-8">Post Job Page - Coming Soon</div>} />
        <Route path="/find-pro" element={<div className="p-8">Find Pro Page - Coming Soon</div>} />
        <Route path="/how-it-works" element={<div className="p-8">How It Works Page - Coming Soon</div>} />
        <Route path="/jobs" element={<div className="p-8">Jobs Page - Coming Soon</div>} />
        <Route path="/signals" element={<div className="p-8">Signals Page - Coming Soon</div>} />
        <Route path="/teams" element={<div className="p-8">Teams Page - Coming Soon</div>} />
        <Route path="/about" element={<div className="p-8">About Page - Coming Soon</div>} />
        <Route path="/contact" element={<div className="p-8">Contact Page - Coming Soon</div>} />
        <Route path="/pricing" element={<div className="p-8">Pricing Page - Coming Soon</div>} />
        <Route path="/dashboard" element={<div className="p-8">Dashboard - Coming Soon</div>} />
        <Route path="/messages" element={<div className="p-8">Messages - Coming Soon</div>} />
        <Route path="/account" element={<div className="p-8">Account - Coming Soon</div>} />
        <Route path="/history" element={<div className="p-8">History - Coming Soon</div>} />
        <Route path="/sign-in" element={<div className="p-8">Sign In - Coming Soon</div>} />
        <Route path="/sign-up" element={<div className="p-8">Sign Up - Coming Soon</div>} />
        <Route path="/terms" element={<div className="p-8">Terms - Coming Soon</div>} />
        <Route path="/privacy" element={<div className="p-8">Privacy - Coming Soon</div>} />
      </Routes>
    </div>
  );
};

export default WebsiteApp;