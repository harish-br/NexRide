export const TRAIN_STATIONS = [
    { code: 'ED', name: 'Erode Jn', aliases: ['erode', 'erd'], lat: 11.3283, lng: 77.7161 },
    { code: 'CBE', name: 'Coimbatore Jn', aliases: ['coimbatore', 'kovai', 'cbe'], lat: 10.9961, lng: 76.9634 },
    { code: 'SA', name: 'Salem Jn', aliases: ['salem', 'slm'], lat: 11.6444, lng: 78.1064 },
    { code: 'MAS', name: 'MGR Chennai Central', aliases: ['chennai', 'madras'], lat: 13.0827, lng: 80.2707 },
    { code: 'TUP', name: 'Tiruppur', aliases: ['tiruppur', 'tirupur'], lat: 11.1026, lng: 77.3411 },
    { code: 'MDU', name: 'Madurai Jn', aliases: ['madurai'], lat: 9.9194, lng: 78.1030 },
    { code: 'TPJ', name: 'Tiruchchirappalli Jn', aliases: ['trichy', 'tiruchi'], lat: 10.7850, lng: 78.6874 },
    { code: 'KRR', name: 'Karur Jn', aliases: ['karur'], lat: 10.9575, lng: 78.0848 },
    { code: 'MTP', name: 'Mettupalayam', aliases: ['mettupalayam'], lat: 11.3006, lng: 76.9405 },
    { code: 'ONR', name: 'Coonoor', aliases: ['coonoor'], lat: 11.3530, lng: 76.7959 },
    { code: 'UAM', name: 'Udagamandalam', aliases: ['oty', 'ooty'], lat: 11.4064, lng: 76.6948 },
    { code: 'PGT', name: 'Palakkad Town', aliases: ['palakkad', 'palakad', 'pgt', 'palghad'], lat: 10.7867, lng: 76.6548 },
];


export const searchStations = (query) => {
    if (!query) return [];
    const lower = query.toLowerCase().trim();
    return TRAIN_STATIONS.filter(station =>
        station.name.toLowerCase().includes(lower) ||
        station.code.toLowerCase().includes(lower) ||
        station.aliases.some(a => a.includes(lower))
    );
};
