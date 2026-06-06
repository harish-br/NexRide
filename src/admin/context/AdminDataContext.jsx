import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../../firebase';

const AdminDataContext = createContext();

export function useAdminData() {
  return useContext(AdminDataContext);
}

export function AdminDataProvider({ children }) {
  const [schedules, setSchedules] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [busRequests, setBusRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSchedules = () => {};
    let unsubscribeLogs = () => {};
    let unsubscribeRequests = () => {};

    try {
      // Listen to bus_schedules
      unsubscribeSchedules = onSnapshot(collection(db, 'bus_schedules'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSchedules(data);
        setLoading(false);
      }, (error) => {
        console.error("Error listening to bus_schedules:", error);
        setLoading(false);
      });

      // Listen to audit_logs
      const logsQuery = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(50));
      unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAuditLogs(data);
      }, (error) => {
        console.error("Error listening to audit_logs:", error);
      });

      // Listen to pending bus requests
      const requestsQuery = query(collection(db, 'bus_requests'), where('status', '==', 'pending'));
      unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBusRequests(data);
      }, (error) => {
        console.error("Error listening to bus_requests:", error);
      });
    } catch (error) {
      console.error("Failed to subscribe to data:", error);
      setLoading(false);
    }

    return () => {
      unsubscribeSchedules();
      unsubscribeLogs();
      unsubscribeRequests();
    };
  }, []);

  return (
    <AdminDataContext.Provider value={{ schedules, auditLogs, busRequests, loading }}>
      {children}
    </AdminDataContext.Provider>
  );
}
