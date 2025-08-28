import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Logo } from '@/components/Logo';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to send reset email');
      } else {
        setMessage('Password reset email sent! Check your inbox.');
        setEmail('');
      }
    } catch (err) {
      setError('Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded shadow w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <Logo size={48} />
          <span className="font-extrabold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-500 mt-2">
            FirstroundAI
          </span>
        </div>

        <div className="flex items-center mb-6">
          <button
            onClick={() => setLocation('/login')}
            className="mr-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-2xl font-bold">Forgot Password</h2>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-2 rounded font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/login"
            className="text-blue-600 hover:underline text-sm"
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
} 