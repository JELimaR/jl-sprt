import Team from "../data/Team";
import { A_TeamTableItem, IA_TeamTableItem } from "./A_TeamTableItem"; // Asumo que A_TeamTableItem está en un archivo separado

// 1. Define los tipos específicos para los genéricos Res y Punt
export type GoalMatchResults = 'W' | 'D' | 'L';
export type GoalMatchPuntuations = 'gf' | 'ga';

// 2. Define la Interfaz concreta, extendiendo la Interfaz abstracta
// Incluye 'sg' ya que es específico de fútbol y no está en la base abstracta.
export type IGoalTeamTableItem = IA_TeamTableItem<GoalMatchResults, GoalMatchPuntuations> & {
  sg: number; // sg (Goal Difference) es específico de esta implementación
};


export default class GoalTeamTableItem extends A_TeamTableItem<GoalMatchResults, GoalMatchPuntuations> {
    
  // El constructor simplemente llama al constructor de la clase padre
  constructor(t: Team, bsId: string) {
    super(t, bsId);
  }

  // 3. Implementación del cálculo de puntos (ps)
  /**
   * Puntos totales (ps): 3 * Ganados + 1 * Empatados.
   */
  get ps(): number {
    // Usamos 'matchResults' heredado que contiene { W: number, D: number, L: number }
    const { W, D } = this.matchResults;
    return 3 * W + D;
  }

  // 4. Implementación para inicializar los resultados del partido (Res)
  /**
   * Generar los valores iniciales de MatchTeamResults: { W: 0, D: 0, L: 0 }
   */
  getInitialCountOfMathResults(): { [k in GoalMatchResults]: number; } {
    return { W: 0, D: 0, L: 0 };
  }

  // 5. Implementación para inicializar las puntuaciones/estadísticas (Punt)
  /**
   * Generar los valores iniciales de MatchTeamPuntuation: { gf: 0, ga: 0 }
   */
  getInitialCountOfMathPuntuations(): { [k in GoalMatchPuntuations]: number; } {
    return { gf: 0, ga: 0 };
  }

  // 6. Getters de acceso rápido para las estadísticas de fútbol
  
  // Resultados (acceden a this.matchResults)
  get W(): number { return this.matchResults.W }
  get D(): number { return this.matchResults.D }
  get L(): number { return this.matchResults.L }

  // Goles (acceden a this.matchPuntuations)
  get gf(): number { return this.matchPuntuations.gf }
  // NOTA: El nombre de la propiedad 'ge' original se corrige a 'ga' (Goles en contra)
  get ga(): number { return this.matchPuntuations.ga } 

  // Diferencia de Goles (sg) - Cálculo específico
  get sg(): number {
    return this.gf - this.ga;
  }

  // Métodos para sumar resultados/goles (usando los nombres originales del proyecto)
  addWM() { this.addMatchResult('W') }
  addDM() { this.addMatchResult('D') }
  addLM() { this.addMatchResult('L') }

  addGf(g: number) { this.matchPuntuations.gf += g }
  // NOTA: El nombre de la propiedad 'addGe' original se corrige a 'addGa'
  addGa(g: number) { this.matchPuntuations.ga += g } 

  // El getter 'ge' original también debe ser corregido para acceder a 'ga'
  // Si necesitas mantener 'ge' por compatibilidad con el código anterior:
  get ge(): number { return this.ga; }
  addGe(g: number) { this.addGa(g); }


  // 7. Implementación para devolver la función de ordenamiento específica
  getSortFunc(): (a: A_TeamTableItem<GoalMatchResults, GoalMatchPuntuations>, b: A_TeamTableItem<GoalMatchResults, GoalMatchPuntuations>, isSE: boolean) => number {
    return goalSimpleSortFunc;
  }

  // 8. Sobrescribe getInterface para incluir 'sg'
  getInterface(): IGoalTeamTableItem {
    // Llama a la interfaz base y le añade sg
    return {
      ...(super.getInterface() as IA_TeamTableItem<GoalMatchResults, GoalMatchPuntuations>),
      sg: this.sg,
    };
  }
}

// 9. Se mantiene y se adapta la función de ordenamiento
export const goalSimpleSortFunc = (a: A_TeamTableItem<GoalMatchResults, GoalMatchPuntuations>, b: A_TeamTableItem<GoalMatchResults, GoalMatchPuntuations>, isSE: boolean): number => {
  // Puntos (P) - se maneja en el A_TeamTableItem, pero se repite aquí para la lógica SE
  if (isSE) {
    if (a.P - b.P !== 0) {
      return b.P - a.P
    }
  }
  // Posición (pos) - se maneja en el A_TeamTableItem
  if (b.pos - a.pos !== 0) {
    return a.pos - b.pos
  }
  // Porcentaje de partidos (pm) - se maneja en el A_TeamTableItem
  if (!isSE) {
    if (a.pm - b.pm !== 0) {
      return b.pm - a.pm
    }
  }
  // Puntos (ps) - se maneja en el A_TeamTableItem
  if (a.ps - b.ps !== 0) {
    return b.ps - a.ps;
  }
  // Diferencia de Goles (sg) - ESPECÍFICO DE GOAL
  if ( (a as GoalTeamTableItem).sg - (b as GoalTeamTableItem).sg !== 0) {
    return (b as GoalTeamTableItem).sg - (a as GoalTeamTableItem).sg;
  }
  // Goles a Favor (gf) - ESPECÍFICO DE GOAL
  return (b as GoalTeamTableItem).gf - (a as GoalTeamTableItem).gf;
}