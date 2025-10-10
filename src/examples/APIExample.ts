import JCalendar from "../JCalendar/JCalendar";
import { IConfederationData, IFederationData, IInstitutionData, SportAPIController } from "../JSportModule";
import SportServerAPI from "../JSportServerModule";
import mostrarFecha from "../mostrarFechaBorrar";
import { getInstitutionsData, getFederationData, getConfederationData } from "./APIExample/entitiesData";
import { getContinentData, getCountriesData, getTownsData } from "./APIExample/geogData";


export default function APIExample() {

  const cal = JCalendar.createFromYear(5147);

  let conts = getContinentData()
  let couns = getCountriesData()
  let towns = getTownsData()

  const ssapi: SportAPIController = SportServerAPI();
  const entities = ssapi.getEntityController();
  const elements = ssapi.getElementController();

  // se cargan todos los datos geog
  entities.loadGeogExampleData(conts, couns, towns);

  // agregar datos de institutions
  getInstitutionsData().forEach((inst: IInstitutionData) => {
    entities.createInstitution(inst);
  })
  console.log('Total Institutions', entities.getInstitutions({}).length)

  // agregar datos de fed
  getFederationData().forEach((fed: IFederationData) => {
    entities.createFederation(fed)
  })
  console.log('Total Federations', entities.getFederations({}).length)

  // agregar datos de conf
  getConfederationData().forEach((conf: IConfederationData, i: number) => {
    if (i == 0) {
      conf.fs.push('1')
    }
    entities.createConfederation(conf)
    if (!entities.associateFederation('2', conf.i)) {
      console.log('No se asocia a 2 en la conf: ', conf.i)
    }
  })
  console.log('getAllConfederations')
  console.log(entities.getAllConfederations())

  // asociar las federaciones:
  entities.getFederations({}).forEach(fed => {
    // buscar a que confederacion debe pertenecer
    // federation.areaAsosiated.info.r == confederation.areaAsosiated.info.i
    entities.getAllConfederations().forEach(conf => {
      if (!conf.ms.includes(fed.i)) {
        entities.associateFederation(fed.i, conf.i);
      }
    })
  })
  console.log('getAllConfederations')
  console.log(entities.getAllConfederations())

  mostrarFecha(cal.now)
}