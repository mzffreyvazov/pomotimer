import React, { useState, useEffect, useRef } from 'react';
import { TimerProvider, useTimer } from '@/contexts/TimerContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import TimerDisplay from './TimerDisplay';
import TimerSettings from './TimerSettings';
import SoundControl from './SoundControl';
import { NotificationPrompt } from './NotificationPrompt';
import { ThemeToggle } from './ThemeToggle';
import { cn, optimizeMobilePerformance } from '@/lib/utils';
import { useSpacebarTip } from '@/hooks/use-spacebar-tip';
import { Button } from '@/components/ui/button';
import { ClipboardList, UserCircle, Settings, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

// Import the SessionsPanel component
// @ts-ignore: The file exists but TypeScript can't find its type declarations
import SessionsPanel from './SessionsPanel';

interface PomodoroContentProps {
  showSignupModal: () => void;
  showLoginModal: () => void;
}

// Inner component to access context
const PomodoroContent: React.FC<PomodoroContentProps> = ({ showSignupModal, showLoginModal }) => {
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showSessions, setShowSessions] = useState<boolean>(false);
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const { isActive, isPaused } = useTimer();
  const { theme } = useTheme();
  const { user, signOut } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  // Initialize the spacebar tip
  useSpacebarTip();

  // Apply mobile optimizations when component mounts
  useEffect(() => {
    optimizeMobilePerformance();
  }, []);

  // Attribute for smooth animation on mobile
  // Using data attribute to target in CSS
  const timerState = isActive && !isPaused ? "true" : "false";

  return (
    <>
      <div className={cn(
        "fixed inset-0 min-h-screen w-full flex justify-center items-center bg-pomo-background",
        isDark ? "bg-[#221F26]" : ""
      )}>
        <div className="fixed top-3 right-3 z-50 flex items-center gap-2">
          {user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-pomo-secondary hover:text-pomo-foreground"
                    title="Account"
                  >
                    <UserCircle size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    className="flex items-center cursor-pointer"
                    onClick={() => setShowAccountModal(true)}
                  >
                    <UserCircle size={16} className="mr-2" />
                    <span>Account</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="flex items-center cursor-pointer"
                    onClick={signOut}
                  >
                    <LogOut size={16} className="mr-2" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="flex items-center cursor-pointer"
                    // TODO: Implement shortcuts modal
                  >
                    <ClipboardList size={16} className="mr-2" />
                    <span>Shortcuts</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="flex items-center cursor-pointer text-destructive focus:text-destructive"
                    // TODO: Implement delete account logic
                  >
                    <LogOut size={16} className="mr-2" />
                    <span>Delete Account</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* Account Modal */}
              <Dialog open={showAccountModal} onOpenChange={setShowAccountModal}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Account Info</DialogTitle>
                  </DialogHeader>
                  <div className="py-2">
                    {user.user_metadata?.name && (
                      <div className="mb-2">
                        <span className="font-medium">Name:</span> {user.user_metadata.name}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Email:</span> {user.email}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAccountModal(false)}>Close</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <Button 
              variant="default" 
              size="sm" 
              onClick={showSignupModal}
              className="bg-pomo-primary hover:bg-pomo-primary/90"
            >
              Sign In
            </Button>
          )}
          <ThemeToggle />
        </div>
        
        <div 
          ref={containerRef}
          className={cn(
            "pomodoro-container transition-all duration-300 w-full max-w-md mx-auto",
            (showSettings || showSessions) ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
          )}
          data-timer-active={timerState}
          data-animation-state={isActive ? (isPaused ? "paused" : "active") : "inactive"}
        >
          <TimerDisplay 
            onOpenSettings={() => setShowSettings(true)} 
            onOpenSessions={() => setShowSessions(true)}
            isTimerVisible={!showSettings && !showSessions}
          />
          <SoundControl />
        </div>
        
        {/* Settings Panel */}
        <div className={cn(
          "fixed inset-0 flex items-center justify-center transition-all duration-300",
          isDark 
            ? "backdrop-blur-sm bg-[#221F26]/30" 
            : "backdrop-blur-sm bg-pomo-background/30",
          showSettings ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}>
          <div className="p-6 w-full max-w-md mx-4">
            <TimerSettings onClose={() => setShowSettings(false)} />
          </div>
        </div>
        
        {/* Sessions Panel */}
        <div className={cn(
          "fixed inset-0 flex items-center justify-center transition-all duration-300",
          isDark 
            ? "backdrop-blur-sm bg-[#221F26]/30" 
            : "backdrop-blur-sm bg-pomo-background/30",
          showSessions ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}>
          <div className="p-6 w-full max-w-[640px] mx-4">
            {showSessions && (
              <SessionsPanel onClose={() => setShowSessions(false)} />
            )}
          </div>
        </div>
      </div>
      
      {/* Notification permission prompt */}
      <NotificationPrompt />
    </>
  );
};

interface PomodoroAppProps {
  showSignupModal: () => void;
  showLoginModal: () => void;
}

// Main component with provider
const PomodoroApp: React.FC<PomodoroAppProps> = ({ showSignupModal, showLoginModal }) => {
  return (
    <TimerProvider>
      <PomodoroContent showSignupModal={showSignupModal} showLoginModal={showLoginModal} />
    </TimerProvider>
  );
};

export default PomodoroApp;
