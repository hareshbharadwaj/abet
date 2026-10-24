import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { auth, firestore } from '../config/firebase';
import { userStorage } from '../utils/localStorage';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  ConfirmationResult
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUpWithEmail: (email: string, password: string, name: string, role: UserRole) => Promise<User>;
  signInWithEmail: (email: string, password: string) => Promise<User>;
  signInWithGoogle: (role: UserRole) => Promise<User>;
  signInWithPhone: (phoneNumber: string) => Promise<void>;
  verifyOTP: (otp: string, name: string, role: UserRole) => Promise<User>;
  setupRecaptcha: (elementId: string) => void;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const normalizeCreatedAt = (value: unknown): string => {
  if (!value) {
    return new Date().toISOString();
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? new Date().toISOString() : value.toISOString();
  }

  if (typeof value === 'object' && value !== null) {
    const timestampLike = value as { seconds?: number; nanoseconds?: number; toDate?: () => Date };
    if (typeof timestampLike.toDate === 'function') {
      const date = timestampLike.toDate();
      return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    }
    if (typeof timestampLike.seconds === 'number') {
      const date = new Date((timestampLike.seconds || 0) * 1000 + Math.floor((timestampLike.nanoseconds || 0) / 1000000));
      return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    }
  }

  return new Date().toISOString();
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            userData.createdAt = normalizeCreatedAt(userData.createdAt);
            setUser(userData);
          } else {
            // Fallback to localStorage
            const localUsers = userStorage.getUsers();
            const localUser = localUsers.find(u => u.uid === firebaseUser.uid);
            if (localUser) {
              setUser(localUser);
            } else {
              setUser(null);
            }
          }
        } catch (error) {
          console.warn("Firestore fetching user data failed, trying localStorage:", error);
          const localUsers = userStorage.getUsers();
          const localUser = localUsers.find(u => u.uid === firebaseUser.uid);
          if (localUser) {
            setUser(localUser);
            userStorage.setCurrentUser(localUser);
          } else {
            setUser(null);
            userStorage.clearCurrentUser();
          }
        }
      } else {
        const isMockSuperAdmin = sessionStorage.getItem('mockSuperAdmin') === 'true' || localStorage.getItem('mockSuperAdmin') === 'true';
        if (isMockSuperAdmin) {
          const superAdminUser: User = {
            uid: "superadmin-hardcoded",
            email: "admin123@gmail.com",
            name: "Super Administrator",
            role: "superadmin",
            status: "active",
            createdAt: new Date().toISOString(),
          };
          setUser(superAdminUser);
          userStorage.setCurrentUser(superAdminUser);
        } else {
          const storedUser = userStorage.getCurrentUser();
          if (storedUser) {
            setUser(storedUser);
          } else {
            setUser(null);
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createUserDocument = async (uid: string, data: Partial<User>): Promise<User> => {
    const newUser: User = {
      uid,
      email: data.email || '',
      name: data.name || 'User',
      role: data.role || 'buyer',
      status: data.role === 'seller' ? 'pending' : 'active',
      createdAt: new Date().toISOString(),
      phone: data.phone || '',
      photoURL: data.photoURL || '',
    };

    try {
      await setDoc(doc(firestore, 'users', uid), newUser);
    } catch (error) {
      console.warn("Firestore createUserDocument failed, using localStorage fallback:", error);
    }

    // Always persist to localStorage as fallback
    const localUsers = userStorage.getUsers();
    const updatedUsers = [...localUsers.filter(u => u.uid !== uid), newUser];
    userStorage.setUsers(updatedUsers);

    setUser(newUser);
    return newUser;
  };

  const signUpWithEmail = async (email: string, password: string, name: string, role: UserRole = 'buyer'): Promise<User> => {
    if (email.toLowerCase() === "admin123@gmail.com") {
      throw new Error("Cannot register as Admin");
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return await createUserDocument(userCredential.user.uid, { email, name, role });
  };

  const signInWithEmail = async (email: string, password: string): Promise<User> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Check for hardcoded Superadmin credentials
    if (cleanEmail === "admin123@gmail.com" && cleanPassword === "123456") {
      const superAdminUser: User = {
        uid: "superadmin-hardcoded",
        email: "admin123@gmail.com",
        name: "Super Administrator",
        role: "superadmin",
        status: "active",
        createdAt: new Date().toISOString(),
      };
      sessionStorage.setItem('mockSuperAdmin', 'true');
      localStorage.setItem('mockSuperAdmin', 'true');
      userStorage.setCurrentUser(superAdminUser);
      
      // Sync mock admin in localStorage too
      const localUsers = userStorage.getUsers();
      if (!localUsers.some(u => u.email.toLowerCase() === cleanEmail)) {
        userStorage.setUsers([...localUsers, superAdminUser]);
      }
      
      setUser(superAdminUser);
      return superAdminUser;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      try {
        const userDoc = await getDoc(doc(firestore, 'users', userCredential.user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          userData.createdAt = normalizeCreatedAt(userData.createdAt);
          setUser(userData);
          userStorage.setCurrentUser(userData);
          return userData;
        }
      } catch (err) {
        console.warn("Firestore fetch during signIn failed, trying localStorage:", err);
      }
      
      // Check localStorage if Firestore read failed
      const localUser = userStorage.getUsers().find(u => u.email.toLowerCase() === cleanEmail);
      if (localUser) {
        setUser(localUser);
        userStorage.setCurrentUser(localUser);
        return localUser;
      }
      throw new Error("User data not found in database.");
    } catch (error: any) {
      console.warn("Firebase Auth signIn failed, checking localStorage fallback:", error.message);
      const localUser = userStorage.getUsers().find(u => u.email.toLowerCase() === cleanEmail);
      if (localUser) {
        setUser(localUser);
        userStorage.setCurrentUser(localUser);
        return localUser;
      }
      throw error;
    }
  };

  const signInWithGoogle = async (role: UserRole = 'buyer'): Promise<User> => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    
    // Check if user already exists
    const userDoc = await getDoc(doc(firestore, 'users', userCredential.user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      userData.createdAt = normalizeCreatedAt(userData.createdAt);
      setUser(userData);
      return userData;
    } else {
      // Create new user
      return await createUserDocument(userCredential.user.uid, { 
        email: userCredential.user.email || '', 
        name: userCredential.user.displayName || 'Google User', 
        photoURL: userCredential.user.photoURL || '',
        role 
      });
    }
  };

  const setupRecaptcha = (elementId: string): void => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        }
      });
    }
  };

  const signInWithPhone = async (phoneNumber: string): Promise<void> => {
    const appVerifier = (window as any).recaptchaVerifier;
    if (!appVerifier) {
        throw new Error("Recaptcha not initialized");
    }
    const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    setConfirmationResult(result);
  };

  const verifyOTP = async (otp: string, name: string, role: UserRole = 'buyer'): Promise<User> => {
    if (!confirmationResult) {
      throw new Error('No pending phone verification');
    }

    const userCredential = await confirmationResult.confirm(otp);
    
    // Check if user exists
    const userDoc = await getDoc(doc(firestore, 'users', userCredential.user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      userData.createdAt = normalizeCreatedAt(userData.createdAt);
      setUser(userData);
      return userData;
    } else {
      // Create new user document
      return await createUserDocument(userCredential.user.uid, {
        phone: userCredential.user.phoneNumber || '',
        name: name,
        role: role
      });
    }
  };

  const signOut = async (): Promise<void> => {
    sessionStorage.removeItem('mockAdmin');
    sessionStorage.removeItem('mockSuperAdmin');
    localStorage.removeItem('mockSuperAdmin');
    userStorage.clearCurrentUser();
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn("Firebase signOut failed, clearing local state anyway:", e);
    }
    setUser(null);
  };

  const resetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  };

  const value: AuthContextType = {
    user,
    loading,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signInWithPhone,
    verifyOTP,
    setupRecaptcha,
    resetPassword,
    signOut,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
