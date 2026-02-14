import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './LanguageContext';
import {
    Shield, Phone, Heart, Users, CheckCircle, ChevronRight,
    ArrowLeft, Bell, AlertTriangle, ScrollText, Smartphone,
    Lock, Info, Plus, UserPlus, Trash2, Search, X, Clock, Navigation
} from 'lucide-react';
import haptics from '../utils/haptics';
import { Contacts } from '@capacitor-community/contacts';
import GlobalLoader from './GlobalLoader';
import WomenSafetyScreen from './WomenSafetyScreen';
import Lottie from 'lottie-react';
import WomenSafetyAnim from './LottieAnimations/Women.json';

/* ------------------- UI COMPONENTS ------------------- */

const ViewHeader = ({ title, onBack }) => {
    const { isRTL } = useLanguage();
    return (
        <div style={{
            padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#FFFFFF', position: 'relative', borderBottom: '1px solid #F1F5F9'
        }}>
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { haptics.light(); onBack(); }}
                style={{
                    background: 'none', border: 'none', padding: '4px', cursor: 'pointer',
                    position: 'absolute', left: isRTL ? 'auto' : '16px', right: isRTL ? '16px' : 'auto'
                }}
            >
                <ArrowLeft size={24} color="#1F293B" style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} />
            </motion.button>
            <h1 style={{ fontSize: '17px', fontWeight: '600', color: '#1E293B', margin: 0 }}>{title}</h1>
        </div>
    );
};

const InfoTile = ({ icon: Icon, title, color, onClick }) => {
    const { isRTL } = useLanguage();
    return (
        <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={() => { haptics.light(); onClick(); }}
            style={{
                backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '16px',
                display: 'flex', flexDirection: 'column', alignItems: isRTL ? 'flex-end' : 'flex-start',
                gap: '8px', border: '1px solid #F1F5F9', cursor: 'pointer',
                textAlign: isRTL ? 'right' : 'left'
            }}
        >
            <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                backgroundColor: `${color}10`, display: 'flex',
                alignItems: 'center', justifyContent: 'center'
            }}>
                <Icon size={20} color={color} />
            </div>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1F293B', margin: 0 }}>{title}</h3>
        </motion.div>
    );
};

const ToolCard = ({ icon: Icon, title, description, color, onClick, isLast, lottieAnim = null }) => {
    const { isRTL } = useLanguage();
    return (
        <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={() => { haptics.light(); onClick(); }}
            style={{
                backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '20px',
                display: 'flex', alignItems: 'center', gap: '16px', marginBottom: isLast ? 0 : '12px',
                border: '1px solid #F1F5F9', cursor: 'pointer',
                flexDirection: isRTL ? 'row-reverse' : 'row'
            }}
        >
            <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                backgroundColor: `${color}10`, display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
                {lottieAnim ? (
                    <Lottie animationData={lottieAnim} loop={true} style={{ width: '100%', height: '100%' }} />
                ) : (
                    <Icon size={24} color={color} />
                )}
            </div>
            <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1F293B', margin: 0 }}>{title}</h3>
                <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0', lineHeight: '1.4' }}>{description}</p>
            </div>
            <ChevronRight size={20} color="#CBD5E1" style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} />
        </motion.div>
    );
};

const CheckInOption = ({ icon: Icon, label }) => {
    const { isRTL } = useLanguage();
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            flexDirection: isRTL ? 'row-reverse' : 'row'
        }}>
            <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                backgroundColor: '#F1F5F9', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
                <Icon size={20} color="#64748B" />
            </div>
            <span style={{ fontSize: '15px', color: '#334155', fontWeight: '500', flex: 1, textAlign: isRTL ? 'right' : 'left' }}>{label}</span>
        </div>
    );
};

/* ------------------- SUB-VIEWS ------------------- */

