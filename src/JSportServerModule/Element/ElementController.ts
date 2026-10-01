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

const DEFAULT_SEASON = 1986;
const SOURCE_RANKING_CONTEXT = 'fr_S_SIM';
const SIMPLE_LEAGUE_TOURNAMENT_ID = 'SIM_LEAGUE';

/** Partido + metadatos de la jornada/ronda a la que pertenece (para el DTO). */
interface MatchWithTurn {
  match: AnyMatch;
  turn: number;
  halfWeek: number;
}

/**
 * ElementController — Fase A: simulaciones de liga simple.
 *
 * Administra **sesiones** por `simulationId` (vía ElementHandler). Una sesión es un
 * MUNDO: un `SimulationContext` compartido + los torneos que se juegan en él. En la
 * Fase A el mundo contiene un único torneo (la liga simple), por eso las queries sin
 * `tournamentId` operan sobre ese único torneo (ver `requireTournament`).
 *
 * Los DTOs se arman recorriendo `tournament.stagesMap` de forma genérica (StageGroup
 * y StagePlayoff), nunca casteando a un tipo de stage fijo.
 *
 * Toda la maquinaria de dominio (Tournament, SimulationContext, avance del
 * calendario) vive acá; el consumidor (frontend) solo ve el id + DTOs.
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

  // ==========================================================================
  // Comandos
  // ==========================================================================

  createSimpleLeague(input: ICreateSimpleLeagueInput): ISimulationRef {
    if (!input.teams || input.teams.length < 2) {
      throw new Error(`createSimpleLeague: se requieren al menos 2 equipos (recibidos: ${input.teams?.length ?? 0}). En ElementController.createSimpleLeague`);
    }
    const season = input.season ?? DEFAULT_SEASON;
    const category = input.category ?? 'S';
    const n = input.teams.length;

    const cal = JCalendar.createFromYear(season);
    const ctx = new SimulationContext(cal);
    const profile = ProfilesFactory.getProfile(input.sport);

    // 1. Crear teams con nombres legibles + mapa id->nombre para los DTOs.
    const teamNames = new Map<string, string>();
    const teams: AnyTeam[] = input.teams.map((t, i) => {
      const instId = t.id ?? `sim-${i}`;
      const town = new Town({ i: `TWN_${instId}`, n: t.name, c: 'C_SIM', p: 1, a: 1 });
      const inst = new Institution({
        id: instId,
        name: t.name,
        shortName: t.name,
        abrevName: t.name.slice(0, 3).toUpperCase(),
        headquarters: town,
        funtationDay: new JDate(1),
        sport: input.sport,
      });
      inst.createTeam(category);
      const team = inst.getTeam(category)!;
      teamNames.set(team.id, t.name);
      return team;
    });

    // 2. Ranking inicial (fuente) para el torneo.
    const rankItems: IRankItem[] = teams.map((team, i) => ({
      pos: i + 1,
      team,
      origin: SOURCE_RANKING_CONTEXT,
    }));
    const sourceRanking = Ranking.fromRankItemArr(SOURCE_RANKING_CONTEXT, rankItems);
    ctx.store.set(sourceRanking.context, sourceRanking);

    // 3. Construir el torneo (1 fase, 1 grupo) desde el GSG.
    const data = this.buildSimpleLeagueData(n, input.opt);
    const tournament = Tournament.create(
      { id: SIMPLE_LEAGUE_TOURNAMENT_ID, season },
      data,
      ctx,
      profile,
    );

    // teamsAssign resuelve el ranking inicial (ini_) desde el store y agenda el draw.
    teamsAssign(tournament, ctx);

    const id = this.handler.genId();
    const tournaments = new Map<string, Tournament>();
    tournaments.set(SIMPLE_LEAGUE_TOURNAMENT_ID, tournament);
    this.handler.add({ id, ctx, sport: input.sport, tournaments, teamNames });
    return { simulationId: id };
  }

  advance(simulationId: string): IAdvanceResultDTO {
    const s = this.handler.require(simulationId);
    const cal = s.ctx.calendar;
    let pending: JEvent[] = [];

    if (cal.hasEventsToProcess()) {
      // Si no hay durativos activos, saltar el tiempo muerto hasta el próximo evento.
      if (cal.getActiveEvents().length === 0) {
        const NE = cal.getNextEvents();
        if (NE) {
          const intervals = JDateTime.difBetween(NE.dt, cal.now) - 1;
          if (intervals > 0) cal.advanceIntervals(intervals);
        }
      }
      const res = cal.tick();
      if (!res.advanced) pending = res.pending;
    }

    return this.buildAdvanceResult(s, pending);
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
  // Helpers internos — selección de torneo del mundo
  // ==========================================================================

  /**
   * Devuelve el torneo sobre el que operan las queries de Fase A. El mundo tiene un
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

  // ==========================================================================
  // Helpers internos — armado de DTOs
  // ==========================================================================

  /** GSG data para una liga de N equipos (1 fase, 1 grupo). */
  private buildSimpleLeagueData(n: number, opt: ICreateSimpleLeagueInput['opt']): ITournamentFromGSGData {
    const iniCreator: TInitialCreator = {
      tournamentId: SIMPLE_LEAGUE_TOURNAMENT_ID,
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

  private nameOf(s: ISimulationSession, teamId: string): string {
    return s.teamNames.get(teamId) ?? teamId;
  }

  private toDateTimeDTO(dt: JDateTime): IDateTimeDTO {
    return {
      absolute: dt.absolute,
      dateTime: dt.getDateTime(),
      label: DateToString.DateTime_ddd_DD_mmm_YYYY_HHMM_HW(dt),
    };
  }

  private toMatchDTO(s: ISimulationSession, mt: MatchWithTurn): IMatchDTO {
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
      homeName: this.nameOf(s, homeId),
      awayTeamId: awayId,
      awayName: this.nameOf(s, awayId),
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
    return this.allMatchesWithTurn(t).map((mt) => this.toMatchDTO(s, mt));
  }

  private toParticipantRefDTO(s: ISimulationSession, ref: FixtureParticipantRef): FixtureParticipantRefDTO {
    if (ref.kind === 'team') {
      return { kind: 'team', teamId: ref.teamId, teamName: this.nameOf(s, ref.teamId) };
    }
    return ref;
  }

  private toFixtureSlotDTO(s: ISimulationSession, slot: IFixtureSlot): IFixtureSlotDTO {
    const dto: IFixtureSlotDTO = {
      slotId: slot.slotId,
      stageId: slot.stageId,
      turn: slot.turn,
      halfWeek: slot.halfWeek,
      home: this.toParticipantRefDTO(s, slot.home),
      away: this.toParticipantRefDTO(s, slot.away),
    };
    if (slot.group !== undefined) dto.group = slot.group;
    if (slot.matchId !== undefined) dto.matchId = slot.matchId;
    return dto;
  }

  private buildFixture(s: ISimulationSession): IFixtureSlotDTO[] {
    const t = this.requireTournament(s);
    const out: IFixtureSlotDTO[] = [];
    t.stagesMap.forEach((stage) => {
      stage.getFixture().forEach((slot) => out.push(this.toFixtureSlotDTO(s, slot)));
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
          teamName: this.nameOf(s, String(team)),
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
