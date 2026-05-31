import { useState } from 'react';

const SAVED_PLACES_KEY = 'nexride_saved_places';

export const useSavedPlaces = () => {
    const [savedPlaces, setSavedPlaces] = useState(() => {
        try {
            const stored = localStorage.getItem(SAVED_PLACES_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (err) {
            console.error("Error loading saved places", err);
            return [];
        }
    });

    const savePlace = (place) => {
        // place structure:
        // { 
        //   id: 'home' | 'work' | string (for custom), 
        //   type: 'home' | 'work' | 'custom', 
        //   name: string, 
        //   lat: number, 
        //   lng: number, 
        //   address: string
        // }
        try {
            // Find if exists and replace, else append
            const filteredPlaces = savedPlaces.filter(p => p.id !== place.id);
            const newPlaces = [...filteredPlaces, place];
            setSavedPlaces(newPlaces);
            localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(newPlaces));
        } catch (err) {
            console.error("Error saving place", err);
        }
    };

    const removePlace = (id) => {
        try {
            const newPlaces = savedPlaces.filter(p => p.id !== id);
            setSavedPlaces(newPlaces);
            localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(newPlaces));
        } catch (err) {
            console.error("Error removing place", err);
        }
    };

    const getPlace = (id) => savedPlaces.find(p => p.id === id);

    return {
        savedPlaces,
        savePlace,
        removePlace,
        getPlace
    };
};
