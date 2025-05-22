import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { cn, optimizeMobilePerformance } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { DbSession, getUserSessions } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { format, isToday, isYesterday, differenceInDays, parseISO } from 'date-fns';

const SessionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [sessionsHistory, setSessionsHistory] = useState<DbSession[]>([]);
  const [groupedSessions, setGroupedSessions] = useState<{
    today: DbSession[];
    yesterday: DbSession[];
    previous7Days: DbSession[];
    previous30Days: DbSession[];
    pastMonths: DbSession[];
  }>({
    today: [],
    yesterday: [],
    previous7Days: [],
    previous30Days: [],
    pastMonths: [],
  });

  // Apply mobile optimizations when component mounts
  useEffect(() => {
    optimizeMobilePerformance();
  }, []);

  // Fetch sessions from Supabase
  useEffect(() => {
    const fetchSessions = async () => {
      if (user) {
        const fetchedSessions = await getUserSessions();
        setSessionsHistory(fetchedSessions);
      } else {
        setSessionsHistory([]); // Clear sessions if user logs out
      }
    };

    fetchSessions();
  }, [user]);

  // Group sessions by date
  useEffect(() => {
    const today: DbSession[] = [];
    const yesterday: DbSession[] = [];
    const previous7Days: DbSession[] = [];
    const previous30Days: DbSession[] = [];
    const pastMonths: DbSession[] = [];

    sessionsHistory.forEach(session => {
      const sessionDate = parseISO(session.session_date);
      if (isToday(sessionDate)) {
        today.push(session);
      } else if (isYesterday(sessionDate)) {
        yesterday.push(session);
      } else if (differenceInDays(new Date(), sessionDate) <= 7) {
        previous7Days.push(session);
      } else if (differenceInDays(new Date(), sessionDate) <= 30) {
        previous30Days.push(session);
      } else {
        pastMonths.push(session);
      }
    });

    setGroupedSessions({ today, yesterday, previous7Days, previous30Days, pastMonths });
  }, [sessionsHistory]);
  
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
              {groupedSessions.today.length > 0 ? (
                <ul className="space-y-3">
                  {groupedSessions.today.map(session => (
                    <li 
                      key={session.id} 
                      className={cn(
                        "p-4 rounded-lg transition-all duration-300 hover:translate-y-[-2px]",
                        isDark 
                          ? "bg-pomo-muted/50 hover:bg-pomo-muted/60 hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]" 
                          : "bg-pomo-muted/30 hover:bg-pomo-muted/40 hover:shadow-md"
                      )}
                    >
                      <p className="font-medium text-[15px]">{session.session_name || 'Unnamed Session'}</p>
                      <div className="flex items-center mt-1">
                        <Clock size={14} className="text-pomo-secondary mr-1" />
                        <span className="text-xs text-pomo-secondary">
                          {session.focus_duration} mins
                          {' - '}
                          {format(parseISO(session.session_date), 'p')}
                        </span>
                      </div>
                      <div className="flex items-center mt-1">
                        <Calendar size={14} className="text-pomo-secondary mr-1" />
                        <span className="text-xs text-pomo-secondary">
                          {format(parseISO(session.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-pomo-secondary italic p-2">No sessions today.</p>
              )}
            </section>

            {/* Yesterday's Sessions */}
            {groupedSessions.yesterday.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center">Yesterday</h2>
              {groupedSessions.yesterday.length > 0 ? (
                <ul className="space-y-3">
                  {groupedSessions.yesterday.map(session => (
                    <li 
                      key={session.id} 
                      className={cn(
                        "p-4 rounded-lg transition-all duration-300 hover:translate-y-[-2px]",
                        isDark 
                          ? "bg-pomo-muted/50 hover:bg-pomo-muted/60 hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]" 
                          : "bg-pomo-muted/30 hover:bg-pomo-muted/40 hover:shadow-md"
                      )}
                    >
                      <p className="font-medium text-[15px]">{session.session_name || 'Unnamed Session'}</p>
                      <div className="flex items-center mt-1">
                        <Clock size={14} className="text-pomo-secondary mr-1" />
                        <span className="text-xs text-pomo-secondary">
                          {session.focus_duration} mins
                          {' - '}
                          {format(parseISO(session.session_date), 'p')}
                        </span>
                      </div>
                      <div className="flex items-center mt-1">
                        <Calendar size={14} className="text-pomo-secondary mr-1" />
                        <span className="text-xs text-pomo-secondary">
                          {format(parseISO(session.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-pomo-secondary italic p-2">No sessions yesterday.</p>
              )}
            </section>
            )}

            {/* Previous 7 Days */}
            {groupedSessions.previous7Days.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center">Previous 7 Days</h2>
              {groupedSessions.previous7Days.length > 0 ? (
                <ul className="space-y-3">
                  {groupedSessions.previous7Days.map(session => (
                    <li 
                      key={session.id} 
                      className={cn(
                        "p-4 rounded-lg transition-all duration-300 hover:translate-y-[-2px]",
                        isDark 
                          ? "bg-pomo-muted/50 hover:bg-pomo-muted/60 hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]" 
                          : "bg-pomo-muted/30 hover:bg-pomo-muted/40 hover:shadow-md"
                      )}
                    >
                      <p className="font-medium text-[15px]">{session.session_name || 'Unnamed Session'}</p>
                      <div className="flex items-center mt-1">
                        <Clock size={14} className="text-pomo-secondary mr-1" />
                        <span className="text-xs text-pomo-secondary">
                          {session.focus_duration} mins
                          {' - '}
                          {format(parseISO(session.session_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center mt-1">
                        <Calendar size={14} className="text-pomo-secondary mr-1" />
                        <span className="text-xs text-pomo-secondary">
                          {format(parseISO(session.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-pomo-secondary italic p-2">No sessions in the previous 7 days.</p>
              )}
            </section>
            )}

            {/* Previous 30 Days */}
            {groupedSessions.previous30Days.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center">Previous 30 Days</h2>
              {groupedSessions.previous30Days.length > 0 ? (
                <ul className="space-y-3">
                  {groupedSessions.previous30Days.map(session => (
                    <li 
                      key={session.id} 
                      className={cn(
                        "p-4 rounded-lg transition-all duration-300 hover:translate-y-[-2px]",
                        isDark 
                          ? "bg-pomo-muted/50 hover:bg-pomo-muted/60 hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]" 
                          : "bg-pomo-muted/30 hover:bg-pomo-muted/40 hover:shadow-md"
                      )}
                    >
                      <p className="font-medium text-[15px]">{session.session_name || 'Unnamed Session'}</p>
                      <div className="flex items-center mt-1">
                        <Clock size={14} className="text-pomo-secondary mr-1" />
                        <span className="text-xs text-pomo-secondary">
                          {session.focus_duration} mins
                          {' - '}
                          {format(parseISO(session.session_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center mt-1">
                        <Calendar size={14} className="text-pomo-secondary mr-1" />
                        <span className="text-xs text-pomo-secondary">
                          {format(parseISO(session.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-pomo-secondary italic p-2">No sessions in the previous 30 days.</p>
              )}
            </section>
            )}

            {/* Past Months */}
            {groupedSessions.pastMonths.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center">Past Months</h2>
              {groupedSessions.pastMonths.length > 0 ? (
                <ul className="space-y-3">
                  {groupedSessions.pastMonths.map(session => (
                    <li 
                      key={session.id} 
                      className={cn(
                        "p-4 rounded-lg transition-all duration-300 hover:translate-y-[-2px]",
                        isDark 
                          ? "bg-pomo-muted/50 hover:bg-pomo-muted/60 hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]" 
                          : "bg-pomo-muted/30 hover:bg-pomo-muted/40 hover:shadow-md"
                      )}
                    >
                      <p className="font-medium text-[15px]">{session.session_name || 'Unnamed Session'}</p>
                      <div className="flex items-center mt-1">
                        <Clock size={14} className="text-pomo-secondary mr-1" />
                        <span className="text-xs text-pomo-secondary">
                          {session.focus_duration} mins
                          {' - '}
                          {format(parseISO(session.session_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center mt-1">
                        <Calendar size={14} className="text-pomo-secondary mr-1" />
                        <span className="text-xs text-pomo-secondary">
                          {format(parseISO(session.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-pomo-secondary italic p-2">No sessions in past months.</p>
              )}
            </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionsPage;
