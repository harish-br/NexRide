import { useEffect } from 'react';

/**
 * SEO Manager Component
 * Dynamically updates document title and meta description based on app state.
 */
const SEOManager = ({ activeScreen, activeTab, showBusBooking, showTrainBooking, showParcelBooking }) => {
    
    useEffect(() => {
        let title = "NexRide – Bus Timings, Parcel & Bus Booking | Erode, Ooty, Anthiyur & More";
        let description = "Book buses and parcels online across Erode, Anthiyur, Ooty, Gobichettipalayam and Bhavani. Check live bus timings, track parcels, and book seats instantly on NexRide.";

        const SEORoutes = {
            '/erode-bus-timings': { title: 'Erode Bus Timings & Booking | NexRide' },
            '/anthiyur-bus-schedule': { title: 'Anthiyur Bus Timings & Schedule | NexRide' },
            '/gobichettipalayam-bus': { title: 'Gobichettipalayam Bus Booking | NexRide' },
            '/bhavani-bus-timings': { title: 'Bhavani Bus Timings & Routes | NexRide' },
            '/parcel-booking-erode': { title: 'Erode Parcel Booking Online | NexRide' },
            '/bus-timings': { title: 'Live Bus Timings & Schedules | NexRide' },
            '/parcel-booking': { title: 'Online Parcel Booking & Delivery | NexRide' },
            '/bus-booking': { title: 'Online Bus Ticket Booking | NexRide' },
            '/routes': { title: 'Explore Bus Routes & Services | NexRide' }
        };

        // Metadata Mapping based on App State
        if (showBusBooking) {
            title = "Search Bus Timings Instantly on NexRide";
            description = "Find live bus timings, routes, and schedules in seconds and travel with confidence.";
        } 
        else if (showTrainBooking) {
            title = "Check Train Schedules and Routes";
            description = "Access train timings, route information, and schedules quickly and easily.";
        }
        else if (showParcelBooking) {
            title = "Reliable Parcel Delivery Services";
            description = "Send and track parcels across the city with NexRide's trusted delivery network.";
        }
        else if (activeTab === 'ride') {
            title = "Book a Cab or Auto Within Minutes";
            description = "Get reliable cab and auto rides with fast booking and transparent pricing.";
        }
        else if (activeScreen === 'search' || activeScreen === 'nearby-stops') {
            title = "Explore Routes and Stops";
            description = "Discover bus and train routes, stops, and service information.";
        }
        else if (activeScreen === 'contact') {
            title = "Contact Support";
            description = "Reach our team for assistance, feedback, and partnership inquiries.";
        }
        else if (activeScreen === 'terms' || activeScreen === 'privacy-policy' || activeScreen === 'refund') {
            title = "Legal Information and Policies";
            description = "Review NexRide's terms of service, privacy policy, and refund information.";
        }
        else if (activeTab === 'profile') {
            title = "Transportation Made Simpler";
            description = "Learn how NexRide helps people move smarter every day.";
        }
        else if (activeScreen === 'download') {
            title = "Download the NexRide App Today";
            description = "Access bus timings, train schedules, and ride booking on the go.";
        }
        else if (activeScreen === 'landing') {
            title = "NexRide – Bus Timings, Parcel & Bus Booking | Erode, Ooty, Anthiyur & More";
            description = "Book buses and parcels online across Erode, Anthiyur, Ooty, Gobichettipalayam and Bhavani. Check live bus timings, track parcels, and book seats instantly on NexRide.";
        }
        else if (activeScreen === 'seo-route' && SEORoutes[window.location.pathname]) {
            title = SEORoutes[window.location.pathname].title;
            description = "Book buses and parcels online across Erode, Anthiyur, Ooty, Gobichettipalayam and Bhavani. Check live bus timings, track parcels, and book seats instantly on NexRide.";
        }

        // Apply Updates to DOM
        document.title = title;
        
        // Update Meta Description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', description);
        }

        // Update Open Graph Title
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', title);

        // Update Open Graph Description
        const ogDescription = document.querySelector('meta[property="og:description"]');
        if (ogDescription) ogDescription.setAttribute('content', description);

    }, [activeScreen, activeTab, showBusBooking, showTrainBooking, showParcelBooking]);

    return null; // This component doesn't render anything
};

export default SEOManager;
