import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import haptics from '../utils/haptics';
import { useTranslation } from 'react-i18next';

const RadioButton = ({ selected, color = '#3B82F6' }) => (
    <div style={{
        width: '22px',
        height: '22px',
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

const LanguageSettingsScreen = ({ onBack }) => {
    const { t } = useTranslation();
    const { languages, currentLanguage, changeLanguage, isRTL } = useLanguage();

    const handleSelect = (code) => {
        if (code !== currentLanguage) {
            haptics.medium();
            changeLanguage(code);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#FFFFFF',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            direction: isRTL ? 'rtl' : 'ltr'
        }}>
            {/* Header */}
            <div style={{
                padding: '24px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
            }}>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={onBack}
                    style={{
                        border: 'none',
                        background: '#F8FAFC',
                        padding: '10px',
                        borderRadius: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <ArrowLeft size={22} color="#0F172A" style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                </motion.button>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#0F172A' }}>
                    {t('profile.language')}
                </h2>
            </div>

            {/* Language List */}
            <div style={{ padding: '0 20px', flex: 1, overflowY: 'auto', paddingTop: '8px' }}>
                <p style={{ color: '#64748B', fontSize: '15px', marginBottom: '24px', fontWeight: '500' }}>
                    {t('profile.select_language')}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '100px' }}>
                    {languages.map((lang) => {
                        const isSelected = currentLanguage === lang.code;
                        return (
                            <motion.div
                                key={lang.code}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleSelect(lang.code)}
                                style={{
                                    padding: '16px 20px',
                                    borderRadius: '16px',
                                    backgroundColor: isSelected ? '#F0F7FF' : '#FFFFFF',
                                    border: `1.5px solid ${isSelected ? '#3B82F6' : '#F1F5F9'}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.08)' : 'none'
                                }}
                            >
                                <RadioButton selected={isSelected} />
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                                    <span style={{
                                        fontSize: '17px',
                                        fontWeight: '600',
                                        color: isSelected ? '#1E40AF' : '#1F2937'
                                    }}>
                                        {lang.nativeName}
                                    </span>
                                    <span style={{
                                        fontSize: '14px',
                                        fontWeight: '400',
                                        color: isSelected ? '#3B82F6' : '#64748B',
                                        marginTop: '2px'
                                    }}>
                                        {lang.englishName}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Actions */}
            <div style={{
                padding: '24px 20px',
                paddingBottom: '40px', // Added padding for safe area
                backgroundColor: '#FFFFFF',
                borderTop: '1px solid #F1F5F9',
                boxShadow: '0 -10px 20px rgba(0,0,0,0.02)'
            }}>
                <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={onBack}
                    style={{
                        width: '100%',
                        padding: '18px',
                        borderRadius: '16px',
                        backgroundColor: '#1569fd', // Primary Blue
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                >
                    Confirm App Language
                </motion.button>
                <p style={{ margin: '16px 0 0 0', fontSize: '13px', color: '#94A3B8', textAlign: 'center', lineHeight: '1.5', fontWeight: '400' }}>
                    {t('profile.language_saved_info')}
                </p>
            </div>
        </div>
    );
};

export default LanguageSettingsScreen;
