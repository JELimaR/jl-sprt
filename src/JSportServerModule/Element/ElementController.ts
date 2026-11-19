import {
  IElementController,
  ICreateSimpleLeagueInput,
  ICreateCupInput,
  ISimulationRef,
  IAdvanceResultDTO,
  ISimulationStateDTO,
  IMatchDTO,
  IStandingRowDTO,
  ICalendarEventDTO,
  IDateTimeDTO,
  MatchStateDTO,
  MatchWinnerDTO,
  IFixtureSlotDTO,
  FixtureParticipantRefDTO,
  ITeamDTO,
  ITeamTournamentDTO,
  IMatchTeamKitDTO,
} from "../../JSportModule";
import type { FixtureParticipantRef, IFixtureSlot } from "../../Tournament/Stage/Fixture";
import { ElementHandler, ISimulationSession } from "./ElementHandler";
import { SportFactoryServer } from "../SportFactoryServer";
import { SportWorld } from "../../World/SportWorld";
import { SimulationContext } from "../../Tournament/SimulationContext";
import { Tournament } from "../../Tournament/Tournament";
import { StageGroup } from "../../Tournament/Stage/StageGroup/StageGroup";
import { StagePlayoff } from "../../Tournament/Stage/StagePlayoff/StagePlayoff";
import { League } from "../../Tournament/Stage/StageGroup/League/League";
import { Ranking } from "../../JSportModule/Ranking/Ranking";
import { Institution } from "../../JSportModule/data/Entities/Institution";
import { Town } from "../../JSportModule/data/Entities/GeogEntity";
import { IKitSet, IMatchKitChoice, selectMatchKits, shirtDominant, webColorsOf } from "../../JSportModule/data/Entities/Kits";
import { teamsAssign } from "../../Tournament/teamsAssign";
import { JDate, JDateTime, DateToString } from "jl-calendar";
import type { JEvent } from "jl-calendar";
import { JEventMatch } from "../../Tournament/Stage/Match/EventMatch";
import {
  ProfilesFactory,
  formatScoreText,
  getSetBreakdown,
  scoreValue,
  TSupportedMatchScore,
  initialTeam,
  randomFloat,
} from "jl-sprt-match";
import type { AnyMatch, AnyTeam, TypeCategory } from "jl-sprt-core";
import type { TypeHalfWeekOfYear } from "jl-calendar";
import type { IRankItem, TypeTableMatchState } from "../../JSportModule";
import type { TGS } from "../../Tournament/Stage/Stage";
import type { ITournamentFromGSGData } from "../../JSportModule/GeneralStageGraph/tournamentFromGSG";
import type { TInitialCreator, TPhaseCreator } from "../../JSportModule/GeneralStageGraph/GSGCreators";

const SOURCE_RANKING_CONTEXT = 'fr_S_SIM';
const SIMPLE_LEAGUE_TOURNAMENT_ID = 'SIM_LEAGUE';
const CUP_TOURNAMENT_ID = 'SIM_CUP';
/** La copa de eliminación directa es un bracket de 64 (5 rondas: 64->32->16->8->4->2). */
const CUP_TEAMS = 64;

/** Partido + metadatos de la jornada/ronda y el torneo al que pertenece (para el DTO). */
interface MatchWithTurn {
  match: AnyMatch;
  turn: number;
  halfWeek: number;
  tournamentId: string;
  tournamentName: string;
}

/**
 * ElementController — API de SIMULACIÓN sobre el `SportWorld` del proceso.
 *
 * Administra sesiones por `simulationId` (vía ElementHandler). Cada sesión vive dentro
 * del mundo del proceso (`SportFactoryServer.instance.world`), el mismo que administra
 * el EntityController: así las entidades (instituciones/teams) y la simulación comparten
 * estado (ver docs/plans/SPORT_WORLD.md).
 *
 * El mundo es dueño del calendario y los rankings; el `SimulationContext` que usa el
 * motor de torneos se construye como VISTA del mundo (`world.calendar` + `world.rankings`).
 *
 * Los nombres de team salen de `A_Team.name` (derivado de su Institution) — no hay mapa
 * paralelo. Los DTOs se arman recorriendo `tournament.stagesMap` de forma genérica.
 */
export class ElementController implements IElementController {
  private static _instance: ElementController;
  private constructor() { }
  static get instance(): ElementController {
    if (!this._instance)
      this._instance = new ElementController();
    return this._instance;
  }

