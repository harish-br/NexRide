export const busStops = [];

export const busSchedules = [
    {
        id: "mock_1",
        source: "Erode",
        destination: "Coimbatore",
        departure_times: ["06:00", "08:30", "11:15", "14:45", "18:00", "22:30"],
        status: "active",
        operator: "TNSTC",
        serviceType: "Govt",
        via: "Perundurai, Avinashi",
        search_tags: ["erode", "coimbatore", "perundurai", "avinashi"]
    },
    {
        id: "mock_2",
        source: "Erode",
        destination: "Salem",
        departure_times: ["07:15", "09:45", "12:30", "15:20", "19:10"],
        status: "active",
        operator: "Private",
        serviceType: "Express",
        via: "Bhavani, Sankagiri",
        search_tags: ["erode", "salem", "bhavani", "sankagiri"]
    },
    {
        id: "mock_3",
        source: "Anthiyur",
        destination: "Erode",
        departure_times: ["06:30", "09:00", "13:15", "17:45"],
        status: "active",
        operator: "TNSTC",
        serviceType: "Govt",
        via: "Bhavani",
        search_tags: ["anthiyur", "erode", "bhavani"]
    }
];
