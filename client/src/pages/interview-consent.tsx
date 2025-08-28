import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  AlertTriangle, 
  Eye, 
  Shield, 
  Clock, 
  Monitor, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';

interface ConsentState {
  interviewToken?: string;
  candidateName?: string;
  jobRole?: string;
}

export default function InterviewConsent() {
  const [, setLocation] = useLocation();
  const [hasConsented, setHasConsented] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [showDetailedTerms, setShowDetailedTerms] = useState(false);

  const state = history.state?.usr as ConsentState || {};
  const { interviewToken, candidateName, jobRole } = state;
  
  // Check if user is logged in
  React.useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      // If not logged in, redirect to login page
      setLocation('/login');
      return;
    }
  }, [setLocation]);

  const handleConsent = () => {
    if (!hasConsented || !hasReadTerms) {
      return;
    }

    // Store consent in localStorage
    localStorage.setItem('interviewConsent', JSON.stringify({
      timestamp: Date.now(),
      hasConsented: true,
      token: interviewToken
    }));

    // Navigate to interview session
    setLocation('/interview', { 
      state: { 
        interviewToken,
        candidateName,
        jobRole,
        consented: true
      }
    });
  };

  const handleDecline = () => {
    setLocation('/interview-terminated', {
      state: {
        reason: 'declined',
        message: 'You have declined to participate in the interview. The interview session has been cancelled.'
      }
    });
  };

  const monitoringFeatures = [
    {
      icon: <Monitor className="w-5 h-5 text-blue-600" />,
      title: "Real-time Focus Monitoring",
      description: "Continuous monitoring of your browser window and tab focus during the interview"
    },
    {
      icon: <Eye className="w-5 h-5 text-green-600" />,
      title: "Visibility Detection",
      description: "Detection when you switch to other applications or browser tabs"
    },
    {
      icon: <Clock className="w-5 h-5 text-orange-600" />,
      title: "Time Tracking",
      description: "Monitoring time spent away from the interview interface"
    },
    {
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
      title: "Violation Detection",
      description: "Automatic detection of multiple focus violations"
    }
  ];

  const consequences = [
    "First violation: Warning message displayed",
    "Second violation: Final warning with countdown",
    "Third violation: Interview automatically terminated",
    "Termination reason: Disciplinary action for multiple focus violations"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Interview Session Consent
          </h1>
          <p className="text-xl text-gray-600">
            Please read and understand the monitoring policies before proceeding
          </p>
        </div>

        {/* Main Consent Card */}
        <Card className="mb-6 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardTitle className="flex items-center gap-3">
              <Shield className="w-8 h-8" />
              Important: Interview Monitoring & Consent
            </CardTitle>
            <CardDescription className="text-blue-100">
              This interview session includes comprehensive monitoring to ensure academic integrity
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Monitoring Features */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-blue-600" />
                  What We Monitor
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {monitoringFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      {feature.icon}
                      <div>
                        <h4 className="font-medium text-gray-900">{feature.title}</h4>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consequences */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Consequences of Violations
                </h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <ul className="space-y-2">
                    {consequences.map((consequence, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-red-800">
                        <span className="text-red-600 font-medium">{index + 1}.</span>
                        {consequence}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Privacy Notice */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  Privacy & Data Protection
                </h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <ul className="space-y-2 text-sm text-green-800">
                    <li>• All monitoring data is processed locally and not stored permanently</li>
                    <li>• No personal information is collected beyond what's necessary for the interview</li>
                    <li>• Data is automatically deleted after the interview session ends</li>
                    <li>• We do not access your camera, microphone, or other system resources</li>
                  </ul>
                </div>
              </div>

              {/* Detailed Terms Toggle */}
              <div>
                <Button
                  variant="outline"
                  onClick={() => setShowDetailedTerms(!showDetailedTerms)}
                  className="w-full"
                >
                  {showDetailedTerms ? 'Hide' : 'Show'} Detailed Terms & Conditions
                </Button>
                
                {showDetailedTerms && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 space-y-3">
                    <h4 className="font-semibold">Detailed Terms:</h4>
                    <ul className="space-y-2 list-disc list-inside">
                      <li>The interview system will monitor your browser's focus state throughout the session</li>
                      <li>Switching to other applications, tabs, or windows will be detected</li>
                      <li>Multiple violations will result in automatic interview termination</li>
                      <li>You agree to maintain focus on the interview interface during the entire session</li>
                      <li>Technical issues or legitimate interruptions should be reported immediately</li>
                      <li>By proceeding, you acknowledge understanding of these monitoring policies</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Consent Checkboxes */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="readTerms"
                    checked={hasReadTerms}
                    onCheckedChange={(checked) => setHasReadTerms(checked as boolean)}
                  />
                  <label htmlFor="readTerms" className="text-sm text-gray-700 leading-relaxed">
                    I have read and understood the monitoring policies, consequences of violations, 
                    and privacy protection measures outlined above.
                  </label>
                </div>
                
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="consent"
                    checked={hasConsented}
                    onCheckedChange={(checked) => setHasConsented(checked as boolean)}
                  />
                  <label htmlFor="consent" className="text-sm text-gray-700 leading-relaxed">
                    I consent to participate in this interview session with full understanding 
                    that my focus and attention will be monitored throughout the process.
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  onClick={handleConsent}
                  disabled={!hasConsented || !hasReadTerms}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  I Consent - Start Interview
                </Button>
                
                <Button
                  onClick={handleDecline}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                  size="lg"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  I Decline - Cancel Interview
                </Button>
              </div>

              {/* Status Indicator */}
              <div className="text-center">
                {hasConsented && hasReadTerms ? (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Ready to proceed with interview</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-orange-600">
                    <Info className="w-5 h-5" />
                    <span className="font-medium">Please complete all consent requirements</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="text-center text-sm text-gray-500">
          <p>
            If you have any questions about these monitoring policies, 
            please contact the interview administrator before proceeding.
          </p>
        </div>
      </div>
    </div>
  );
} 