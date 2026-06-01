import { db, auth } from '../../firebase';
import { app } from '../../firebase';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { 
  collection, doc, getDocs, getDoc, setDoc, updateDoc, 
  deleteDoc, serverTimestamp, addDoc, writeBatch
} from 'firebase/firestore';

const normalize = (str) => str ? str.toLowerCase().trim() : "";

const logAudit = async (action, details) => {
  try {
    const user = auth.currentUser;
    if (!user) return;
    await addDoc(collection(db, 'audit_logs'), {
      adminEmail: user.email,
      adminUid: user.uid,
      action,
      details,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Failed to log audit:", error);
  }
};

export const adminService = {
  // === RAW DATA FETCH ===
  async getAllSchedules() {
    const snapshot = await getDocs(collection(db, 'bus_schedules'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // === PLACES (DERIVED) ===
  async getPlaces() {
    const schedules = await this.getAllSchedules();
    const placeNames = new Set();
    
    schedules.forEach(schedule => {
      if (schedule.source) placeNames.add(schedule.source.trim());
      if (schedule.destination) placeNames.add(schedule.destination.trim());
    });

    return Array.from(placeNames).map(name => ({
      id: normalize(name),
      name,
      status: 'active'
    })).sort((a, b) => a.name.localeCompare(b.name));
  },

  async updatePlace(oldName, newName) {
    if (!oldName || !newName || oldName === newName) return;
    const schedules = await this.getAllSchedules();
    const batch = writeBatch(db);
    let count = 0;
    
    schedules.forEach(schedule => {
      let needsUpdate = false;
      const updateData = {};
      
      if (schedule.source === oldName) {
        updateData.source = newName;
        needsUpdate = true;
      }
      if (schedule.destination === oldName) {
        updateData.destination = newName;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        updateData.search_tags = [normalize(updateData.source || schedule.source), normalize(updateData.destination || schedule.destination)];
        const docRef = doc(db, 'bus_schedules', schedule.id);
        batch.update(docRef, updateData);
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      await logAudit('UPDATE_PLACE', `Renamed place from ${oldName} to ${newName} across ${count} routes`);
    }
  },

  // === ROUTES (MAPPED FROM BUS_SCHEDULES) ===
  async getRoutes() {
    const schedules = await this.getAllSchedules();
    return schedules.map(schedule => ({
      id: schedule.id,
      routeNumber: schedule.routeNumber || '',
      place: schedule.source || 'Unknown',
      source: schedule.source || '',
      destination: schedule.destination || '',
      status: schedule.status || 'active',
      distance: schedule.distance || '',
      via: schedule.via || '',
      operatorName: schedule.operatorName || '',
      serviceType: schedule.serviceType || '',
      departure_times: schedule.departure_times || []
    }));
  },

  async addRoute(data) {
    const docId = `${normalize(data.source)}_${normalize(data.destination)}`;
    const scheduleData = {
      source: data.source,
      destination: data.destination,
      status: data.status || 'active',
      routeNumber: data.routeNumber || '',
      distance: data.distance || '',
      departure_times: [], // Empty to start
      search_tags: [normalize(data.source), normalize(data.destination)]
    };

    await setDoc(doc(db, 'bus_schedules', docId), scheduleData);
    await logAudit('ADD_ROUTE', `Added route: ${data.source} to ${data.destination}`);
    return { id: docId, ...scheduleData };
  },

  async updateRoute(id, data) {
    // Note: Since ID is derived from source/dest, if they change source/dest we should technically delete and recreate.
    // For simplicity, we just update the existing doc (which might have an outdated ID but it still works).
    const updateData = {
      source: data.source,
      destination: data.destination,
      status: data.status,
      routeNumber: data.routeNumber,
      distance: data.distance,
      search_tags: [normalize(data.source), normalize(data.destination)]
    };
    await updateDoc(doc(db, 'bus_schedules', id), updateData);
    await logAudit('UPDATE_ROUTE', `Updated route: ${id}`);
  },

  async deleteRoute(id) {
    await deleteDoc(doc(db, 'bus_schedules', id));
    await logAudit('DELETE_ROUTE', `Deleted route: ${id}`);
  },

  // === BUSES & TIMINGS (FLATTENED FROM DEPARTURE_TIMES ARRAY & BUS_DETAILS MAP) ===
  async getBuses() {
    const schedules = await this.getAllSchedules();
    const buses = [];

    schedules.forEach(schedule => {
      const times = schedule.departure_times || [];
      const busDetailsMap = schedule.bus_details || {};
      
      times.forEach(time => {
        const details = busDetailsMap[time] || {};
        buses.push({
          id: `${schedule.id}_${time}`, // synthetic ID
          routeId: schedule.id,
          source: schedule.source,
          destination: schedule.destination,
          departureTime: time,
          busNumber: details.busNumber || '',
          busType: details.busType || schedule.serviceType || 'Standard',
          operatorName: details.operatorName || schedule.operatorName || 'TNSTC',
          via: details.via || schedule.via || (schedule.route_stops ? schedule.route_stops.join(', ') : ''),
          arrivalTime: details.arrivalTime || '',
          operatingDays: details.operatingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          status: details.status || schedule.status || 'active'
        });
      });
    });

    return buses;
  },

  async addBus(data) {
    const scheduleRef = doc(db, 'bus_schedules', data.routeId);
    const scheduleSnap = await getDoc(scheduleRef);
    
    if (scheduleSnap.exists()) {
      const scheduleData = scheduleSnap.data();
      let times = scheduleData.departure_times || [];
      if (!times.includes(data.departureTime)) {
        times.push(data.departureTime);
        times.sort(); // Keep sorted
      }
      
      const busDetails = scheduleData.bus_details || {};
      busDetails[data.departureTime] = {
        busNumber: data.busNumber || '',
        busType: data.busType || '',
        operatorName: data.operatorName || '',
        via: data.via || '',
        arrivalTime: data.arrivalTime || '',
        operatingDays: data.operatingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        status: data.status || 'active'
      };
      
      await updateDoc(scheduleRef, {
        departure_times: times,
        bus_details: busDetails,
        serviceType: data.busType || scheduleData.serviceType || '',
        operatorName: data.operatorName || scheduleData.operatorName || '',
        via: data.via || scheduleData.via || ''
      });
      await logAudit('ADD_TIMING', `Added ${data.departureTime} to route ${data.routeId}`);
    } else {
      throw new Error("Route does not exist.");
    }
  },

  async updateBus(syntheticId, data, oldDepartureTime) {
    const scheduleRef = doc(db, 'bus_schedules', data.routeId);
    const scheduleSnap = await getDoc(scheduleRef);

    if (scheduleSnap.exists()) {
      const scheduleData = scheduleSnap.data();
      let times = scheduleData.departure_times || [];
      const busDetails = scheduleData.bus_details || {};
      
      // Remove old time
      times = times.filter(t => t !== oldDepartureTime);
      delete busDetails[oldDepartureTime];
      
      // Add new time
      if (!times.includes(data.departureTime)) {
        times.push(data.departureTime);
        times.sort();
      }

      busDetails[data.departureTime] = {
        busNumber: data.busNumber || '',
        busType: data.busType || '',
        operatorName: data.operatorName || '',
        via: data.via || '',
        arrivalTime: data.arrivalTime || '',
        operatingDays: data.operatingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        status: data.status || 'active'
      };

      await updateDoc(scheduleRef, {
        departure_times: times,
        bus_details: busDetails,
        serviceType: data.busType || scheduleData.serviceType || '',
        operatorName: data.operatorName || scheduleData.operatorName || '',
        via: data.via || scheduleData.via || ''
      });
      await logAudit('UPDATE_TIMING', `Updated timing on ${data.routeId} to ${data.departureTime}`);
    }
  },

  async deleteBus(routeId, departureTime) {
    const scheduleRef = doc(db, 'bus_schedules', routeId);
    const scheduleSnap = await getDoc(scheduleRef);

    if (scheduleSnap.exists()) {
      const scheduleData = scheduleSnap.data();
      let times = scheduleData.departure_times || [];
      const busDetails = scheduleData.bus_details || {};
      
      times = times.filter(t => t !== departureTime);
      delete busDetails[departureTime];

      await updateDoc(scheduleRef, { 
        departure_times: times,
        bus_details: busDetails
      });
      await logAudit('DELETE_TIMING', `Removed ${departureTime} from route ${routeId}`);
    }
  },

  // === AUDIT LOGS ===
  async getAuditLogs(limitCount = 50) {
    const snapshot = await getDocs(collection(db, 'audit_logs'));
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return logs.sort((a, b) => {
      const timeA = a.timestamp?.toMillis() || 0;
      const timeB = b.timestamp?.toMillis() || 0;
      return timeB - timeA;
    }).slice(0, limitCount);
  },

  // === STATS ===
  async getDashboardStats() {
    const schedules = await this.getAllSchedules();
    const placeNames = new Set();
    let totalTimings = 0;

    schedules.forEach(schedule => {
      if (schedule.source) placeNames.add(schedule.source.trim());
      if (schedule.destination) placeNames.add(schedule.destination.trim());
      totalTimings += (schedule.departure_times || []).length;
    });

    return {
      totalPlaces: placeNames.size,
      totalRoutes: schedules.length,
      totalBuses: totalTimings,
      lastUpdated: new Date().toISOString()
    };
  },

  // === BUS REQUESTS & APPROVALS ===
  async submitBusRequest(data) {
    const user = auth.currentUser;
    const requestData = {
      ...data,
      status: 'pending',
      submittedBy: user?.email || 'Unknown',
      timestamp: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'bus_requests'), requestData);
    await logAudit('SUBMIT_BUS_REQUEST', `Submitted new bus timing for ${data.source} to ${data.destination}`);
    return docRef.id;
  },

  async approveBusRequest(requestId) {
    const requestRef = doc(db, 'bus_requests', requestId);
    const snap = await getDoc(requestRef);
    if (!snap.exists()) throw new Error("Request not found");
    const data = snap.data();
    
    // Check if route exists, if not create it
    const docId = `${normalize(data.source)}_${normalize(data.destination)}`;
    const routeSnap = await getDoc(doc(db, 'bus_schedules', docId));
    
    if (!routeSnap.exists()) {
      await this.addRoute({
        source: data.source,
        destination: data.destination,
        status: 'active'
      });
    }

    // Add the bus
    await this.addBus({
      routeId: docId,
      source: data.source,
      destination: data.destination,
      departureTime: data.departureTime,
      arrivalTime: data.arrivalTime || '',
      busNumber: data.busName || '',
      busType: data.busType || 'Standard',
      operatorName: data.operatorName || 'TNSTC',
      via: data.via || '',
      status: 'active'
    });

    // Update request status
    await updateDoc(requestRef, { status: 'approved' });
    await logAudit('APPROVE_BUS_REQUEST', `Approved bus timing for ${data.source} to ${data.destination}`);
  },

  async rejectBusRequest(requestId) {
    await updateDoc(doc(db, 'bus_requests', requestId), { status: 'rejected' });
    await logAudit('REJECT_BUS_REQUEST', `Rejected bus request ${requestId}`);
  },

  // === TEAM MEMBERS ===
  async getAdmins() {
    const snapshot = await getDocs(collection(db, 'admins'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getAdminRequests() {
    const snapshot = await getDocs(collection(db, 'admin_join_requests'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async requestAdminAccess(uid, email) {
    await setDoc(doc(db, 'admin_join_requests', uid), {
      email,
      uid,
      status: 'pending',
      timestamp: serverTimestamp()
    });
    await logAudit('REQUEST_ADMIN_ACCESS', `User ${email} requested admin access`);
  },

  async approveAdminRequest(requestId, uid, email) {
    // Add to admins collection
    await setDoc(doc(db, 'admins', uid), {
      email,
      role: 'admin',
      addedAt: serverTimestamp()
    });
    // Remove from requests collection
    await deleteDoc(doc(db, 'admin_join_requests', requestId));
    await logAudit('APPROVE_ADMIN', `Approved admin access for ${email}`);
  },

  async createAdminUserAndRecord(data) {
    // 1. Create a secondary Firebase App to create the user without signing out the Super Admin
    // Using a random name so it doesn't conflict if called multiple times
    const secondaryApp = initializeApp(app.options, `SecondaryApp_${Date.now()}`);
    const secondaryAuth = getAuth(secondaryApp);
    
    try {
      // 2. Create the Auth user
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, data.email, data.password);
      const newUid = userCredential.user.uid;
      
      // 3. Add to the admins collection with all the new data
      await setDoc(doc(db, 'admins', newUid), {
        email: data.email,
        name: data.name,
        role: data.role || 'admin',
        mobile: data.mobile,
        addedAt: serverTimestamp()
      });
      
      await logAudit('ADD_ADMIN', `Super Admin created new member: ${data.name} (${data.email})`);
      
      // 4. Sign out the secondary app
      await signOut(secondaryAuth);
    } catch (error) {
      console.error("Failed to create admin:", error);
      throw error;
    }
  },

  async rejectAdminRequest(requestId, email) {
    await deleteDoc(doc(db, 'admin_join_requests', requestId));
    await logAudit('REJECT_ADMIN', `Rejected admin request for ${email}`);
  },

  async removeAdmin(uid, email) {
    // Prevent removing yourself
    const user = auth.currentUser;
    if (user && user.uid === uid) {
      throw new Error("You cannot remove yourself");
    }
    await deleteDoc(doc(db, 'admins', uid));
    await logAudit('REMOVE_ADMIN', `Removed admin ${email}`);
  }
};
