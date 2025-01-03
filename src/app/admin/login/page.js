"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

// Admin users data - in practice this should be in a secure backend
const ADMIN_USERS = {
  "tim.veneer@wildan.com": { email: "tim.veneer@wildan.com", role: "admin", name: "Tim Veneer" },
  "thomas@perlint.com": { email: "thomas@perlint.com", role: "admin", name: "Thomas" },
  "admin@demo.com": { email: "admin@demo.com", role: "admin", name: "Demo" }
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = ADMIN_USERS[email];
    if (user && password === 'admin123') {
      // Store complete user data including role
      localStorage.setItem('user', JSON.stringify({
        email: user.email,
        role: user.role,
        name: user.name
      }));
      localStorage.setItem('portal','admin')
      router.push('/admin/dashboard');
    } else {
      setError('Invalid email or password');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6 bg-[#0161D5] py-2 rounded-md">
            <img
              src="/logo_admin.png"
              alt="Company Logo"
              priority="true"
              className="h-16" 
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
          <p className="text-gray-600 mt-2">Log in to manage subsidiary accounts</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="mt-1 text-gray-800 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-800 text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border text-gray-800 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        <div className="mt-6 text-center">
          <a href="#" className="text-blue-600 hover:text-blue-500 text-sm">
            Forgot password?
          </a>
        </div>
        {/* footer with copyright and some links */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>&copy; 2024 MStrategy. All rights reserved.</p>
          <p className="mt-2">
            <a href="#" className="text-blue-600 hover:text-blue-500">
              Privacy Policy
            </a>
            <span className="mx-2">•</span>
            <a href="#" className="text-blue-600 hover:text-blue-500">
              Terms of Service
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}