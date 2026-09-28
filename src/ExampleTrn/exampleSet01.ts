
/**
 * se crea IJTorunamentConfig como ejemplo
 */

import { getExampleTeams } from "../examples/ExampleData";
import { calculateParticipantsPerGroupArray } from "./validationFunctions";
import { FootballProfile } from "jl-sprt-match";

const profile = new FootballProfile();
const selection = getExampleTeams(32, profile).map((t, idx) => { return { team: t, rank: idx + 1 } })

export default {
  participantsRank: selection, // el numero de parts debe ser igual a la suma de participantsNumber.news de cada stage
}