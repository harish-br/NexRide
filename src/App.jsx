import React, { useState, useEffect, useRef } from 'react';
import NetworkStatusBanner from './components/NetworkStatusBanner';
import { motion, useMotionValue, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './components/LanguageContext';
import MapLayer from './components/MapLayer';
import LocationFab from './components/LocationFab';
import BottomSheet from './components/BottomSheet';
import './App.css';
import { getDistance } from './utils/locationUtils';
import haptics from './utils/haptics';
import { ArrowLeft, LocateFixed } from 'lucide-react';

import { APIProvider } from '@vis.gl/react-google-maps';
import SearchScreen from './components/SearchScreen';


import BusBookingSheet from './components/BusBookingSheet';
import TrainBookingSheet from './components/TrainBookingSheet';
import SuburbanSheet from './components/SuburbanSheet';
import BusStopDetailsSheet from './components/BusStopDetailsSheet';

import BusResultsScreen from './components/BusResultsScreen';
import ActiveRideScanner from './components/ActiveRideScanner';

import BottomNav from './components/BottomNav';
import { TicketsScreen } from './components/TabScreens';
import ProfileScreen from './components/ProfileScreen';
import AdminRouteCreator from './components/AdminRouteCreator';
import SafetyScreen from './components/SafetyScreen';
import RideScreen from './components/RideScreen';
import WebLanding from './components/WebLanding';
import NearbyBusStopsScreen from './components/NearbyBusStopsScreen';
import NearbyStopMapScreen from './components/NearbyStopMapScreen';

// LoginScreen import removed
import AuthSheet from './components/AuthSheet'; // Import Auth Sheet
import IntroScreen from './components/IntroScreen';
import SplashScreen from './components/SplashScreen'; // Import Splash Screen
import SuccessAnimationScreen from './components/SuccessAnimationScreen'; // Import Success Screen
import OnboardingHoverCard from './components/OnboardingHoverCard'; // Import Onboarding Hover Card
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { ContactScreen, RefundScreen, TermsScreen, PrivacyPolicyScreen } from './components/legal/LegalPages';
import InAppWebView from './components/InAppWebView';
import NotificationPermissionModal from './components/NotificationPermissionModal';
import { LocationPermissionCard } from './components/LocationPermissionModal';
import { notificationService } from './services/notificationService';
import GlobalLoader from './components/GlobalLoader';

const API_KEY = 'AIzaSyDlpxJyvl6FFHQGVO3_i-FsTO_-L9GlLO8';
const LIBRARIES = ['places', 'geometry', 'geocoding', 'routes'];

export default function App() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  // State
  const [sheetState, setSheetState] = useState('collapsed'); // 'collapsed', 'expanded', 'hidden'
  const [routeData, setRouteData] = useState(null); // { origin, destination, routes }
  const [busSearchData, setBusSearchData] = useState(null); // { from, to }
  const [selectedStation, setSelectedStation] = useState(null); // { name, code }
  const [selectedTrainData, setSelectedTrainData] = useState(null); // Train status data
  const [selectedBusStop, setSelectedBusStop] = useState(null);
  const [activeTrainLocation, setActiveTrainLocation] = useState(null); // { lat, lng, title }

  // Motion Value for Bottom Sheet Position (Lifted State)
  const sheetY = useMotionValue(typeof window !== 'undefined' ? window.innerHeight : 0);

  // Initial Route Check (For direct URL access like /contact)
  // Initial Route Check (For direct URL access like /contact)
  const getInitialScreen = () => {
    const path = window.location.pathname;
    // Strict URL matching for compliance
    if (path === '/privacy-policy') return 'privacy-policy';
    if (path === '/terms' || path === '/profile/terms') return 'terms';
    if (path === '/refund-policy' || path === '/profile/refund') return 'refund';
    if (path === '/contact' || path === '/profile/contact') return 'contact';
    if (path === '/app') return 'home';

    // NEW (2026-01-20): Skip SEO landing if app has already been "Launched" once
    const hasLaunched = localStorage.getItem("introCompleted") === "true";
    if (hasLaunched) return 'home';

    return 'landing'; // Default to landing for new URL / hits
  };

  const [activeScreen, setActiveScreen] = useState(getInitialScreen);
  const [showBusBooking, setShowBusBooking] = useState(false);
  const [showTrainBooking, setShowTrainBooking] = useState(false);
  const [showSuburbanSheet, setShowSuburbanSheet] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'tickets', 'plan', 'profile'

  // WebView Data
  const [webViewData, setWebViewData] = useState({ title: '', url: '' });

  // --- AUTH & INTRO STATE ---
  const [showIntro, setShowIntro] = useState(true);
  const [user, setUser] = useState(null);
  const [authStatus, setAuthStatus] = useState('loading'); // 'loading' | 'authenticated' | 'guest'
  const [confirmationResult, setConfirmationResult] = useState(null); // Phone Auth Confirmation Result

  // New States for Nearby Feature
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  {/* Toast Notification Removed */ }

  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showSplash, setShowSplash] = useState(true); // NEW: Splash Screen State
  const [showAuthSheet, setShowAuthSheet] = useState(false); // NEW: Auth Sheet State
  const [needsOnboarding, setNeedsOnboarding] = useState(false); // NEW: Onboarding State
  const [showLocationModal, setShowLocationModal] = useState(false); // NEW: Location Modal State
  const [isManualLocationMode, setIsManualLocationMode] = useState(false); // NEW: Manual choice flag
  const [showActiveRideScanner, setShowActiveRideScanner] = useState(false); // NEW: Active Ride Scanner State
  const [selectedNearbyStop, setSelectedNearbyStop] = useState(null); // Nearby Bus Stop Map View

  // Route Stats
  const [routeStats, setRouteStats] = useState({ distance: '', duration: '', summary: '' });
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  // Location State
  const [userPosition, setUserPosition] = useState(null); // { lat, lng }
  const [userAddress, setUserAddress] = useState(null);
  const [userDistrictInfo, setUserDistrictInfo] = useState(null); // { district, state }
  const [isLocating, setIsLocating] = useState(false);
  const lastPositionRef = useRef(null);
  const watchIdRef = useRef(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    console.log("Initializing App...");
    
    // iOS Safari PWA Input Focus Bug Workaround
    document.addEventListener("touchstart", () => {}, true);

    // 1. INSTANT LOCAL CACHE CHECK (Prioritize Offline Reality)
    let hasLocalSession = false;
    try {
        const session = JSON.parse(localStorage.getItem('userSession') || '{}');
        hasLocalSession = (session.isLoggedIn === true && session.sessionStatus === 'active');
        if (!hasLocalSession) hasLocalSession = localStorage.getItem('isLoggedIn') === 'true';
    } catch (e) {
        hasLocalSession = localStorage.getItem('isLoggedIn') === 'true';
    }

    if (hasLocalSession) {
        console.log("[Auth] Persistent session found locally. Bypassing network wall.");
        setAuthStatus('authenticated'); // Pre-emptively grant access
        setShowIntro(false);
        setNeedsOnboarding(false);
        setActiveScreen((prev) => prev === 'landing' ? 'home' : prev);
    } else {
        if (!navigator.onLine) {
            console.warn("[Auth] Offline Guest detected. Strictly routing to login.");
            setActiveScreen('login');
            setShowIntro(false);
            setNeedsOnboarding(false);
        }
    }

    // 2. BACKGROUND VALIDATION / ONLINE SYNC
    const checkOnboarding = async (uid) => {
      try {
        const docSnap = await getDoc(doc(db, "users", uid));
        // MODIFIED: Even if profile is not completed, we skip the onboarding UI as per request.
        if (!docSnap.exists() || !docSnap.data().profileCompleted) {
          setNeedsOnboarding(false); // Was true
          setShowIntro(false); // Was true
          localStorage.setItem("introCompleted", "true");
          setActiveScreen('home');
        } else {
          setNeedsOnboarding(false);
          setShowIntro(false);
          localStorage.setItem("introCompleted", "true");
          setActiveScreen('home'); // Ensure we are on home screen
        }
      } catch (err) {
        console.error("Onboarding check failed:", err);
        setNeedsOnboarding(false); // (Fallback to home instead of blocking)
        setShowIntro(false); 
        setActiveScreen('home'); // Explicitly allow offline/cached users into the app
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth State Resolved:", currentUser ? "User Logged In" : "User Logged Out");
      setUser(currentUser);

      if (currentUser) {
        setAuthStatus('authenticated');
        localStorage.setItem('userSession', JSON.stringify({ isLoggedIn: true, sessionStatus: 'active', lastLoginAt: Date.now() }));
        localStorage.setItem('isLoggedIn', 'true'); // Maintain cache
        checkOnboarding(currentUser.uid);
      } else {
        if (navigator.onLine) {
            // Strictly online and truly logged out
            setAuthStatus('guest');
            localStorage.setItem('userSession', JSON.stringify({ isLoggedIn: false, sessionStatus: 'logged_out' }));
            localStorage.removeItem('isLoggedIn');
            setNeedsOnboarding(false);
        } else if (!hasLocalSession) {
            // Offline and NO local session
            setAuthStatus('guest');
            setNeedsOnboarding(false);
            setActiveScreen('login');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleIntroComplete = () => {
    console.log("Intro Screen Completed - Checking Auth");
    if (authStatus === 'authenticated') {
      localStorage.setItem("introCompleted", "true");
      setShowIntro(false);
      setActiveScreen('home'); // Skip landing page
    } else {
      setShowAuthSheet(true);
    }
  };

  const handleAuthSuccess = async (authenticatedUser) => {
    if (authenticatedUser?.isDeveloper || authenticatedUser?.isDriver) {
      setUser(authenticatedUser);
      setAuthStatus('authenticated');
    }

    // Check onboarding for regular users
    // Check onboarding for regular users - Logic preserved but UI trigger disabled
    if (authenticatedUser && !authenticatedUser.isDeveloper && !authenticatedUser.isDriver) {
      try {
        const docSnap = await getDoc(doc(db, "users", authenticatedUser.uid));
        if (!docSnap.exists() || !docSnap.data().profileCompleted) {
          console.log("User profile incomplete, but skipping onboarding UI.");
          setNeedsOnboarding(false); // Was true
        }
      } catch (err) {
        console.error("Auth success onboarding check failed:", err);
      }
    }

    setShowAuthSheet(false);
    localStorage.setItem("introCompleted", "true");
    setShowIntro(false);
    setActiveScreen('home');
  };

  // Continuous Location Monitoring & Blocking Logic
  useEffect(() => {
    // Only monitor when app is active (not in splash/intro/onboarding)
    if (showSplash || showIntro || needsOnboarding) return;

    let checkInterval;

    const checkLocationState = async () => {
      // 1. Strict Check: If already prompted once, never show again automatically
      const hasPrompted = localStorage.getItem('location_prompt_shown');
      if (hasPrompted) {
        if (!userPosition && !isLocating) {
          startLocationTracking(); // Try silent tracking
        }
        return;
      }

      // If user explicitly chose manual mode, we don't block them
      if (isManualLocationMode) {
        setShowLocationModal(false);
        return;
      }

      // 2. Check Permission Status
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const status = await navigator.permissions.query({ name: 'geolocation' });

          const evaluateStatus = (s) => {
            if (s === 'denied') {
              // Only show if we haven't shown before (covered by top check, but safe to keep)
              if (!hasPrompted) setShowLocationModal(true);
            } else if (s === 'prompt' && activeScreen === 'home') {
              if (!hasPrompted) setShowLocationModal(true);
            } else if (s === 'granted') {
              if (!userPosition && !isLocating) {
                startLocationTracking();
              }
            }
          };

          evaluateStatus(status.state);
          status.onchange = () => evaluateStatus(status.state);
        } else {
          // Fallback logic
          if (!userPosition && !isLocating) {
            startLocationTracking();
          }
        }
      } catch (err) {
        console.warn("Permission check skipped/failed:", err);
        if (!userPosition && !isLocating) {
          startLocationTracking();
        }
      }
    };

    checkLocationState();

    // Check every 10 seconds 
    checkInterval = setInterval(checkLocationState, 10000);

    return () => clearInterval(checkInterval);
  }, [showSplash, showIntro, needsOnboarding, isManualLocationMode, userPosition, isLocating, activeScreen]);

  const handleEnableLocation = () => {
    // 1. Close UI Immediately
    setShowLocationModal(false);

    // 2. Set Persistent Flag Immediately
    localStorage.setItem('location_prompt_shown', 'true');

    // 3. Continue State Logic
    setIsManualLocationMode(false);
    setActiveScreen('home');
    setActiveTab('home');
    setSheetState('collapsed');
    startLocationTracking();
  };

  const handleManualLocation = () => {
    setShowLocationModal(false);
    localStorage.setItem('location_prompt_shown', 'true');
    setIsManualLocationMode(true);
    localStorage.setItem('location_denied_ts', Date.now().toString());
  };

  // Close Permission Modal & Center Map once we have a valid fix
  useEffect(() => {
    if (userPosition && showLocationModal) {
      setShowLocationModal(false);
      handleLocateMe(); // Center map on the new position
    }
  }, [userPosition, showLocationModal]);

  const startLocationTracking = (retryWithLowAccuracy = true) => {
    setIsLocating(true);

    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.");
      setIsLocating(false);
      return;
    }

    // Clear existing watch if any
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    const options = {
      enableHighAccuracy: retryWithLowAccuracy,
      maximumAge: 0,
      timeout: retryWithLowAccuracy ? 15000 : 30000, // 15s for high, 30s for low
    };

    console.log(`Starting location watch (HighAccuracy: ${options.enableHighAccuracy})...`);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newPos = { lat: latitude, lng: longitude, accuracy };

        // Only update if significant change or first time
        let shouldUpdate = true;
        if (lastPositionRef.current) {
          const dist = getDistance(lastPositionRef.current.lat, lastPositionRef.current.lng, latitude, longitude);
          if (dist < 3) shouldUpdate = false;
        }

        if (shouldUpdate) {
          lastPositionRef.current = newPos;
          setUserPosition(newPos);

          // Reverse Geocoding
          if (window.google && window.google.maps && window.google.maps.Geocoder) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
              if (status === "OK" && results[0]) {
                // Better descriptive address: Neighborhood, Street or Landmark
                let descriptiveAddress = "";
                const comps = results[0].address_components;

                // Priority: sublocality_level_1 (Neighborhood) > sublocality_level_2 > route (Street)
                const neighborhood = comps.find(c => c.types.includes("sublocality_level_1"))?.long_name;
                const area = comps.find(c => c.types.includes("sublocality_level_2"))?.long_name;
                const street = comps.find(c => c.types.includes("route"))?.long_name;
                const locality = comps.find(c => c.types.includes("locality"))?.long_name;

                if (neighborhood) descriptiveAddress = neighborhood;
                else if (area) descriptiveAddress = area;
                else if (street) descriptiveAddress = street;
                else descriptiveAddress = locality || results[0].formatted_address.split(',')[0];

                if (locality && descriptiveAddress !== locality) {
                  descriptiveAddress += `, ${locality}`;
                }

                setUserAddress(descriptiveAddress);

                // Extract District and State
                let district = 'Unknown';
                let state = 'Unknown';

                try {
                  comps.forEach(component => {
                    if (component.types.includes("administrative_area_level_2")) {
                      district = component.long_name;
                    }
                    if (component.types.includes("administrative_area_level_1")) {
                      state = component.long_name;
                    }
                  });
                } catch (err) {
                  console.warn("Error parsing address components", err);
                }

                setUserDistrictInfo({ district, state });
              }
            });
          }
        }

        // Stop loading spinner once we have a fix
        setIsLocating(false);
      },
      (error) => {
        console.error("Location error:", error.message, "Code:", error.code);

        // Handle Denied (Code 1)
        if (error.code === 1) {
          setShowLocationModal(true);
          setIsLocating(false);
          return;
        }

        // Handle Timeout (Code 3) or GPS Issue (Code 2) with Fallback
        if (retryWithLowAccuracy && (error.code === 3 || error.code === 2)) {
          console.log("High accuracy failed, retrying with low accuracy...");
          startLocationTracking(false);
          return;
        }

        setIsLocating(false);
        const msg = error.code === 3 ? t('errors.location_timeout') : t('errors.location_unavailable');
        console.log("Location tracking failed final:", msg);
      },
      options
    );
  };

  const handleLocateMe = () => {
    setRecenterTrigger(prev => prev + 1); // Trigger map center
    if (!userPosition || !watchIdRef.current) {
      startLocationTracking(); // Start tracking if not already
    } else {
      // Just recenter if already tracking
      // setToastMessage(t('common.centering_location'));
      console.log(t('common.centering_location'));
    }
  };

  // One-time cleanup for dummy tickets (Fix for localhost data)
  useEffect(() => {
    const hasCleared = localStorage.getItem('has_cleared_initial_dummy_data');
    if (!hasCleared) {
      console.log('Performing one-time cleanup of dummy tickets...');
      localStorage.removeItem('tickets');
      localStorage.setItem('has_cleared_initial_dummy_data', 'true');
    }
  }, []);

  // ------------------------------------------------------------
  // NEW: HANDLE PAYMENT SUCCESS RETURN
  // ------------------------------------------------------------
  useEffect(() => {
    const handlePaymentReturn = async () => {
      // Manual URL parsing since we don't use React Router's useSearchParams
      const searchParams = new URLSearchParams(window.location.search);
      const orderId = searchParams.get('order_id');
      const path = window.location.pathname;

      if (!orderId) return;

      console.log("PAYMENT RETURN DETECTED:", orderId);
      setSheetState('hidden'); // Hide sheet during processing
      // setToastMessage(t('common.verifying_payment'));

      try {
        // 1. Verify with Backend
        const response = await fetch(`/api/verify-payment/${orderId}`);
        const data = await response.json();
        console.log("BACKEND VERIFICATION RESPONSE:", data);

        if (data.status === 'SUCCESS' || data.status === 'PAID') {
          console.log("PAYMENT VERIFIED: SUCCESS");

          // 2. Retrieve Pending Ticket Data
          const pendingStr = localStorage.getItem('pendingTicket');
          if (pendingStr) {
            const pendingTicket = JSON.parse(pendingStr);

            // 3. Create Final Ticket Object
            // Parse duration string for Expiry (e.g. "4 hr 10 min", "45 min")
            let durationMs = 3600000 * 2; // Default 2 hours if parse fails
            try {
              const dStr = newTicket.durationString || '';
              let totalMin = 0;

              // Simple regex for "X hr" and "Y min"
              const hrMatch = dStr.match(/(\d+)\s*hr/i);
              const minMatch = dStr.match(/(\d+)\s*min/i);

              if (hrMatch) totalMin += parseInt(hrMatch[1]) * 60;
              if (minMatch) totalMin += parseInt(minMatch[1]);

              if (totalMin > 0) durationMs = totalMin * 60000;
            } catch (e) {
              console.warn("Duration parse failed, using default", e);
            }

            // Buffer: +1 Hour extra validity after ETA
            const expiryBuffer = 3600000;

            const finalTicket = {
              ticketId: orderId, // Use Order ID as Ticket ID
              ...pendingTicket,
              creationTime: Date.now(),
              expiryTime: Date.now() + durationMs + expiryBuffer,
              isPaid: true
            };

            // Use finalTicket instead of newTicket for storage
            const newTicket = finalTicket; // Keep var name compatible for now

            // 4. Save to Local Tickets History
            const existingTickets = JSON.parse(localStorage.getItem('tickets') || '[]');
            // Avoid duplicates
            if (!existingTickets.find(t => t.ticketId === newTicket.ticketId)) {
              existingTickets.unshift(newTicket); // Add to top
              localStorage.setItem('tickets', JSON.stringify(existingTickets));
              console.log("TICKET SAVED LOCALLY:", newTicket);

              // 4b. Sync to Firestore (Persistence)
              if (auth.currentUser) {
                try {
                  // Import these at top of file, but for now I'll use property access if possible or rely on import update?
                  // I need to update imports first.
                  // See below.
                  const { doc, setDoc } = await import('firebase/firestore');
                  const { db } = await import('./firebase');
                  await setDoc(doc(db, "users", auth.currentUser.uid, "tickets", newTicket.ticketId), newTicket);
                  console.log("TICKET SYNCED TO FIRESTORE");
                } catch (fsErr) {
                  console.error("Firestore Sync Error", fsErr);
                }
              }
            }

            // 5. Cleanup & UI Switch
            localStorage.removeItem('pendingTicket');

            // --- NEW: Trigger Success Animation instead of immediate jump ---
            setShowSuccessAnimation(true);
            // setToastMessage(t('common.payment_success'));

            // Clear URL without reload
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            console.warn("No pending ticket found for this payment.");
            // setToastMessage("Payment received, but ticket data found.");
            console.error("Payment received, but ticket data found.");
          }
        } else {
          console.error("Payment Verification Failed:", data);
          // setToastMessage(`Payment status: ${data.status}`);
          console.log(`Payment status: ${data.status}`);
        }
      } catch (err) {
        console.error("Verification Error:", err);
        // setToastMessage("Could not verify payment. Please contact support.");
        console.error("Could not verify payment.");
      }
    };

    handlePaymentReturn();
  }, []);



  // Navigation & History Management
  const [busFilterState, setBusFilterState] = useState({
    sortBy: 'earliest',
    filterType: 'All',
    scrollPosition: 0
  });

  // Handle Hardware Back Button & PopState
  useEffect(() => {
    if (!window.history.state) {
      window.history.replaceState({ screen: 'home', sheetState: 'collapsed' }, '');
    }

    const handlePopState = (event) => {
      const state = event.state;
      if (state && state.screen) {
        setActiveScreen(state.screen);
        if (state.sheetState) {
          setSheetState(state.sheetState);
        }
      } else {
        setActiveScreen('home');
        setSheetState('collapsed');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Generic Navigate Function with Replace Support
  const navigateTo = (screen, sheetStateOverride = 'hidden', replace = false) => {
    // Map screen to URL path
    let path = '/';
    if (screen === 'contact') path = '/contact';
    if (screen === 'terms') path = '/terms';
    if (screen === 'refund') path = '/refund-policy';
    if (screen === 'privacy-policy') path = '/privacy-policy';
    if (screen === 'login') path = '/login';
    if (screen === 'home') path = '/app';
    if (screen === 'landing') path = '/';

    // For other internal screens, we keep '/' (or you could map them too if you wanted deep links)

    const newState = { screen, sheetState: sheetStateOverride };
    if (replace) {
      window.history.replaceState(newState, '', path);
    } else {
      window.history.pushState(newState, '', path);
    }
    setActiveScreen(screen);
    setSheetState(sheetStateOverride);
  };

  // Generic Back Function
  const goBack = () => {
    window.history.back();
  };

  // Handlers
  const handleStartSearch = () => {
    navigateTo('search');
  };

  const handleBackFromSearch = () => {
    setRouteData(null); // Ensure clean state
    goBack();
  };

  /* ------------------- NOTIFICATIONS LOGIC ------------------- */
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Check for permission state on Auth Load
  useEffect(() => {
    if (authStatus === 'authenticated') {
      const checkPermission = async () => {
        // If supported and not granted, and user hasn't actively denied "Not Now" recently
        // If supported and not granted
        const isSupported = notificationService.isSupported();
        if (isSupported && Notification.permission === 'default') {
          // STRICT CHECK: Only show if NEVER shown before
          const hasShown = localStorage.getItem('notification_prompt_shown');

          if (!hasShown) {
            // Slight delay to not bombard user immediately on load
            setTimeout(() => setShowNotificationModal(true), 3000);
          }
        } else if (isSupported && Notification.permission === 'granted') {
          // Ensure token is fresh/registered
          notificationService.registerForPushNotifications();
        }
      };


      checkPermission();
    }
  }, [authStatus]);

  // Foreground Message Listener
  useEffect(() => {
    if (notificationService.isSupported()) {
      const unsubscribe = notificationService.listenForMessages((payload) => {
        // Toast removed
        console.log("Notification:", payload.notification.title, payload.notification.body);
      });
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, []);

  const handleEnableNotifications = async () => {
    // 1. Close Immediately
    setShowNotificationModal(false);
    // 2. Set Flag Immediately
    localStorage.setItem('notification_prompt_shown', 'true');

    const result = await notificationService.requestPermission();
    if (result === 'granted') {
      await notificationService.registerForPushNotifications();
      console.log("Notifications enabled!");
    } else {
      console.warn("Notification permission denied.");
    }
  };

  const handleNotNowNotifications = () => {
    setShowNotificationModal(false);
    localStorage.setItem('notification_prompt_shown', 'true');
  };
  /* ----------------------------------------------------------- */

  // Route Found Handler
  const handleRouteFound = (data) => {
    setRouteData({
      ...data
    });
    // Use REPLACE to avoid circular history [Home, Search, RouteView]
    // Going back will ideally return to Search (via custom handler below) 
    // BUT we want stack depth 2: [Home, Search] -> [Home, RouteView]
    navigateTo('route-view', 'collapsed', true);
  };

  const handleClearRoute = () => {
    if (activeScreen === 'route-view') {
      // Go back to search, REPLACING RouteView with Search
      // Stack remains depth 2: [Home, Search]
      navigateTo('search', 'hidden', true);
    } else {
      setRouteData(null);
      setRouteStats({ distance: '', duration: '', summary: '' });
      setSheetState('collapsed');
    }
  };

  const handleBusClick = () => {
    setShowBusBooking(true);
  };

  const handleTrainClick = () => {
    setShowTrainBooking(true);
  };

  const handleSuburbanClick = () => {
    setShowSuburbanSheet(true);
  };

  const handleBusSearch = (from, to) => {
    setBusSearchData({ from, to });
    setShowBusBooking(false);
    navigateTo('bus-results');
  };

  const handleStationSelect = (station) => {
    setSelectedStation(station);
    setSelectedTrainData(null);
    setShowTrainBooking(false);
    navigateTo('train-live');
  };

  const handleTrainSelect = (trainData) => {
    setSelectedTrainData(trainData);
    setSelectedStation(null);
    setShowTrainBooking(false);
    navigateTo('train-live');
  };

  const handleBusStopSelect = (stop) => {
    setSelectedBusStop(stop);
  };

  const handleNearbyClick = () => {
    navigateTo('nearby-stops');
  };

  const handleActiveRideScan = (data) => {
    console.log("Active Ride Scanned:", data);
    setShowActiveRideScanner(false);
    setShowSuccessAnimation(true); // Proceed to success screen as a mock booking
  };

  const handleStopsFound = React.useCallback((count) => {
    if (count === 0) {
      // setToastMessage(t('errors.no_nearby_stops'));
      console.log(t('errors.no_nearby_stops'));
    }
  }, [t]);

  const handleAdminNavigate = (screen) => {
    if (screen === 'admin-routes') {
      navigateTo('admin-route-create');
    }
  };

  const handleLegalNavigate = (screen) => {
    navigateTo(screen);
  };

  const handleUserLogout = async () => {
    try {
      console.log("Processing Silent Logout...");
      await signOut(auth);

      // Clear User Session Data
      localStorage.setItem('userSession', JSON.stringify({ isLoggedIn: false, sessionStatus: 'logged_out' }));
      localStorage.removeItem("isLoggedIn"); // Explicitly drop offline entry bypass token
      localStorage.removeItem("introCompleted"); // Force Intro/Get Started on next load
      localStorage.removeItem("pendingTicket");

      // Reset App State
      setUser(null);
      setAuthStatus('guest');
      setShowIntro(true); // RE-SHOW INTRO SCREEN
      setActiveScreen('home'); // Reset screen stack
      setActiveTab('home');
      setRouteData(null);
      setBusSearchData(null);
      setSheetState('collapsed');
      setShowAuthSheet(false);
      localStorage.removeItem("introCompleted"); // Strictly require Intro on reload too

      console.log("Logout Complete - Redirecting to Get Started");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  // 🧹 Cleanup Effect: Clear Route Data when returning to Home
  useEffect(() => {
    if (activeScreen === 'home') {
      if (routeData) {
        setRouteData(null);
        setRouteStats({ distance: '', duration: '', summary: '' });
      }
    }
  }, [activeScreen, routeData]);

  return (
    <APIProvider apiKey={API_KEY} libraries={LIBRARIES} onError={(e) => console.error('Maps API Error', e)}>
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        overflow: 'hidden',
        background: '#fff',
      }}>
        
        <NetworkStatusBanner />

        {/* Website Landing Page - SEO and Brand First (Only shown on '/') */}
        {activeScreen === 'landing' && (
          <WebLanding onLaunchApp={() => navigateTo('home', 'collapsed')} />
        )}

        {/* Splash Screen - Highest Priority */}
        <AnimatePresence>
          {showSplash && (
            <SplashScreen onComplete={() => setShowSplash(false)} />
          )}
        </AnimatePresence>

        {/* Intro Screen Overlay - Only show if showIntro is true AND Splash is done */}
        <AnimatePresence>
          {!showSplash && showIntro && <IntroScreen onComplete={handleIntroComplete} />}
        </AnimatePresence>



        {/* Auth Sheet - Modal for Login/Signup */}
        <AnimatePresence>
          {showAuthSheet && (
            <AuthSheet
              isOpen={showAuthSheet}
              onClose={() => setShowAuthSheet(false)}
              onSuccess={handleAuthSuccess}
            />
          )}
        </AnimatePresence>

        {/* Onboarding Screen - Mandatory for new users (Hard Gate) */}
        <AnimatePresence>
          {needsOnboarding && (
            <OnboardingHoverCard
              onComplete={() => {
                setNeedsOnboarding(false);
                setShowIntro(false);
                localStorage.setItem("introCompleted", "true");
              }}
              onBack={() => {
                setNeedsOnboarding(false);
                setShowAuthSheet(true); // Go back to Auth state
              }}
            />
          )}
        </AnimatePresence>

        {/* Main Application - Passenger Mode (Hard Gated) */}
        {!needsOnboarding && !showIntro && !showSplash && (
          <>
            <div style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: (showLocationModal && !isManualLocationMode) ? 'none' : 'auto',
              filter: (showLocationModal && !isManualLocationMode) ? 'blur(12px)' : 'none',
              transition: 'filter 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 1
            }}>
              {/* Map Layer - Always Rendered in Background for Passenger */}
              <MapLayer
                isSheetOpen={sheetState === 'expanded'}
                isDragging={isDragging}
                routeData={activeScreen === 'route-view' ? routeData : null}
                activeScreen={activeScreen}
                selectedRouteIndex={selectedRouteIndex}
                onRouteIndexChange={setSelectedRouteIndex}
                onRouteDetailsChange={setRouteStats}
                onStopSelect={handleBusStopSelect}
                recenterTrigger={recenterTrigger}
                onStopsFound={handleStopsFound}
                userPosition={userPosition}
                activeTrainLocation={activeTrainLocation}
              />


              {/* Floating Back Button for Route View - Fixed Top Left */}
              <AnimatePresence>
                {activeScreen === 'route-view' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    style={{
                      position: 'fixed',
                      top: '50px',
                      left: isRTL ? 'auto' : '20px',
                      right: isRTL ? '20px' : 'auto',
                      zIndex: 1000,
                      pointerEvents: 'auto'
                    }}
                  >
                    <button
                      onClick={() => {
                        haptics.light();
                        handleClearRoute();
                      }}
                      style={{
                        background: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '44px',
                        height: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                    >
                      <ArrowLeft size={24} color="#111" style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>



              {/* BUS RESULTS SCREEN */}
              {activeScreen === 'bus-results' && (
                <BusResultsScreen
                  onBack={goBack}
                  searchData={busSearchData}
                  filterState={busFilterState}
                  setFilterState={setBusFilterState}
                />
              )}

              {/* SEARCH SCREEN */}
              {activeScreen === 'search' && (
                <SearchScreen
                  onBack={handleBackFromSearch}
                  onRouteFound={handleRouteFound}
                  initialData={routeData ? { origin: routeData.origin, destination: routeData.destination } : null}
                  userPosition={userPosition}
                  userAddress={userAddress}
                />
              )}

              {/* ADMIN ROUTE CREATOR */}
              {activeScreen === 'admin-route-create' && (
                <AdminRouteCreator onBack={goBack} />
              )}

              {/* NEARBY BUS STOPS SCREENS */}
              {activeScreen === 'nearby-stops' && (
                <NearbyBusStopsScreen
                  userPosition={userPosition}
                  onBack={goBack}
                  onViewStopOnMap={(stop) => {
                    setSelectedNearbyStop(stop);
                    navigateTo('nearby-stop-map');
                  }}
                />
              )}
              {activeScreen === 'nearby-stop-map' && selectedNearbyStop && (
                <NearbyStopMapScreen
                  userPosition={userPosition}
                  stop={selectedNearbyStop}
                  onBack={goBack}
                />
              )}

              {/* LEGAL PAGES */}
              {activeScreen === 'contact' && <ContactScreen onBack={goBack} />}
              {activeScreen === 'terms' && <TermsScreen onBack={goBack} />}
              {activeScreen === 'refund' && <RefundScreen onBack={goBack} />}
              {activeScreen === 'privacy-policy' && <PrivacyPolicyScreen onBack={goBack} />}

              {/* DEFAULT HOME OR ROUTE VIEW (BottomSheet Overlay) */}
              {(activeScreen === 'home' || activeScreen === 'route-view') && activeTab === 'home' && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', paddingBottom: '80px' }}>
                  <div style={{ pointerEvents: 'auto' }}>
                    <BottomSheet
                      sheetState={sheetState}
                      setSheetState={setSheetState}
                      dragY={sheetY}
                      setIsDragging={setIsDragging}
                      onStartSearch={handleStartSearch}
                      onBusClick={handleBusClick}
                      onTrainClick={handleTrainClick}
                      onSuburbanClick={handleSuburbanClick}
                      onNearbyClick={handleNearbyClick}
                      routeData={routeData}
                      routeStats={routeStats}
                      onClearRoute={handleClearRoute}
                      selectedRouteIndex={selectedRouteIndex}
                      setSelectedRouteIndex={setSelectedRouteIndex}
                      userAddress={userAddress}
                      userPosition={userPosition}
                      userDistrictInfo={userDistrictInfo}
                      onLegalNavigate={handleLegalNavigate}
                      onTicketBooked={() => setActiveTab('tickets')}
                    />
                  </div>
                </div>
              )}

              {/* NEW TABS */}
              {activeTab === 'tickets' && (
                <TicketsScreen
                  onBookTicket={() => {
                    setActiveTab('home');
                    handleStartSearch();
                  }}
                />
              )}
              {activeTab === 'ride' && (
                <RideScreen
                  userPosition={userPosition}
                  userAddress={userAddress}
                  onBookRide={(type) => console.log('Book Ride:', type)}
                />
              )}
              {activeTab === 'profile' && (
                <>
                  {authStatus === 'loading' && (
                    <GlobalLoader message={t('common.loading')} />
                  )}
                  {/* Render Profile Screen for both Guest and Authenticated users */}
                  {authStatus !== 'loading' && (
                    <ProfileScreen
                      user={user}
                      authStatus={authStatus}
                      onNavigate={(screen) => {
                        if (screen === 'admin-routes') {
                          navigateTo('admin-route-create');
                        } else {
                          navigateTo(screen);
                        }
                      }}
                      onLegalNavigate={handleLegalNavigate}
                      onLogin={() => navigateTo('login')}
                      onBack={() => setActiveTab('home')}
                      onLogout={handleUserLogout}
                    />
                  )}
                </>
              )}


              {/* BUS BOOKING SHEET (Overlay) */}
              <BusBookingSheet
                isOpen={showBusBooking}
                onClose={() => setShowBusBooking(false)}
                onSearch={handleBusSearch}
                userAddress={userAddress}
                userPosition={userPosition}
                onActiveRideClick={() => {
                  setShowBusBooking(false);
                  setShowActiveRideScanner(true);
                }}
              />

              {/* TRAIN BOOKING SHEET (Overlay) */}
              <TrainBookingSheet
                isOpen={showTrainBooking}
                onClose={() => setShowTrainBooking(false)}
                onStationSelect={handleStationSelect}
                onTrainSelect={handleTrainSelect}
                // NEW: Update map with train location
                onTrainLocationFound={(loc) => {
                  // Expecting { lat, lng, title }
                  setRecenterTrigger(prev => prev + 1);
                  // We can reuse 'userPosition' if we want to cheat, OR add a dedicated prop to MapLayer.
                  // Let's add a dedicated prop `activeTrainLocation` to MapLayer below.
                  setActiveTrainLocation(loc);
                }}
              />

              {/* SUBURBAN SHEET (Overlay) */}
              <SuburbanSheet
                isOpen={showSuburbanSheet}
                onClose={() => setShowSuburbanSheet(false)}
              />

              {/* IN-APP WEBVIEW (Overlay - Highest Priority) */}
              {activeScreen === 'webview' && (
                <InAppWebView
                  title={webViewData.title}
                  url={webViewData.url}
                  onBack={goBack}
                />
              )}

              {/* BUS STOP DETAILS SHEET (Overlay) */}
              <BusStopDetailsSheet
                stop={selectedBusStop}
                onClose={() => setSelectedBusStop(null)}
              />

              {/* BOTTOM NAVIGATION */}
              {(activeScreen === 'home' || activeScreen === 'route-view') && !needsOnboarding && (
                <>
                  <LocationFab
                    onLocate={handleLocateMe}
                    isLocating={isLocating}
                    sheetY={sheetY}
                    show={activeTab === 'home' && !showBusBooking && !showTrainBooking}
                  />
                  <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
                </>
              )}

              <ActiveRideScanner
                isOpen={showActiveRideScanner}
                onClose={() => setShowActiveRideScanner(false)}
                onScanSuccess={handleActiveRideScan}
              />

            </div>

            <NotificationPermissionModal
              isOpen={showNotificationModal}
              onClose={() => setShowNotificationModal(false)}
              onEnable={handleEnableNotifications}
              onNotNow={handleNotNowNotifications}
            />

            {/* SUCCESS ANIMATION OVERLAY */}
            <AnimatePresence>
              {showSuccessAnimation && (
                <SuccessAnimationScreen
                  onComplete={() => {
                    setShowSuccessAnimation(false);
                    setActiveTab('tickets');
                    console.log("Ticket Booked Successfully!");
                  }}
                />
              )}
            </AnimatePresence>

            {/* Location Permission Modal (Outside barrier) */}
            <LocationPermissionCard
              isOpen={showLocationModal && !isManualLocationMode}
              onClose={() => setShowLocationModal(false)}
              onAllow={handleEnableLocation}
              onManual={handleManualLocation}
              isLoading={isLocating}
            />
          </>
        )}


      </div>
    </APIProvider>
  );
}

