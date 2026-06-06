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

  const withTimeout = (promise, ms = 8000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout checking admin status. Ensure you have internet access and your database is online.")), ms))
    ]);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        // Check if user is in admins collection
        try {
          const isSuperAdmin = user.email === 'teamnexride@gmail.com';
          
          let adminDoc = null;
          try {
            // Add a timeout to prevent indefinite hangs (e.g. from App Check or offline)
            const adminDocByUidPromise = getDoc(doc(db, 'admins', user.uid));
            const adminDocByUid = await withTimeout(adminDocByUidPromise);
            
            let adminDocByEmail = { exists: () => false };
            if (user.email) {
              const adminDocByEmailPromise = getDoc(doc(db, 'admins', user.email));
              adminDocByEmail = await withTimeout(adminDocByEmailPromise);
            }
            
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
      {loading ? (
        <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6', color: '#6b7280', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <h2>Loading Admin...</h2>
          </div>
        </div>
      ) : children}
    </AdminAuthContext.Provider>
  );
}
