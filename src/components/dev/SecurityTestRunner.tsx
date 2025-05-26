
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { runTimesheetSecurityTest } from "@/tests/e2e-timesheet-security.test";
import { Shield, Play, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const SecurityTestRunner: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Capture console logs during test execution
  const captureConsoleLogs = () => {
    const originalLog = console.log;
    const originalError = console.error;
    const testLogs: string[] = [];

    console.log = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      testLogs.push(`[LOG] ${message}`);
      originalLog(...args);
    };

    console.error = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      testLogs.push(`[ERROR] ${message}`);
      originalError(...args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      return testLogs;
    };
  };

  const runSecurityTest = async () => {
    setIsRunning(true);
    setTestResult(null);
    setLogs([]);

    const restoreConsole = captureConsoleLogs();

    try {
      await runTimesheetSecurityTest();
      setTestResult('success');
    } catch (error) {
      console.error('Security test failed:', error);
      setTestResult('error');
    } finally {
      const capturedLogs = restoreConsole();
      setLogs(capturedLogs);
      setIsRunning(false);
    }
  };

  const getStatusIcon = () => {
    if (isRunning) return <AlertTriangle className="h-5 w-5 text-yellow-500 animate-spin" />;
    if (testResult === 'success') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (testResult === 'error') return <XCircle className="h-5 w-5 text-red-500" />;
    return <Shield className="h-5 w-5 text-blue-500" />;
  };

  const getStatusBadge = () => {
    if (isRunning) return <Badge variant="outline" className="text-yellow-600">Running...</Badge>;
    if (testResult === 'success') return <Badge variant="outline" className="text-green-600">Passed</Badge>;
    if (testResult === 'error') return <Badge variant="outline" className="text-red-600">Failed</Badge>;
    return <Badge variant="outline">Ready</Badge>;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <CardTitle>Timesheet Security Test</CardTitle>
            {getStatusBadge()}
          </div>
          <Button 
            onClick={runSecurityTest} 
            disabled={isRunning}
            size="sm"
          >
            <Play className="h-4 w-4 mr-2" />
            {isRunning ? "Running..." : "Run Test"}
          </Button>
        </div>
        <CardDescription>
          End-to-end test to verify that timesheet entries are properly isolated between users using Row Level Security (RLS).
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            This test will:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Create test users A and B</li>
              <li>Have User A create a timesheet entry</li>
              <li>Switch to User B and verify they cannot see User A's entry</li>
              <li>Test direct API access by entry ID</li>
              <li>Verify each user can only see their own entries</li>
            </ul>
          </AlertDescription>
        </Alert>

        {testResult && (
          <Alert variant={testResult === 'success' ? 'default' : 'destructive'}>
            {testResult === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {testResult === 'success' 
                ? "🎉 All security tests passed! RLS is working correctly." 
                : "❌ Security tests failed. Check the logs below for details."}
            </AlertDescription>
          </Alert>
        )}

        {logs.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Test Logs:</h4>
            <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap">
                {logs.join('\n')}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SecurityTestRunner;
