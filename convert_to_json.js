import { comprehensive } from './src/data/bus_timings/comprehensive.js';
import fs from 'fs';

const aggregated = {};

comprehensive.forEach(bus => {
    const key = `${bus.from}-${bus.to}-${bus.operatorName}`;
    if (!aggregated[key]) {
        aggregated[key] = {
            source: bus.from,
            destination: bus.to,
            via: bus.via,
            operator: bus.operatorName,
            departure_times: [],
            notes: bus.serviceType
        };
    }
    
    // Convert "08:30 AM" to "08:30" (24h format as expected by Python script)
    const [time, period] = bus.departureTime.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    const formattedTime = hours.toString().padStart(2, '0') + ':' + minutes.toString().padStart(2, '0');
    
    if (!aggregated[key].departure_times.includes(formattedTime)) {
        aggregated[key].departure_times.push(formattedTime);
    }
});

const output = Object.values(aggregated);
fs.writeFileSync('bus_timings.json', JSON.stringify(output, null, 2));
console.log(`Converted ${comprehensive.length} entries to ${output.length} aggregated routes in bus_timings.json`);
