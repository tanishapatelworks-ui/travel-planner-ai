import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile as updateFirebaseProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import type { User } from "firebase/auth";
import type { Profile } from "@/types";

interface AuthContextValue {
  session: User | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (firebaseUser: User) => {
    const profileRef = doc(db, "users", firebaseUser.uid);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      setProfile(profileSnap.data() as Profile);
    } else {
      const newProfile = {
        id: firebaseUser.uid,
        full_name: firebaseUser.displayName || "",
        avatar_url: firebaseUser.photoURL || null,
        email: firebaseUser.email || "",
        created_at: new Date().toISOString(),
      };

      await setDoc(profileRef, newProfile);
      setProfile(newProfile as Profile);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setUser(firebaseUser);

        if (firebaseUser) {
          await loadProfile(firebaseUser);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    fullName: string
  ) => {
    const result = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    await updateFirebaseProfile(result.user, {
      displayName: fullName,
    });

    const newProfile = {
      id: result.user.uid,
      full_name: fullName,
      avatar_url: null,
      email,
      created_at: new Date().toISOString(),
    };

    await setDoc(doc(db, "users", result.user.uid), newProfile);

    setUser(result.user);
    setProfile(newProfile as Profile);
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    await loadProfile(result.user);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (!user) return;
    await loadProfile(user);
  };

  return (
    <AuthContext.Provider
      value={{
        session: user,
        user,
        profile,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        resetPassword,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return ctx;
}