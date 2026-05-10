const fs = require('fs');
const path = require('path');

const newRoutes = [
    {
      "source": "Perundurai",
      "destination": "Bhavani",
      "route_stops": ["Bhavani"],
      "bus_number": "B12",
      "departure_times": ["05:00","05:45","06:00","06:15","06:30","07:00","07:20","08:10","08:40","09:00","09:30","10:00","10:20","10:40","11:00","11:10","11:20","11:30","11:50","12:20","12:45","13:10","13:30","13:45","14:00","14:30","14:50","15:20","15:45","16:10","16:40","16:50","17:15","17:30","17:50","18:10","18:20","18:45","19:10","19:20","19:40","20:15","21:50"],
      "operator": "TNSTC"
    },
    {
      "source": "Perundurai",
      "destination": "Chennimalai",
      "route_stops": ["Chennimalai"],
      "bus_number": "C1, C5, C9, C13",
      "departure_times": ["06:40","06:50","07:50","08:15","08:30","09:50","10:20","10:50","11:10","11:20","12:00","12:20","12:40","13:20","13:30","13:40","14:10","14:40","15:30","16:15","17:00","17:20","17:50","18:00","18:20","19:20","20:00","20:20","20:40","21:45"],
      "operator": "TNSTC"
    },
    {
      "source": "Perundurai",
      "destination": "Erode",
      "route_stops": ["Erode"],
      "bus_number": "12, 17, 18, 31, 39, 8E",
      "departure_times": ["03:50","04:20","04:30","04:40","04:50","05:00","05:10","05:30","05:50","06:00","06:20","06:50","07:15","07:45","08:00","08:30","09:10","09:20","09:30","10:00","10:10","10:30","11:00","11:15","11:30","11:50","12:00","12:10","13:00","13:10","13:20","13:30","13:40","13:50","14:00","14:10","14:20","14:30","14:40","15:00","15:10","15:30","15:40","15:50","16:00","16:15","16:50","17:15","17:30","18:00","18:10","18:30","18:40","19:30","19:50","20:00","20:30","21:10","21:20"],
      "operator": "TNSTC"
    },
    {
      "source": "Perundurai",
      "destination": "Gobichettipalayam",
      "route_stops": ["Gobichettipalayam"],
      "bus_number": "7, P4, P5",
      "departure_times": ["05:00","05:45","06:15","06:40","07:20","07:45","08:20","09:00","09:10","09:20","09:30","10:15","10:30","10:40","11:15","11:40","11:50","12:00","12:10","12:40","13:00","13:30","13:40","14:10","14:20","14:50","15:00","15:20","15:45","16:00","16:15","16:30","16:40","16:50","17:20","17:50","18:10","18:50","19:10","19:30","19:40","20:00","20:30","20:45","21:20","22:30"],
      "operator": "TNSTC"
    },
    {
      "source": "Perundurai",
      "destination": "Vellode",
      "route_stops": ["Vellode"],
      "bus_number": "17",
      "departure_times": ["05:15","08:30"],
      "operator": "TNSTC"
    },
    {
      "source": "Perundurai",
      "destination": "Vijayamangalam",
      "route_stops": ["Vijayamangalam"],
      "bus_number": "P10A",
      "departure_times": ["04:30","10:00","19:00"],
      "operator": "TNSTC"
    },
    {
      "source": "Perundurai",
      "destination": "Thingalur",
      "route_stops": ["Thingalur"],
      "bus_number": "P7",
      "departure_times": ["06:45","17:30"],
      "operator": "TNSTC"
    },
    {
      "source": "Perundurai",
      "destination": "Sivagiri",
      "route_stops": ["Sivagiri"],
      "bus_number": "C9",
      "departure_times": ["08:15","14:45"],
      "operator": "TNSTC"
    },
    {
      "source": "Perundurai",
      "destination": "SIPCOT",
      "route_stops": ["SIPCOT"],
      "bus_number": "C9, 12G",
      "departure_times": ["05:40","06:40","08:40","09:40"],
      "operator": "TNSTC"
    },
    {
      "source": "Perundurai",
      "destination": "Kangeyam",
      "route_stops": ["Kangeyam"],
      "bus_number": "C5",
      "departure_times": ["05:50","10:15","12:30","15:00","18:30"],
      "operator": "TNSTC"
    },
    {
      "source": "Perundurai",
      "destination": "Kaikolapalayam",
      "route_stops": ["Kaikolapalayam"],
      "bus_number": "37A",
      "departure_times": ["05:30"],
      "operator": "TNSTC"
    },
    {
      "source": "Perundurai",
      "destination": "Kanjikoil",
      "route_stops": ["Kanjikoil"],
      "bus_number": "17",
      "departure_times": ["16:45"],
      "operator": "TNSTC"
    },
    {
      "source": "Perundurai",
      "destination": "Kavindapadi",
      "route_stops": ["Kavindapadi"],
      "bus_number": "17, K1, P2",
      "departure_times": ["05:50","06:30","07:15","08:20","09:00","10:15","10:45","11:30","11:40","11:50","12:30","12:40","13:30","13:40","14:10","14:30","15:30","16:20","17:15","17:40","17:50","18:40","18:50","20:00","20:30","21:00"],
      "operator": "TNSTC"
    },
    {
      "source": "Perundurai",
      "destination": "Getticheviyur",
      "route_stops": ["Getticheviyur"],
      "bus_number": "P10A",
      "departure_times": ["06:20","16:30"],
      "operator": "TNSTC"
    },
    {
      "source": "Perundurai",
      "destination": "Kunnathur",
      "route_stops": ["Kunnathur"],
      "bus_number": "10, P",
      "departure_times": ["06:00","06:15","06:40","06:50","07:20","09:00","09:30","10:30","11:30","12:20","14:00","14:10","14:20","14:40","15:00","16:20","16:30","16:50","18:00","19:00","20:20"],
      "operator": "TNSTC"
    },
    {
      "source": "Perundurai",
      "destination": "Modakurichi",
      "route_stops": ["Modakurichi"],
      "bus_number": "12P9",
      "departure_times": ["06:00","17:30"],
      "operator": "TNSTC"
    },
    {
      "source": "Perundurai",
      "destination": "Moonampalli",
      "route_stops": ["Moonampalli"],
      "bus_number": "C9",
      "departure_times": ["06:50","19:15"],
      "operator": "TNSTC"
    },
    {
      "source": "Perundurai",
      "destination": "Panikkampalayam",
      "route_stops": ["Panikkampalayam"],
      "bus_number": "B12",
      "departure_times": ["08:15","17:00"],
      "operator": "TNSTC"
    },
    {
      "source": "Perundurai",
      "destination": "Periya Vettuvapalayam",
      "route_stops": ["Periya Vettuvapalayam"],
      "bus_number": "12E",
      "departure_times": ["05:45"],
      "operator": "TNSTC"
    },
    {
      "source": "Perundurai",
      "destination": "Saralai",
      "route_stops": ["Saralai"],
      "bus_number": "P6",
      "departure_times": ["07:20"],
      "operator": "TNSTC"
    },
    {
      "source": "Perundurai",
      "destination": "Vellirveli",
      "route_stops": ["Vellirveli"],
      "bus_number": "P3, P10",
      "departure_times": ["06:45"],
      "operator": "TNSTC"
    },
    {
      "source": "Bhavani",
      "destination": "Anthiyur",
      "route_stops": ["Paruvachi"],
      "departure_times": ["04:30","04:50","05:00","05:40","05:50","06:30","06:45","07:00","07:15","07:30","07:40","08:40","09:00","09:45","10:00","10:10","10:40","11:00","12:40","13:00","13:30","14:15","14:30","15:30","16:00","16:15","16:45","17:00","17:15","17:40","18:00","18:30","18:50","20:00","20:30","20:50","21:00","21:15","21:30","21:50"],
      "operator": "TNSTC"
    },
    {
      "source": "Bhavani",
      "destination": "Kovilur",
      "route_stops": ["Paruvachi","Anthiyur"],
      "departure_times": ["04:20","07:45","09:20","10:30","11:00","14:00","17:30","19:45","20:40","21:15"],
      "operator": "TNSTC"
    },
    {
      "source": "Bhavani",
      "destination": "Ennamangalam",
      "route_stops": ["Paruvachi","Anthiyur"],
      "departure_times": ["07:40","08:45","10:45"],
      "operator": "TNSTC"
    },
    {
      "source": "Bhavani",
      "destination": "Malai Karuppusamy Kovil",
      "route_stops": ["Paruvachi","Anthiyur"],
      "departure_times": ["06:20"],
      "operator": "TNSTC"
    },
    {
      "source": "Bhavani",
      "destination": "Vellithiruppur",
      "route_stops": ["Olgadam"],
      "departure_times": ["07:15","12:00","14:40","16:45","18:20","20:00"],
      "operator": "TNSTC"
    },
    {
      "source": "Bhavani",
      "destination": "Komarayanur",
      "route_stops": ["Olgadam","Vellithiruppur","Chennampatti"],
      "departure_times": ["14:50","15:20"],
      "operator": "TNSTC"
    },
    {
      "source": "Bhavani",
      "destination": "Kargekandi",
      "route_stops": ["Paruvachi","Anthiyur","Thamaraikarai"],
      "departure_times": ["06:00","06:45","09:30","13:00"],
      "operator": "TNSTC"
    },
    {
      "source": "Bhavani",
      "destination": "Mysore",
      "route_stops": ["Paruvachi","Anthiyur","Thamaraikarai","Kargekandi","Ramapura","Hanur","Kollegal"],
      "departure_times": ["06:45"],
      "operator": "TNSTC"
    },
    {
      "source": "Bhavani",
      "destination": "Salem",
      "route_stops": ["Sankagiri"],
      "departure_times": ["05:50","06:20","06:40","07:40","07:50","08:00","09:00","09:10","09:50","10:10","10:20","12:30","12:45","12:50","13:00","14:00","14:15","14:25","14:35","16:30","16:45","16:55","18:10","18:25","18:40","19:00"],
      "operator": "TNSTC"
    },
    {
      "source": "Bhavani",
      "destination": "Gobichettipalayam",
      "route_stops": ["Paruvachi","Anthiyur"],
      "departure_times": ["07:45","11:45","14:40","17:00","17:45","18:00","20:00","21:00"],
      "operator": "TNSTC"
    },
    {
      "source": "Bhavani",
      "destination": "Athani",
      "route_stops": ["Appakudal"],
      "departure_times": ["13:45","16:00","18:00"],
      "operator": "TNSTC"
    },
    {
      "source": "Bhavani",
      "destination": "Nagalur",
      "route_stops": ["Appakudal","Athani"],
      "departure_times": ["15:50"],
      "operator": "TNSTC"
    },
    {
      "source": "Bhavani",
      "destination": "TN Palayam",
      "route_stops": ["Appakudal","Athani"],
      "departure_times": ["10:00","11:00","15:15"],
      "operator": "TNSTC"
    },
    {
      "source": "Bhavani",
      "destination": "Sathyamangalam",
      "route_stops": ["Appakudal","Athani"],
      "departure_times": ["05:15","05:30","07:00","10:00","10:30","15:40","15:50","18:20","18:50"],
      "operator": "TNSTC"
    },
    {
      "source": "Bhavani",
      "destination": "Sathyamangalam",
      "route_stops": ["Appakudal","Athani"],
      "departure_times": ["04:30","04:40","06:45","07:10","07:40","08:20","08:45","11:50","12:40","13:20","13:50","14:30","15:30","16:40","16:45","17:30","18:00","20:00","21:00"],
      "operator": "Private"
    },
    {
      "source": "Bhavani",
      "destination": "Bannari",
      "route_stops": ["Sathyamangalam"],
      "departure_times": ["05:40","08:00"],
      "operator": "TNSTC"
    },
    {
      "source": "Bhavani",
      "destination": "Coimbatore",
      "route_stops": ["Perundurai","Perumanallur","Avinashi"],
      "departure_times": ["06:00","06:20","07:20","07:40","08:00","08:30","09:00","10:00","11:40","12:20","13:40","14:00","15:00","15:40"],
      "operator": "TNSTC"
    },
    {
      "source": "Bhavani",
      "destination": "Coimbatore",
      "route_stops": ["Perundurai","Perumanallur","Avinashi"],
      "departure_times": ["06:40","09:20","14:40","16:00","17:30"],
      "operator": "Private"
    },
    {
      "source": "Bhavani",
      "destination": "Krishnagiri",
      "route_stops": ["Mettur","Dharmapuri"],
      "departure_times": ["04:30","07:00","10:40","13:40","17:30","18:30","19:00"],
      "operator": "TNSTC"
    },
    {
      "source": "Bhavani",
      "destination": "Hosur",
      "route_stops": ["Mettur","Dharmapuri","Krishnagiri"],
      "departure_times": ["00:15","09:30","12:30","15:30"],
      "operator": "TNSTC"
    },
    {
      "source": "Bhavani",
      "destination": "Bangalore",
      "route_stops": ["Mettur","Dharmapuri","Rayakottai","Hosur"],
      "departure_times": ["10:00","22:45","23:45"],
      "operator": "TNSTC"
    }
];

