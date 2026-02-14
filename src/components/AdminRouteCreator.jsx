import React, { useState, useEffect } from 'react';
import { useMap, Marker } from '@vis.gl/react-google-maps';
import { ArrowLeft, Save, Loader2, MapPin, Navigation, Plus } from 'lucide-react';

// STYLES
const styles = {
    container: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'transparent', zIndex: 100, display: 'flex', flexDirection: 'column',
        pointerEvents: 'none'
    },
    header: {
        padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #E0E0E0', backgroundColor: 'white', zIndex: 10, pointerEvents: 'auto'
    },
    title: { fontSize: '18px', fontWeight: '600' },
    mapContainer: { flex: 1, position: 'relative' },
    controls: {
        position: 'absolute', top: '16px', left: '16px', right: '16px',
        backgroundColor: 'white', padding: '16px', borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)', zIndex: 5, pointerEvents: 'auto'
    },
    inputGroup: { marginBottom: '12px' },
    label: { fontSize: '12px', color: '#5F6368', marginBottom: '4px', display: 'block' },
    input: {
        width: '100%', padding: '10px', fontSize: '14px', border: '1px solid #DADCE0',
        borderRadius: '8px', outline: 'none'
    },
    fab: {
        position: 'absolute', bottom: '32px', right: '16px',
        backgroundColor: '#1A73E8', color: 'white', borderRadius: '28px',
        padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '8px',
        boxShadow: '0 4px 10px rgba(26,115,232,0.3)', border: 'none', cursor: 'pointer',
        fontWeight: '600', pointerEvents: 'auto'
    }
};

const StopDetailsSheet = ({ stop, onSave, onClose }) => {
    const [details, setDetails] = useState({
        name: stop.name || '',
        code: '',
        arrivalTime: '',
        haltDuration: '5'
    });

    const handleSave = () => {
        onSave({ ...stop, ...details });
    };

    return (
        <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            backgroundColor: 'white', padding: '24px',
            borderTopLeftRadius: '20px', borderTopRightRadius: '20px',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.1)', zIndex: 20, pointerEvents: 'auto'
        }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Stop Details</h3>
            <div style={{ marginBottom: '16px' }}>
                <label style={styles.label}>Stop Name</label>
                <input
                    style={styles.input}
                    value={details.name}
                    onChange={e => setDetails(prev => ({ ...prev, name: e.target.value }))}
                />
            </div>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{ flex: 1 }}>
                    <label style={styles.label}>Arrival Time</label>
                    <input
                        type="time"
                        style={styles.input}
                        value={details.arrivalTime}
                        onChange={e => setDetails(prev => ({ ...prev, arrivalTime: e.target.value }))}
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={styles.label}>Halt (min)</label>
                    <input
                        type="number"
                        style={styles.input}
                        value={details.haltDuration}
                        onChange={e => setDetails(prev => ({ ...prev, haltDuration: e.target.value }))}
                    />
                </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={onClose} style={{
                    flex: 1, padding: '12px', border: '1px solid #DADCE0', borderRadius: '8px',
                    backgroundColor: 'transparent', fontWeight: '600'
                }}>Cancel</button>
                <button onClick={handleSave} style={{
                    flex: 1, padding: '12px', backgroundColor: '#1A73E8', color: 'white',
                    border: 'none', borderRadius: '8px', fontWeight: '600'
                }}>Save Stop</button>
            </div>
        </div>
    );
};

const AdminRouteCreator = ({ onBack }) => {
    const map = useMap();
    // const mapsLibrary = useMapsLibrary('places'); // Unused for now
    const [stops, setStops] = useState([]);
    const [source, setSource] = useState('');
    const [destination, setDestination] = useState('');
    const [activeStop, setActiveStop] = useState(null); // Stop being edited
    const [isSelectingLocation, setIsSelectingLocation] = useState(false);

    // Map Click Listener
    useEffect(() => {
        if (!map) return;
        const listener = map.addListener('click', (e) => {
            if (isSelectingLocation) {
                const newStop = {
                    lat: e.latLng.lat(),
                    lng: e.latLng.lng(),
                    name: 'New Stop', // Should reverse geocode
                    id: Date.now()
                };
                setActiveStop(newStop);
                setIsSelectingLocation(false);
            }
        });
        return () => window.google.maps.event.removeListener(listener);
    }, [map, isSelectingLocation]);

    const handleSaveStop = (updatedStop) => {
        setStops(prev => [...prev.filter(s => s.id !== updatedStop.id), updatedStop]);
        setActiveStop(null);
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <button onClick={onBack} style={{ background: 'none', border: 'none' }}>
                    <ArrowLeft size={24} />
                </button>
                <span style={styles.title}>Create Route</span>
                <button style={{ background: 'none', border: 'none', color: '#1A73E8', fontWeight: '600' }}>
                    Save
                </button>
            </div>

            <div style={styles.mapContainer}>
                {/* Map remains powered by parent APIProvider, but we might need to recenter/control it */}
                <div style={styles.controls}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Source</label>
                        <input style={styles.input} placeholder="Start Location" value={source} onChange={e => setSource(e.target.value)} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Destination</label>
                        <input style={styles.input} placeholder="End Location" value={destination} onChange={e => setDestination(e.target.value)} />
                    </div>
                </div>

                {/* Markers for Stops */}
                {stops.map((stop, index) => (
                    <Marker
                        key={stop.id}
                        position={stop}
                        label={`${index + 1}`}
                        onClick={() => setActiveStop(stop)}
                    />
                ))}

                <button
                    onClick={() => setIsSelectingLocation(true)}
                    style={{
                        ...styles.fab,
                        backgroundColor: isSelectingLocation ? '#34A853' : '#1A73E8'
                    }}
                >
                    {isSelectingLocation ? 'Tap Map to Drop Pin' : <><Plus size={20} /> Add Stop</>}
                </button>

                {activeStop && (
                    <StopDetailsSheet
                        stop={activeStop}
                        onSave={handleSaveStop}
                        onClose={() => setActiveStop(null)}
                    />
                )}
            </div>
        </div>
    );
};

export default AdminRouteCreator;
