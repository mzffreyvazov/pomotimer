import React, { useState, useEffect, useRef } from 'react';
import { TimerProvider, useTimer } from '@/contexts/TimerContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationProvider, useNotifications } from '@/contexts/NotificationContext';
import TimerDisplay from './TimerDisplay';
import TimerSettings from './TimerSettings';
import SoundControl from './SoundControl';
import { NotificationPrompt } from './NotificationPrompt';
import { ThemeToggle } from './ThemeToggle';
import { cn, optimizeMobilePerformance } from '@/lib/utils';
import { useSpacebarTip } from '@/hooks/use-spacebar-tip';
import { Button } from '@/components/ui/button';
import { ClipboardList, UserCircle, Settings, LogOut, History, Trash, LogIn } from 'lucide-react'; // Added Trash and LogIn
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom'; // Added useNavigate
import ShortcutsModal from './ShortcutsModal'; // Import the new modal
import SessionLimitNotification from './SessionLimitNotification'; // Import session limit notification
import { GoalPreviewDrawer } from './GoalPreviewDrawer'; // Import the goal preview drawer

// Import the SessionsPanel component
// @ts-ignore: The file exists but TypeScript can't find its type declarations
import SessionsPanel from './SessionsPanel';

interface PomodoroContentProps {
  showSignupModal: () => void;
  showLoginModal: () => void;
}

