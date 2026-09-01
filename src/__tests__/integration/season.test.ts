import { describe, it, expect, beforeEach } from "vitest";
import { JCalendar, JDateTime } from "jl-calendar";
import { Federation, IFederationCreator, Country, Town } from "../../JSportModule";
import { IInstitutionCreator, Institution } from "../../JSportModule/data/Entities/Institution";
import LeagueSystem, { ILeagueSystemCreator } from "../../JSportModule/data/Entities/LeagueSystem";
import { TInitialCreator, TPhaseCreator } from "../../JSportModule/GeneralStageGraph/GSGCreators";
import { ITournamentFromGSGData } from "../../JSportModule/GeneralStageGraph/tournamentFromGSG";
import { FootballProfile } from "../../JSportModule/profiles/football/FootballProfile";
import { teamsAssign } from "../../Tournament/teamsAssign";
import { SimulationContext } from "../../Tournament/SimulationContext";
import Tournament from "../../Tournament/Tournament";
import { reseedRandom } from "../../JSportModule/Match/randomSource";
import { Ranking } from "../../JSportModule/Ranking";
import { JDate } from "jl-calendar";

// -----------------------------------------------------------------------------
// Capa 7 — Integración end-to-end de una temporada
//
// Verifica el flujo completo con el diseño refactorizado (SimulationContext,
// store inyectado, SIN singleton global): crear federación -> instituciones ->
// torneo de división -> asignar teams -> avanzar calendario -> ranking final.
//
// Determinista: reseedRandom(SEED) antes de simular. El store es local al test
// (ctx.store), por lo que NO hay estado global compartido entre tests.
// -----------------------------------------------------------------------------

const SEED = 13;
const SEASON = 1156;
const N_TEAMS = 8;

/** Config de una liga de 8 equipos, ida y vuelta (mirroring fede_inst_Example año 1156). */
function divisionConfig(): ITournamentFromGSGData {
  const iniCreator: TInitialCreator = {
    tournamentId: 'S_FTEST_D01',
    qualyrankList: Array.from({ length: N_TEAMS }, (_, i) => ({ origin: 'fr_S_FTEST', pos: i + 1 })),
    rankGroupNumbers: [N_TEAMS],
  };
  const phaseCreatorArr: TPhaseCreator[] = [
    {
      id: 1,
      stages: [
        { count: 1, stage: { type: 'group', opt: 'h&a', value: 1 } },
      ],
    },
  ];
  return {
    name: 'Lig',
    gsgData: { initialCreator: iniCreator, phaseArr: phaseCreatorArr },
    matchList: [28, 32, 36, 40, 44, 48, 52, 70, 74, 78, 82, 86, 90, 94],
    schedList: [16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16],
    qualyRules: [],
  };
}

/**
 * Igual que divisionConfig() pero CON sorteo (draw), que dispara el camino
 * teamsDraw -> Bombo -> shuffled. Con la inyección de randomFloat en Bombo,
 * este sorteo también es reproducible bajo reseedRandom(seed).
 */
function divisionConfigWithDraw(): ITournamentFromGSGData {
  const cfg = divisionConfig();
  cfg.gsgData.phaseArr[0].stages[0].stage = {
    type: 'group', opt: 'h&a', value: 1, draw: { interv: 18, rules: [] },
  };
  return cfg;
}

function buildFederationWithTeams(): Federation {
  const fedCreator: IFederationCreator = {
    id: 'FTEST',
    areaAsosiated: new Country({ i: 'C_TEST', n: 'Country_TEST', r: '1', a: 18141, p: 1576000 }),
    name: 'Federation Test', shortName: 'FTEST',
    fundationDay: new JDate(378 * 1888),
    members: new Map<string, Institution>(),
    founderMembers: [],
    headquarters: new Town({ i: 'T_TEST', n: 'Town_TEST', c: '12', a: 18, p: 15400 }),
    cupSystem: {}, leagueSystem: {}, rankings: {},
  };
  const federation = new Federation(fedCreator);
  for (let i = 1; i <= N_TEAMS; i++) {
    const iid = `C_TEST_I${String(i).padStart(3, '0')}`;
    const iic: IInstitutionCreator = {
      id: iid, name: iid, shortName: iid, abrevName: iid,
      headquarters: new Town({ i: `T_${iid}`, n: iid, c: 'C_TEST', p: 2, a: 5 }),
      funtationDay: new JDate(13556),
    };
    const institution = new Institution(iic);
    federation.addMember(institution);
    institution.createTeam('S');
    federation.addInstitutionToCategory(institution, 'S');
  }
  return federation;
}

