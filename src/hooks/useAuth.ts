import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient, ensureUserExists, checkUserAccess } from '../services/supabaseClient';
import { toast } from 'react-hot-toast';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [initError, setInitError] = useState<string | null>(null);
  const supabase = getSupabaseClient();
  const [user, setUser] = useState<any>(null);

  // Helper function to set demo user
  const setDemoUser = () => {
    console.log('Setting demo user due to Supabase connection issues');
    const demoUser = {
      id: 'demo-user-id',
      email: 'demo@example.com',
      user_metadata: {
        name: 'Demo User'
      }
    };
    setCurrentUser(demoUser);
    setUser(demoUser);
    setIsInitialized(true);
  };

  // Public function to allow manual fallback to demo mode
  const fallbackToDemoMode = useCallback(() => {
    setInitError(null);
    setDemoUser();
  }, []);

  // Check if user is logged in - run only once during initialization
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('Checking session...');
        // Check if Supabase is enabled
        const supabaseEnabled = import.meta.env.VITE_SUPABASE_ENABLED === 'true';
        
        if (!supabaseEnabled) {
          console.log('Supabase is disabled, using demo user');
          setDemoUser();
          return;
        }
        
        // Wrap all Supabase calls in a try-catch to handle network errors
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Error getting session:', sessionError);
            // Check for various connection/network error types
            if (sessionError.message.includes('Failed to fetch') || 
                sessionError.message.includes('fetch') ||
                sessionError.message.includes('Network') ||
                sessionError.message.includes('network') ||
                sessionError.name === 'TypeError') {
              console.log('Connection failed, setting init error');
              setInitError('Unable to connect to the authentication service. This may be due to network issues or Supabase configuration problems. Please check your internet connection and verify your Supabase settings.');
              setIsInitialized(true);
              return;
            }
            setInitError('Failed to connect to authentication service');
            setIsInitialized(true);
            return;
          }
          
          if (session) {
            console.log('Session found, getting user...');
            try {
              const { data: { user }, error: userError } = await supabase.auth.getUser();
              
              if (userError) {
                console.error('Error getting user:', userError);
                // Check for various connection/network error types
                if (userError.message.includes('Failed to fetch') || 
                    userError.message.includes('fetch') ||
                    userError.message.includes('Network') || 
                    userError.message.includes('network') ||
                    userError.name === 'TypeError') {
                  console.log('User fetch failed, setting init error');
                  setInitError('Unable to connect to the authentication service. This may be due to network issues or Supabase configuration problems. Please check your internet connection and verify your Supabase settings.');
                  setIsInitialized(true);
                  return;
                }
                setInitError('Failed to get user information');
                setIsInitialized(true);
                return;
              }
              
              if (user) {
                console.log('User found:', user.email);
                try {
                  // Ensure the user exists in our pmc_users table
                  await ensureUserExists(user.id, user.email || '', user.user_metadata?.name);
                  
                  // Check user access BEFORE setting them as logged in
                  console.log('Checking user access before login...');
                  const accessResult = await checkUserAccess(user.id, user.email || '');
                  
                  if (!accessResult.hasAccess) {
                    console.log('User access denied during session check:', accessResult.message);
                    setInitError(accessResult.message);
                    setCurrentUser(null);
                    setUser(null);
                    setIsInitialized(true);
                    return; // Exit early, don't set user as logged in
                  }
                  
                  console.log('User access granted during session check');
                  // Only set user if access is granted
                  setCurrentUser(user);
                  setUser(user);
                } catch (error: any) {
                  console.error('Error ensuring user exists:', error);
                  // If user profile creation fails, still allow login but show warning
                  console.log('User profile setup failed, but allowing login');
                  setCurrentUser(user);
                  setUser(user);
                }
              }
            } catch (userFetchError: any) {
              console.error('Network error fetching user:', userFetchError);
              setInitError('Unable to connect to the authentication service. This may be due to network issues or Supabase configuration problems. Please check your internet connection and verify your Supabase settings.');
              setIsInitialized(true);
              return;
            }
          } else {
            console.log('No session found, user not logged in');
          }
        } catch (supabaseError: any) {
          console.error('Supabase connection error:', supabaseError);
          // Any error connecting to Supabase should show init error instead of falling back
          setInitError('Unable to connect to the authentication service. This may be due to network issues or Supabase configuration problems. Please check your internet connection and verify your Supabase settings.');
          setIsInitialized(true);
          return;
        }
      } catch (error: any) {
        console.error('Error in checkSession:', error);
        // Show init error on any unexpected errors
        setInitError('An unexpected error occurred while initializing the application. Please try again or continue in demo mode.');
        setIsInitialized(true);
        return;
      } finally {
        // Always set isInitialized to true, even if there was an error
        if (!isInitialized) {
          setIsInitialized(true);
        }
      }
    };
    
    // Start the session check
    checkSession();
    
    // Set up auth state change listener only if Supabase is enabled
    const supabaseEnabled = import.meta.env.VITE_SUPABASE_ENABLED === 'true';
    
    if (supabaseEnabled && !initError) {
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event);
            if (session) {
              try {
                // Set user immediately, check access asynchronously
                setCurrentUser(session.user);
                setUser(session.user);
                
                // Check access asynchronously without blocking auth state change
                checkUserAccess(session.user.id, session.user.email || '').then(accessResult => {
                  if (!accessResult.hasAccess) {
                    console.log('User access denied during auth state change:', accessResult.message);
                    // Show warning but don't sign out automatically during auth state changes
                    console.log('User will be blocked when trying to generate content');
                  }
                }).catch(accessError => {
                  console.error('Error checking user access during auth state change:', accessError);
                  // Don't block auth state change due to access check errors
                });
              } catch (error) {
                console.error('Error in auth state change handler:', error);
                // Don't crash the app due to auth state change errors
              }
            } else {
              setCurrentUser(null);
              setUser(null);
            }
          }
        );
        
        return () => {
          // Clean up subscription when component unmounts
          try {
            subscription.unsubscribe();
          } catch (error) {
            console.error('Error unsubscribing from auth changes:', error);
          }
        };
      } catch (authListenerError) {
        console.error('Error setting up auth listener:', authListenerError);
        // Continue without auth listener if it fails
      }
    }
  }, [isInitialized]);

  const handleLogin = useCallback(async (user: any) => {
    console.log('User logged in:', user.email);
    
    try {
      // Check access BEFORE setting user as logged in
      console.log('Checking user access before completing login...');
      
      try {
        const accessResult = await checkUserAccess(user.id, user.email || '');
        
        if (!accessResult.hasAccess) {
          console.log('User access denied during login:', accessResult.message);
          toast.error(accessResult.message);
          
          // Sign out the user from Supabase since they don't have access
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.error('Error signing out user with denied access:', signOutError);
          }
          
          setCurrentUser(null);
          setUser(null);
          return; // Exit early, don't complete the login
        }
        
        console.log('User access granted during login');
        // Only set user if access is granted
        setCurrentUser(user);
        setUser(user);
        console.log('User login completed successfully');
      } catch (accessError) {
        console.error('Error checking user access during login:', accessError);
        
        // If access check fails due to network issues, allow login but warn user
        if (accessError.message && accessError.message.includes('Failed to fetch')) {
          console.log('Access check failed due to network issues, allowing login');
          setCurrentUser(user);
          setUser(user);
          toast.error('Unable to verify access due to connection issues. Some features may not work properly.');
        } else {
          toast.error('Unable to verify access. Please try again.');
          setCurrentUser(null);
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error checking user access during login:', error);
      console.log('Outer catch in handleLogin, allowing login anyway');
      
      // If there's a complete failure, still allow login but warn
      setCurrentUser(user);
      setUser(user);
      toast.error('Unable to verify access due to technical issues. Some features may not work properly.');
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      console.log('Logging out...');
      const supabaseEnabled = import.meta.env.VITE_SUPABASE_ENABLED === 'true';
      
      if (supabaseEnabled) {
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          console.error('Error signing out from Supabase:', signOutError);
          // Continue with local logout even if Supabase signout fails
        }
      }
      
      setCurrentUser(null);
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      // Still clear local state even if logout fails
      setCurrentUser(null);
      setUser(null);
      toast.error('Logged out (with errors)');
    }
  }, []);

  return {
    currentUser,
    user,
    setCurrentUser,
    isInitialized,
    initError,
    handleLogin,
    handleLogout,
    fallbackToDemoMode
  };
}