import { rawBusData } from './rawBusData';

const busData = rawBusData.map(bus => {
    // Safely split the route string to extract origin and destination
    const parts = bus.route.split(/→|->|-/).map(p => p.trim());
    const originStr = parts[0] || 'Erode';
    const destStr = parts[1] || 'Unknown';

    // Generate a basic route code like ERD-CBE
    const originCode = originStr.substring(0, 3).toUpperCase();
    const destCode = destStr.substring(0, 3).toUpperCase();
    const routeCode = `${originCode}-${destCode}`;

    return {
        route: routeCode,
        origin: originStr,
        destination: destStr,
        time: bus.time,
        operator: bus.busName,
        operatorType: bus.type, // Map 'type' to 'operatorType' used in logic sometimes
        serviceType: bus.serviceType
    };
});

export default busData;