  private get handler(): ElementHandler {
    return ElementHandler.instance;
  }

  private get world(): SportWorld {
    return SportFactoryServer.instance.world;
  }

  // ╔════════════════════════════════════════════════════════════════════════╗
  // ║ CASOS DE USO / ESCENARIOS DE PRUEBA — NO es la API real                  ║
  // ║                                                                          ║
  // ║ `createSimpleLeague` (y su helper `buildSimpleLeagueData` más abajo) NO  ║
  // ║ forman parte de la API "real" de elements: montan un escenario concreto  ║
  // ║ (liga simple) para poder construir/probar los componentes de la app. La  ║
  // ║ creación real de torneos del mundo irá por otro flujo (SportWorld /      ║
  // ║ creadores de torneos). Mantener claramente separado de los comandos y    ║
  // ║ queries genéricos (advance/runAll/getState/...).                         ║
  // ╚════════════════════════════════════════════════════════════════════════╝

  createSimpleLeague(input: ICreateSimpleLeagueInput): ISimulationRef {
    if (!input.teams || input.teams.length < 2) {
      throw new Error(`createSimpleLeague: se requieren al menos 2 equipos (recibidos: ${input.teams?.length ?? 0}). En ElementController.createSimpleLeague`);
    }
    return this.createSimulation(
      input.sport,
      input.teams,
      input.season,
      input.category,
      SIMPLE_LEAGUE_TOURNAMENT_ID,
      (tournamentId) => this.buildSimpleLeagueData(tournamentId, input.teams.length, input.opt),
    );
  }

  createSingleEliminationCup(input: ICreateCupInput): ISimulationRef {
    if (!input.teams || input.teams.length !== CUP_TEAMS) {
      throw new Error(`createSingleEliminationCup: se requieren exactamente ${CUP_TEAMS} equipos (recibidos: ${input.teams?.length ?? 0}). En ElementController.createSingleEliminationCup`);
    }
    return this.createSimulation(
      input.sport,
      input.teams,
      input.season,
      input.category,
      CUP_TOURNAMENT_ID,
      (tournamentId) => this.buildSingleEliminationCupData(tournamentId),
    );
  }

  /**
   * Núcleo común de los CASOS DE USO: reinicia el mundo (un mundo = una simulación),
   * crea las instituciones/teams, arma el ranking fuente y construye el torneo desde
   * el GSG que provee `buildData`. Registra la sesión y devuelve su `simulationId`.
   */
  private createSimulation(
    sport: ICreateSimpleLeagueInput['sport'],
    teamsInput: ICreateSimpleLeagueInput['teams'],
    inputSeason: number | undefined,
    inputCategory: TypeCategory | undefined,
    tournamentPrefix: string,
    buildData: (tournamentId: string) => ITournamentFromGSGData,
  ): ISimulationRef {
    const category = inputCategory ?? 'S';
    const profile = ProfilesFactory.getProfile(sport);

    // UN MUNDO = UNA SIMULACIÓN. Crear el escenario REINICIA el mundo del proceso:
    // se descarta por completo el mundo anterior (entidades + calendario + rankings) y
    // se limpian las sesiones previas. Así nunca coexisten dos simulaciones (p. ej.
    // entrar al test, salir y volver a entrar no acumula mundos; tampoco el doble
    // montaje de React StrictMode deja una simulación extra con sus eventos).
    const world = inputSeason !== undefined
      ? SportFactoryServer.instance.resetWorld(inputSeason)
      : SportFactoryServer.instance.resetWorld();
    this.handler.clear();
    const season = world.currentSeason;

    // El SimulationContext es una VISTA del mundo: comparte su calendario único y su
    // store de rankings. El torneo agenda sus eventos en el calendario del mundo.
    const ctx = new SimulationContext(world.calendar, world.rankings);

    // 1. Crear las entidades (instituciones) EN EL MUNDO y obtener sus teams. El
    //    nombre legible queda en la Institution; el team lo expone vía `name`.
    const uniq = this.handler.genId();
    const teams: AnyTeam[] = teamsInput.map((t, i) => {
      const instId = t.id ?? `${uniq}-inst-${i}`;
      // Town placeholder del mundo (geografía real se cargará vía EntityController).
      const townId = `TWN_${instId}`;
      if (!world.getTown(townId)) {
        world.addTown(new Town({ i: townId, n: t.name, c: 'C_SIM', p: 1, a: 1 }));
      }
      const inst = new Institution({
        id: instId,
        name: t.name,
        shortName: t.name,
        abrevName: t.name.slice(0, 3).toUpperCase(),
        headquarters: world.getTown(townId)!,
        funtationDay: new JDate(1),
        sport,
      });
      // Valores iniciales con el helper transitorio de jl-sprt-match (teams distintos).
      inst.createTeam(category, initialTeam(sport, randomFloat));
      world.addInstitution(inst);
      return inst.getTeam(category)!;
    });

    // 2. Ranking inicial (fuente) para el torneo, en el store del mundo.
    const rankItems: IRankItem[] = teams.map((team, i) => ({
      pos: i + 1,
      team,
      origin: SOURCE_RANKING_CONTEXT,
    }));
    const sourceRanking = Ranking.fromRankItemArr(SOURCE_RANKING_CONTEXT, rankItems);
    ctx.store.set(sourceRanking.context, sourceRanking);

    // 3. Construir el torneo desde el GSG. Id único por sesión.
    const tournamentId = `${tournamentPrefix}_${uniq}`;
    const data = buildData(tournamentId);
    const tournament = Tournament.create({ id: tournamentId, season }, data, ctx, profile);

    // teamsAssign resuelve el ranking inicial (ini_) desde el store y agenda el draw.
    teamsAssign(tournament, ctx);

    const tournaments = new Map<string, Tournament>();
    tournaments.set(tournamentId, tournament);
    this.handler.add({ id: uniq, world, ctx, sport, tournaments });
    return { simulationId: uniq };
  }

