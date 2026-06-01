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
  const [unauthorizedUser, setUnauthorizedUser] = useState(null);
  const [adminRole, setAdminRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        // Check if user is in admins collection
        try {
          const adminDocByUid = await getDoc(doc(db, 'admins', user.uid));
          const adminDocByEmail = await getDoc(doc(db, 'admins', user.email));
          
          const adminDoc = adminDocByUid.exists() ? adminDocByUid : (adminDocByEmail.exists() ? adminDocByEmail : null);
          
          if (adminDoc) {
            setCurrentUser(user);
            setIsAdmin(true);
            const role = user.email === 'teamnexride@gmail.com' ? 'super_admin' : (adminDoc.data().role || 'admin');
            setAdminRole(role);
            setAuthError(null);
            setUnauthorizedUser(null);
          } else {
            // User is logged in but not an admin. We keep them logged in so they can request access.
            console.warn("User is not an admin, retaining auth state for join request.");
            setCurrentUser(user);
            setIsAdmin(false);
            setUnauthorizedUser({ uid: user.uid, email: user.email });
            setAuthError("You do not have administrative privileges.");
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
        setAdminRole(null);
        setUnauthorizedUser(null);
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
    adminRole,
    loading,
    authError,
    unauthorizedUser,
    login,
    logout
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {!loading && children}
    </AdminAuthContext.Provider>
  );
}