/** Avanza el calendario ejecutando todos los eventos (equivalente a exampleAdvance, sin logs). */
function advanceCalendar(cal: JCalendar): void {
  let guard = 0;
  while (cal.getNextEvents().events.length !== 0) {
    const { dt, events } = cal.getNextEvents();
    cal.now = dt;
    events.forEach((eve) => eve.execute());
    if (++guard > 100000) throw new Error('advanceCalendar: demasiados eventos (posible loop)');
  }
}

describe("Integración - temporada de una división (end-to-end)", () => {
  beforeEach(() => {
    reseedRandom(SEED);
  });

  it("corre una temporada completa y produce un ranking coherente", () => {
    const federation = buildFederationWithTeams();

    // ranking inicial de la federación
    const franking = federation.getRanking('S');
    expect(franking.size).toBe(N_TEAMS);
    const initialTeamIds = franking.getRankTable().map(r => r.team.id).sort();

    // contexto de simulación (calendario + store local, sin global)
    const cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, SEASON, 168).getIJDateTimeCreator());
    const ctx = new SimulationContext(cal);
    ctx.store.set(franking.context, franking);

    // configurar el league system de la división y crear el torneo
    const lsc: ILeagueSystemCreator = {
      category: 'S',
      isTransition: false,
      divisions: [{ level: 1, fromGSGData: divisionConfig(), condition: { N: N_TEAMS, p: 0, r: 0 } }],
    };
    federation.updateLeagueSystem(new LeagueSystem(lsc));

    const tournamentData = federation.createTournamentList();
    expect(tournamentData.length).toBe(1);

    const tournament = Tournament.create({ id: tournamentData[0].name, season: SEASON }, tournamentData[0], ctx, new FootballProfile());
    teamsAssign(tournament, ctx);

    // avanzar el calendario -> se juegan todos los partidos
    advanceCalendar(cal);

    // todas las phases terminaron
    expect(tournament.phases.every(p => p.isFinished)).toBe(true);

    // el torneo produjo su ranking final (context tr_)
    const trank = tournament.getRelativeRank();
    expect(trank.context).toBe('tr_S_FTEST_D01');
    expect(trank.isBlocked).toBe(true);
    expect(trank.size).toBe(N_TEAMS);

    // el store contiene el ranking de la stage (rs_) y el inicial (ini_)
    expect(ctx.store.has('ini_S_FTEST_D01')).toBe(true);

    // no se perdieron ni duplicaron teams
    const finalTeamIds = trank.getRankTable().map(r => r.team.id).sort();
    expect(new Set(finalTeamIds).size).toBe(N_TEAMS);
    expect(finalTeamIds).toEqual(initialTeamIds);
  });

  /** Corre una temporada con el config dado y devuelve la secuencia pos:institución. */
  function runSeason(configFactory: () => ITournamentFromGSGData): string[] {
    reseedRandom(SEED);
    const federation = buildFederationWithTeams();
    const franking = federation.getRanking('S');
    const cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, SEASON, 168).getIJDateTimeCreator());
    const ctx = new SimulationContext(cal);
    ctx.store.set(franking.context, franking);
    federation.updateLeagueSystem(new LeagueSystem({
      category: 'S', isTransition: false,
      divisions: [{ level: 1, fromGSGData: configFactory(), condition: { N: N_TEAMS, p: 0, r: 0 } }],
    }));
    const data = federation.createTournamentList();
    const t = Tournament.create({ id: data[0].name, season: SEASON }, data[0], ctx, new FootballProfile());
    teamsAssign(t, ctx);
    advanceCalendar(cal);
    return t.getRelativeRank().getRankTable().map(r => `${r.pos}:${r.team.entity.id}`);
  }

  it("es determinista SIN sorteo: misma semilla produce el mismo ranking", () => {
    expect(runSeason(divisionConfig)).toEqual(runSeason(divisionConfig));
  });

  it("es determinista CON sorteo: Bombo usa la fuente sembrada (reseedRandom)", () => {
    // Con la inyección de randomFloat en Bombo.shuffled, el sorteo es reproducible:
    // misma semilla -> mismo emparejamiento -> mismo ranking final.
    expect(runSeason(divisionConfigWithDraw)).toEqual(runSeason(divisionConfigWithDraw));
  });

  it("no comparte estado entre simulaciones (stores independientes)", () => {
    const federation = buildFederationWithTeams();
    const franking = federation.getRanking('S');

    const ctxA = new SimulationContext(new JCalendar(JDateTime.createFromDayOfYearAndYear(1, SEASON, 168).getIJDateTimeCreator()));
    const ctxB = new SimulationContext(new JCalendar(JDateTime.createFromDayOfYearAndYear(1, SEASON, 168).getIJDateTimeCreator()));

    ctxA.store.set(franking.context, franking);

    expect(ctxA.store.has(franking.context)).toBe(true);
    expect(ctxB.store.has(franking.context)).toBe(false);
    expect(ctxB.store.size).toBe(0);
  });
});
