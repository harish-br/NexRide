import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AdminAuthContext = createContext();

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

export function AdminAuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        // Check if user is in admins collection
        try {
          const adminDocRef = doc(db, 'admins', user.uid);
          const adminDoc = await getDoc(adminDocRef);
          
          if (adminDoc.exists()) {
            setCurrentUser(user);
            setIsAdmin(true);
            setAuthError(null);
          } else {
            // User is logged in but not an admin. Sign them out for security.
            console.warn("User is not an admin, signing out...");
            await signOut(auth);
            setCurrentUser(null);
            setIsAdmin(false);
            setAuthError("You do not have administrative privileges. Please ensure your exact UID is in the 'admins' collection.");
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          await signOut(auth);
          setCurrentUser(null);
          setIsAdmin(false);
          setAuthError("Permission denied checking admin status. Ensure firestore rules are correct.");
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    currentUser,
    isAdmin,
    loading,
    authError,
    login,
    logout
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {!loading && children}
    </AdminAuthContext.Provider>
  );
}
