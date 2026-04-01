import { erd_cbe } from './bus_timings/erd_cbe';
import { cbe_erd } from './bus_timings/cbe_erd';
import { erd_mtr } from './bus_timings/erd_mtr';
import { mtr_erd } from './bus_timings/mtr_erd';
import { ant_erd } from './bus_timings/ant_erd';
import { erd_pln } from './bus_timings/erd_pln';
import { erd_dpm } from './bus_timings/erd_dpm';
import { erd_kgm } from './bus_timings/erd_kgm';

const busData = [
  ...erd_cbe.map(bus => ({ ...bus, route: 'ERD-CBE', serviceType: bus.serviceType || (bus.operator === 'TNSTC' ? 'Non-Stop' : 'Private') })),
  ...cbe_erd.map(bus => ({ ...bus, route: 'CBE-ERD', serviceType: bus.serviceType || (bus.operator === 'TNSTC' ? 'Non-Stop' : 'Private') })),
  ...erd_mtr.map(bus => ({ ...bus, route: 'ERD-MTR', serviceType: bus.serviceType || 'Private' })),
  ...mtr_erd.map(bus => ({ ...bus, route: 'MTR-ERD', operatorType: bus.operatorType || (bus.operator === 'TNSTC' ? 'Govt' : 'Private') })),
  ...ant_erd,
  ...erd_pln.map(bus => ({ ...bus, route: 'ERD-PLN', serviceType: bus.serviceType || (bus.operator === 'TNSTC' ? 'Govt' : 'Private') })),
  ...erd_dpm.map(bus => ({ ...bus, route: 'ERD-DPM', serviceType: bus.serviceType || (bus.operator === 'TNSTC' ? 'Govt' : 'Private') })),
  ...erd_kgm.map(bus => ({ ...bus, route: 'ERD-KGM', serviceType: bus.serviceType || (bus.operator === 'TNSTC' ? 'Govt' : 'Private') }))
];

export default busData;
