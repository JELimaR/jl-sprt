import {
  IElementController,
  ICreateSimpleLeagueInput,
  ISimulationRef,
  IAdvanceResultDTO,
  ISimulationStateDTO,
  IMatchDTO,
  IStandingRowDTO,
  ICalendarEventDTO,
  IDateTimeDTO,
  MatchStateDTO,
  IFixtureSlotDTO,
  FixtureParticipantRefDTO,
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
import { teamsAssign } from "../../Tournament/teamsAssign";
import { JCalendar, JDate, JDateTime, DateToString } from "jl-calendar";
import type { JEvent } from "jl-calendar";
import { JEventMatch } from "../../Tournament/Stage/Match/EventMatch";
import {
  ProfilesFactory,
  formatScoreText,
  getSetBreakdown,
  scoreValue,
  TSupportedMatchScore,
} from "jl-sprt-match";
import type { AnyMatch, AnyTeam } from "jl-sprt-core";
import type { TypeHalfWeekOfYear } from "jl-calendar";
import type { IRankItem, TypeTableMatchState } from "../../JSportModule";
import type { TGS } from "../../Tournament/Stage/Stage";
import type { ITournamentFromGSGData } from "../../JSportModule/GeneralStageGraph/tournamentFromGSG";
import type { TInitialCreator, TPhaseCreator } from "../../JSportModule/GeneralStageGraph/GSGCreators";

const SOURCE_RANKING_CONTEXT = 'fr_S_SIM';
const SIMPLE_LEAGUE_TOURNAMENT_ID = 'SIM_LEAGUE';

/** Partido + metadatos de la jornada/ronda a la que pertenece (para el DTO). */
interface MatchWithTurn {
  match: AnyMatch;
  turn: number;
  halfWeek: number;
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
    const world = this.world;
    const season = input.season ?? world.currentSeason;
    const category = input.category ?? 'S';
    const n = input.teams.length;
    const profile = ProfilesFactory.getProfile(input.sport);

    // Cada simulación tiene su PROPIO calendario (aislamiento por simulación): sus
    // eventos no se mezclan con los de otras simulaciones del mismo proceso. Los
    // rankings del mundo SÍ se comparten (las entidades viven en el mundo). El
    // calendario propio arranca en el día 1 de la temporada de la simulación.
    //
    // NOTA (escenario de prueba): la "liga simple" es un caso de uso aislado; por eso
    // calendario propio. Cuando el SportWorld maneje el calendario único real, la
    // creación de torneos del mundo irá por otro flujo (no por createSimpleLeague).
    const ctx = new SimulationContext(JCalendar.createFromYear(season), world.rankings);

    // 1. Crear las entidades (instituciones) EN EL MUNDO y obtener sus teams. El
    //    nombre legible queda en la Institution; el team lo expone vía `name`.
    const uniq = this.handler.genId();
    const teams: AnyTeam[] = input.teams.map((t, i) => {
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
        sport: input.sport,
      });
      inst.createTeam(category);
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

    // 3. Construir el torneo (1 fase, 1 grupo) desde el GSG. Id único por sesión para
    //    que varias simulaciones coexistan en el mismo mundo sin colisionar.
    const tournamentId = `${SIMPLE_LEAGUE_TOURNAMENT_ID}_${uniq}`;
    const data = this.buildSimpleLeagueData(tournamentId, n, input.opt);
    const tournament = Tournament.create({ id: tournamentId, season }, data, ctx, profile);

    // teamsAssign resuelve el ranking inicial (ini_) desde el store y agenda el draw.
    teamsAssign(tournament, ctx);

    const tournaments = new Map<string, Tournament>();
    tournaments.set(tournamentId, tournament);
    this.handler.add({ id: uniq, world, ctx, sport: input.sport, tournaments });
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

    // Solo se salta tiempo muerto si no hay actividad en curso. Si hay durativos
    // activos, el reloj ya está en la zona de eventos: no hay nada que saltar.
    if (cal.getActiveEvents().length === 0) {
      const NE = cal.getNextEvents();
      if (NE) {
        // Dejar el reloj en el intervalo INMEDIATAMENTE ANTERIOR al próximo evento,
        // sin ejecutarlo. El siguiente `advance` (un tick) lo ejecuta. El salto se
        // hace con `advanceIntervals` del calendario, que internamente pasa por
        // `tick()` en cada paso (no mueve el reloj por fuera).
        const intervals = JDateTime.difBetween(NE.dt, cal.now) - 1;
        if (intervals > 0) {
          const jump = cal.advanceIntervals(intervals);
          if (jump.pending.length > 0) {
            return this.buildAdvanceResult(s, jump.pending);
          }
        }
      }
    }

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
    //  - un evento agendado exactamente en `now`, o
    //  - el próximo evento está en el intervalo INMEDIATAMENTE siguiente (gap == 1):
    //    estamos "a las puertas", el tick siguiente lo ejecuta.
    const hasActive = cal.getActiveEvents().length > 0;
    const hasEventNow = cal.getCurrentEventList().length > 0;
    const next = cal.getNextEvents();
    const gap = next ? JDateTime.difBetween(next.dt, cal.now) : Infinity;

    if (hasActive || hasEventNow || gap <= 1) {
      // Ejecutar el instante actual / avanzar el durativo: un único tick.
      let pending: JEvent[] = [];
      if (cal.hasEventsToProcess()) {
        const res = cal.tick();
        if (!res.advanced) pending = res.pending;
      }
      return this.buildAdvanceResult(s, pending);
    }

    // Hay tiempo muerto por delante: saltar hasta el intervalo anterior al próximo
    // evento, sin ejecutarlo (lo ejecutará el próximo `step`, que entrará por gap<=1).
    if (next) {
      const jump = cal.advanceIntervals(gap - 1);
      return this.buildAdvanceResult(s, jump.pending);
    }

    // No hay nada por delante.
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

  // ==========================================================================
  // Helpers internos — recorrido genérico de stages
  // ==========================================================================

  /** Extrae los partidos de un stage con su jornada/ronda, sea group o playoff. */
  private matchesOfStage(stage: TGS): MatchWithTurn[] {
    const out: MatchWithTurn[] = [];
    if (stage instanceof StageGroup) {
      stage.groups.forEach((league: League) => {
        league.turns.forEach((turn) => {
          turn.matches.forEach((match: AnyMatch) => {
            out.push({ match, turn: turn.num, halfWeek: turn.halfWeek });
          });
        });
      });
    } else if (stage instanceof StagePlayoff) {
      stage.playoff.rounds.forEach((round) => {
        round.matches.forEach((match: AnyMatch) => {
          out.push({ match, turn: round.num, halfWeek: round.halfWeek?.[0] ?? 0 });
        });
      });
    }
    return out;
  }

  /** Recorre todos los stages del torneo recolectando sus partidos. */
  private allMatchesWithTurn(t: Tournament): MatchWithTurn[] {
    const out: MatchWithTurn[] = [];
    t.stagesMap.forEach((stage) => {
      this.matchesOfStage(stage).forEach((mt) => out.push(mt));
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

  private toMatchDTO(mt: MatchWithTurn): IMatchDTO {
    const m = mt.match;
    const res = m.result;
    const homeId = m.homeTeam.id;
    const awayId = m.awayTeam.id;
    let homeScore = 0;
    let awayScore = 0;
    let scoreText: string | null = null;
    let sets: IMatchDTO['sets'] = [];
    if (res) {
      const hs = res.getScore(homeId) as TSupportedMatchScore;
      const as = res.getScore(awayId) as TSupportedMatchScore;
      homeScore = scoreValue(hs);
      awayScore = scoreValue(as);
      scoreText = formatScoreText(hs, as);
      sets = getSetBreakdown(hs, as);
    }
    return {
      id: m.id,
      turn: mt.turn,
      homeTeamId: homeId,
      homeName: m.homeTeam.name,
      awayTeamId: awayId,
      awayName: m.awayTeam.name,
      state: m.state as MatchStateDTO,
      homeScore,
      awayScore,
      scoreText,
      sets,
      live: m.state === 'playing',
      date: this.toDateTimeDTO(m.date),
      halfWeek: mt.halfWeek,
    };
  }

  private buildMatches(s: ISimulationSession): IMatchDTO[] {
    const t = this.requireTournament(s);
    return this.allMatchesWithTurn(t).map((mt) => this.toMatchDTO(mt));
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
    const finished = [...t.stagesMap.values()].every((stage) => stage.isFinished);
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
