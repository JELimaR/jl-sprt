import { Ranking } from "../JSportModule";

/**
 * Mapa global para almacenar los rankings finalizados de:
 * - Tournaments
 * - Stages
 * - Phases
 * - Seasons?
 */
export const globalFinishedRankingsMap = new Map<string, Ranking>();