// Inner component to access context
const PomodoroContent: React.FC<PomodoroContentProps> = ({ showSignupModal, showLoginModal }) => {  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showSessions, setShowSessions] = useState<boolean>(false);
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false); // State for shortcuts modal
  const { isActive, isPaused } = useTimer();
  const { theme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate(); // Initialized useNavigate
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    // Initialize the spacebar tip
  useSpacebarTip();
  
  // Add event listeners for signup/login modals
  useEffect(() => {
    const handleShowSignup = () => showSignupModal();
    const handleShowLogin = () => showLoginModal();
    
    window.addEventListener('SHOW_SIGNUP_MODAL', handleShowSignup);
    window.addEventListener('SHOW_LOGIN_MODAL', handleShowLogin);
    
    return () => {
      window.removeEventListener('SHOW_SIGNUP_MODAL', handleShowSignup);
      window.removeEventListener('SHOW_LOGIN_MODAL', handleShowLogin);
    };
  }, [showSignupModal, showLoginModal]);

  // Apply mobile optimizations when component mounts
  useEffect(() => {
    optimizeMobilePerformance();
  }, []);

  // Attribute for smooth animation on mobile
  // Using data attribute to target in CSS
  const timerState = isActive && !isPaused ? "true" : "false";

  const openSessionsPanel = () => {
    setShowSessions(true);
  };
  
  const shouldHideMainElements = showSettings || showSessions;

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
                    onClick={() => setShowShortcutsModal(true)} // Open shortcuts modal
                  >
                    <ClipboardList size={16} className="mr-2" />
                    <span>Shortcuts</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center cursor-pointer"
                    onClick={() => navigate('/sessions')}
                  >
                    <History size={16} className="mr-2" />
                    <span>Past Sessions</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="flex items-center cursor-pointer"
                    onClick={signOut}
                  >
                    <LogOut size={16} className="mr-2" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>                  <DropdownMenuSeparator />                  <DropdownMenuItem 
                    className="flex items-center cursor-pointer text-destructive focus:text-destructive"
                    onClick={() => setShowDeleteAccountModal(true)}
                  >
                    <Trash size={16} className="mr-2" />
                    <span>Delete Account</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>{/* Account Modal */}              <Dialog open={showAccountModal} onOpenChange={setShowAccountModal}>
                <DialogContent className={cn(
                  "p-0 overflow-hidden border-2",
                  isDark 
                    ? "bg-pomo-background border-pomo-muted/30 shadow-black/30" 
                    : "bg-pomo-background border-pomo-muted/30 shadow-gray-300/30"
                )}>
                  <div className={cn(
                    "p-4 w-full", 
                    isDark ? "bg-pomo-muted/50" : "bg-pomo-muted/30"
                  )}>
                    <DialogTitle className="text-xl font-semibold text-pomo-primary flex items-center">
                      <UserCircle className="mr-2" size={24} />
                      Account Info
                    </DialogTitle>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    {user.user_metadata?.name && (
                      <div className="flex items-center gap-3 p-3 rounded-lg transition-all duration-300 hover:translate-y-[-2px]"
                        style={{
                          background: isDark ? "rgba(var(--muted), 0.5)" : "rgba(var(--muted), 0.3)",
                        }}
                      >
                        <div className="bg-pomo-primary/20 p-2 rounded-full">
                          <UserCircle size={24} className={isDark ? "text-pomo-primary" : "text-pomo-primary"} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-pomo-secondary">Name</p>
                          <p className="font-medium">{user.user_metadata.name}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 p-3 rounded-lg transition-all duration-300 hover:translate-y-[-2px]"
                      style={{
                        background: isDark ? "rgba(var(--muted), 0.5)" : "rgba(var(--muted), 0.3)",
                      }}
                    >
                      <div className="bg-pomo-primary/20 p-2 rounded-full">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="24" 
                          height="24" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className={isDark ? "text-pomo-primary" : "text-pomo-primary"}
                        >
                          <rect width="20" height="16" x="2" y="4" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-pomo-secondary">Email</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className={cn(
                    "p-4 border-t",
                    isDark ? "border-pomo-muted/30" : "border-pomo-muted/50"
                  )}>                    <Button 
                      onClick={() => setShowAccountModal(false)} 
                      className={cn(
                        "text-white transition-all duration-300 shadow-none",
                        isDark 
                          ? "bg-pomo-primary/80 hover:bg-pomo-primary text-pomo-background" 
                          : "bg-pomo-primary hover:bg-pomo-primary/90"
                      )}
                    >
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>              </Dialog>

              {/* Delete Account Modal */}              <Dialog open={showDeleteAccountModal} onOpenChange={setShowDeleteAccountModal}>
                <DialogContent className={cn(
                  "p-0 overflow-hidden border-2",
                  isDark 
                    ? "bg-pomo-background border-pomo-muted/30 shadow-black/30" 
                    : "bg-pomo-background border-pomo-muted/30 shadow-gray-300/30"
                )}>
                  <div className={cn(
                    "p-4 w-full", 
                    isDark ? "bg-destructive/20" : "bg-destructive/10"
                  )}>
                    <DialogTitle className="text-xl font-semibold text-destructive flex items-center">
                      <Trash className="mr-2" size={24} />
                      Delete Account
                    </DialogTitle>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg transition-all duration-300"
                      style={{
                        background: isDark ? "rgba(var(--muted), 0.5)" : "rgba(var(--muted), 0.3)",
                      }}
                    >
                      <div className="bg-destructive/20 p-2 rounded-full">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="24" 
                          height="24" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className="text-destructive"
                        >
                          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                          <line x1="12" y1="9" x2="12" y2="13"/>
                          <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-destructive">Warning: This cannot be undone</p>
                        <p className="text-sm">All your data and history will be permanently deleted.</p>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                      <p className="text-sm">Please confirm that you want to delete your account:</p>
                      <p className="font-medium mt-2">{user.email}</p>
                    </div>
                  </div>

                  <DialogFooter className={cn(
                    "p-4 border-t flex justify-between",
                    isDark ? "border-pomo-muted/30" : "border-pomo-muted/50"
                  )}><Button 
                      onClick={() => setShowDeleteAccountModal(false)} 
                      className={cn(
                        "transition-all duration-300 bg-transparent shadow-none",
                        isDark 
                          ? "text-pomo-foreground hover:bg-pomo-muted/30" 
                          : "text-pomo-foreground hover:bg-pomo-muted/20"
                      )}
                      variant="ghost"
                    >
                      Cancel
                    </Button>
                    
                    <Button 
                      onClick={() => {
                        // Placeholder for delete account implementation
                        alert("Account deletion feature coming soon!");
                        setShowDeleteAccountModal(false);
                      }} 
                      className="bg-destructive hover:bg-destructive/90 text-white transition-all duration-300 shadow-none"
                      variant="destructive"
                    >
                      Delete Account
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={showSignupModal}
              className={cn(
              "flex items-center gap-2 transition-all duration-300 border",
              isDark 
                ? "border-pomo-muted/50 text-pomo-primary hover:bg-pomo-secondary/30" 
                : "border-pomo-muted/50 text-pomo-primary hover:bg-pomo-secondary/20"
              )}
            >
              <LogIn size={16} />
              Sign In
            </Button>
          )}
          <ThemeToggle />
        </div>
        
        <div 
          ref={containerRef}
          className={cn(
            "pomodoro-container transition-all duration-300 w-full max-w-md mx-auto",
            shouldHideMainElements ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
          )}
          data-timer-active={timerState}
          data-animation-state={isActive ? (isPaused ? "paused" : "active") : "inactive"}
        >
          <TimerDisplay 
            onOpenSettings={() => setShowSettings(true)} 
            onOpenSessions={() => setShowSessions(true)}
            isTimerVisible={!shouldHideMainElements}
          />
          <SoundControl />
        </div>
        
        {/* Settings Panel */}
        <div className={cn(
          "fixed inset-0 flex items-center justify-center transition-all duration-300",
          isDark 
            ? "backdrop-blur-sm bg-[#221F26]/30" 
            : "backdrop-blur-sm bg-pomo-background/30",          showSettings ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}>
          <div className="p-6 w-full max-w-lg mx-4">
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
          </div>        </div>
      </div>
        {/* Notification permission prompt */}
      <NotificationPrompt />
      {/* Goal Preview Drawer */}
      <GoalPreviewDrawer 
        onOpenSessionsPanel={openSessionsPanel} 
        isHidden={shouldHideMainElements} 
      />
      {/* Shortcuts Modal */}
      <ShortcutsModal isOpen={showShortcutsModal} onClose={() => setShowShortcutsModal(false)} />
      {/* Session Limit Notification */}
      <SessionLimitNotification 
        showSignupModal={showSignupModal} 
        showLoginModal={showLoginModal}
      />
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
      <NotificationProvider>
        <PomodoroContent showSignupModal={showSignupModal} showLoginModal={showLoginModal} />
      </NotificationProvider>
    </TimerProvider>
  );
};

export default PomodoroApp;
