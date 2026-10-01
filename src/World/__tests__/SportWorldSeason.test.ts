import { describe, it, expect, beforeEach } from "vitest";
import { JDate } from "jl-calendar";
import { SportWorld } from "../SportWorld";
import { Federation, IFederationCreator, Country, Town } from "../../JSportModule";
import { IInstitutionCreator, Institution } from "../../JSportModule/data/Entities/Institution";
import { LeagueSystem, ILeagueSystemCreator } from "../../JSportModule/data/Entities/LeagueSystem";
import { TInitialCreator, TPhaseCreator } from "../../JSportModule/GeneralStageGraph/GSGCreators";
import { ITournamentFromGSGData } from "../../JSportModule/GeneralStageGraph/tournamentFromGSG";
import { reseedRandom } from "jl-sprt-match";

// -----------------------------------------------------------------------------
// SportWorld — Paso 4: ciclo de temporada (runSeason + closeSeason) a nivel
// FEDERACIÓN (clubes). Replica el setup de multiSeason.test.ts pero orquestado por
// el SportWorld: dos divisiones de 8 equipos, corre la temporada, cierra (ascensos/
// descensos) y verifica que la transición N->N+1 conserva los equipos y siembra los
// torneos del año siguiente.
// -----------------------------------------------------------------------------

const SEED = 13;
const SEASON = 1156;
const FED_ID = 'WFED';
const DIV_SIZE = 8;
const TOTAL = DIV_SIZE * 2;

function divisionConfig(tournamentId: string, posOffset: number): ITournamentFromGSGData {
  const iniCreator: TInitialCreator = {
    tournamentId,
    qualyrankList: Array.from({ length: DIV_SIZE }, (_, i) => ({ origin: `fr_S_${FED_ID}`, pos: posOffset + i + 1 })),
    rankGroupNumbers: [DIV_SIZE],
  };
  const phaseCreatorArr: TPhaseCreator[] = [
    { id: 1, stages: [{ count: 1, stage: { type: 'group', opt: 'h&a', value: 1 } }] },
  ];
  return {
    name: 'Lig',
    gsgData: { initialCreator: iniCreator, phaseArr: phaseCreatorArr },
    matchList: [28, 32, 36, 40, 44, 48, 52, 70, 74, 78, 82, 86, 90, 94],
    schedList: [16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16],
    qualyRules: [],
  };
}

function twoDivisionLeagueSystem(): LeagueSystem {
  const lsc: ILeagueSystemCreator = {
    category: 'S',
    isTransition: false,
    divisions: [
      { level: 1, fromGSGData: divisionConfig('S_' + FED_ID + '_D01', 0), condition: { N: DIV_SIZE, p: 0, r: 1 } },
      { level: 2, fromGSGData: divisionConfig('S_' + FED_ID + '_D02', DIV_SIZE), condition: { N: DIV_SIZE, p: 1, r: 0 } },
    ],
  };
  return new LeagueSystem(lsc);
}

function buildFederationWithTeams(): Federation {
  const fedCreator: IFederationCreator = {
    id: FED_ID,
    areaAsosiated: new Country({ i: 'C_W', n: 'Country_W', r: '1', a: 1, p: 1 }),
    name: 'Federation World', shortName: FED_ID,
    fundationDay: new JDate(378 * 1888),
    members: new Map<string, Institution>(),
    founderMembers: [],
    headquarters: new Town({ i: 'T_W', n: 'Town_W', c: 'C_W', a: 1, p: 1 }),
    cupSystem: {}, leagueSystem: {}, rankings: {},
  };
  const federation = new Federation(fedCreator);
  for (let i = 1; i <= TOTAL; i++) {
    const iid = `C_W_I${String(i).padStart(3, '0')}`;
    const iic: IInstitutionCreator = {
      id: iid, name: iid, shortName: iid, abrevName: iid,
      headquarters: new Town({ i: `T_${iid}`, n: iid, c: 'C_W', p: 1, a: 1 }),
      funtationDay: new JDate(13556), sport: "football",
    };
    const institution = new Institution(iic);
    federation.addMember(institution);
    institution.createTeam('S');
    federation.addInstitutionToCategory(institution, 'S');
  }
  return federation;
}

/** Mundo con una federación de 2 divisiones, LeagueSystem configurado. */
function buildWorld(): { world: SportWorld; federation: Federation } {
  const world = SportWorld.createFromYear(SEASON);
  const federation = buildFederationWithTeams();
  federation.updateLeagueSystem(twoDivisionLeagueSystem());
  world.addFederation(federation);
  return { world, federation };
}

describe("SportWorld - ciclo de temporada (federación, clubes)", () => {
  beforeEach(() => {
    reseedRandom(SEED);
  });

  it("openSeasonTournaments siembra los torneos de la federación en la temporada actual", () => {
    const { world } = buildWorld();
    world.openSeasonTournaments();
    // Dos divisiones -> dos torneos.
    expect(world.tournaments.length).toBe(2);
    // Antes de correr, el calendario tiene eventos por procesar (stage-start de cada div).
    expect(world.calendar.hasEventsToProcess()).toBe(true);
  });

  it("runSeason corre la temporada completa: los torneos quedan finalizados", () => {
    const { world } = buildWorld();
    world.openSeasonTournaments();
    world.runSeason();
    world.tournaments.forEach((t) => {
      t.stagesMap.forEach((stage) => expect(stage.isFinished).toBe(true));
    });
  });

  it("closeSeason aplica ascensos/descensos y conserva el conjunto de equipos", () => {
    const { world, federation } = buildWorld();
    const before = federation.getRanking('S').getRankTable().map((r) => r.team.entity.id);
    expect(before.length).toBe(TOTAL);

    world.openSeasonTournaments();
    world.runSeason();
    world.closeSeason();

    // La temporada avanzó.
    expect(world.currentSeason).toBe(SEASON + 1);

    // El ranking de la federación se actualizó sin perder ni duplicar equipos.
    const after = federation.getRanking('S').getRankTable().map((r) => r.team.entity.id);
    expect(after.length).toBe(TOTAL);
    expect(new Set(after).size).toBe(TOTAL);
    expect([...after].sort()).toEqual([...before].sort());
  });

  it("closeSeason siembra los torneos del nuevo año (listos para correr)", () => {
    const { world } = buildWorld();
    world.openSeasonTournaments();
    world.runSeason();
    world.closeSeason();

    // Tras cerrar, hay torneos del año nuevo registrados y eventos por procesar.
    expect(world.tournaments.length).toBe(2);
    expect(world.calendar.hasEventsToProcess()).toBe(true);
  });

  it("dos temporadas consecutivas corren end-to-end (encadenamiento N -> N+1)", () => {
    const { world, federation } = buildWorld();

    // Temporada 1
    world.openSeasonTournaments();
    world.runSeason();
    world.closeSeason();
    expect(world.currentSeason).toBe(SEASON + 1);

    // Temporada 2 (torneos ya sembrados por closeSeason)
    world.runSeason();
    world.closeSeason();
    expect(world.currentSeason).toBe(SEASON + 2);

    // El conjunto de equipos sigue intacto tras dos temporadas.
    const ids = federation.getRanking('S').getRankTable().map((r) => r.team.entity.id);
    expect(ids.length).toBe(TOTAL);
    expect(new Set(ids).size).toBe(TOTAL);
  });

  it("closeSeason sin federaciones con LeagueSystem no crea torneos (mundo vacío)", () => {
    const world = SportWorld.createFromYear(SEASON);
    world.closeSeason();
    expect(world.currentSeason).toBe(SEASON + 1);
    expect(world.tournaments.length).toBe(0);
  });
});
