import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, ArrowRight } from 'lucide-react';
import haptics from '../utils/haptics';

const SEORoutesH1 = {
  '/erode-bus-timings': 'Bus Timings & Online Booking – Erode',
  '/anthiyur-bus-schedule': 'Bus Timings & Online Booking – Anthiyur',
  '/gobichettipalayam-bus': 'Bus Timings & Online Booking – Gobichettipalayam',
  '/bhavani-bus-timings': 'Bus Timings & Online Booking – Bhavani',
  '/parcel-booking-erode': 'Parcel Booking & Tracking – Erode',
  '/bus-timings': 'Live Bus Timings & Schedules',
  '/parcel-booking': 'Online Parcel Booking & Delivery',
  '/bus-booking': 'Online Bus Ticket Booking',
  '/routes': 'Explore Bus Routes & Services'
};

const RouteSEOPage = ({ onLaunchApp, routePath }) => {
    const h1Text = SEORoutesH1[routePath] || 'Bus Timings & Online Booking';

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 9999,
            textAlign: 'center'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{ maxWidth: '400px', width: '100%' }}
            >
                <div style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto 24px',
                    background: 'linear-gradient(135deg, #1569FD 0%, #00C6FB 100%)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 25px rgba(21, 105, 253, 0.2)'
                }}>
                    <MapPin color="white" size={40} />
                </div>

                <h1 style={{
                    fontSize: '32px',
                    fontWeight: 700,
                    color: '#111827',
                    marginBottom: '16px',
                    letterSpacing: '-1px',
                    lineHeight: '1.2'
                }}>
                    {h1Text}
                </h1>

                <p style={{
                    fontSize: '16px',
                    color: '#6B7280',
                    lineHeight: '1.6',
                    marginBottom: '40px',
                    fontWeight: '400'
                }}>
                    Check live bus timings, track parcels, book tickets, and plan your routes seamlessly across Tamil Nadu directly on NexRide.
                </p>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                        if (haptics && typeof haptics.medium === 'function') {
                            haptics.medium();
                        }
                        onLaunchApp();
                    }}
                    style={{
                        width: '100%',
                        padding: '18px',
                        background: '#111827',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '16px',
                        fontSize: '18px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        boxShadow: '0 12px 30px rgba(0,0,0,0.15)'
                    }}
                >
                    Launch Application <ArrowRight size={20} />
                </motion.button>

                <div style={{ marginTop: '40px', fontSize: '14px', color: '#9CA3AF' }}>
                    © {new Date().getFullYear()} NexRide • Built for Tamil Nadu
                </div>
            </motion.div>
        </div>
    );
};

export default RouteSEOPage;
