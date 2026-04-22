import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: any | null;
  loading: boolean;
  isAdmin: boolean;
  isAdminAuthenticated: boolean;
  verifyAdminPassword: (password: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null, 
  loading: true, 
  isAdmin: false,
  isAdminAuthenticated: false,
  verifyAdminPassword: () => false
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('admin_auth') === 'true';
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        setUser(fbUser);
        if (fbUser) {
          // Check admin status with password parsing
          // Format expected: email1=pass1,email2=pass2 OR just email1,email2
          const rawAdmins = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',');
          const adminIdentities = rawAdmins.map((entry: string) => entry.split('=')[0].trim().toLowerCase());
          
          const isEmailAdmin = fbUser.email && adminIdentities.includes(fbUser.email.toLowerCase());
          const isPhoneAdmin = fbUser.phoneNumber && adminIdentities.includes(fbUser.phoneNumber);
          
          setIsAdmin(!!(isEmailAdmin || isPhoneAdmin));

          // Sync with Supabase instead of Firestore
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('uid', fbUser.uid)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
            console.error("Supabase profile error:", error);
          }

          if (data) {
            setProfile(data);
          } else {
            // Create profile in Supabase if it doesn't exist
            const newProfile = {
              uid: fbUser.uid,
              email: fbUser.email,
              display_name: fbUser.displayName || 'Estudante Angolano',
              purchased_bundle_ids: [],
              favorite_ids: [],
              role: 'user'
            };
            
            const { data: created, error: createError } = await supabase
              .from('users')
              .insert([newProfile])
              .select()
              .single();

            if (createError) {
              console.error("Error creating Supabase profile:", createError);
            } else {
              setProfile(created);
            }
          }
        } else {
          setProfile(null);
        }
      } catch (error: any) {
        console.error("Auth context error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const verifyAdminPassword = (password: string): boolean => {
    const identity = user?.email?.toLowerCase() || user?.phoneNumber;
    if (!identity) return false;
    
    const rawAdmins = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',');
    const adminEntry = rawAdmins.find((entry: string) => 
      entry.split('=')[0].trim().toLowerCase() === identity
    );

    if (adminEntry) {
      const parts = adminEntry.split('=');
      // If there's no password set in env, we allow access if the email matches
      // but if a password is set (email=pass), we verify it
      if (parts.length > 1) {
        const correctPassword = parts[1].trim();
        if (password === correctPassword) {
          setIsAdminAuthenticated(true);
          sessionStorage.setItem('admin_auth', 'true');
          return true;
        }
      } else {
        // No password required for this admin if not specified in VITE_ADMIN_EMAILS
        setIsAdminAuthenticated(true);
        sessionStorage.setItem('admin_auth', 'true');
        return true;
      }
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, isAdminAuthenticated, verifyAdminPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
