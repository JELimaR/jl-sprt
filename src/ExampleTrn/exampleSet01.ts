
/**
 * se crea IJTorunamentConfig como ejemplo
 */

import { getExampleTeams } from "../Entities/ExampleData";
import { calculateParticipantsPerGroupArray } from "./validationFunctions";

const selection = getExampleTeams(32).map((t, idx) => { return { team: t, rank: idx + 1 } })

export default {
  participantsRank: selection, // el numero de parts debe ser igual a la suma de participantsNumber.news de cada stage
}