/**
 * Score de un partido de volleyball.
 * Cada equipo tiene sets ganados y los puntos de cada set.
 */
export interface IVolleyScore {
  setsWon: number;
  setPoints: number[]; // puntos por set jugado
}

export interface IFootablScore {
  goals: number;
}

export type TMatchScore = number | IVolleyScore | IFootablScore;
export type TSerieScore = number | IVolleyScore | IFootablScore;