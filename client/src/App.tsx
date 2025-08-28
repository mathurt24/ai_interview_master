import { Switch, Route, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Brain, Mic, BarChart3, Settings, Bell } from 'lucide-react';
import InterviewUpload from "@/pages/interview-upload";
import InterviewSession from "@/pages/interview-session";
import InterviewConsent from "@/pages/interview-consent";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminResumeUpload from "@/pages/admin-resume-upload";
import AdminEmailConfig from "@/pages/admin-email-config";
import NotFound from "@/pages/not-found";
import SignupPage from "@/pages/signup";
import LoginPage from "@/pages/login";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import React, { useEffect } from "react";
import AdminInterviewResults from "@/pages/admin-interview-results";
import Signup from './pages/signup';
import InterviewTerminated from "@/pages/interview-terminated";
import { Logo } from '@/components/Logo';

// Protected route component for upload page
function ProtectedUploadRoute() {
  const [location, setLocation] = useLocation();
  const [isInvitedCandidate, setIsInvitedCandidate] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;

  React.useEffect(() => {
    // Admin users should always have access to upload page
    if (user?.role === 'admin') {
      setIsLoading(false);
      return;
    }

    // Only check invitation status for candidates
    if (user?.role === 'candidate' && user?.email) {
      fetch('/api/admin/candidates')
        .then(res => res.json())
        .then(candidates => {
          const candidate = candidates.find((c: any) => c.email === user.email);
          const isInvited = candidate?.invited || false;
          setIsInvitedCandidate(isInvited);
          setIsLoading(false);
          
          // If candidate is invited, redirect to interview
          if (isInvited) {
            setLocation('/interview');
          }
        })
        .catch(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [user, setLocation]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Admin users can always access upload page
  if (user?.role === 'admin') {
    return <InterviewUpload />;
  }

  // Non-invited candidates can access upload page
  if (user?.role === 'candidate' && !isInvitedCandidate) {
    return <InterviewUpload />;
  }

  // Invited candidates should be redirected to interview
  if (user?.role === 'candidate' && isInvitedCandidate) {
    return <div className="flex items-center justify-center min-h-screen">Redirecting to interview...</div>;
  }

  // Fallback
  return <div className="flex items-center justify-center min-h-screen">Access denied</div>;
}

const queryClient = new QueryClient();

function LandingRedirect() {
  const [location, setLocation] = useLocation();
  React.useEffect(() => {
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
    if (user) {
      if (user.role === 'admin') {
        setLocation('/admin');
      } else if (user.role === 'candidate') {
        // Check if candidate is invited
        fetch('/api/admin/candidates')
          .then(res => res.json())
          .then(candidates => {
            const candidate = candidates.find((c: any) => c.email === user.email);
            if (candidate?.invited) {
              // Invited candidates go directly to interview
              setLocation('/interview');
            } else {
              // Self-registered candidates go to upload page
              setLocation('/upload');
            }
          })
          .catch(() => {
            // Fallback for candidates - go to upload page
            setLocation('/upload');
          });
      }
    }
    // else, stay on login page
  }, [setLocation]);
  return <LoginPage />;
}

function Router() {
  return (
    <Switch>
              <Route path="/" component={LandingRedirect} />
        <Route path="/interview-consent" component={InterviewConsent} />
        <Route path="/interview" component={InterviewSession} />
        <Route path="/upload" component={ProtectedUploadRoute} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/upload-resume" component={AdminResumeUpload} />
        <Route path="/admin/email-config" component={AdminEmailConfig} />
        <Route path="/signup" component={SignupPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/admin/interview/:id" component={AdminInterviewResults} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password/:token" component={ResetPassword} />
        <Route path="/interview-terminated" component={InterviewTerminated} />
        <Route component={NotFound} />
    </Switch>
  );
}

function Navigation() {
  const [location, setLocation] = useLocation();
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
  const isLoginPage = location === "/" || location === "/login";
  const isSignupPage = location === "/signup";
  const interviewInProgress = user && user.role !== 'admin' && sessionStorage.getItem('currentInterview');

  if (isLoginPage || isSignupPage) {
    return (
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16">
            <div className="flex items-center space-x-3">
              <Logo size={40} />
              <h1 className="font-extrabold text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-500 ml-2">FirstroundAI</h1>
            </div>
          </div>
        </div>
      </header>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('user');
    setLocation('/');
  };

  if (interviewInProgress) {
    return (
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Logo size={40} />
              <h1 className="font-extrabold text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-500 ml-2">FirstroundAI</h1>
            </div>
            <button onClick={handleLogout} className="ml-4 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Logout</button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Logo size={40} />
            <h1 className="font-extrabold text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-500 ml-2">FirstroundAI</h1>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="/" className="text-primary pb-4 font-medium flex items-center">Home</a>
            {user && user.role === 'candidate' && (
              <a href="/interview" className="text-gray-500 hover:text-gray-700 pb-4 font-medium flex items-center">Interview</a>
            )}
            {user && user.role === 'admin' && (
              <a href="/admin" className="text-gray-500 hover:text-gray-700 pb-4 font-medium flex items-center">Admin Console</a>
            )}
            <button onClick={handleLogout} className="ml-4 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Logout</button>
          </nav>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">AI Interview Platform</p>
              <p className="text-xs text-gray-500">Powered by Advanced AI Technology</p>
            </div>
          </div>
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [isInvitedCandidate, setIsInvitedCandidate] = React.useState(false);
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
  const role = user?.role;
  const isAdmin = role === 'admin';
  const isCandidate = role === 'candidate';

  // Check if candidate is invited
  React.useEffect(() => {
    if (isCandidate && user?.email) {
      fetch('/api/admin/candidates')
        .then(res => res.json())
        .then(candidates => {
          const candidate = candidates.find((c: any) => c.email === user.email);
          setIsInvitedCandidate(candidate?.invited || false);
        })
        .catch(() => setIsInvitedCandidate(false));
    }
  }, [isCandidate, user?.email]);

  const nav = isAdmin
    ? [
        { label: 'Interviews', path: '/admin?tab=interviews' },
        { label: 'Candidates', path: '/admin?tab=candidates' },
        { label: 'Upload Resume', path: '/admin/upload-resume' },
        { label: 'Email Config', path: '/admin/email-config' },
        { label: 'Job Roles', path: '/admin?tab=jobroles' },
        { label: 'Questions', path: '/admin?tab=questions' },
        { label: 'Insights', path: '/admin?tab=insights' },
        { label: 'Settings', path: '/admin?tab=settings' },
        { label: 'Admin Tools', path: '/admin?tab=admin' },
      ]
    : isInvitedCandidate
    ? [
        // Invited candidates only see Interview - no other options
        { label: 'Interview', path: '/interview' },
      ]
    : [
        // Self-registered candidates see both
        { label: 'Upload Resume', path: '/upload' },
        { label: 'Interview', path: '/interview' },
      ];

  // For invited candidates, force redirect to interview if they try to access other routes
  React.useEffect(() => {
    if (isInvitedCandidate && location !== '/interview') {
      setLocation('/interview');
    }
  }, [isInvitedCandidate, location, setLocation]);

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-white dark:bg-gray-800 shadow-lg flex-shrink-0 flex flex-col">
        <div className="h-16 flex items-center px-6 space-x-2 font-bold text-xl border-b border-gray-200 dark:border-gray-700">
          <Logo size={32} />
          <span className="font-extrabold text-lg tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-500">FirstroundAI</span>
        </div>
        <nav className="flex-1 py-4 space-y-2">
          {nav.map(item => (
            <button
              key={item.label}
              className={`w-full text-left px-6 py-2 rounded ${location === item.path ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              onClick={() => {
                console.log('Navigating to:', item.path);
                setLocation(item.path);
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            className="w-full bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            onClick={() => { localStorage.removeItem('user'); window.location.href = '/'; }}
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const [location] = useLocation();
  const [isLoading, setIsLoading] = React.useState(true);
  const [invitationStatus, setInvitationStatus] = React.useState<boolean | null>(null);
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
  
  // Check invitation status on component mount
  React.useEffect(() => {
    const checkInvitationStatus = async () => {
      if (user?.role === 'candidate' && user?.email) {
        try {
          const response = await fetch('/api/admin/candidates');
          const candidates = await response.json();
          const candidate = candidates.find((c: any) => c.email === user.email);
          setInvitationStatus(candidate?.invited || false);
        } catch (error) {
          console.error('Error checking invitation status:', error);
          setInvitationStatus(false);
        }
      } else {
        setInvitationStatus(false);
      }
      setIsLoading(false);
    };
    
    checkInvitationStatus();
  }, [user]);
  
  if (location === '/login') {
    return (
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>
    );
  }
  
  if (location === '/signup') {
    return (
      <QueryClientProvider client={queryClient}>
        <Signup />
      </QueryClientProvider>
    );
  }
  
  if (location === '/forgot-password') {
    return (
      <QueryClientProvider client={queryClient}>
        <ForgotPassword />
      </QueryClientProvider>
    );
  }
  
  if (location.startsWith('/reset-password')) {
    return (
      <QueryClientProvider client={queryClient}>
        <ResetPassword />
      </QueryClientProvider>
    );
  }
  
  if (!user) {
    window.location.href = '/login';
    return null;
  }

  // Show loading while checking invitation status
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Role-based route protection
  const isAdmin = user.role === 'admin';
  const isCandidate = user.role === 'candidate';

  // Admin users can only access admin routes
  if (isAdmin) {
    if (!location.startsWith('/admin')) {
      // Redirect admin users to admin dashboard if they try to access non-admin routes
      window.location.href = '/admin';
      return null;
    }
  }

  // Candidates cannot access admin routes - immediate redirect
  if (isCandidate && location.startsWith('/admin')) {
    // Redirect candidates away from admin routes immediately
    window.location.href = '/interview';
    return null;
  }

  // For invited candidates, force redirect to interview if they're not already there
  if (isCandidate && invitationStatus === true && location !== '/interview') {
    window.location.href = '/interview';
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarLayout>
        <Switch>
          {/* Candidate routes */}
          <Route path="/upload" component={ProtectedUploadRoute} />
          <Route path="/interview" component={InterviewSession} />
          {/* Admin routes - only accessible by admin users */}
          {isAdmin && (
            <>
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/admin/upload-resume" component={AdminResumeUpload} />
              <Route path="/admin/email-config" component={AdminEmailConfig} />
              <Route path="/admin/interview/:id" component={AdminInterviewResults} />
            </>
          )}
          {/* Fallback */}
          <Route component={NotFound} />
        </Switch>
      </SidebarLayout>
    </QueryClientProvider>
  );
}
