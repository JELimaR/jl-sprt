import { A_TeamTableItem, IA_TeamTableItem } from "./A_TeamTableItem";

// Arr de resultados posibles
const ExampleMatchTeamResultsArr = ['W', 'L'] as const;
export type TExampleMatchTeamResult = typeof ExampleMatchTeamResultsArr[number];

// Arr de puntuaciones 
const ExampleMatchTeamPuntuationArr = ['gf', 'ge', 'sg'] as const;
export type TExampleMatchPuntuation = typeof ExampleMatchTeamPuntuationArr[number];

export class ExampleTeamTableItem extends A_TeamTableItem<TExampleMatchTeamResult, TExampleMatchPuntuation> {
  /**
   * Generar los valores iniciales de MatchTeamResults
   */
  getInitialCountOfMathResults(): { W: number; L: number; } {
    let out = {};
    ExampleMatchTeamResultsArr.forEach((k: TExampleMatchTeamResult) => {
      out = { ...out, [k]: 0, };
    })
    return out as { [k in TExampleMatchTeamResult]: number };
  }
  /**
   * generar los valores iniciales de MatchTeamPuntuation
   */
  getInitialCountOfMathPuntuations(): { [k in TExampleMatchPuntuation]: number } {
    let out = {};
    ExampleMatchTeamPuntuationArr.forEach((k: TExampleMatchPuntuation) => {
      out = { ...out, [k]: 0, };
    })
    return out as { [k in TExampleMatchPuntuation]: number };
  }
  /**
   * calculo de puntos
   */
  get ps(): number {
    throw new Error("Method not implemented.");
  }

  getSortFunc() {
    return exampleSimpleSortFunc;
  }

  getInterface(): IA_TeamTableItem<TExampleMatchTeamResult, TExampleMatchPuntuation> {
    let out = super.getInterface();
    // return out;
    return {
      ...out,
      sg: out.gf - out.ge,

      ps: out.ps,

      pm: out.pm,
      team: this.team.id,
    };
  }

}

export const exampleSimpleSortFunc = (a: ExampleTeamTableItem, b: ExampleTeamTableItem, isSE: boolean): number => {
  if (isSE) {
    if (a.P - b.P !== 0) {
      return b.P - a.P
    }
  }
  if (b.pos - a.pos !== 0) {
    return a.pos - b.pos
  }
  if (!isSE) {
    if (a.pm - b.pm !== 0) {
      return b.pm - a.pm
    }
  }
  if (a.ps - b.ps !== 0) {
    return b.ps - a.ps;
  }
  if (a.matchPuntuations['sg'] - b.matchPuntuations['sg'] !== 0) {
    return b.matchPuntuations['sg'] - a.matchPuntuations['sg'];
  }
  return b.matchPuntuations['gf'] - a.matchPuntuations['gf'];
}