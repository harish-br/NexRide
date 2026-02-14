import React, { useRef, useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { motion, AnimatePresence } from 'framer-motion';
import nexrideAnimation from './LottieAnimations/Nexrideintro.json';
import introBg from '../assets/intro_bg.png';
import './IntroScreen.css';

const IntroScreen = ({ onComplete }) => {
    const lottieRef = useRef(null);
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            title: "Next step towards you.",
            subtitle: "Get live updates, arrival times, and route details to stay on track every day."
        },
        {
            title: "Never miss your ride.",
            subtitle: "Everything you need to stay on track. Live tracking and updates for a smoother commute."
        },
        {
            title: "Your journey starts here.",
            subtitle: "Live transport updates that keep you moving."
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [slides.length]);

    // Loop animation with 2 second delay
    const handleAnimationComplete = () => {
        setTimeout(() => {
            if (lottieRef.current) {
                lottieRef.current.goToAndPlay(0);
            }
        }, 2000);
    };

    return (
        <div className="intro-container" style={{ backgroundImage: `url(${introBg})` }}>
            {/* Full Screen Lottie */}
            <div className="intro-lottie-wrapper">
                <Lottie
                    lottieRef={lottieRef}
                    animationData={nexrideAnimation}
                    loop={false}
                    autoplay={true}
                    onComplete={handleAnimationComplete}
                    rendererSettings={{
                        preserveAspectRatio: 'xMidYMid slice'
                    }}
                    style={{
                        width: '100%',
                        height: '100%',
                    }}
                />
            </div>

            {/* Header Text */}
            <div className="intro-header">
                <h1 style={{
                    fontSize: '48px',
                    fontWeight: 600,
                    color: '#ffffff',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'baseline'
                }}>
                    NexRide
                    <motion.span
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{
                            duration: 1.5,
                            ease: "easeInOut",
                            repeat: Infinity,
                        }}
                        style={{ color: '#ffffff', marginLeft: '2px' }}
                    >
                        .
                    </motion.span>
                </h1>
                <p style={{
                    fontSize: '16px',
                    color: 'rgba(255, 255, 255, 0.9)', // Slightly transparent for lighter weight feel
                    fontWeight: '400',
                    marginTop: '11px'
                }}>

                </p>
            </div>

            {/* Bottom Panel */}
            <div className="intro-bottom-panel">


                <div style={{
                    width: '100%',
                    maxWidth: '320px',
                    textAlign: 'left',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* Animated Text Section */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <AnimatePresence mode='wait'>
                            <motion.div
                                key={currentSlide}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.45, ease: "easeOut" }}
                            >
                                <h2 style={{
                                    fontSize: '24px',
                                    fontWeight: 600,
                                    color: '#1C1C1E',
                                    marginBottom: '12px'
                                }}>
                                    {slides[currentSlide].title}
                                </h2>

                                <p style={{
                                    fontSize: '20px',
                                    color: '#3C3C43',
                                    marginBottom: '24px',
                                    lineHeight: '1.3'
                                }}>
                                    {slides[currentSlide].subtitle}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Progress Dots */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', alignItems: 'center' }}>
                        {slides.map((_, index) => {
                            const isActive = index === currentSlide;
                            return (
                                <motion.div
                                    key={index}
                                    initial={false}
                                    animate={{
                                        width: isActive ? 32 : 8,
                                        backgroundColor: isActive ? '#E5E7EB' : '#D1D5DB' // Active track vs Inactive dot
                                    }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    style={{
                                        height: '8px',
                                        borderRadius: '999px',
                                        overflow: 'hidden',
                                        position: 'relative'
                                    }}
                                >
                                    {isActive && (
                                        <motion.div
                                            initial={{ width: "0%" }}
                                            animate={{ width: "100%" }}
                                            transition={{ duration: 3, ease: "linear" }}
                                            style={{
                                                height: '100%',
                                                backgroundColor: '#6c7074ff', // Dark Grey active fill
                                                position: 'absolute',
                                                top: 0,
                                                left: 0
                                            }}
                                        />
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>

                    <button
                        onClick={onComplete}
                        style={{
                            width: '100%',
                            padding: '16px',
                            backgroundColor: '#1569fd', // Primary Color
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '16px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            transition: 'transform 0.1s active',
                            marginTop: 'auto',
                            marginBottom: '12px'
                        }}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                        onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        Get Started
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IntroScreen;
