import { RankingStore } from "../JSportModule";

/**
 * Store global para almacenar los rankings finalizados de:
 * - Tournaments
 * - Stages
 * - Phases
 * - Federations
 * - Confederations
 * 
 * Mantiene historial de todos los rankings guardados por context.
 */
export const globalFinishedRankingsMap = new RankingStore();