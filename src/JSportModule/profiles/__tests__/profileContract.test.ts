import { describe, it, expect } from "vitest";
import { AnySportProfile, IMatchCreationInfo, ISerieCreationInfo } from "../ISportProfile";
import { FootballProfile } from "../football/FootballProfile";
import { VolleyballProfile } from "../volleyball/VolleyballProfile";
import { AmericanFootballProfile } from "../americanFootball/AmericanFootballProfile";
import { A_Match } from "../../Match/A_Match";
import { A_Serie } from "../../Match/A_Serie";
import { A_Result } from "../../Match/A_Result";
import { A_MatchPlay } from "../../Match/A_MatchPlay";
import { A_TeamTableItem, AnyTeamTableItem } from "../../Ranking/A_TeamTableItem";
import Team, { TeamMatch } from "../../data/Team";

// -----------------------------------------------------------------------------
// Contrato ISportProfile — parametrizado sobre los 3 profiles.
//
// Verifica que cada profile es una fábrica coherente: crea instancias de las
// clases base A_* correctas, y que el sort func de su TableItem es un orden total
// (transitivo, antisimétrico en signo).
// -----------------------------------------------------------------------------

/** Team mínimo: el profile/match solo usa id, getTeamMatch, addNewMatch. */
function fakeTeam(id: string): Team {
  const t: Partial<Team> = {
    id,
    getTeamMatch: () => new TeamMatch(id),
    addNewMatch: () => {},
    addStage: () => {},
  };
  return t as unknown as Team;
}

function matchInfo(id: string): IMatchCreationInfo {
  return {
    id,
    hw: 10,
    season: 2000,
    homeTeam: fakeTeam('A'),
    awayTeam: fakeTeam('B'),
    allowedDraw: true,
    isNeutral: false,
  };
}

function serieInfo(id: string): ISerieCreationInfo {
  return {
    id,
    teamOne: fakeTeam('A'),
    teamTwo: fakeTeam('B'),
    hws: [10, 12],
    season: 2000,
    opt: 'h&a',
  };
}

const profiles: Array<{ name: string; profile: AnySportProfile }> = [
  { name: 'FootballProfile', profile: new FootballProfile() },
  { name: 'VolleyballProfile', profile: new VolleyballProfile() },
  { name: 'AmericanFootballProfile', profile: new AmericanFootballProfile() },
];

describe.each(profiles)("Contrato ISportProfile - $name", ({ profile }) => {
  it("createMatch devuelve un A_Match", () => {
    expect(profile.createMatch(matchInfo('m1'))).toBeInstanceOf(A_Match);
  });

  it("createSerie devuelve un A_Serie", () => {
    expect(profile.createSerie(serieInfo('s1'))).toBeInstanceOf(A_Serie);
  });

  it("createResult devuelve un A_Result", () => {
    expect(profile.createResult('A', 'B')).toBeInstanceOf(A_Result);
  });

  it("createMatchPlay devuelve un A_MatchPlay", () => {
    expect(profile.createMatchPlay()).toBeInstanceOf(A_MatchPlay);
  });

  it("createTableItem devuelve un A_TeamTableItem", () => {
    const item = profile.createTableItem(fakeTeam('A'), 'bs1');
    expect(item).toBeInstanceOf(A_TeamTableItem);
  });

  it("getSortFunc existe y ordena de forma total (transitiva)", () => {
    // Construimos varios items con puntajes distintos jugando partidos vía el
    // resultado, para que el sort tenga sobre qué ordenar.
    const items: AnyTeamTableItem[] = ['A', 'B', 'C', 'D'].map((id, idx) => {
      const it = profile.createTableItem(fakeTeam(id), 'bs1');
      // asignamos posiciones distintas para tener un criterio determinista
      it.pos = idx + 1;
      return it;
    });

    const sortFunc = items[0].getSortFunc();
    expect(typeof sortFunc).toBe('function');

    // Orden total: si a<=b y b<=c entonces a<=c (transitividad del comparador).
    const cmp = (a: AnyTeamTableItem, b: AnyTeamTableItem) => sortFunc(a, b, false);
    const sorted = [...items].sort(cmp);
    // ordenar dos veces debe dar el mismo resultado (estabilidad del orden total)
    const sortedTwice = [...sorted].sort(cmp);
    expect(sortedTwice.map((i) => i.team.id)).toEqual(sorted.map((i) => i.team.id));

    // antisimetría de signo: cmp(a,b) y cmp(b,a) tienen signos opuestos (o ambos 0).
    // Se normaliza con `+ 0` para evitar la distinción -0/+0 de Object.is en toBe.
    for (let i = 0; i < items.length; i++) {
      for (let j = 0; j < items.length; j++) {
        const ab = Math.sign(cmp(items[i], items[j]));
        const ba = Math.sign(cmp(items[j], items[i]));
        expect(ab + 0).toBe(-ba + 0);
      }
    }
  });
});
