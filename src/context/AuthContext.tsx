import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        setUser(fbUser);
        if (fbUser) {
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

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