function formatTime(t) {
    const [h, m] = t.split(':');
    let hours = parseInt(h);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${hours.toString().padStart(2, '0')}:${m} ${suffix}`;
}

const entries = [];
newRoutes.forEach(r => {
    const code = `${r.source.substring(0,3).toUpperCase()}-${r.destination.substring(0,3).toUpperCase()}`;
    r.departure_times.forEach(time => {
        entries.push({
            routeCode: code,
            from: r.source,
            to: r.destination,
            via: r.route_stops.join(", "),
            departureTime: formatTime(time),
            operatorName: r.operator,
            serviceType: r.operator === 'TNSTC' ? 'Govt' : 'Private'
        });
    });
});

const filePath = path.join(__dirname, '../src/data/bus_timings/comprehensive.js');
let content = fs.readFileSync(filePath, 'utf8');

const lastBracketIndex = content.lastIndexOf('];');
if (lastBracketIndex === -1) {
    console.error("Could not find end of array");
    process.exit(1);
}

const entriesStr = entries.map(e => `    ${JSON.stringify(e, null, 8).replace(/\n/g, '\n    ')}`).join(',\n');
const newContent = content.slice(0, lastBracketIndex).trim() + ',\n' + entriesStr + '\n];\n';

fs.writeFileSync(filePath, newContent);
console.log(`Added ${entries.length} entries to comprehensive.js`);
