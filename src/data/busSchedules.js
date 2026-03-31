import { rawBusData } from './rawBusData';

export const busSchedules = rawBusData.map(bus => {
    // Safely parse the route
    const parts = bus.route.split(/→|->|-/).map(p => p.trim());
    const fromStr = parts[0] || 'Erode';
    const toStr = parts[1] || 'Unknown';

    // Route code
    const originCode = fromStr.substring(0, 3).toUpperCase();
    const destCode = toStr.substring(0, 3).toUpperCase();
    const routeCode = `${originCode}-${destCode}`;

    // Map serviceType and type logic perfectly for BusResultsScreen expectations
    // BusResultsScreen filters:
    // "Govt" -> searches for 'govt' or 'tnstc' in bus.serviceType
    // "Private" -> searches for 'private' in bus.serviceType
    // "Non-Stop" -> searches for 'non-stop' in bus.serviceType
    let serviceTypeVal = '';
    
    if (bus.type === 'Govt' || bus.busName === 'TNSTC') {
        serviceTypeVal = bus.serviceType ? `TNSTC ${bus.serviceType}` : 'TNSTC Govt';
    } else {
        serviceTypeVal = 'Private';
    }

    return {
        routeCode: routeCode,
        from: fromStr,
        to: toStr,
        departureTime: bus.time,
        operatorName: bus.busName,
        serviceType: serviceTypeVal
    };
});

export const busStops = [
    { id: 's1', name: 'Erode Central Bus Stand', code: 'ERD_BUS', vicinity: 'Erode, Tamil Nadu', lat: 11.3486, lng: 77.7214 },
    { id: 's2', name: 'Bhavani Road Stop', code: 'BHV_RD', vicinity: 'Bhavani, Erode', lat: 11.4502, lng: 77.6837 },
    { id: 's3', name: 'Perundurai Junction', code: 'PRD_JN', vicinity: 'Perundurai', lat: 11.2721, lng: 77.5878 },
    { id: 's4', name: 'Avinashi New Bus Stand', code: 'AVN_BS', vicinity: 'Avinashi', lat: 11.1915, lng: 77.2699 },
    { id: 's5', name: 'Coimbatore Gandhipuram', code: 'CBE_GP', vicinity: 'Coimbatore', lat: 11.0118, lng: 76.9664 },
    { id: 's6', name: 'Hope College Stop', code: 'HPE_CL', vicinity: 'Peelamedu, CBE', lat: 11.0301, lng: 77.0163 },
    { id: 's7', name: 'Salem Steel Plant Stop', code: 'SLM_ST', vicinity: 'Salem', lat: 11.6601, lng: 78.0772 },
    { id: 's8', name: 'Mettur Dam Bus Stand', code: 'MTR_DAM', vicinity: 'Mettur', lat: 11.7766, lng: 77.7951 },
    { id: 's9', name: 'Anthiyur Bus Stand', code: 'ANT_BS', vicinity: 'Anthiyur', lat: 11.5833, lng: 77.6000 }
];
