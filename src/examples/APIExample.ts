
import JCalendar from "../JCalendar/JCalendar";
import { JDateTime } from "../JCalendar/JDateTimeModule";
import { IConfederationData, IFederationCreator, IFederationData, IInstitutionData, ITownData, SportAPIController } from "../JSportModule";
import SportServerAPI from "../JSportServerModule";
import mostrarFecha from "../mostrarFechaBorrar";
import { getConfederationData, getFederationData, getInstitutionsData } from "./APIExample/entitiesData";
import { getContinentData, getCountriesData, getTownsData } from "./APIExample/geogData";

export default function APIExample() {

  const cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, 1986).getIJDateTimeCreator());

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
  console.log(entities.getInstitutions({}).length)

  // agregar datos de fed
  getFederationData().forEach((fed: IFederationData) => {
    entities.createFederation(fed)
  })
  console.log(entities.getFederations({}).length)

  // agregar datos de conf
  getConfederationData().forEach((conf: IConfederationData) => {
    entities.createConfederation(conf)
    if (!entities.associateFederation('1', conf.i)) {
      console.log(conf.i)
    }
  })
  console.log(entities.getAllConfederations())

  mostrarFecha(cal.now)
}