  // ==========================================================================
  // API REAL — Comandos (genéricos, independientes del escenario)
  // ==========================================================================

  advance(simulationId: string): IAdvanceResultDTO {
    const s = this.handler.require(simulationId);
    const cal = s.ctx.calendar;
    let pending: JEvent[] = [];

    // Avance fino: exactamente un tick. Procesa el instante actual (ejecuta
    // instantáneos, arranca/avanza durativos) y mueve el reloj un intervalo, salvo
    // que un interactivo lo frene. No salta tiempo muerto.
    if (cal.hasEventsToProcess()) {
      const res = cal.tick();
      if (!res.advanced) pending = res.pending;
    }

    return this.buildAdvanceResult(s, pending);
  }

  advanceToNextEvent(simulationId: string): IAdvanceResultDTO {
    const s = this.handler.require(simulationId);
    const cal = s.ctx.calendar;

    // Salto INERTE hasta el intervalo anterior al próximo evento, SIN ejecutar nada en
    // el camino. `skipToNextEvent` solo mueve el reloj (no simula intervalos), así que
    // no arranca/juega los durativos que haya por delante. El siguiente `advance` (un
    // tick) ejecuta el evento. Si hay durativos activos o no hay futuros, no salta.
    cal.skipToNextEvent();
    return this.buildAdvanceResult(s, []);
  }

  advanceIntervals(simulationId: string, n: number): IAdvanceResultDTO {
    const s = this.handler.require(simulationId);
    const cal = s.ctx.calendar;
    // Hasta n ticks; `advanceIntervals` del calendario frena ante un interactivo.
    const res = cal.advanceIntervals(n);
    return this.buildAdvanceResult(s, res.pending);
  }

  step(simulationId: string): IAdvanceResultDTO {
    const s = this.handler.require(simulationId);
    const cal = s.ctx.calendar;

    // ¿Hay actividad para ejecutar en el instante actual?
    //  - durativos en curso, o
    //  - un evento agendado exactamente en `now` (el reloj ya está en su fecha).
    const hasActive = cal.getActiveEvents().length > 0;
    const hasEventNow = cal.getCurrentEventList().length > 0;

    if (hasActive || hasEventNow) {
      // Ejecutar el instante actual / avanzar el durativo: un único tick.
      let pending: JEvent[] = [];
      if (cal.hasEventsToProcess()) {
        const res = cal.tick();
        if (!res.advanced) pending = res.pending;
      }
      return this.buildAdvanceResult(s, pending);
    }

    // No hay nada en `now`: SALTO INERTE hasta la fecha exacta del próximo evento, sin
    // ejecutarlo (lo ejecutará el próximo `step`, que entrará por hasEventNow). Solo
    // mueve el reloj; no simula el camino ni juega durativos.
    cal.skipToNextEvent();
    return this.buildAdvanceResult(s, []);
  }

