
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Initialize Supabase client
const supabaseUrl = 'https://qxuxrwhmcwhjwbwrdrsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4dXhyd2htY3doandid3JkcnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1ODk5NDYsImV4cCI6MjA2NzE2NTk0Nn0.t8wPTu3uWHZGhaFNp5-I79ZEdjOwF_xunMGoy_E9e8o';
const supabase = createClient(supabaseUrl, supabaseKey);

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: UserData | null;
  supabase: SupabaseClient;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check for active session on mount
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await fetchUserData(session.user);
      }
      
      setLoading(false);
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await fetchUserData(session.user);
        } else {
          setUser(null);
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserData = async (authUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setUser({
          id: data.id,
          email: authUser.email || '',
          name: data.name,
          role: data.role
        });
        setIsAdmin(data.role === 'admin');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
      setIsAdmin(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast.success('Signed in successfully');
    } catch (error: any) {
      toast.error(error.message || 'Error signing in');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      
      // Create auth user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });

      if (authError) {
        throw authError;
      }

      // The profile will be created automatically by the database trigger
      toast.success('Account created successfully');
    } catch (error: any) {
      toast.error(error.message || 'Error creating account');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
    } catch (error: any) {
      toast.error(error.message || 'Error signing out');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    supabase,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}