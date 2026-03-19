import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, MapPin, Home, Briefcase, Trash2 } from 'lucide-react';
import haptics from '../utils/haptics';

const SavedPlacesListModal = ({ 
    isOpen, 
    onClose, 
    savedPlaces, 
    onSelectPlace, 
    onDeletePlace, 
    onAddNewPlace 
}) => {
    if (!isOpen) return null;

    const getIcon = (type) => {
        if (type === 'home') return <Home size={20} color="#1A73E8" />;
        if (type === 'work') return <Briefcase size={20} color="#1A73E8" />;
        return <MapPin size={20} color="#EAB308" />;
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }}>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
            />

            {/* Sheet */}
            <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                style={{
                    width: '100%', maxWidth: '480px', backgroundColor: '#ffffff',
                    borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
                    padding: '24px', paddingBottom: '40px', position: 'relative',
                    zIndex: 100000, boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
                    maxHeight: '80vh', display: 'flex', flexDirection: 'column'
                }}
            >
                {/* Drag Handle */}
                <div style={{ width: '40px', height: '4px', backgroundColor: '#E5E7EB', borderRadius: '2px', margin: '0 auto 16px auto', flexShrink: 0 }} />

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', margin: 0 }}>Saved Places</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                        <X size={24} color="#9CA3AF" />
                    </button>
                </div>

                {/* List */}
                <div style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
                    {savedPlaces.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#6B7280' }}>
                            <MapPin size={48} color="#D1D5DB" style={{ marginBottom: '16px', opacity: 0.5 }} />
                            <p>No saved places yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {savedPlaces.map((place) => (
                                <div 
                                    key={place.id}
                                    style={{ 
                                        display: 'flex', alignItems: 'center', padding: '16px',
                                        border: '1px solid #F3F4F6', borderRadius: '16px',
                                        background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                                    }}
                                >
                                    {/* Selectable Area */}
                                    <div 
                                        onClick={() => { haptics.light(); onSelectPlace(place); }}
                                        style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', overflow: 'hidden' }}
                                    >
                                        <div style={{ 
                                            width: '40px', height: '40px', borderRadius: '50%', 
                                            background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                        }}>
                                            {getIcon(place.type)}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                                            <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {place.name || place.type}
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {place.address}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Delete Action */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); haptics.medium(); onDeletePlace(place.id); }}
                                        style={{ 
                                            background: 'none', border: 'none', padding: '8px', 
                                            cursor: 'pointer', color: '#EF4444', flexShrink: 0 
                                        }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Add New Button */}
                <button
                    onClick={() => { haptics.light(); onAddNewPlace(); }}
                    style={{
                        width: '100%', padding: '16px', background: '#F3F4F6', color: '#111',
                        border: '1px dashed #D1D5DB', borderRadius: '16px', fontSize: '16px', fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        marginTop: '24px', cursor: 'pointer', flexShrink: 0
                    }}
                >
                    <Plus size={20} color="#111" />
                    Add New Place
                </button>
            </motion.div>
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default SavedPlacesListModal;
