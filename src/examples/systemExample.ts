
import JCalendar from "../JCalendar/JCalendar";
import { JDateTime } from "../JCalendar/JDateTimeModule";
import { verifyBaseStageConfig, verifyLeagueConfig, verifySingleEliminationConfig, verifyStageConfig, verifyStageGroupConfig, verifyStagePlayoffConfig } from "../JSportModule";
import SportServerAPI from "../JSportServerModule";
import mostrarFecha from "../mostrarFechaBorrar";
import stageExampleData from "./stageExampleData";

const {
  s1,
  s4,
} = stageExampleData;

export default function systemExample() {

  const cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, 1156, 168).getIJDateTimeCreator());
  mostrarFecha(cal.now)

  const ssapi = SportServerAPI();
  console.log(ssapi)
  console.log(ssapi.getAllConfederations())

  console.log(verifyBaseStageConfig)

  console.log(verifyBaseStageConfig(s1.config.bsConfig))
  console.log(verifySingleEliminationConfig(s1.config.bsConfig))
  console.log(verifyBaseStageConfig(s4.config.bsConfig))
  console.log(verifyLeagueConfig(s4.config.bsConfig))

  console.log(verifyStageConfig(s1.config))
  console.log(verifyStagePlayoffConfig(s1.config))
  console.log(verifyStageGroupConfig(s4.config))

}