import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n';
import { db, auth } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import haptics from '../utils/haptics';

const LanguageContext = createContext({
    currentLanguage: 'en',
    languages: [],
    changeLanguage: () => { console.warn("Default context changeLanguage called"); },
    isRTL: false
});

export const languages = [
    { code: 'ta', nativeName: 'தமிழ்', englishName: 'Tamil', dir: 'ltr' },
    { code: 'en', nativeName: 'English', englishName: 'English', dir: 'ltr' },
    { code: 'hi', nativeName: 'हिंदी', englishName: 'Hindi', dir: 'ltr' },
    { code: 'te', nativeName: 'తెలుగు', englishName: 'Telugu', dir: 'ltr' },
    { code: 'ar', nativeName: 'العربية', englishName: 'Arabic', dir: 'rtl' },
    { code: 'zh', nativeName: '中文（简体）', englishName: 'Chinese', dir: 'ltr' },
];

export const LanguageProvider = ({ children }) => {
    const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');
    const [isRTL, setIsRTL] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Initial setup
        const storedLang = localStorage.getItem('i18nextLng');
        if (storedLang) {
            handleLanguageChange(storedLang, false);
        } else {
            detectInitialLanguage();
        }

        // Auth listener for Firestore sync
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                syncLanguageWithFirestore(currentUser);
            }
        });

        return () => unsubscribe();
    }, []);

    const detectInitialLanguage = () => {
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang.includes('ta')) {
            handleLanguageChange('ta', false);
        } else {
            handleLanguageChange('en', false);
        }
    };

    const syncLanguageWithFirestore = async (currentUser) => {
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            const docSnap = await getDoc(userRef);
            if (docSnap.exists() && docSnap.data().language) {
                const cloudLang = docSnap.data().language;
                if (cloudLang !== currentLanguage) {
                    handleLanguageChange(cloudLang, false);
                }
            }
        } catch (error) {
            console.error('Error syncing language with Firestore:', error);
        }
    };

    const handleLanguageChange = async (langCode, shouldSync = true) => {
        const lang = languages.find((l) => l.code === langCode) || languages[1];

        i18n.changeLanguage(langCode).catch(err => console.error("i18n error:", err));

        setCurrentLanguage(langCode);
        setIsRTL(lang.dir === 'rtl');

        document.documentElement.dir = lang.dir;
        document.documentElement.lang = langCode;

        if (shouldSync) {
            haptics.medium();
            localStorage.setItem('i18nextLng', langCode);
            if (auth.currentUser) {
                try {
                    const userRef = doc(db, 'users', auth.currentUser.uid);
                    await updateDoc(userRef, { language: langCode });
                } catch (error) {
                    console.error('Error updating language in Firestore:', error);
                }
            }
        }
    };

    return (
        <LanguageContext.Provider value={{ currentLanguage, languages, changeLanguage: handleLanguageChange, isRTL }}>
            <div style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                {children}
            </div>
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