  runAll(simulationId: string, guard: number = 5 * 300 * 378): IAdvanceResultDTO {
    const s = this.handler.require(simulationId);
    const cal = s.ctx.calendar;
    let g = 0;
    let pending: JEvent[] = [];

    while (cal.hasEventsToProcess()) {
      const NE = cal.getNextEvents();
      if (NE && cal.getActiveEvents().length === 0) {
        const intervals = JDateTime.difBetween(NE.dt, cal.now) - 1;
        if (intervals > 0) {
          const jump = cal.advanceIntervals(intervals);
          if (jump.pending.length > 0) { pending = jump.pending; break; }
        }
      }
      const res = cal.tick();
      if (!res.advanced && res.pending.length > 0) { pending = res.pending; break; }
      if (++g > guard) {
        throw new Error(`runAll superó el guard (${guard}) en ${DateToString.Date_DDMMYYYY(cal.now.date)}. En ElementController.runAll`);
      }
    }

    return this.buildAdvanceResult(s, pending);
  }

  dispose(simulationId: string): boolean {
    return this.handler.remove(simulationId);
  }

  // ==========================================================================
  // Queries
  // ==========================================================================

  getState(simulationId: string): ISimulationStateDTO {
    return this.buildState(this.handler.require(simulationId));
  }

  getFixture(simulationId: string): IFixtureSlotDTO[] {
    return this.buildFixture(this.handler.require(simulationId));
  }

  getMatches(simulationId: string): IMatchDTO[] {
    return this.buildMatches(this.handler.require(simulationId));
  }

  getMatch(simulationId: string, matchId: string): IMatchDTO | null {
    const s = this.handler.find(simulationId);
    if (!s) return null;
    return this.buildMatches(s).find((m) => m.id === matchId) ?? null;
  }

  getStandings(simulationId: string): IStandingRowDTO[] {
    return this.buildStandings(this.handler.require(simulationId), 'partial');
  }

  getCalendarEvents(simulationId: string): ICalendarEventDTO[] {
    return this.buildEvents(this.handler.require(simulationId));
  }

  getCurrentDate(simulationId: string): IDateTimeDTO {
    const s = this.handler.require(simulationId);
    return this.toDateTimeDTO(s.ctx.calendar.now);
  }

  getTeam(simulationId: string, teamId: string): ITeamDTO | null {
    const s = this.handler.find(simulationId);
    if (!s) return null;
    const team = this.findTeam(s, teamId);
    if (!team) return null;
    // Colores y equipaciones: los de la institución del team (misma fuente que el DTO
    // de entidad). Toda institución de una simulación está en el mundo.
    const inst = this.requireInstitutionOf(s, team);
    return {
      teamId: team.id,
      name: team.name,
      category: team.category,
      institutionId: team.entity.id,
      institutionName: team.entity.name,
      sport: s.sport,
      identityColors: [...inst.identity.colors],
      webColors: inst.webColors(),
      kits: inst.kits,
    };
  }

  getTeamTournaments(simulationId: string, teamId: string): ITeamTournamentDTO[] {
    const s = this.handler.require(simulationId);
    const out: ITeamTournamentDTO[] = [];
    s.tournaments.forEach((t) => {
      // El team participa si aparece en algún partido del torneo.
      const plays = this.allMatchesWithTurn(t).some(
        ({ match }) => match.homeTeam.id === teamId || match.awayTeam.id === teamId,
      );
      if (!plays) return;
      const finished = this.isTournamentFinished(t);
      const position = this.teamPositionInTournament(t, teamId);
      out.push({
        tournamentId: t.config.idConfig,
        name: t.config.name,
        season: t.info.season,
        position,
        finished,
      });
    });
    return out;
  }

  getTeamMatches(simulationId: string, teamId: string, tournamentId?: string): IMatchDTO[] {
    const s = this.handler.require(simulationId);
    const tournaments = tournamentId
      ? [...s.tournaments.values()].filter((t) => t.config.idConfig === tournamentId)
      : [...s.tournaments.values()];

    const matches: IMatchDTO[] = [];
    tournaments.forEach((t) => {
      this.allMatchesWithTurn(t).forEach((mt) => {
        if (mt.match.homeTeam.id === teamId || mt.match.awayTeam.id === teamId) {
          matches.push(this.toMatchDTO(s, mt));
        }
      });
    });
    // Estilo agenda: ordenado por instante.
    matches.sort((a, b) => a.date.absolute - b.date.absolute);
    return matches;
  }

