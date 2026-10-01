
import { JCalendar } from "jl-calendar";
import { arr2, AnyTeam, TypeBaseStageOption, AnyMatch, AnyTeamTableItem, AnySportProfile } from "jl-sprt-core";
import { IElementInfo, ILeagueConfig, TypeTableMatchState } from "../../../../JSportModule";
import { BaseStage } from "../../BaseStage";
import { robinRoundSchedulingFunction } from "./RoundRobin";
import { Turn } from "./Turn";
import { FixtureParticipantRef, IFixtureSlot } from "../../Fixture";

// export interface ILeagueInfo extends IBaseStageInfo { }

export class League extends BaseStage<IElementInfo, ILeagueConfig> {

  private _turns: Turn[] = [];

  /**
   * Creacion de una League. Se asigna la config y la info
   * Quedan desconocidos los participants y por tanto no se crean los turns
   *        -> ESTOS SE CREAN EN LA ASIGNACION -> función assign()
   */
  constructor(info: IElementInfo, config: ILeagueConfig, sportProfile: AnySportProfile) { // FALTA VERIFICAR QUE CADA fechHalfWeeks sea mayor al fechHalfWeeksSchedule
    super(info, config, sportProfile);
    this.config.turnHalfWeeks = config.turnHalfWeeks;
    this.config.turnHalfWeeksSchedule = config.turnHalfWeeksSchedule;
  }

  /**
   * Se realizan las siguientes verificaciones
   * * existe sch para la cantidad de participants
   * * la cantidad de halfweeks asignada para cada turn coincide con la cantidad de turns que corresponde
   * * la cantidad de halfweeks asignada para la programacion de cada turn coincide con la cantidad de turns que corresponde
   */
  constructorVerification(config: ILeagueConfig): void {
    if (
      config.participantsNumber < 2 ||
      config.participantsNumber > 20 ||
      !Number.isInteger(config.participantsNumber)
    ) {
      throw new Error(`no existe sch para el valor: ${config.participantsNumber}`);
    }
    let sch: arr2<number>[][] = League.getDataScheduling(
      config.participantsNumber,
      config.opt,
    );
    if (sch.length !== config.turnHalfWeeks.length) {
      throw new Error(`cantidad de wks incorrecta
      se esperaban: ${sch.length} y se presentan: ${config.turnHalfWeeks.length} turnHalfWeeks`);
    }
    if (
      config.turnHalfWeeks.length !== config.turnHalfWeeksSchedule.length
    ) {
      throw new Error(`cantidad de wks de assignation incorrecta
      se esperaban: ${config.turnHalfWeeks.length} y se presentan: ${config.turnHalfWeeksSchedule.length}`);
    }

  }

  get isFinished(): boolean {
    return super.isFinished && this._turns.length == this.config.turnHalfWeeks.length
  }

  get turns(): Turn[] {
    return this._turns;
  }

  get matches(): AnyMatch[] {
    let out: AnyMatch[] = [];
    this._turns.forEach((f: Turn) => {
      f.matches.forEach((m) => out.push(m));
    })
    return out;
  }

  /**
   * Para crear los turns
   * @param cal 
   */
  createChildren(cal: JCalendar): void {
    // matriz 
    let sch: arr2<number>[][] = League.getDataScheduling(
      this.config.participantsNumber,
      this.config.opt
    );

    for (let t = 0; t < sch.length; t++) {
      let teams: AnyTeam[] = [];
      for (let m of sch[t]) {
        const ht: AnyTeam = this.participants.get(m[0])!;
        const at: AnyTeam = this.participants.get(m[1])!;
        teams.push(ht);
        teams.push(at);
      }

      this.createNewTurn(teams, cal);
    }
  }

  createNewTurn(teamsDrawSorted: AnyTeam[], calendar: JCalendar) {
    const turnNumber: number = this._turns.length + 1;
    const turnIndex: number = this._turns.length;
    const turn: Turn = new Turn({
      num: this._turns.length + 1,
      matches: this.createTurnMatches(teamsDrawSorted, turnNumber),
      halfweek: this.config.turnHalfWeeks[turnIndex],
      halfweekSchedule: this.config.turnHalfWeeksSchedule[turnIndex],
    })

    turn.generateMatchOfTurnScheduleEvents(calendar, this);
    this._turns.push(turn);
  }

