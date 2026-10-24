import { AlertCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

export function FirebaseSetupWarning() {
  const isConfigured =
    import.meta.env.VITE_FIREBASE_API_KEY ||
    !window.location.hostname.includes('localhost');

  // Don't show warning if Firebase seems configured or in production
  if (isConfigured) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-lg border-orange-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="bg-orange-100 p-2 rounded-full">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl mb-2">🔧 Firebase Setup Required</h2>
              <p className="text-gray-600 text-sm mb-3">
                The app is using placeholder Firebase credentials. You need to configure your Firebase project to use this app.
              </p>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium mb-2 text-sm">Quick Setup (5 minutes):</h3>
            <ol className="text-sm space-y-1 text-gray-700 list-decimal list-inside">
              <li>Create Firebase project at console.firebase.google.com</li>
              <li>Enable Authentication, Firestore, and Storage</li>
              <li>Copy your Firebase config</li>
              <li>Update <code className="bg-orange-100 px-1 rounded">/src/config/firebase.ts</code></li>
            </ol>
          </div>

          <div className="flex gap-2">
            <Button asChild className="flex-1">
              <a
                href="https://console.firebase.google.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Firebase Console
              </a>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <a
                href="/SETUP_HELP.md"
                target="_blank"
              >
                View Setup Guide
              </a>
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-4 text-center">
            See <code>SETUP_HELP.md</code> or <code>QUICKSTART.md</code> for detailed instructions
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