  // ==========================================================================
  // Helpers internos — selección de torneo
  // ==========================================================================

  /**
   * Devuelve el torneo sobre el que operan las queries de Fase A. La sesión tiene un
   * único torneo (la liga simple); cuando el modelo soporte varios, estas firmas
   * recibirán un `tournamentId` explícito.
   */
  private requireTournament(s: ISimulationSession): Tournament {
    const first = s.tournaments.values().next().value as Tournament | undefined;
    if (!first) {
      throw new Error(`La simulación "${s.id}" no tiene torneos. En ElementController.requireTournament`);
    }
    return first;
  }

  /** Busca un team por id en toda la sesión (derivado de los partidos materializados). */
  private findTeam(s: ISimulationSession, teamId: string): AnyTeam | undefined {
    for (const t of s.tournaments.values()) {
      const found = this.teamsById(t).get(teamId);
      if (found) return found;
    }
    return undefined;
  }

  /**
   * Un torneo está TERMINADO si tiene al menos un partido materializado y todos están
   * finalizados. Robusto frente a la vacuidad de `stage.isFinished` (que, al basarse en
   * `matches.every(...)`, devuelve true para un stage aún sin partidos: antes del draw
   * NO es "terminado", es "no empezado").
   */
  private isTournamentFinished(t: Tournament): boolean {
    const matches = this.allMatchesWithTurn(t);
    if (matches.length === 0) return false;
    return matches.every(({ match }) => match.state === 'finished');
  }

  /**
   * Posición (1-based) del equipo en la tabla del torneo, o undefined si el stage no
   * tiene tabla o el equipo no figura. Recorre los stages y devuelve la primera
   * coincidencia por teamId.
   */
  private teamPositionInTournament(t: Tournament, teamId: string): number | undefined {
    for (const stage of t.stagesMap.values()) {
      for (const tti of stage.getTable('partial')) {
        if (tti.team.id === teamId) {
          const row = tti.getInterface() as unknown as { pos: number };
          return row.pos;
        }
      }
    }
    return undefined;
  }

  // ==========================================================================
  // Helpers internos — recorrido genérico de stages
  // ==========================================================================

  /** Extrae los partidos de un stage con su jornada/ronda y el torneo, sea group o playoff. */
  private matchesOfStage(stage: TGS, tournamentId: string, tournamentName: string): MatchWithTurn[] {
    const out: MatchWithTurn[] = [];
    if (stage instanceof StageGroup) {
      stage.groups.forEach((league: League) => {
        league.turns.forEach((turn) => {
          turn.matches.forEach((match: AnyMatch) => {
            out.push({ match, turn: turn.num, halfWeek: turn.halfWeek, tournamentId, tournamentName });
          });
        });
      });
    } else if (stage instanceof StagePlayoff) {
      stage.playoff.rounds.forEach((round) => {
        round.matches.forEach((match: AnyMatch) => {
          out.push({ match, turn: round.num, halfWeek: round.halfWeek?.[0] ?? 0, tournamentId, tournamentName });
        });
      });
    }
    return out;
  }

  /** Recorre todos los stages del torneo recolectando sus partidos. */
  private allMatchesWithTurn(t: Tournament): MatchWithTurn[] {
    const out: MatchWithTurn[] = [];
    const tournamentId = t.config.idConfig;
    const tournamentName = t.config.name;
    t.stagesMap.forEach((stage) => {
      this.matchesOfStage(stage, tournamentId, tournamentName).forEach((mt) => out.push(mt));
    });
    return out;
  }

  /**
   * Mapa `teamId -> AnyTeam` del torneo, derivado de los partidos ya materializados.
   * Alcanza para resolver nombres en el fixture: un slot solo lleva ref `team` cuando
   * su Match concreto existe, y ese Match aporta sus equipos.
   */
  private teamsById(t: Tournament): Map<string, AnyTeam> {
    const map = new Map<string, AnyTeam>();
    this.allMatchesWithTurn(t).forEach(({ match }) => {
      map.set(match.homeTeam.id, match.homeTeam);
      map.set(match.awayTeam.id, match.awayTeam);
    });
    return map;
  }

  // ==========================================================================
  // Helpers internos — armado de DTOs
  // ==========================================================================

