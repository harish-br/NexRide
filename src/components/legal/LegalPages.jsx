import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react';
import Lottie from 'lottie-react';
import lockAnimation from '../LottieAnimations/Lock.json';

// Shared Layout Component
const LegalLayout = ({ title, children, onBack, style }) => (
    <div style={{
        position: 'fixed', inset: 0,
        backgroundColor: '#F9FAFB',
        zIndex: 10000, // Above everything (Profile is 9999)
        display: 'flex', flexDirection: 'column',
        ...style
    }}>
        {/* Header */}
        <div style={{
            padding: '16px',
            backgroundColor: 'white',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex', alignItems: 'center',
            position: 'sticky', top: 0, zIndex: 10
        }}>
            <button
                onClick={onBack}
                style={{
                    background: 'none', border: 'none', padding: '8px',
                    marginRight: '8px', cursor: 'pointer', display: 'flex'
                }}
            >
                <ArrowLeft size={24} color="#111827" />
            </button>
            <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>
                {title}
            </h1>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                {children}
            </div>
        </div>
    </div>
);

// --- 4. Privacy Policy Screen ---
export const PrivacyPolicyScreen = ({ onBack }) => {
    const [animationState, setAnimationState] = useState('playing'); // 'playing', 'fading', 'finished'

    // SEO & Title Logic
    useEffect(() => {
        document.title = "Privacy Policy – NexRide";

        const metaDesc = document.querySelector('meta[name="description"]');
        let originalMetaContent = null;
        let createdMeta = null;

        if (metaDesc) {
            originalMetaContent = metaDesc.getAttribute('content');
            metaDesc.setAttribute('content', 'Read the Privacy Policy for NexRide. Learn how we collect, use, and protect your data while using our bus and train tracking services.');
        } else {
            const meta = document.createElement('meta');
            meta.name = "description";
            meta.content = 'Read the Privacy Policy for NexRide. Learn how we collect, use, and protect your data while using our bus and train tracking services.';
            document.head.appendChild(meta);
            createdMeta = meta;
        }

        return () => {
            document.title = "NexRide";
            if (createdMeta) {
                document.head.removeChild(createdMeta);
            } else if (metaDesc && originalMetaContent !== null) {
                metaDesc.setAttribute('content', originalMetaContent);
            }
        };
    }, []);

    const finishAnimation = React.useCallback(() => {
        setAnimationState('fading');
        setTimeout(() => {
            setAnimationState('finished');
        }, 500); // 500ms fade out duration
    }, []);

    // Animation Logic
    useEffect(() => {
        // Enforce fixed 3s duration
        const timer = setTimeout(() => {
            if (animationState === 'playing') {
                finishAnimation();
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [animationState, finishAnimation]);

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'white' }}>
            {/* Main Content (Hidden initially, faded in) */}
            <LegalLayout
                title="Privacy Policy"
                onBack={onBack}
                style={{
                    opacity: (animationState === 'finished' || animationState === 'fading') ? 1 : 0,
                    transition: 'opacity 0.6s ease-in-out',
                    zIndex: 10000, // Explicitly set to ensure it's on top when visible
                    // Ensure it takes up space but is hidden visually during animation
                    visibility: (animationState === 'finished' || animationState === 'fading') ? 'visible' : 'hidden',
                    // Note: visibility: hidden ensures it doesn't block clicks if it were on top, but we have the animation layer on top anyway.
                    // Actually, simple opacity transition is cleaner. 
                    // Let's use absolute positioning relative to the container.
                    position: 'absolute',
                }}
            >
                <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '24px' }}>Last updated: 04-Feb-2026</p>

                <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
                    <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#374151', marginBottom: '24px' }}>
                        NexRide (accessible at <a href="https://nexride.co.in" style={{ color: '#2563EB', textDecoration: 'none' }}>https://nexride.co.in</a>) is committed to protecting your privacy. This Privacy Policy explains how the NexRide application collects, uses, and safeguards user information in connection with its services.
                    </p>

                    <SectionHeader number="1" title="Information We Collect" />

                    <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}>Personal Information</p>
                    <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#374151', marginBottom: '16px' }}>
                        When you register or sign in to NexRide, we collect your mobile number for the purpose of account creation, verification, and secure access using one-time password (OTP)–based authentication.
                        <br />
                        No Google Sign-In or social login services are used.
                    </p>

                    <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}>Location Information</p>
                    <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#374151', marginBottom: '8px' }}>
                        NexRide uses non-identifiable location data on your device to:
                    </p>
                    <ul style={{ paddingLeft: '20px', margin: '0 0 16px 0', fontSize: '15px', lineHeight: '1.6', color: '#374151' }}>
                        <li>Show nearby bus stops</li>
                        <li>Calculate routes and distances</li>
                        <li>Enable live transit-related features</li>
                    </ul>
                    <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#374151', marginBottom: '16px' }}>
                        This location data is processed temporarily on the device and is not used for tracking, profiling, or advertising.
                    </p>

                    <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}>Usage Information</p>
                    <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#374151', marginBottom: '24px' }}>
                        We may collect aggregated and non-personal usage information (such as feature usage or error logs) to improve app performance and reliability. This data cannot be used to identify individual users.
                    </p>

                    <SectionHeader number="2" title="How We Use Your Information" />
                    <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#374151', marginBottom: '8px' }}>We use the collected information strictly to:</p>
                    <ul style={{ paddingLeft: '20px', margin: '0 0 24px 0', fontSize: '15px', lineHeight: '1.6', color: '#374151' }}>
                        <li>Provide NexRide services including ticketing, pass management, and trip planning</li>
                        <li>Verify and secure user accounts using mobile number authentication</li>
                        <li>Maintain essential user preferences and service history</li>
                        <li>Provide customer support and respond to user inquiries</li>
                    </ul>

                    <SectionHeader number="3" title="Data Security & Confidentiality" />
                    <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#374151', marginBottom: '16px' }}>
                        We implement appropriate technical and organizational security measures to protect user data. All sensitive data transmission is encrypted.
                    </p>
                    <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#374151', marginBottom: '24px' }}>
                        NexRide does not sell, rent, or trade personal information to third parties and does not use user data for advertising or marketing purposes.
                    </p>

                    <SectionHeader number="4" title="Data Sharing" />
                    <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#374151', marginBottom: '8px' }}>User information is shared only when required to:</p>
                    <ul style={{ paddingLeft: '20px', margin: '0 0 16px 0', fontSize: '15px', lineHeight: '1.6', color: '#374151' }}>
                        <li>Comply with legal obligations</li>
                        <li>Prevent fraud or misuse of the service</li>
                        <li>Ensure secure operation of the platform</li>
                    </ul>
                    <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#374151', marginBottom: '24px' }}>
                        No personal data is shared for commercial exploitation.
                    </p>

                    <SectionHeader number="5" title="Contact Us" />
                    <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#374151', marginBottom: '12px' }}>
                        If you have any questions about this Privacy Policy or NexRide’s data practices, please contact us at:
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Mail size={18} color="#2563EB" style={{ marginRight: '8px' }} />
                        <a href="mailto:teamnexride@gmail.com" style={{ fontSize: '15px', fontWeight: '500', color: '#2563EB', textDecoration: 'none' }}>
                            teamnexride@gmail.com
                        </a>
                    </div>
                </div>
            </LegalLayout>

            {/* Animation Layer */}
            {animationState !== 'finished' && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'white',
                    zIndex: 10001,
                    opacity: animationState === 'fading' ? 0 : 1,
                    transition: 'opacity 0.5s ease-out',
                    pointerEvents: animationState === 'fading' ? 'none' : 'auto'
                }}>
                    {/* Back Button for Animation State */}
                    <button
                        onClick={onBack}
                        style={{
                            position: 'absolute',
                            top: '16px',
                            left: '16px',
                            background: 'none',
                            border: 'none',
                            padding: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            zIndex: 10002
                        }}
                    >
                        <ArrowLeft size={24} color="#111827" />
                    </button>


                    <div style={{ width: 160, height: 160, transform: 'translateY(-20px)' }}> {/* 120-160px responsive, slightly above center */}
                        <Lottie
                            animationData={lockAnimation}
                            loop={false}
                            autoplay={true}
                            // onComplete Removed to force 3s wait
                            onError={() => setAnimationState('finished')} // Fallback if fails
                        />
                    </div>
                    {/* Optional Text */}
                    <p style={{
                        marginTop: '16px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#4B5563',
                        opacity: 0.8,
                        animation: 'fadeIn 0.5s ease-in'
                    }}>
                        Your privacy is protected with NexRide
                    </p>
                    <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 0.8; transform: translateY(0); } }`}</style>
                </div>
            )}
        </div>
    );
};

// --- 1. Contact Us Screen ---
export const ContactScreen = ({ onBack }) => {
    const [isLoaded, setIsLoaded] = React.useState(false);

    React.useEffect(() => {
        document.title = "Contact Us – NexRide";
        // Force a brief mount delay to ensure rendering happens after route change
        const timer = setTimeout(() => setIsLoaded(true), 50);
        return () => {
            clearTimeout(timer);
            document.title = "NexRide";
        };
    }, []);

    if (!isLoaded) return <div style={{ position: 'fixed', inset: 0, background: 'white', zIndex: 10001 }} />;

    return (
        <LegalLayout title="Contact Us" onBack={onBack}>
            <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>Last updated: 28-Dec-2025</p>

                <div style={{
                    backgroundColor: 'white', padding: '24px', borderRadius: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #E5E7EB'
                }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111', marginBottom: '20px' }}>
                        Merchant Legal Entity Name
                    </h3>
                    <p style={{ fontSize: '15px', color: '#374151', marginBottom: '24px' }}>Harish BR</p>

                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111', marginBottom: '12px' }}>
                        Registered Address
                    </h3>
                    <p style={{ fontSize: '15px', color: '#374151', lineHeight: '1.6', marginBottom: '24px' }}>
                        51/1, Amman Kovil Meadu, Kuppichipalayam, Bhavani,<br />
                        Erode, Tamil Nadu, PIN: 638311
                    </p>

                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111', marginBottom: '12px' }}>
                        Operational Address
                    </h3>
                    <p style={{ fontSize: '15px', color: '#374151', lineHeight: '1.6', marginBottom: '24px' }}>
                        51/1, Amman Kovil Meadu, Kuppichipalayam, Bhavani,<br />
                        Erode, Tamil Nadu, PIN: 638311
                    </p>

                    <div style={{ height: '1px', backgroundColor: '#F3F4F6', margin: '24px 0' }} />



                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Mail size={20} color="#6B7280" style={{ marginRight: '12px' }} />
                        <div>
                            <div style={{ fontSize: '12px', color: '#6B7280' }}>Email</div>
                            <a href="mailto:teamnexride@gmail.com" style={{ fontSize: '15px', fontWeight: '500', color: '#2563EB', textDecoration: 'none' }}>
                                teamnexride@gmail.com
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </LegalLayout>
    );
};

// --- 2. Refund Policy Screen ---
export const RefundScreen = ({ onBack }) => {
    const [isLoaded, setIsLoaded] = React.useState(false);

    React.useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 50);
        return () => clearTimeout(timer);
    }, []);

    if (!isLoaded) return <div style={{ position: 'fixed', inset: 0, background: 'white', zIndex: 10001 }} />;

    return (
        <LegalLayout title="Refund Policy" onBack={onBack}>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '24px' }}>Last updated: 01-Oct-2025</p>

            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
                <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#374151', marginBottom: '24px' }}>
                    At NexRide (<a href="https://nexride.co.in" style={{ color: '#2563EB', textDecoration: 'none' }}>https://nexride.co.in</a>), we aim to provide a reliable public transport service platform.
                </p>

                <SectionHeader number="1" title="General Conditions" />
                <ul style={{ paddingLeft: '20px', margin: '0 0 24px 0', fontSize: '15px', lineHeight: '1.6', color: '#374151' }}>
                    <li>All payments are subject to verification.</li>
                    <li>By making a payment, you agree to this Refund Policy.</li>
                    <li>Refunds are processed only under the conditions mentioned below.</li>
                </ul>

                <SectionHeader number="2" title="Eligibility for Refunds" />
                <p style={{ fontSize: '15px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Refunds may be issued in the following cases:</p>
                <ul style={{ paddingLeft: '20px', margin: '0 0 16px 0', fontSize: '15px', lineHeight: '1.6', color: '#374151' }}>
                    <li>Duplicate payment for the same transaction.</li>
                    <li>Payment debited but ticket/pass not generated due to technical issues.</li>
                    <li>Service unavailability caused by system or operator failure.</li>
                    <li>Cancellation within the allowed window (if applicable).</li>
                </ul>
                <p style={{ fontSize: '15px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Refunds will NOT be issued for:</p>
                <ul style={{ paddingLeft: '20px', margin: '0 0 24px 0', fontSize: '15px', lineHeight: '1.6', color: '#374151' }}>
                    <li>Change of mind after successful ticket/pass issuance.</li>
                    <li>User error (wrong route/date selected).</li>
                    <li>Violation of NexRide Terms.</li>
                </ul>

                <SectionHeader number="3" title="Refund Process" />
                <ul style={{ paddingLeft: '20px', margin: '0 0 24px 0', fontSize: '15px', lineHeight: '1.6', color: '#374151' }}>
                    <li>Users must contact: <a href="mailto:teamnexride@gmail.com" style={{ color: '#2563EB' }}>teamnexride@gmail.com</a></li>
                    <li>Provide Order ID / Transaction ID and reason.</li>
                    <li>Verification will be completed within 7 working days.</li>
                </ul>

                <SectionHeader number="4" title="Refund Mode & Timeline" />
                <ul style={{ paddingLeft: '20px', margin: '0 0 24px 0', fontSize: '15px', lineHeight: '1.6', color: '#374151' }}>
                    <li>Refunds are credited to the original payment method.</li>
                    <li>Amount reflects within 5–10 business days depending on bank/provider.</li>
                </ul>

                <SectionHeader number="5" title="Partial Refunds" />
                <ul style={{ paddingLeft: '20px', margin: '0 0 24px 0', fontSize: '15px', lineHeight: '1.6', color: '#374151' }}>
                    <li>Partial refunds may apply if service delivery was partially affected.</li>
                </ul>

                <SectionHeader number="6" title="Non-Refundable Services" />
                <ul style={{ paddingLeft: '20px', margin: '0 0 0 0', fontSize: '15px', lineHeight: '1.6', color: '#374151' }}>
                    <li>Fully used tickets/passes.</li>
                    <li>Subscription plans after activation.</li>
                </ul>
            </div>
        </LegalLayout >
    );
};

// --- 3. Terms & Conditions Screen ---
export const TermsScreen = ({ onBack }) => {
    const [isLoaded, setIsLoaded] = React.useState(false);

    React.useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 50);
        return () => clearTimeout(timer);
    }, []);

    if (!isLoaded) return <div style={{ position: 'fixed', inset: 0, background: 'white', zIndex: 10001 }} />;

    return (
        <LegalLayout title="Terms & Conditions" onBack={onBack}>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '24px' }}>Last updated: 01-Oct-2025</p>

            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
                <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#374151', marginBottom: '24px' }}>
                    These Terms apply to NexRide (<a href="https://nexride.co.in" style={{ color: '#2563EB', textDecoration: 'none' }}>https://nexride.co.in</a>), operated by Harish BR.
                </p>

                <SectionHeader number="1" title="General" />
                <ul style={{ paddingLeft: '20px', margin: '0 0 24px 0', fontSize: '15px', lineHeight: '1.6', color: '#374151' }}>
                    <li>NexRide is a public transport assistance platform.</li>
                    <li>Content and services may change without prior notice.</li>
                </ul>

                <SectionHeader number="2" title="Use of Service" />
                <ul style={{ paddingLeft: '20px', margin: '0 0 24px 0', fontSize: '15px', lineHeight: '1.6', color: '#374151' }}>
                    <li>Users must provide accurate information.</li>
                    <li>Misuse or fraudulent activity may result in account suspension.</li>
                </ul>

                <SectionHeader number="3" title="Payments" />
                <ul style={{ paddingLeft: '20px', margin: '0 0 24px 0', fontSize: '15px', lineHeight: '1.6', color: '#374151' }}>
                    <li>All payments are final once confirmed, except where refunds are allowed under the Refund Policy.</li>
                </ul>

                <SectionHeader number="4" title="Cancellation & Refund" />
                <ul style={{ paddingLeft: '20px', margin: '0 0 24px 0', fontSize: '15px', lineHeight: '1.6', color: '#374151' }}>
                    <li>Refunds are governed strictly by the NexRide Refund Policy.</li>
                    <li>Cancellation is allowed only if mentioned for a specific service.</li>
                </ul>

                <SectionHeader number="5" title="Liability" />
                <ul style={{ paddingLeft: '20px', margin: '0 0 24px 0', fontSize: '15px', lineHeight: '1.6', color: '#374151' }}>
                    <li>NexRide is not responsible for delays or cancellations caused by operators.</li>
                    <li>We are not liable for bank/payment gateway failures.</li>
                </ul>

                <SectionHeader number="6" title="Digital Services" />
                <ul style={{ paddingLeft: '20px', margin: '0 0 24px 0', fontSize: '15px', lineHeight: '1.6', color: '#374151' }}>
                    <li>NexRide provides digital tickets/passes only.</li>
                    <li>No physical goods are shipped.</li>
                </ul>

                <SectionHeader number="7" title="Privacy" />
                <ul style={{ paddingLeft: '20px', margin: '0 0 24px 0', fontSize: '15px', lineHeight: '1.6', color: '#374151' }}>
                    <li>User data is handled as per applicable Indian laws.</li>
                    <li>Data is used only for service delivery and compliance.</li>
                </ul>

                <SectionHeader number="8" title="Governing Law" />
                <ul style={{ paddingLeft: '20px', margin: '0 0 0 0', fontSize: '15px', lineHeight: '1.6', color: '#374151' }}>
                    <li>Governed by laws of India.</li>
                    <li>Jurisdiction: Erode, Tamil Nadu.</li>
                </ul>
            </div>
        </LegalLayout>
    );
};

const SectionHeader = ({ number, title }) => (
    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111', marginTop: '0', marginBottom: '12px' }}>
        {number}. {title}
    </h3>
);
