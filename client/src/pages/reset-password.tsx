import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Logo } from '@/components/Logo';
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [validating, setValidating] = useState(true);

  useEffect(() => {
    // Extract token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    
    if (resetToken) {
      setToken(resetToken);
      validateToken(resetToken);
    } else {
      setError('Invalid reset link');
      setValidating(false);
    }
  }, []);

  const validateToken = async (resetToken: string) => {
    try {
      const res = await fetch(`/api/auth/validate-reset-token?token=${resetToken}`);
      if (res.ok) {
        setTokenValid(true);
      } else {
        setError('Invalid or expired reset link');
      }
    } catch (err) {
      setError('Failed to validate reset link');
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to reset password');
      } else {
        setMessage('Password reset successfully! Redirecting to login...');
        setTimeout(() => setLocation('/login'), 2000);
      }
    } catch (err) {
      setError('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded shadow w-full max-w-md text-center">
          <div className="flex flex-col items-center mb-6">
            <Logo size={48} />
            <span className="font-extrabold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-500 mt-2">
              FirstroundAI
            </span>
          </div>
          
          <div className="text-red-600 mb-6">{error}</div>
          
          <button
            onClick={() => setLocation('/forgot-password')}
            className="bg-primary text-white px-6 py-2 rounded hover:bg-primary-dark transition-colors"
          >
            Request New Reset Link
          </button>
        </div>
      </div>
    );
  }

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
          <h2 className="text-2xl font-bold">Reset Password</h2>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
          Enter your new password below.
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
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={6}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={6}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-2 rounded font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
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