  /**
   * [CASO DE USO] GSG data para una liga de N equipos (1 fase, 1 grupo).
   * Helper exclusivo de `createSimpleLeague` (escenario de prueba), no de la API real.
   */
  private buildSimpleLeagueData(tournamentId: string, n: number, opt: ICreateSimpleLeagueInput['opt']): ITournamentFromGSGData {
    const iniCreator: TInitialCreator = {
      tournamentId,
      qualyrankList: Array.from({ length: n }, (_, i) => ({ origin: SOURCE_RANKING_CONTEXT, pos: i + 1 })),
      rankGroupNumbers: [n],
    };
    const phaseArr: TPhaseCreator[] = [
      { id: 1, stages: [{ count: 1, stage: { type: 'group', opt, value: 1 } }] },
    ];
    // La librería calcula la cantidad de jornadas según el round-robin (par/impar).
    // Se juega cada 2 medias semanas; se programa la media semana anterior.
    const turnsCount = League.getTurnsNumber(n, opt);
    const matchList = Array.from({ length: turnsCount }, (_, i) => 4 + i * 2) as TypeHalfWeekOfYear[];
    const schedList = Array.from({ length: turnsCount }, (_, i) => 3 + i * 2) as TypeHalfWeekOfYear[];
    return {
      name: 'Simple League',
      gsgData: { initialCreator: iniCreator, phaseArr },
      matchList,
      schedList,
      qualyRules: [],
    };
  }

  /**
   * [CASO DE USO] GSG data para una COPA de eliminación directa de 64 equipos.
   * Helper exclusivo de `createSingleEliminationCup`, no de la API real.
   *
   * Estructura en 2 fases:
   *  - Fase 1: un StagePlayoff IDA/VUELTA ('h&a') de 5 rondas (64->32->16->8->4->2).
   *    Un playoff de R rondas produce R+1 rank groups (los cortes por ronda):
   *    [finalistas(2), perd_r5(2), perd_r4(4), perd_r3(8), perd_r2(16), perd_r1(32)] = 6.
   *  - Fase 2: la FINAL en campo NEUTRAL (StagePlayoff de 1 ronda sobre los 2
   *    finalistas) + 5 `transfer` que arrastran las ramas eliminadas al FinalNode
   *    (verifyPhaseCreator exige consumir los 6 rank groups de la fase 1).
   *
   * Fechas: 10 del bracket (5 rondas h&a, pares ida/vuelta) + 1 final = 11.
   */
  private buildSingleEliminationCupData(tournamentId: string): ITournamentFromGSGData {
    const n = CUP_TEAMS;
    const iniCreator: TInitialCreator = {
      tournamentId,
      qualyrankList: Array.from({ length: n }, (_, i) => ({ origin: SOURCE_RANKING_CONTEXT, pos: i + 1 })),
      rankGroupNumbers: [n], // un único bracket de 64
    };
    const phaseArr: TPhaseCreator[] = [
      // Fase 1: bracket h&a de 5 rondas. Produce 6 rank groups.
      { id: 1, stages: [{ count: 1, stage: { type: 'playoff', opt: 'h&a', value: 5 } }] },
      // Fase 2: FINAL neutral (consume los 2 finalistas) + arrastre de las 5 ramas
      // eliminadas (consume los 6 rank groups de la fase 1: 1 final + 5 transfer).
      {
        id: 2,
        stages: [
          { count: 1, stage: { type: 'playoff', opt: 'neutral', value: 1 } }, // FINAL: 2 -> campeón
          { count: 1, stage: { type: 'transfer' } }, // perd_r5
          { count: 1, stage: { type: 'transfer' } }, // perd_r4
          { count: 1, stage: { type: 'transfer' } }, // perd_r3
          { count: 1, stage: { type: 'transfer' } }, // perd_r2
          { count: 1, stage: { type: 'transfer' } }, // perd_r1
        ],
      },
    ];
    // 10 fechas del bracket (5 rondas h&a, pares ida/vuelta) + 1 final neutral = 11.
    const matchList = [10, 12, 18, 20, 26, 28, 34, 36, 42, 44, 50] as TypeHalfWeekOfYear[];
    const schedList = [8, 8, 16, 16, 24, 24, 32, 32, 40, 40, 46] as TypeHalfWeekOfYear[];
    return {
      name: 'Single Elimination Cup',
      gsgData: { initialCreator: iniCreator, phaseArr },
      matchList,
      schedList,
      qualyRules: [],
    };
  }

