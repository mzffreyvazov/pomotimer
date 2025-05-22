import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionLimitNotificationProps {
  showSignupModal: () => void;
  showLoginModal: () => void;
}

const SessionLimitNotification: React.FC<SessionLimitNotificationProps> = ({ 
  showSignupModal, 
  showLoginModal 
}) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [showDialog, setShowDialog] = useState(false);
  
  useEffect(() => {
    const handleSessionLimitReached = () => {
      if (!user) {
        setShowDialog(true);
      }
    };
    
    window.addEventListener('SESSION_LIMIT_REACHED', handleSessionLimitReached);
    
    return () => {
      window.removeEventListener('SESSION_LIMIT_REACHED', handleSessionLimitReached);
    };
  }, [user]);
  
  const handleSignUp = () => {
    setShowDialog(false);
    showSignupModal();
  };
  
  const handleLogin = () => {
    setShowDialog(false);
    showLoginModal();
  };
  
  const handleContinue = () => {
    setShowDialog(false);
  };
  
  if (user) return null;
  
  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className={cn(
        isDark ? "dark-dialog-theme" : "",
        "max-w-md mx-auto"
      )}>
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20 mb-4">
            <Clock className="h-6 w-6 text-amber-500" />
          </div>
          <DialogTitle className="text-center">Session Limit Reached</DialogTitle>
          <DialogDescription className="text-center pt-2">
            You've reached the limit of 3 saved sessions for non-registered users.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className={cn(
            "text-center",
            isDark ? "text-white/70" : "text-gray-600"
          )}>
            Create an account to save unlimited sessions and access your progress from any device.
          </p>
        </div>
        
        <div className="mt-6 space-y-2">
          <Button 
            onClick={handleSignUp}
            className={cn(
              "w-full bg-pomo-primary hover:bg-pomo-primary/90 text-pomo-background"
            )}
          >
            Sign up
          </Button>
          <Button
            variant="outline" 
            onClick={handleLogin}
            className="w-full border-pomo-muted hover:bg-pomo-muted/20"
          >
            Log in
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleContinue}
            className="w-full hover:bg-pomo-muted/20"
          >
            Continue with limit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionLimitNotification;
