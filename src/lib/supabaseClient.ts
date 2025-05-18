import { createClient } from '@supabase/supabase-js';
import { Session as SupabaseSession } from '@supabase/supabase-js';

// Use import.meta.env to access Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing Supabase environment variables. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env file."
  );
}

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface DbSession {
  id: string;
  user_id: string;
  session_date: string;
  focus_duration: number;
  session_name?: string;
  is_completed: boolean;
  created_at: string;
}

export interface DbTask {
  id: string;
  session_id: string;
  title: string;
  is_completed: boolean;
  sort_order: number;
  estimated_minutes?: number;
  created_at: string;
}

// Helper function to save a session to Supabase
export const saveSessionToSupabase = async (
  session: {
    session_name?: string;
    focus_duration: number;
    is_completed?: boolean;
  },
  tasks?: { 
    title: string; 
    is_completed: boolean; 
    sort_order: number;
    estimated_minutes?: number;
  }[]
) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.log('No user logged in, not saving session');
      return null;
    }

    // Insert the session
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        session_name: session.session_name,
        focus_duration: session.focus_duration,
        is_completed: session.is_completed ?? true,
        session_date: new Date().toISOString()
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error saving session:', sessionError);
      return null;
    }

    // If we have tasks, save them too
    if (tasks && tasks.length > 0 && sessionData) {
      const taskInserts = tasks.map(task => ({
        session_id: sessionData.id,
        title: task.title,
        is_completed: task.is_completed,
        sort_order: task.sort_order,
        estimated_minutes: task.estimated_minutes
      }));

      const { error: tasksError } = await supabase
        .from('tasks')
        .insert(taskInserts);

      if (tasksError) {
        console.error('Error saving tasks:', tasksError);
      }
    }

    return sessionData;
  } catch (error) {
    console.error('Unexpected error saving session:', error);
    return null;
  }
};

// Helper to get the current user
export const getCurrentUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Helper to get user sessions
export const getUserSessions = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        tasks(*)
      `)
      .eq('user_id', user.id)
      .order('session_date', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching sessions:', error);
    return [];
  }
};

// Helper to delete a session from Supabase
export const deleteSessionFromSupabase = async (sessionId: string) => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    // Delete the session
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error deleting session:', error);
    return false;
  }
};

// Helper to delete all sessions for a user
export const clearUserSessionsFromSupabase = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    // Delete all sessions for this user
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Error clearing sessions:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error clearing sessions:', error);
    return false;
  }
};