  /** Nombre legible de un team por id (del propio team; `teamId` como fallback). */
  private nameOf(teamsById: Map<string, AnyTeam>, teamId: string): string {
    return teamsById.get(teamId)?.name ?? teamId;
  }

  private toDateTimeDTO(dt: JDateTime): IDateTimeDTO {
    return {
      absolute: dt.absolute,
      dateTime: dt.getDateTime(),
      label: DateToString.DateTime_ddd_DD_mmm_YYYY_HHMM_HW(dt),
    };
  }

  /** Institución de un team. Lanza si no está en el mundo (invariante de la simulación). */
  private requireInstitutionOf(s: ISimulationSession, team: { id: string; entity: { id: string } }): Institution {
    const inst = s.world.getInstitution(team.entity.id);
    if (!inst) throw new Error(`team ${team.id}: institution '${team.entity.id}' is not in the world`);
    return inst;
  }

  private toMatchTeamKitDTO(kits: IKitSet, choice: IMatchKitChoice): IMatchTeamKitDTO {
    const field = kits[choice.field];
    const special: IMatchTeamKitDTO['special'] = {};
    for (const [position, slot] of Object.entries(choice.special)) special[position] = { slot, kit: kits[slot] };
    return { fieldSlot: choice.field, field, web: webColorsOf(shirtDominant(field)), special };
  }

  private toMatchDTO(s: ISimulationSession, mt: MatchWithTurn): IMatchDTO {
    const m = mt.match;
    const res = m.result;
    // Equipaciones del partido: las decide el dominio (choque por ΔE), no la interfaz.
    const homeKits = this.requireInstitutionOf(s, m.homeTeam).kits;
    const awayKits = this.requireInstitutionOf(s, m.awayTeam).kits;
    const kitSelection = selectMatchKits(ProfilesFactory.getProfile(s.sport).kitSpec, homeKits, awayKits);
    const homeId = m.homeTeam.id;
    const awayId = m.awayTeam.id;
    let homeScore = 0;
    let awayScore = 0;
    let scoreText: string | null = null;
    let sets: IMatchDTO['sets'] = [];
    let winner: MatchWinnerDTO = null;
    if (res) {
      const hs = res.getScore(homeId) as TSupportedMatchScore;
      const as = res.getScore(awayId) as TSupportedMatchScore;
      homeScore = scoreValue(hs);
      awayScore = scoreValue(as);
      scoreText = formatScoreText(hs, as);
      sets = getSetBreakdown(hs, as);
    }
    // El ganador lo decide el deporte (getResultInfo), solo cuando el partido terminó.
    if (m.state === 'finished' && res) {
      const info = res.getResultInfo();
      if (info.teamWinner === homeId) winner = 'home';
      else if (info.teamWinner === awayId) winner = 'away';
      else winner = 'draw';
    }
    return {
      id: m.id,
      turn: mt.turn,
      tournamentId: mt.tournamentId,
      tournamentName: mt.tournamentName,
      homeTeamId: homeId,
      homeName: m.homeTeam.name,
      awayTeamId: awayId,
      awayName: m.awayTeam.name,
      homeKit: this.toMatchTeamKitDTO(homeKits, kitSelection.home),
      awayKit: this.toMatchTeamKitDTO(awayKits, kitSelection.away),
      awayKitChanged: kitSelection.awayChanged,
      state: m.state as MatchStateDTO,
      homeScore,
      awayScore,
      scoreText,
      winner,
      sets,
      live: m.state === 'playing',
      date: this.toDateTimeDTO(m.date),
      halfWeek: mt.halfWeek,
    };
  }

  private buildMatches(s: ISimulationSession): IMatchDTO[] {
    const t = this.requireTournament(s);
    return this.allMatchesWithTurn(t).map((mt) => this.toMatchDTO(s, mt));
  }

  private toParticipantRefDTO(teamsById: Map<string, AnyTeam>, ref: FixtureParticipantRef): FixtureParticipantRefDTO {
    if (ref.kind === 'team') {
      return { kind: 'team', teamId: ref.teamId, teamName: this.nameOf(teamsById, ref.teamId) };
    }
    return ref;
  }