  createTurnMatches(teams: AnyTeam[], turnNumber: number): AnyMatch[] {
    let out: AnyMatch[] = [];

    const total: number = this.matches.length;
    for (let i = 0; i < teams.length; i += 2) {

      const match = this._sportProfile.createMatch({
        awayTeam: teams[i],
        homeTeam: teams[i + 1],
        hw: this.config.turnHalfWeeks[turnNumber - 1],
        season: this.info.season,
        id: `${this.info.id}-T${turnNumber}-M${total + i / 2 + 1}`,
        // allowedDraw: true,
        isNeutral: this.config.opt == 'neutral',
      })

      out.push(match);
    }

    return out;
  }

  getTable(ttms: TypeTableMatchState): AnyTeamTableItem[] {
    let out = this.calcTableValues(ttms);

    if (out.length > 0) {
      const sortFunc = out[0].getSortFunc();
      out.sort((a, b) => sortFunc(a, b, false));
    }

    out.forEach((itti, idx) => itti.pos = idx + 1)

    return out;
  }

  /**
   * Fixture estructural de la liga. Deriva las jornadas y emparejamientos del
   * round-robin (determinístico, sin equipos) y las half-weeks del config. Si el
   * draw ya ocurrió (los turns existen), enriquece cada slot con el equipo real y el
   * `matchId`; si no, deja la referencia como `seed` (posición de ranking).
   *
   * El `slotId` usa el MISMO esquema que el id del Match real
   * (`<stageId>-T<turno>-M<idx>`), para poder enlazar slot <-> match.
   */
  getFixture(): IFixtureSlot[] {
    const sch: arr2<number>[][] = League.getDataScheduling(
      this.config.participantsNumber,
      this.config.opt,
    );

    const out: IFixtureSlot[] = [];
    let globalMatchCount = 0;

    sch.forEach((turnPairs: arr2<number>[], turnIndex: number) => {
      const turnNumber = turnIndex + 1;
      const existingTurn = this._turns[turnIndex];

      turnPairs.forEach((pair: arr2<number>, i: number) => {
        globalMatchCount++;
        const slotId = `${this.info.id}-T${turnNumber}-M${globalMatchCount}`;
        // El round-robin da [home, away] como POSICIONES (1-based) del ranking.
        let home: FixtureParticipantRef = { kind: 'seed', pos: pair[0] };
        let away: FixtureParticipantRef = { kind: 'seed', pos: pair[1] };
        let matchId: string | undefined;

        // Si el turn ya está materializado, usar el Match real (equipos + id).
        const match = existingTurn?.matches[i];
        if (match) {
          matchId = match.id;
          home = { kind: 'team', teamId: match.homeTeam.id };
          away = { kind: 'team', teamId: match.awayTeam.id };
        }

        out.push({
          slotId,
          stageId: this.info.id,
          turn: turnNumber,
          halfWeek: this.config.turnHalfWeeks[turnIndex],
          home,
          away,
          matchId,
        });
      });
    });

    return out;
  }

  /************************************************************************************************************************************************************* */
  // statics
  static getTurnsNumber(n: number, opt: TypeBaseStageOption): number {
    let sch = League.getDataScheduling(n, opt);
    return sch.length;
  }
  static getCantMatches(n: number, opt: TypeBaseStageOption): number {
    let sch = League.getDataScheduling(n, opt);
    return sch.length * sch[0].length;
  }
  static getDataScheduling(n: number, opt: TypeBaseStageOption): arr2<number>[][] {
    return robinRoundSchedulingFunction(n, opt);
  }

  //
  static teamsSortForDraw(teamRankArr: AnyTeam[]) {
    let out: AnyTeam[] = [];

    let currUpIndex = 0;
    let currUnderIndex = teamRankArr.length - 1;

    let i = 0;
    let j = teamRankArr.length - 1;

    let pair = false;
    while (currUpIndex < currUnderIndex) {

      if (pair) {
        out[currUpIndex] = teamRankArr[j];
        j--;
        out[currUnderIndex] = teamRankArr[j];
        j--;
        pair = false;
      } else {
        out[currUpIndex] = teamRankArr[i];
        i++;
        out[currUnderIndex] = teamRankArr[i];
        i++;
        pair = true;
      }

      currUpIndex++;
      currUnderIndex--;
    }

    if (currUpIndex == currUnderIndex) {
      out[currUpIndex] = teamRankArr[i];
    }
    return out;
  }
}
