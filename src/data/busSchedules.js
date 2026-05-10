import { erd_cbe } from './bus_timings/erd_cbe';
import { cbe_erd } from './bus_timings/cbe_erd';
import { erd_mtr } from './bus_timings/erd_mtr';
import { mtr_erd } from './bus_timings/mtr_erd';
import { ant_erd } from './bus_timings/ant_erd';
import { erd_pln } from './bus_timings/erd_pln';
import { erd_dpm } from './bus_timings/erd_dpm';
import { erd_kgm } from './bus_timings/erd_kgm';
import { comprehensive } from './bus_timings/comprehensive';

export const busSchedules = [
    ...erd_cbe.map(bus => ({
        routeCode: 'ERD-CBE',
        from: 'Erode',
        to: 'Coimbatore',
        departureTime: bus.time,
        operatorName: bus.operator,
        serviceType: bus.serviceType || (bus.operator === 'TNSTC' ? 'TNSTC (Non-Stop)' : 'Private'),
        bus_type: bus.operator === 'A.S.M' ? 'A.S.M' : 'Standard'
    })),
    ...cbe_erd.map(bus => ({
        routeCode: 'CBE-ERD',
        from: 'Coimbatore',
        to: 'Erode',
        departureTime: bus.time,
        operatorName: bus.operator,
        serviceType: bus.serviceType || (bus.operator === 'TNSTC' ? 'TNSTC (Non-Stop)' : 'Private'),
        bus_type: bus.operator === 'A.S.M' ? 'A.S.M' : 'Standard'
    })),
    ...erd_mtr.map(bus => ({
        routeCode: 'ERD-MTR',
        from: 'Erode',
        to: 'Mettur',
        departureTime: bus.time,
        operatorName: bus.operator,
        serviceType: bus.serviceType || 'Private'
    })),
    ...mtr_erd.map(bus => ({
        routeCode: 'MTR-ERD',
        from: 'Mettur',
        to: 'Erode',
        departureTime: bus.time,
        operatorName: bus.operatorType === 'Govt' ? 'Govt' : 'Private',
        serviceType: bus.operatorType === 'Govt' ? 'Govt' : 'Private'
    })),
    ...ant_erd.map(bus => ({
        routeCode: 'ANT-ERD',
        from: bus.origin,
        to: bus.destination,
        departureTime: bus.time,
        operatorName: bus.operator || (bus.operatorType === 'Govt' ? 'TNSTC' : 'Private'),
        serviceType: bus.operatorType
    })),
    ...erd_pln.map(bus => ({
        routeCode: 'ERD-PLN',
        from: 'Erode',
        to: 'Palani',
        departureTime: bus.time,
        operatorName: bus.operator,
        serviceType: bus.operator === 'TNSTC' ? 'Govt' : 'Private'
    })),
    ...erd_dpm.map(bus => ({
        routeCode: 'ERD-DPM',
        from: 'Erode',
        to: 'Dharapuram',
        departureTime: bus.time,
        operatorName: bus.operator,
        serviceType: bus.operator === 'TNSTC' ? 'Govt' : 'Private'
    })),
    ...erd_kgm.map(bus => ({
        routeCode: 'ERD-KGM',
        from: 'Erode',
        to: 'Kangayam',
        departureTime: bus.time,
        operatorName: bus.operator,
        serviceType: bus.serviceType || (bus.operator === 'TNSTC' ? 'Govt' : 'Private'),
        bus_type: bus.operator === 'A.S.M' ? 'A.S.M' : 'Standard'
    })),
    // --- A.S.M Buses ---
    ...["05:00 AM", "06:00 AM", "07:45 AM", "12:10 PM", "02:20 PM"].map(time => ({
        routeCode: 'ANT-CBE',
        from: 'Anthiyur',
        to: 'Coimbatore',
        via: 'Gobichettipalayam',
        departureTime: time,
        operatorName: 'A.S.M Bus Travel',
        serviceType: 'Private AC Seater',
        bus_type: 'A.S.M'
    })),
    ...["05:00 AM", "06:00 AM", "07:45 AM", "12:10 PM", "02:20 PM"].map(time => ({
        routeCode: 'CBE-ANT',
        from: 'Coimbatore',
        to: 'Anthiyur',
        via: 'Gobichettipalayam',
        departureTime: time,
        operatorName: 'A.S.M Bus Travel',
        serviceType: 'Private AC Seater',
        bus_type: 'A.S.M'
    })),
    ...comprehensive
];

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