  private toFixtureSlotDTO(teamsById: Map<string, AnyTeam>, slot: IFixtureSlot): IFixtureSlotDTO {
    const dto: IFixtureSlotDTO = {
      slotId: slot.slotId,
      stageId: slot.stageId,
      turn: slot.turn,
      halfWeek: slot.halfWeek,
      home: this.toParticipantRefDTO(teamsById, slot.home),
      away: this.toParticipantRefDTO(teamsById, slot.away),
    };
    if (slot.group !== undefined) dto.group = slot.group;
    if (slot.matchId !== undefined) dto.matchId = slot.matchId;
    return dto;
  }

  private buildFixture(s: ISimulationSession): IFixtureSlotDTO[] {
    const t = this.requireTournament(s);
    const teamsById = this.teamsById(t);
    const out: IFixtureSlotDTO[] = [];
    t.stagesMap.forEach((stage) => {
      stage.getFixture().forEach((slot) => out.push(this.toFixtureSlotDTO(teamsById, slot)));
    });
    return out;
  }

  private buildStandings(s: ISimulationSession, ttms: TypeTableMatchState): IStandingRowDTO[] {
    const t = this.requireTournament(s);
    const rows: IStandingRowDTO[] = [];
    t.stagesMap.forEach((stage) => {
      stage.getTable(ttms).forEach((tti) => {
        const row = tti.getInterface() as unknown as Record<string, number> & { team: string; pos: number };
        const { pos, team, ...values } = row;
        rows.push({
          pos,
          teamId: String(team),
          teamName: tti.team.name,
          values: values as Record<string, number>,
        });
      });
    });
    return rows;
  }

  private buildEvents(s: ISimulationSession): ICalendarEventDTO[] {
    const matches = this.buildMatches(s);
    const matchById = new Map(matches.map((m) => [m.id, m]));
    const inCalendar = new Set<string>();

    const events: ICalendarEventDTO[] = s.ctx.calendar.events.map((ev, i): ICalendarEventDTO => {
      const dto: ICalendarEventDTO = {
        id: `ev-${i}`,
        kind: ev.kind,
        label: ev.label,
        date: this.toDateTimeDTO(ev.dateTime),
      };
      if (ev.kind === 'match') {
        const matchId = (ev as JEventMatch).match?.id;
        const m = matchId ? matchById.get(matchId) : undefined;
        if (m) {
          inCalendar.add(m.id);
          dto.matchId = m.id;
          dto.label = `${m.homeName} vs ${m.awayName}`;
        }
      }
      return dto;
    });

    // Partidos del fixture que aún no son evento de calendario se agregan como
    // eventos sintéticos para que el fixture completo sea visible desde el inicio.
    matches.forEach((m) => {
      if (inCalendar.has(m.id)) return;
      events.push({
        id: `match-${m.id}`,
        kind: 'match',
        label: `${m.homeName} vs ${m.awayName}`,
        date: m.date,
        matchId: m.id,
      });
    });

    events.sort((a, b) => a.date.absolute - b.date.absolute);
    return events;
  }

  private buildState(s: ISimulationSession): ISimulationStateDTO {
    const cal = s.ctx.calendar;
    const t = this.requireTournament(s);
    const next = cal.getNextEvents();
    const hasActiveMatches = cal.getActiveEvents().length > 0;
    const hasNextEvent = !!next && next.events.length > 0;
    const finished = this.isTournamentFinished(t);
    return {
      standings: this.buildStandings(s, 'partial'),
      matches: this.buildMatches(s),
      events: this.buildEvents(s),
      currentDate: this.toDateTimeDTO(cal.now),
      hasNextEvent,
      hasActiveMatches,
      canAdvance: hasNextEvent || hasActiveMatches,
      finished,
    };
  }

  private buildAdvanceResult(s: ISimulationSession, pending: JEvent[]): IAdvanceResultDTO {
    const matches = this.buildMatches(s);
    const matchById = new Map(matches.map((m) => [m.id, m]));
    const pendingEvents: ICalendarEventDTO[] = (pending ?? []).map((ev: JEvent, i: number) => {
      const dto: ICalendarEventDTO = {
        id: `pending-${i}`,
        kind: ev.kind,
        label: ev.label,
        date: this.toDateTimeDTO(ev.dateTime),
      };
      if (ev.kind === 'match') {
        const matchId = (ev as JEventMatch).match?.id;
        const m = matchId ? matchById.get(matchId) : undefined;
        if (m) { dto.matchId = m.id; dto.label = `${m.homeName} vs ${m.awayName}`; }
      }
      return dto;
    });
    return { state: this.buildState(s), pendingEvents };
  }
}
