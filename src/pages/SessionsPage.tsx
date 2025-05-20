import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { cn, optimizeMobilePerformance } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

const SessionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Apply mobile optimizations when component mounts
  useEffect(() => {
    optimizeMobilePerformance();
  }, []);
  
  // Toggle between light and dark theme
  const toggleTheme = () => {
    if (theme === 'system') {
      // If system, switch to the opposite of current system preference
      setTheme(isDark ? 'light' : 'dark');
    } else {
      // If already on light/dark, switch to the other
      setTheme(theme === 'light' ? 'dark' : 'light');
    }
  };

  // Handle keyboard shortcut for theme toggle
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if T is pressed and no input elements are focused
      if (e.key.toLowerCase() === 't' && 
          document.activeElement?.tagName !== 'INPUT' && 
          document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        toggleTheme();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [theme]);

  // Mock data for past sessions
  const sessions = {
    today: [
      { id: 1, name: 'Morning Focus', duration: '25 mins', time: '9:00 AM' },
      { id: 2, name: 'Project Work', duration: '50 mins', time: '11:00 AM' },
    ],
    yesterday: [
      { id: 3, name: 'Afternoon Study', duration: '45 mins', time: '2:00 PM' },
    ],
    previous7Days: [
      { id: 4, name: 'Weekend Coding', duration: '2 hours', date: 'May 17, 2025' },
      { id: 5, name: 'Reading Session', duration: '30 mins', date: 'May 16, 2025' },
    ],
    previous30Days: [
      { id: 6, name: 'Deep Work', duration: '3 hours', date: 'April 25, 2025' },
    ],
    pastMonths: [
      { id: 7, name: 'March Madness Coding', duration: '5 hours', date: 'March 10, 2025' },
    ],
  };

  // Navigation logic
  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className={cn(
      "fixed inset-0 min-h-screen w-full flex justify-center items-center bg-pomo-background transition-colors duration-300",
      isDark ? "bg-[#221F26]" : ""
    )}>
      <div className="p-6 w-full max-w-xl mx-4 animate-fade-in">
        <div className={cn(
          "w-full rounded-2xl border animate-scale-in transition-all duration-300 ease-in-out",
          isDark 
            ? "bg-pomo-background border-pomo-muted/30 shadow-lg shadow-black/30" 
            : "bg-pomo-background border-pomo-muted/30 shadow-lg shadow-gray-300/50"
        )}>
          <div className="flex flex-row items-center justify-between p-6 pb-2">
            <h3 className="text-xl font-semibold leading-none tracking-tight">Past Sessions</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack} 
              aria-label="Go back"
              className="hover:bg-pomo-muted/40 transition-colors duration-300"
            >
              <ArrowLeft size={18} className="mr-1" />
              <span>Back</span>
            </Button>
          </div>
          <div className="overflow-y-auto max-h-[calc(100vh-12rem)] px-6 pt-2 pb-6">
            {/* Today's Sessions */}
            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center">Today</h2>
              {sessions.today.length > 0 ? (
                <ul className="space-y-3">
                  {sessions.today.map(session => (
                    <li 
                      key={session.id} 
                      className={cn(
                        "p-4 rounded-lg transition-all duration-300 hover:translate-y-[-2px]",
                        isDark 
                          ? "bg-pomo-muted/50 hover:bg-pomo-muted/60 hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]" 
                          : "bg-pomo-muted/30 hover:bg-pomo-muted/40 hover:shadow-md"
                      )}
                    >
                      <p className="font-medium text-[15px]">{session.name}</p>
                      <div className="flex items-center mt-1">
                        <Clock size={14} className="text-pomo-secondary mr-1" />
                        <p className="text-sm text-pomo-secondary">
                          {session.duration} - {session.time}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-pomo-secondary italic p-2">No sessions today.</p>
              )}
            </section>

            {/* Yesterday's Sessions */}
            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center">Yesterday</h2>
              {sessions.yesterday.length > 0 ? (
                <ul className="space-y-3">
                  {sessions.yesterday.map(session => (
                    <li 
                      key={session.id} 
                      className={cn(
                        "p-4 rounded-lg transition-all duration-300 hover:translate-y-[-2px]",
                        isDark 
                          ? "bg-pomo-muted/50 hover:bg-pomo-muted/60 hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]" 
                          : "bg-pomo-muted/30 hover:bg-pomo-muted/40 hover:shadow-md"
                      )}
                    >
                      <p className="font-medium text-[15px]">{session.name}</p>
                      <div className="flex items-center mt-1">
                        <Clock size={14} className="text-pomo-secondary mr-1" />
                        <p className="text-sm text-pomo-secondary">
                          {session.duration} - {session.time}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-pomo-secondary italic p-2">No sessions yesterday.</p>
              )}
            </section>

            {/* Previous 7 Days */}
            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center">Previous 7 Days</h2>
              {sessions.previous7Days.length > 0 ? (
                <ul className="space-y-3">
                  {sessions.previous7Days.map(session => (
                    <li 
                      key={session.id} 
                      className={cn(
                        "p-4 rounded-lg transition-all duration-300 hover:translate-y-[-2px]",
                        isDark 
                          ? "bg-pomo-muted/50 hover:bg-pomo-muted/60 hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]" 
                          : "bg-pomo-muted/30 hover:bg-pomo-muted/40 hover:shadow-md"
                      )}
                    >
                      <p className="font-medium text-[15px]">{session.name}</p>
                      <div className="flex items-center mt-1">
                        <Clock size={14} className="text-pomo-secondary mr-1" />
                        <p className="text-sm text-pomo-secondary">
                          {session.duration} - {session.date}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-pomo-secondary italic p-2">No sessions in the previous 7 days.</p>
              )}
            </section>

            {/* Previous 30 Days */}
            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center">Previous 30 Days</h2>
              {sessions.previous30Days.length > 0 ? (
                <ul className="space-y-3">
                  {sessions.previous30Days.map(session => (
                    <li 
                      key={session.id} 
                      className={cn(
                        "p-4 rounded-lg transition-all duration-300 hover:translate-y-[-2px]",
                        isDark 
                          ? "bg-pomo-muted/50 hover:bg-pomo-muted/60 hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]" 
                          : "bg-pomo-muted/30 hover:bg-pomo-muted/40 hover:shadow-md"
                      )}
                    >
                      <p className="font-medium text-[15px]">{session.name}</p>
                      <div className="flex items-center mt-1">
                        <Clock size={14} className="text-pomo-secondary mr-1" />
                        <p className="text-sm text-pomo-secondary">
                          {session.duration} - {session.date}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-pomo-secondary italic p-2">No sessions in the previous 30 days.</p>
              )}
            </section>

            {/* Past Months */}
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center">Past Months</h2>
              {sessions.pastMonths.length > 0 ? (
                <ul className="space-y-3">
                  {sessions.pastMonths.map(session => (
                    <li 
                      key={session.id} 
                      className={cn(
                        "p-4 rounded-lg transition-all duration-300 hover:translate-y-[-2px]",
                        isDark 
                          ? "bg-pomo-muted/50 hover:bg-pomo-muted/60 hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]" 
                          : "bg-pomo-muted/30 hover:bg-pomo-muted/40 hover:shadow-md"
                      )}
                    >
                      <p className="font-medium text-[15px]">{session.name}</p>
                      <div className="flex items-center mt-1">
                        <Clock size={14} className="text-pomo-secondary mr-1" />
                        <p className="text-sm text-pomo-secondary">
                          {session.duration} - {session.date}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-pomo-secondary italic p-2">No sessions in past months.</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionsPage;
