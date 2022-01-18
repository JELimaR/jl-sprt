import * as utlts from 'jl-utlts';
const CUF = utlts.CollectionsUtilsFunctions.getInstance();

import scheduling, { arr2 } from './scheduling';
import JTeam from './JTeam';
import JMatch from './JMatch';
import { TypeHalfWeekOfYear } from '../Logica/Calendar/types';
import { JFech } from './JFech';
import { JCalendar, JEventFechAssignationLB } from '../Logica/JCalendarLB';
import { IJHalfWeekOfYear, JDateTime } from '../Logica/Calendar/JDateTime';

interface ITeamTableItem {
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  ge: number;
  sg: number;
  ps: number;
  team: JTeam;
}

class TeamTableItem {
  private _team: JTeam;
  private _pg: number = 0;
  private _pe: number = 0;
  private _pp: number = 0;

  private _gf: number = 0;
  private _ge: number = 0;

  constructor(t: JTeam) {
    this._team = t;
  }

  get pj(): number {
    return this._pg + this._pe + this._pp;
  }
  get pg(): number {
    return this._pg;
  }
  get pe(): number {
    return this._pe;
  }
  get pp(): number {
    return this._pp;
  }
  get gf(): number {
    return this._gf;
  }
  get ge(): number {
    return this._ge;
  }
  get sg(): number {
    return this._gf - this._ge;
  }
  get ps(): number {
    return 3 * this._pg + this._pe;
  }

  get team(): JTeam {
    return this._team;
  }

  get ITeamTableItem(): ITeamTableItem {
    return {
      pj: this.pj,
      pg: this.pg,
      pe: this.pe,
      pp: this.pp,
      gf: this.gf,
      ge: this.ge,
      sg: this.sg,
      ps: this.ps,
      team: this.team,
    };
  }
}

export interface ILBConfig {
  partsNumber: number;
  isIV: boolean;
  fechHalfWeeks: TypeHalfWeekOfYear[];
  fechHalfWeeksAssignation: TypeHalfWeekOfYear[];
  temp: number;
}

export default class LB {
  private _config: ILBConfig;

  private _tms: TeamTableItem[] = [];
  private _fchs: JFech[] = [];

  constructor(config: ILBConfig) {
    if (
      config.partsNumber < 2 ||
      config.partsNumber > 20 ||
      config.partsNumber % 1 !== 0
    ) {
      throw new Error(`no existe sch para el valor: ${config.partsNumber}`);
    }
    let sch: arr2<number>[][] = LB.getDataScheduling(
      config.partsNumber,
      config.isIV
    );
    if (sch.length !== config.fechHalfWeeks.length) {
      throw new Error(`cantidad de wks incorrecta`);
    }
    if (
      config.fechHalfWeeks.length !== config.fechHalfWeeksAssignation.length
    ) {
      throw new Error(`cantidad de wks de assignation incorrecta`);
    }
    this._config = config;
  }

  static getCantFchs(n: number, isIV: boolean): number {
    let sch = LB.getDataScheduling(n, isIV);
    return sch.length;
  }
  static getCantMatches(n: number, isIV: boolean): number {
    let sch = LB.getDataScheduling(n, isIV);
    return sch.length * sch[0].length;
  }
  static getDataScheduling(n: number, isIV: boolean): arr2<number>[][] {
    return scheduling(n, isIV);
  }

  get cantFechs(): number {
    return LB.getCantFchs(this._config.partsNumber, this._config.isIV);
  }
  get partsNumber(): number {
    return this._config.partsNumber;
  }
  get fechs(): JFech[] {
    return this._fchs;
  }
  get teams(): ITeamTableItem[] {
    return this._tms.map((t: TeamTableItem) => t.ITeamTableItem);
  }

  assign(parts: JTeam[], cal: JCalendar): void {
    if (this._config.partsNumber !== parts.length) {
      throw new Error(`cantidad de tms incorrecta`);
    }
    // assign parts and table items
    for (let i = 0; i < this._config.partsNumber; i++) {
      this._tms.push(new TeamTableItem(parts[i]));
    }
    // create matches
    let sch: arr2<number>[][] = LB.getDataScheduling(
      this._config.partsNumber,
      this._config.isIV
    );
    for (let f = 0; f < sch.length; f++) {
      let ms: JMatch[] = [];
      for (let m of sch[f]) {
        const l: JTeam = parts[m[0] - 1];
        const v: JTeam = parts[m[1] - 1];

        ms.push(new JMatch(l, v, this._config.fechHalfWeeks[f]));
      }
      let ff = new JFech(
        f + 1,
        this._config.fechHalfWeeks[f],
        CUF.shuffled(ms)
      );
      this._fchs.push(ff);
    }
    for (let i = 0; i < this.cantFechs; i++) {
      const dt = JDateTime.halfWeekOfYearToDateTime(
        this._config.fechHalfWeeksAssignation[i] as TypeHalfWeekOfYear,
        this._config.temp,
        'middle'
      );
      cal.addEvent(
        new JEventFechAssignationLB({
          dateTime: dt.getIJDateTimeCreator(),
          calendar: cal,
          fech: this._fchs[i],
        })
      );
    }
  }

  getFech(field: 'id' | 'halfWeek', fiw: number): JFech | undefined {
    return this._fchs.find((f: JFech) => f[field] === fiw);
  }
}