const ContactsView = ({ onBack, contacts, onAdd, onRemove }) => {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();

    return (
        <div style={{ flex: 1, backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <ViewHeader title={t('safety.contacts_title')} onBack={onBack} />
            <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.6', margin: '0 0 24px 0', textAlign: isRTL ? 'right' : 'left' }}>
                    {t('safety.contacts_desc')}
                </p>

                {contacts.length === 0 ? (
                    <div style={{
                        padding: '40px 20px', backgroundColor: '#F9FAFB', borderRadius: '24px',
                        border: '2px dashed #E5E7EB', textAlign: 'center'
                    }}>
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#FFFFFF',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                        }}>
                            <Users size={32} color="#94A3B8" />
                        </div>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1F293B', marginBottom: '8px' }}>
                            {t('safety.no_contacts')}
                        </h3>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {contacts.map((contact, index) => (
                            <div key={index} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '16px', borderRadius: '16px',
                                backgroundColor: '#F9FAFB', border: '1px solid #F1F5F9',
                                flexDirection: isRTL ? 'row-reverse' : 'row'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '50%',
                                        backgroundColor: '#EFF6FF', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 600, color: '#3B82F6', fontSize: '18px'
                                    }}>
                                        {contact.name.charAt(0)}
                                    </div>
                                    <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                                        <div style={{ fontSize: '16px', fontWeight: 600, color: '#1E293B', marginBottom: '2px' }}>{contact.name}</div>
                                        <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                                            <span style={{ fontWeight: '500' }}>{t(`safety.relations.${contact.relation}`)}</span>
                                            <div style={{ width: '1px', height: '12px', backgroundColor: '#CBD5E1' }} />
                                            <span>{contact.number}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onRemove(index)}
                                    style={{
                                        width: '36px', height: '36px', borderRadius: '50%',
                                        backgroundColor: 'transparent', border: '1px solid #E2E8F0',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                >
                                    <Trash2 size={16} color="#94A3B8" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={onAdd}
                    disabled={contacts.length >= 3}
                    style={{
                        width: '100%', padding: '16px', backgroundColor: contacts.length >= 3 ? '#F1F5F9' : '#3B82F6',
                        borderRadius: '16px', border: 'none', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', gap: '10px',
                        color: contacts.length >= 3 ? '#94A3B8' : '#FFFFFF', fontWeight: 600, fontSize: '15px',
                        flexDirection: isRTL ? 'row-reverse' : 'row'
                    }}
                >
                    {contacts.length >= 3 ? (
                        <span>{t('safety.limit_reached')}</span>
                    ) : (
                        <>
                            <Plus size={20} />
                            <span>{t('safety.add_contact')}</span>
                        </>
                    )}
                </motion.button>
            </div>
        </div>
    );
};

const CheckInView = ({ onBack, enabled, onToggle }) => {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();

    return (
        <div style={{ flex: 1, backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
            <ViewHeader title={t('safety.checkin_title')} onBack={onBack} />
            <div style={{ padding: '24px' }}>
                <div style={{
                    padding: '20px', backgroundColor: '#F0FDF4', borderRadius: '20px',
                    display: 'flex', gap: '16px', marginBottom: '24px',
                    flexDirection: isRTL ? 'row-reverse' : 'row'
                }}>
                    <div style={{
                        width: '44px', height: '44px', borderRadius: '12px',
                        backgroundColor: '#DCFCE7', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                        <Smartphone size={24} color="#15803D" />
                    </div>
                    <p style={{ fontSize: '14px', color: '#166534', margin: 0, lineHeight: '1.5', fontWeight: '500', textAlign: isRTL ? 'right' : 'left' }}>
                        {t('safety.checkin_info')}
                    </p>
                </div>

                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1F293B', marginBottom: '16px', textAlign: isRTL ? 'right' : 'left' }}>
                    {t('safety.checkin_when')}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                    <CheckInOption icon={Clock} label={t('safety.checkin_hours')} />
                    <CheckInOption icon={Navigation} label={t('safety.checkin_duration')} />
                </div>

                <div style={{
                    padding: '20px', backgroundColor: '#F8FAFC', borderRadius: '24px',
                    border: '1px solid #F1F5F9'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                        <span style={{ fontSize: '16px', fontWeight: 600, color: '#1F293B' }}>{t('safety.enable_checkin')}</span>
                        <motion.div
                            whileTap={{ scale: 0.9 }}
                            onClick={() => { haptics.light(); onToggle(); }}
                            style={{
                                width: '52px', height: '32px', borderRadius: '16px',
                                backgroundColor: enabled ? '#10B981' : '#E5E7EB',
                                position: 'relative', cursor: 'pointer'
                            }}
                        >
                            <motion.div
                                animate={{ x: enabled ? (isRTL ? -20 : 20) : 0 }}
                                style={{
                                    width: '24px', height: '24px', borderRadius: '12px',
                                    backgroundColor: '#FFFFFF', position: 'absolute', top: '4px',
                                    left: isRTL ? 'auto' : '4px', right: isRTL ? '4px' : 'auto',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            />
                        </motion.div>
                    </div>
                    <p style={{ fontSize: '13px', color: '#64748B', margin: 0, textAlign: isRTL ? 'right' : 'left' }}>
                        {t('safety.checkin_footer')}
                    </p>
                </div>
            </div>
        </div>
    );
};

/* ------------------- MAIN COMPONENT ------------------- */

const SafetyScreen = ({ onBack }) => {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const [currentView, setCurrentView] = useState('hub'); // hub, contacts, checkin, women-safety, info-privacy, etc.
    const [isLoadingSetup, setIsLoadingSetup] = useState(true);
    const [setupState, setSetupState] = useState({
        trustedContacts: false,
        safetyCheckins: false,
        emergencyActions: false
    });
    const [trustedContactsList, setTrustedContactsList] = useState([]);
    const [isSafetyCompleted, setIsSafetyCompleted] = useState(false);

    // Manual Add State
    const [manualContact, setManualContact] = useState({ name: '', relation: 'friend', number: '' });
    const relations = ['parent', 'spouse', 'sibling', 'friend', 'relative', 'other'];

    useEffect(() => {
        if (!auth.currentUser) {
            setIsLoadingSetup(false);
            return;
        }
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.safetySetup) {
                    setSetupState({
                        trustedContacts: data.safetySetup.trustedContacts || false,
                        safetyCheckins: data.safetySetup.safetyCheckins || false,
                        emergencyActions: data.safetySetup.emergencyActions || false
                    });
                    setTrustedContactsList(data.safetySetup.contactsList || []);
                    setIsSafetyCompleted(data.safetySetupCompleted || false);
                }
            }
            setIsLoadingSetup(false);
        });
        return () => unsubscribe();
    }, []);

    const updateSafetyInFirestore = async (newState, newContactsList, completedStatus) => {
        if (!auth.currentUser) return;
        const allDone = newState.trustedContacts && newState.safetyCheckins && newState.emergencyActions;
        const finalCompleted = completedStatus || allDone;
        try {
            const userDocRef = doc(db, "users", auth.currentUser.uid);
            await setDoc(userDocRef, {
                safetySetup: { ...newState, contactsList: newContactsList },
                safetySetupCompleted: finalCompleted
            }, { merge: true });
            if (finalCompleted) setIsSafetyCompleted(true);
        } catch (error) {
            console.error("Error updating safety setup:", error);
        }
    };

    const handleFeatureTap = (feature) => {
        haptics.light();
        if (feature === 'emergencyActions') {
            const newState = { ...setupState, emergencyActions: true };
            setSetupState(newState);
            updateSafetyInFirestore(newState, trustedContactsList, isSafetyCompleted);
            setCurrentView('info-emergency');
        } else if (feature === 'trustedContacts') {
            setCurrentView('contacts');
        } else if (feature === 'safetyCheckins') {
            setCurrentView('checkin');
        } else if (feature === 'womenSafety') {
            setCurrentView('women-safety');
        } else if (feature === 'privacy') {
            setCurrentView('info-privacy');
        } else if (feature === 'account') {
            setCurrentView('info-account');
        } else if (feature === 'community') {
            setCurrentView('info-community');
        }
    };

    const handleCall = (number, name) => {
        haptics.heavy();
        const confirmed = window.confirm(t('safety.call_confirm', { name, number }));
        if (confirmed) window.location.href = `tel:${number}`;
    };

    const handleManualSubmit = () => {
        if (manualContact.name && manualContact.number) {
            const newList = [...trustedContactsList, manualContact];
            const newState = { ...setupState, trustedContacts: true };
            setTrustedContactsList(newList);
            setSetupState(newState);
            updateSafetyInFirestore(newState, newList, isSafetyCompleted);
            haptics.success();
            setCurrentView('contacts');
        }
    };

    if (isLoadingSetup) return <GlobalLoader message={t('common.loading')} />;

    if (currentView === 'women-safety') return <WomenSafetyScreen onBack={() => setCurrentView('hub')} />;
    if (currentView === 'contacts') return (
        <ContactsView
            onBack={() => setCurrentView('hub')}
            contacts={trustedContactsList}
            onAdd={() => setCurrentView('add-contact')}
            onRemove={(idx) => {
                const newList = [...trustedContactsList];
                newList.splice(idx, 1);
                const newState = { ...setupState, trustedContacts: newList.length > 0 };
                setTrustedContactsList(newList);
                setSetupState(newState);
                updateSafetyInFirestore(newState, newList, isSafetyCompleted);
            }}
        />
    );
    if (currentView === 'checkin') return (
        <CheckInView
            onBack={() => setCurrentView('hub')}
            enabled={setupState.safetyCheckins}
            onToggle={() => {
                const newState = { ...setupState, safetyCheckins: !setupState.safetyCheckins };
                setSetupState(newState);
                updateSafetyInFirestore(newState, trustedContactsList, isSafetyCompleted);
            }}
        />
    );

    if (currentView === 'add-contact') return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'white', zIndex: 110, display: 'flex', flexDirection: 'column', direction: isRTL ? 'rtl' : 'ltr' }}>
            <ViewHeader title={t('safety.add_contact')} onBack={() => setCurrentView('contacts')} />
            <div style={{ padding: '24px', flex: 1 }}>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px', textAlign: isRTL ? 'right' : 'left' }}>{t('user_details.name')}</label>
                    <input
                        type="text"
                        value={manualContact.name}
                        onChange={(e) => setManualContact({ ...manualContact, name: e.target.value })}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', textAlign: isRTL ? 'right' : 'left' }}
                    />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px', textAlign: isRTL ? 'right' : 'left' }}>{t('user_details.mobile')}</label>
                    <input
                        type="tel"
                        value={manualContact.number}
                        onChange={(e) => setManualContact({ ...manualContact, number: e.target.value.replace(/\D/g, '') })}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', textAlign: isRTL ? 'right' : 'left' }}
                    />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px', textAlign: isRTL ? 'right' : 'left' }}>{t('user_details.gender')}</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                        {relations.map(rel => (
                            <button
                                key={rel}
                                onClick={() => setManualContact({ ...manualContact, relation: rel })}
                                style={{
                                    padding: '8px 16px', borderRadius: '100px',
                                    border: manualContact.relation === rel ? '1px solid #3B82F6' : '1px solid #E2E8F0',
                                    backgroundColor: manualContact.relation === rel ? '#EFF6FF' : '#FFFFFF',
                                    color: manualContact.relation === rel ? '#3B82F6' : '#64748B',
                                    fontSize: '14px', fontWeight: '500'
                                }}
                            >
                                {t(`safety.relations.${rel}`)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div style={{ padding: '24px' }}>
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleManualSubmit}
                    disabled={!manualContact.name || !manualContact.number}
                    style={{
                        width: '100%', padding: '16px', borderRadius: '16px',
                        backgroundColor: (manualContact.name && manualContact.number) ? '#3B82F6' : '#CBD5E1',
                        color: 'white', border: 'none', fontWeight: 600, fontSize: '16px'
                    }}
                >
                    {t('user_details.save')}
                </motion.button>
            </div>
        </div>
    );

    return (
        <div style={{
            position: 'fixed', inset: 0, backgroundColor: '#F9FAFB', zIndex: 100,
            display: 'flex', flexDirection: 'column', overflowX: 'hidden',
            direction: isRTL ? 'rtl' : 'ltr'
        }}>
            <ViewHeader title={t('safety.hub_title')} onBack={() => onBack()} />

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 80px' }}>
                <div style={{ marginTop: '24px', marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', textAlign: isRTL ? 'right' : 'left' }}>
                        {t('safety.tools_title')}
                    </h2>
                    <ToolCard
                        color="#EC4899"
                        lottieAnim={WomenSafetyAnim}
                        title={t('safety.women_safety')}
                        description={t('safety.women_safety_desc')}
                        onClick={() => handleFeatureTap('womenSafety')}
                    />
                    <ToolCard
                        icon={Bell}
                        color="#F59E0B"
                        title={t('safety.preferences')}
                        description={t('safety.preferences_desc')}
                        onClick={() => handleFeatureTap('emergencyActions')}
                    />
                    <ToolCard
                        icon={Shield}
                        color="#3B82F6"
                        title={t('safety.manage_contacts')}
                        description={t('safety.manage_contacts_desc')}
                        onClick={() => handleFeatureTap('trustedContacts')}
                    />
                    <ToolCard
                        icon={Smartphone}
                        color="#10B981"
                        title={t('safety.checkin')}
                        description={t('safety.checkin_desc')}
                        onClick={() => handleFeatureTap('safetyCheckins')}
                        isLast
                    />
                </div>

                <div style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', textAlign: isRTL ? 'right' : 'left' }}>
                        {t('safety.know_more_title')}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <InfoTile icon={Search} title={t('safety.tips')} color="#6366F1" onClick={() => handleFeatureTap('community')} />
                        <InfoTile icon={Lock} title={t('safety.data_privacy')} color="#14B8A6" onClick={() => handleFeatureTap('privacy')} />
                        <InfoTile icon={Shield} title={t('safety.nexride_safety')} color="#F43F5E" onClick={() => handleFeatureTap('account')} />
                        <InfoTile icon={ScrollText} title={t('safety.guidelines')} color="#8B5CF6" onClick={() => handleFeatureTap('community')} />
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {currentView.startsWith('info-') && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        style={{
                            position: 'absolute', inset: 0, backgroundColor: 'white', zIndex: 120,
                            padding: '24px', paddingTop: '64px', overflowY: 'auto'
                        }}
                    >
                        <button
                            onClick={() => setCurrentView('hub')}
                            style={{ position: 'absolute', top: '24px', right: isRTL ? 'auto' : '24px', left: isRTL ? '24px' : 'auto', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <X size={20} color="#475569" />
                        </button>

                        {currentView === 'info-privacy' && (
                            <>
                                <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#1E293B', marginBottom: '16px' }}>{t('safety.data_privacy')}</h2>
                                <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#334155' }}>{t('safety.info.privacy_desc')}</p>
                                <ul style={{ fontSize: '14px', lineHeight: '1.6', color: '#475569', paddingLeft: isRTL ? '0' : '20px', paddingRight: isRTL ? '20px' : '0' }}>
                                    {t('safety.info.privacy_list', { returnObjects: true }).map((item, i) => (
                                        <li key={i} style={{ marginBottom: '8px', textAlign: isRTL ? 'right' : 'left' }}>{item}</li>
                                    ))}
                                </ul>
                            </>
                        )}

                        {currentView === 'info-account' && (
                            <>
                                <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#1E293B', marginBottom: '16px' }}>{t('safety.account_security')}</h2>
                                <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#334155' }}>{t('safety.info.account_desc')}</p>
                                <ul style={{ fontSize: '14px', lineHeight: '1.6', color: '#475569', paddingLeft: isRTL ? '0' : '20px', paddingRight: isRTL ? '20px' : '0' }}>
                                    {t('safety.info.account_list', { returnObjects: true }).map((item, i) => (
                                        <li key={i} style={{ marginBottom: '8px', textAlign: isRTL ? 'right' : 'left' }}>{item}</li>
                                    ))}
                                </ul>
                            </>
                        )}

                        {currentView === 'info-community' && (
                            <>
                                <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#1E293B', marginBottom: '16px' }}>{t('safety.guidelines')}</h2>
                                <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#334155' }}>{t('safety.info.guidelines_desc')}</p>
                                <ul style={{ fontSize: '14px', lineHeight: '1.6', color: '#475569', paddingLeft: isRTL ? '0' : '20px', paddingRight: isRTL ? '20px' : '0' }}>
                                    {t('safety.info.guidelines_list', { returnObjects: true }).map((item, i) => (
                                        <li key={i} style={{ marginBottom: '8px', textAlign: isRTL ? 'right' : 'left' }}>{item}</li>
                                    ))}
                                </ul>
                            </>
                        )}

                        {currentView === 'info-emergency' && (
                            <>
                                <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#1E293B', marginBottom: '16px', textAlign: isRTL ? 'right' : 'left' }}>{t('safety.emergency_actions')}</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <EmergencyCallCard icon={Shield} title={t('safety.emergency.police')} number="100" onClick={() => handleCall('100', 'Police')} />
                                    <EmergencyCallCard icon={Phone} title={t('safety.emergency.medical')} number="108" color="#EF4444" onClick={() => handleCall('108', 'Ambulance')} />
                                    <EmergencyCallCard icon={AlertTriangle} title={t('safety.emergency.women_helpline')} number="1091" color="#EC4899" onClick={() => handleCall('1091', 'Women Helpline')} />
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const EmergencyCallCard = ({ icon: Icon, title, number, color = "#1F2937", onClick }) => {
    const { isRTL } = useLanguage();
    return (
        <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: '16px', padding: '16px',
                backgroundColor: '#F9FAFB', borderRadius: '16px', border: '1px solid #E5E7EB',
                cursor: 'pointer', flexDirection: isRTL ? 'row-reverse' : 'row'
            }}
        >
            <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                backgroundColor: `${color}10`, display: 'flex',
                alignItems: 'center', justifyContent: 'center'
            }}>
                <Icon size={20} color={color} />
            </div>
            <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>{title}</div>
                <div style={{ fontSize: '14px', color: '#6B7280', fontWeight: '600' }}>{number}</div>
            </div>
            <Phone size={20} color={color} />
        </motion.div>
    );
};

export default SafetyScreen;
