import React from 'react';
import { useLocation } from 'wouter';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Home, AlertCircle, XCircle } from 'lucide-react';

interface TerminationState {
  reason: 'disciplinary' | 'declined' | 'error' | 'other';
  message: string;
}

export default function InterviewTerminated() {
  const [, setLocation] = useLocation();
  const state = history.state?.usr as TerminationState || {
    reason: 'disciplinary',
    message: 'Due to disciplinary action, the interview has been aborted.'
  };

  const getTitle = () => {
    switch (state.reason) {
      case 'disciplinary':
        return 'Interview Terminated - Disciplinary Action';
      case 'declined':
        return 'Interview Cancelled - Consent Declined';
      case 'error':
        return 'Interview Error';
      default:
        return 'Interview Terminated';
    }
  };

  const getIcon = () => {
    switch (state.reason) {
      case 'disciplinary':
        return <AlertTriangle className="h-12 w-12 text-red-600" />;
      case 'declined':
        return <XCircle className="h-12 w-12 text-blue-600" />;
      case 'error':
        return <AlertCircle className="h-12 w-12 text-orange-600" />;
      default:
        return <AlertCircle className="h-12 w-12 text-gray-600" />;
    }
  };

  const getDescription = () => {
    switch (state.reason) {
      case 'disciplinary':
        return 'Your interview has been terminated due to multiple violations of interview guidelines.';
      case 'declined':
        return 'You have declined to participate in the interview session. The interview has been cancelled.';
      case 'error':
        return 'An error occurred during your interview. Please contact support for assistance.';
      default:
        return 'Your interview has been terminated.';
    }
  };

  const handleGoHome = () => {
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <CardTitle className="text-xl text-red-700">
            {getTitle()}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {getDescription()}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {state.message}
            </AlertDescription>
          </Alert>

          {state.reason === 'disciplinary' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">
                What happened?
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Multiple tab/window switches detected</li>
                <li>• Extended periods away from interview</li>
                <li>• Violation of interview integrity guidelines</li>
              </ul>
            </div>
          )}

          {state.reason === 'declined' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">
                Interview Cancelled
              </h4>
              <p className="text-sm text-blue-700">
                You have chosen not to participate in the interview session. 
                If you change your mind, you can contact the administrator to request a new invitation.
              </p>
            </div>
          )}

          <div className="text-center space-y-3">
            <Button 
              onClick={handleGoHome}
              className="w-full"
              variant="outline"
            >
              <Home className="h-4 w-4 mr-2" />
              Return to Home
            </Button>
            
            {state.reason === 'disciplinary' && (
              <p className="text-xs text-gray-500">
                For questions about this termination, please contact your administrator.
              </p>
            )}
            
            {state.reason === 'declined' && (
              <p className="text-xs text-gray-500">
                If you have questions about the interview process, please contact your administrator.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 