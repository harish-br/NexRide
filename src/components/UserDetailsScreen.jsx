import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Camera, Check, User, Mail, Smartphone, Users, HeartHandshake, X } from 'lucide-react';
import { auth, db } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import haptics from '../utils/haptics';
import GlobalLoader from './GlobalLoader';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './LanguageContext';
import defaultProfileIcon from './LottieAnimations/profileicons/profile.svg';
import editIcon from './LottieAnimations/profileicons/edit.svg';

const PRIMARY_ACCENT = '#1569FD';

const UserDetailsScreen = ({ onBack, user: propUser }) => {
    const user = propUser || auth.currentUser;
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const fileInputRef = React.useRef(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        gender: '',
        assistance: '', // 'Yes' or 'No'
        assistanceType: '' // Optional text
    });

    // Original data for comparison (to enable/disable save)
    const [originalData, setOriginalData] = useState({
        name: '',
        email: '',
        gender: '',
        assistance: '',
        assistanceType: ''
    });

    const [isGenderModalOpen, setIsGenderModalOpen] = useState(false);
    const [emailError, setEmailError] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;
            try {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const initialData = {
                        name: data.name || user.displayName || '',
                        email: data.email || user.email || '',
                        gender: data.gender || '',
                        assistance: data.assistance || '',
                        assistanceType: data.assistanceType || ''
                    };
                    setFormData(initialData);
                    setOriginalData(initialData);
                    setProfilePhoto(data.photoUrl || data.photoURL || user.photoURL || null);
                } else {
                    const initialData = {
                        name: user.displayName || '',
                        email: user.email || '',
                        photoUrl: user.photoURL || null,
                        gender: '',
                        assistance: '',
                        assistanceType: '',
                        createdAt: serverTimestamp()
                    };
                    setDoc(docRef, initialData).catch(err => console.error("Auto-create failed", err));
                }
            } catch (error) {
                console.error("Error fetching user details:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [user]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (field === 'email') setEmailError(''); // Clear error on typing
    };



    const handleSave = async () => {
        haptics.medium();

        // 1. Validation
        if (!formData.name.trim()) {
            haptics.error();
            alert(t('user_details.alerts.name_required') || "Name is required");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            haptics.error();
            alert(t('user_details.alerts.invalid_email') || "Please enter a valid email address");
            return;
        }

        if (!formData.gender) {
            haptics.error();
            alert("Please select your gender");
            return;
        }

        if (!formData.assistance) {
            haptics.error();
            alert("Please select if assistance is required");
            return;
        }



        const targetUid = user?.uid || auth.currentUser?.uid;
        if (!targetUid) {
            console.error("CRITICAL: No User UID found for save operation.");
            alert("Error: User session invalid. Please log in again.");
            return;
        }

        setIsSaving(true);
        try {
            console.log("Saving profile for UID:", targetUid, "Authenticated UID:", auth.currentUser?.uid);
            const docRef = doc(db, "users", targetUid);
            const updateData = {
                ...formData,
                photoURL: profilePhoto,
                updatedAt: serverTimestamp(),
                profileCompleted: true
            };

            console.log("Attempting Firestore write at path: users/", user.uid);
            await setDoc(docRef, updateData, { merge: true });
            console.log("Firestore write success");

            try {
                await updateProfile(user, {
                    displayName: formData.name,
                    photoURL: profilePhoto
                });
            } catch (authError) {
                console.error("Error updating auth profile:", authError);
            }

            setOriginalData(formData);
            haptics.success();
            setIsEditing(false); // Return to view mode automatically
            // Do not call onBack() here as per requirements to return to "Your Profile" (view mode)
        } catch (error) {
            console.error("CRITICAL: Error saving profile to Firestore:", error);
            haptics.error();
            // Provide more specific feedback if it's a size issue
            if (error.code === 'out-of-range' || error.message?.includes('too large')) {
                alert("Profile photo is too large. Please select a smaller image (under 500KB).");
            } else {
                alert(`Failed to save profile: ${error.message || 'Please try again.'}`);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        haptics.light();
        setFormData(originalData);
        setIsEditing(false);
    };

    const compressImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // Compress
                    resolve(dataUrl);
                };
            };
        });
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            // Automatically compress if large, or just consistency for all images
            // We use the compressor for everything to ensure uniform size/quality
            const compressed = await compressImage(file);

            // Check size of base64 string (approx)
            // base64 length * 0.75 is byte size
            const sizeInBytes = (compressed.length * 3) / 4;

            if (sizeInBytes > 500 * 1024) {
                // Even after compression if it's too big (very unlikely for 800x800 jpg)
                alert("Image is still too large after compression. Please choose a different image.");
                return;
            }

            setProfilePhoto(compressed);
            haptics.light();
        } catch (err) {
            console.error("Compression error:", err);
            alert("Failed to process image.");
        }
    };

    if (isLoading) return <GlobalLoader />;

    return (
        <div style={{
            position: 'fixed', inset: 0,
            backgroundColor: '#F7F8FA', zIndex: 50,
            display: 'flex', flexDirection: 'column',
            overflowX: 'hidden',
            direction: isRTL ? 'rtl' : 'ltr'
        }}>
            {/* Header */}
            <div style={{
                padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.05)',
                zIndex: 10, minHeight: '60px'
            }}>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { haptics.light(); isEditing ? handleCancel() : onBack(); }}
                    style={{
                        background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '50%',
                        width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                >
                    <ChevronLeft size={22} color="#1F2937" style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                </motion.button>

                <h1 style={{ fontSize: '18px', fontWeight: '600', color: '#1C1C1E', margin: 0 }}>
                    {isEditing ? t('user_details.edit_title') : t('user_details.title')}
                </h1>

                {!isEditing ? (
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { haptics.light(); setIsEditing(true); }}
                        style={{
                            background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '100px',
                            padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px',
                            cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                            fontSize: '14px', fontWeight: '600', color: '#1F2937'
                        }}
                    >
                        <img src={editIcon} alt="Edit" style={{ width: '16px', height: '16px' }} />
                        {t('user_details.edit')}
                    </motion.button>
                ) : (
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSave}
                        disabled={isSaving}
                        style={{
                            background: '#F3F4F6', // Match Edit pill background
                            border: '1px solid #E5E7EB', // Match Edit pill border
                            borderRadius: '100px',
                            padding: '8px 16px', // Match Edit pill padding
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px', // Match Edit pill gap
                            cursor: isSaving ? 'default' : 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)', // Match Edit pill shadow
                            fontSize: '14px',
                            fontWeight: '600',
                            color: isSaving ? '#9CA3AF' : PRIMARY_ACCENT // Blue color
                        }}
                    >
                        {isSaving && (
                            <div style={{ width: '16px', height: '16px', border: '2px solid #9CA3AF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        )}
                        {isSaving ? t('user_details.done') : t('user_details.save')}
                    </motion.button>
                )}
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <div style={{ padding: '32px 24px 120px 24px' }}>

                    {/* Avatar Section */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                width: '100px', height: '100px', borderRadius: '50%',
                                backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB',
                                overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {profilePhoto ? (
                                    <img src={profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <img src={defaultProfileIcon} alt="Profile" style={{ width: '48px', height: '48px', opacity: 0.2 }} />
                                )}
                            </div>

                            {isEditing && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    onClick={() => fileInputRef.current.click()}
                                    style={{
                                        position: 'absolute', bottom: '0', right: '0',
                                        width: '32px', height: '32px', borderRadius: '50%',
                                        backgroundColor: PRIMARY_ACCENT, border: '3px solid #F7F8FA',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', color: '#FFF', boxShadow: '0 2px 8px rgba(21,105,253,0.3)'
                                    }}
                                >
                                    <Camera size={14} />
                                </motion.div>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" style={{ display: 'none' }} />
                    </div>

                    {/* Form Fields */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>

                        <Field
                            label={t('user_details.name')}
                            value={formData.name}
                            isEditing={isEditing}
                            onChange={(val) => handleChange('name', val)}
                            onEditClick={() => setIsEditing(true)}
                            placeholder={t('user_details.placeholders.name')}
                        />

                        <Field
                            label={t('user_details.mobile')}
                            value={user?.phoneNumber || ""}
                            isReadOnly={true}
                            verified={true}
                            verifiedLabel={t('user_details.verified')}
                        />

                        <Field
                            label={t('user_details.email')}
                            value={formData.email}
                            isEditing={isEditing}
                            onChange={(val) => handleChange('email', val)}
                            onEditClick={() => setIsEditing(true)}
                            placeholder={t('user_details.placeholders.email')}
                            error={emailError}
                        />

                        <Field
                            label={t('user_details.gender')}
                            value={formData.gender}
                            isEditing={isEditing}
                            type="select"
                            onEditClick={() => { setIsEditing(true); setIsGenderModalOpen(true); haptics.light(); }}
                            placeholder={t('user_details.placeholders.gender')}
                        />

                        <Field
                            label={t('user_details.assistance')}
                            subLabel={t('user_details.assistance_description')}
                            value={formData.assistance}
                            isEditing={isEditing}
                            type="binary"
                            options={['Yes', 'No']}
                            onChange={(val) => handleChange('assistance', val)}
                            onEditClick={() => setIsEditing(true)}
                            placeholder={t('user_details.placeholders.assistance')}
                        />

                        {formData.assistance === 'Yes' && isEditing && (
                            <Field
                                label="Type of assistance (optional)"
                                value={formData.assistanceType}
                                isEditing={isEditing}
                                onChange={(val) => handleChange('assistanceType', val)}
                                placeholder="E.g. Wheelchair, Visual guide"
                            />
                        )}

                        {formData.assistance === 'Yes' && !isEditing && formData.assistanceType && (
                            <Field
                                label="Type of assistance"
                                value={formData.assistanceType}
                                isReadOnly={true}
                            />
                        )}
                    </div>
                </div>
            </div>


            {/* Gender Bottom Sheet */}
            <AnimatePresence>
                {isGenderModalOpen && (
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 100,
                        display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
                    }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsGenderModalOpen(false)}
                            transition={{ duration: 0.15 }}
                            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(1px)' }}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                            style={{
                                width: '100%', maxWidth: '480px', backgroundColor: '#FFFFFF',
                                borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
                                padding: '20px 0 40px 0', position: 'relative', zIndex: 101,
                                display: 'flex', flexDirection: 'column',
                                boxShadow: '0 -10px 40px rgba(0,0,0,0.05)'
                            }}
                        >
                            <div style={{ width: '36px', height: '4px', backgroundColor: '#E5E7EB', borderRadius: '2px', alignSelf: 'center', marginBottom: '20px' }} />

                            <div style={{ padding: '0 24px 16px 24px', borderBottom: '1px solid #F1F5F9', marginBottom: '8px' }}>
                                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1C1C1E', margin: 0, textAlign: 'center' }}>
                                    Select Gender
                                </h2>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {[
                                    t('user_details.gender_options.male'),
                                    t('user_details.gender_options.female'),
                                    t('user_details.gender_options.other'),
                                    t('user_details.gender_options.prefer_not_to_say')
                                ].map((option, index, arr) => (
                                    <div
                                        key={option}
                                        onClick={() => {
                                            handleChange('gender', option);
                                            setIsGenderModalOpen(false);
                                            haptics.light();
                                        }}
                                        style={{
                                            padding: '16px 24px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            cursor: 'pointer',
                                            backgroundColor: '#FFFFFF',
                                            transition: 'background-color 0.2s'
                                        }}
                                    >
                                        <span style={{
                                            fontSize: '16px',
                                            fontWeight: '400',
                                            color: '#1C1C1E'
                                        }}>
                                            {option}
                                        </span>
                                        <RadioButton selected={formData.gender === option} />

                                        {index < arr.length - 1 && (
                                            <div style={{
                                                position: 'absolute', bottom: 0, left: '24px', right: '24px',
                                                height: '1px', backgroundColor: '#F1F5F9', pointerEvents: 'none'
                                            }} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

const RadioButton = ({ selected, color = PRIMARY_ACCENT }) => (
    <div style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        border: `2px solid ${selected ? color : '#D1D5DB'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        backgroundColor: '#FFFFFF',
        flexShrink: 0
    }}>
        {selected && (
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: color
                }}
            />
        )}
    </div>
);

const Field = ({ label, subLabel, value, isEditing, onChange, placeholder, isReadOnly, verified, type = 'text', options, addLabel, verifiedLabel, onEditClick, error }) => {
    const { t } = useTranslation();
    const isEmpty = !value || value.trim() === '';

    return (
        <div style={{
            padding: '20px 0',
            borderBottom: '1px solid rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: error ? '#EF4444' : '#9CA3AF', textTransform: 'none' }}>
                    {label}
                </span>
                {subLabel && (
                    <span style={{ fontSize: '11px', fontWeight: '500', color: '#CBD5E1' }}>
                        {subLabel}
                    </span>
                )}
            </div>

            {!isEditing || isReadOnly ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '26px' }}>
                    {isEmpty ? (
                        <button
                            onClick={() => { haptics.light(); onEditClick && onEditClick(); }}
                            style={{
                                background: 'none', border: 'none', padding: 0,
                                color: PRIMARY_ACCENT, fontSize: '15px', fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            {addLabel || t('user_details.add_now')}
                        </button>
                    ) : (
                        <div
                            onClick={() => { if (!isReadOnly) { haptics.light(); onEditClick && onEditClick(); } }}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isReadOnly ? 'default' : 'pointer', width: '100%' }}
                        >
                            <span style={{ fontSize: '16px', fontWeight: '600', color: '#1C1C1E' }}>
                                {value}
                            </span>
                            {verified && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    color: PRIMARY_ACCENT, fontSize: '12px', fontWeight: 600
                                }}>
                                    <Check size={14} strokeWidth={3} />
                                    {verifiedLabel || t('user_details.verified')}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ width: '100%' }}>
                    {type === 'select' ? (
                        <div
                            onClick={onEditClick}
                            style={{
                                width: '100%', padding: '12px 0', display: 'flex', justifyContent: 'space-between',
                                alignItems: 'center', borderBottom: `1px solid ${PRIMARY_ACCENT}40`,
                                cursor: 'pointer'
                            }}
                        >
                            <span style={{
                                fontSize: '16px', fontWeight: '600',
                                color: isEmpty ? '#9CA3AF' : '#111827'
                            }}>
                                {isEmpty ? placeholder : value}
                            </span>
                        </div>
                    ) : type === 'binary' ? (
                        <div style={{ display: 'flex', gap: '20px', marginTop: '4px' }}>
                            {options.map((opt) => (
                                <div
                                    key={opt}
                                    onClick={() => { onChange(opt); haptics.light(); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        cursor: 'pointer', padding: '8px 16px', borderRadius: '12px',
                                        backgroundColor: value === opt ? '#F0F7FF' : '#F8FAFC',
                                        border: `1.5px solid ${value === opt ? PRIMARY_ACCENT : 'transparent'}`
                                    }}
                                >
                                    <RadioButton selected={value === opt} />
                                    <span style={{ fontSize: '15px', fontWeight: '600', color: '#1C1C1E' }}>{opt}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <input
                            type="text"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={placeholder}
                            style={{
                                width: '100%', background: 'transparent', border: 'none',
                                borderBottom: `1px solid ${PRIMARY_ACCENT}40`,
                                padding: '4px 0', fontSize: '16px', fontWeight: '600', color: '#111827',
                                outline: 'none'
                            }}
                            autoFocus={label === t('user_details.name')}
                        />
                    )}
                    {error && (
                        <div style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px', fontWeight: '500' }}>
                            {error}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


export default UserDetailsScreen;
