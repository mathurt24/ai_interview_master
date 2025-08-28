import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Logo } from '@/components/Logo';

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Check for success message from signup
  React.useEffect(() => {
    // Check if there's a success message in localStorage from signup
    const signupMessage = localStorage.getItem('signupMessage');
    if (signupMessage) {
      setSuccessMessage(signupMessage);
      localStorage.removeItem('signupMessage'); // Clear the message
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Login failed');
      } else {
        localStorage.setItem('user', JSON.stringify(data));
        if (data.role === 'admin') {
          setLocation('/admin');
        } else {
          // Check if there's a pending interview for this candidate
          const pendingInterview = localStorage.getItem('pendingInterview');
          if (pendingInterview) {
            try {
              const interviewData = JSON.parse(pendingInterview);
              // Clear the pending interview data
              localStorage.removeItem('pendingInterview');
              // Redirect to interview consent page
              setLocation('/interview-consent', {
                state: {
                  interviewToken: interviewData.token,
                  candidateName: data.name || email,
                  jobRole: interviewData.jobRole
                }
              });
              return;
            } catch (e) {
              console.error('Error parsing pending interview data:', e);
            }
          }
          
          // Fetch candidate record to check if invited
          fetch(`/api/admin/candidates`)
            .then(res => res.json())
            .then(candidates => {
              const candidate = candidates.find((c: any) => c.email === email);
              if (candidate && candidate.invited) {
                setLocation('/interview');
              } else {
                setLocation('/upload');
              }
            })
            .catch(() => setLocation('/upload'));
        }
      }
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <form onSubmit={handleLogin} className="bg-white dark:bg-gray-800 p-8 rounded shadow w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <Logo size={48} />
          <span className="font-extrabold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-500 mt-2">FirstroundAI</span>
        </div>
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center text-green-700">
            {successMessage}
          </div>
        )}
        {error && <div className="mb-4 text-red-600 text-center">{error}</div>}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium">Email</label>
          <input
            type="email"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block mb-1 text-sm font-medium">Password</label>
          <input
            type="password"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <div className="mt-2 text-right">
            <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">
              Forgot Password?
            </a>
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-primary text-white py-2 rounded font-semibold hover:bg-primary-dark"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <div className="mt-4 text-sm text-center">
          Don't have an account? <a href="/signup" className="text-blue-600 underline">Sign Up</a>
        </div>
      </form>
    </div>
  );
} 