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
          const isSuperAdmin = user.email === 'teamnexride@gmail.com';
          
          let adminDoc = null;
          try {
            const adminDocByUid = await getDoc(doc(db, 'admins', user.uid));
            const adminDocByEmail = await getDoc(doc(db, 'admins', user.email));
            adminDoc = adminDocByUid.exists() ? adminDocByUid : (adminDocByEmail.exists() ? adminDocByEmail : null);
          } catch (dbError) {
            console.error("Error fetching admin doc:", dbError);
            if (!isSuperAdmin) {
              throw dbError; // Rethrow to be caught by outer block if not super admin
            }
          }
          
          if (adminDoc || isSuperAdmin) {
            setCurrentUser(user);
            setIsAdmin(true);
            const role = isSuperAdmin ? 'super_admin' : (adminDoc ? adminDoc.data().role || 'admin' : 'admin');
            setAdminRole(role);
            setAuthError(null);
            setUnauthorizedUser(null);
            
            // If super admin doesn't have a document, optionally we could create one, 
            // but for now just letting them in is enough.
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
          setAuthError(`Admin check failed: ${error.message || "Ensure firestore rules are correct."}`);
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
