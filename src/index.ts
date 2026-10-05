// ============================================================================
// JSport Library - Public API Exports
// ============================================================================

// Calendar (re-exported from the jl-calendar package)
export {
  JCalendar,
  JDateTime,
  JDate,
  JTime,
  DateToString,
  JEvent,
  JInstantEvent,
  JDurativeEvent,
  DAYSPERYEAR,
  WEEKSPERYEAR,
  MONTHPERYEAR,
  DAYSPERWEEK,
  DAYSPERODDMONTH,
  DAYSPEREVENMONTH,
  INTERVSPERDAY,
  monthsOfYearNames,
  daysOfWeekNames,
} from 'jl-calendar';
export type {
  IJDTCreator,
  TypeHalfWeekOfYear,
  TypeIntervalOfDay,
  IJEventInfo,
  IEventResolution,
  JEventStatus,
  JEventLifecycle,
  TickResult,
  IJDate,
  IJTime,
  IJDateTime,
} from 'jl-calendar';

// Ranking
export { Ranking } from './JSportModule/Ranking/Ranking';
export type { TypeRanking } from './JSportModule/Ranking/Ranking';
export type { IGenericRankItem, IRankItem, TypeTableMatchState, IRankingMetadata, TypeRankingGenerator, TypeRankedEntity } from './JSportModule/Ranking/interfaces';
export { RankingStore } from './JSportModule/Ranking/RankingStore';
export type { RankingStoreListener } from './JSportModule/Ranking/RankingStore';

// Tournament
export { Tournament } from './Tournament/Tournament';
export { Phase } from './Tournament/Phase';
export { SimulationContext, createSimulationContext } from './Tournament/SimulationContext';
export { TournamentConfigStore } from './Tournament/TournamentConfigStore';
export { teamsAssign } from './Tournament/teamsAssign';

// Stages
export { Stage } from './Tournament/Stage/Stage';
export type { TGS } from './Tournament/Stage/Stage';
export { StageGroup } from './Tournament/Stage/StageGroup/StageGroup';
export { StagePlayoff } from './Tournament/Stage/StagePlayoff/StagePlayoff';
export { League } from './Tournament/Stage/StageGroup/League/League';
export { Turn } from './Tournament/Stage/StageGroup/League/Turn';
export type { ITurnInfo } from './Tournament/Stage/StageGroup/League/Turn';
export { SingleElimination } from './Tournament/Stage/StagePlayoff/SingleElimination/SingleElimination';
export { Round } from './Tournament/Stage/StagePlayoff/SingleElimination/Round';
export type { IRoundInfo } from './Tournament/Stage/StagePlayoff/SingleElimination/Round';

// Eventos concretos (necesarios para discriminar eventos del calendario).
// WARNING: exponer estas clases para hacer `instanceof` es un workaround temporal.
// La solución definitiva es un contrato kind/label en el JEvent base (ver docs/BUGS.md).
export { Event_StageStart } from './Tournament/Stage/Event_StageStart';
export { Event_StageEnd } from './Tournament/Stage/Event_StageEnd';
export { Event_ScheduleOfTurnMatches } from './Tournament/Stage/StageGroup/League/Event_ScheduleOfTurnMatches';
export { JEventMatch } from './Tournament/Stage/Match/EventMatch';

// Data & Config types
export type {
  IElementInfo,
  ITournamentConfig,
  IPhaseConfig,
  IStageConfig,
  IStageGroupConfig,
  IStagePlayoffConfig,
  IBaseStageConfig,
  ILeagueConfig,
  ISingleEliminationConfig,
  TQualyCondition,
} from './JSportModule/data/elementsConfig';

// API & Server
export { SportAPIController } from './JSportModule/SportAPI';
export type { ISportFactory, IEntityController, IElementController, ISportAPIController, IPaginationData } from './JSportModule/apiInterfaces';
export { SportServerAPI } from './JSportServerModule';
// ElementController DTOs (contrato de la API de simulaciones de torneo).
export type {
  IDateTimeDTO,
  MatchStateDTO,
  SetScoreDTO,
  IMatchDTO,
  IStandingRowDTO,
  EventKindDTO,
  ICalendarEventDTO,
  ISimulationStateDTO,
  ISimpleLeagueTeamInput,
  ICreateSimpleLeagueInput,
  ISimulationRef,
  IAdvanceResultDTO,
  FixtureParticipantRefDTO,
  IFixtureSlotDTO,
} from './JSportModule/elementInterfaces';

// GeneralStageGraph
export { GeneralStageGraph } from './JSportModule/GeneralStageGraph/GeneralStageGraph';
export { createGSG } from './JSportModule/GeneralStageGraph/GSGCreators';
export type { TInitialCreator, TPhaseCreator } from './JSportModule/GeneralStageGraph/GSGCreators';
export { tournamentFromGSG } from './JSportModule/GeneralStageGraph/tournamentFromGSG';
export { createStandardGSGDataFromNParticipants } from './JSportModule/GeneralStageGraph/createStandardGSGDataFromNParticipants';
export type { ITournamentFromGSGData } from './JSportModule/GeneralStageGraph/tournamentFromGSG';

// Entities
export { Institution } from './JSportModule/data/Entities/Institution';
export type { IInstitutionData, IInstitutionCreator } from './JSportModule/data/Entities/Institution';
export { Federation } from './JSportModule/data/Entities/Federation';
export type { IFederationData, IFederationCreator } from './JSportModule/data/Entities/Federation';
export { Confederation } from './JSportModule/data/Entities/Confederation';
export type { IConfederationData } from './JSportModule/data/Entities/Confederation';

// Geographic Entities
export { Continent, Country, Town } from './JSportModule/data/Entities/GeogEntity';
export type { IContinentData, ICountryData, ITownData } from './JSportModule/data/Entities/GeogEntity';

// Example data (useful for seeding)
export { getContinentData, getCountriesData, getTownsData } from './examples/APIExample/geogData';
export { getInstitutionsData, getFederationData, getConfederationData } from './examples/APIExample/entitiesData';

// Profiles & Sports (re-exported from jl-sprt-match)
export { ProfilesFactory, SPORTS } from 'jl-sprt-match';
export type { TSport, IFootballScore, IVolleyballScore, IAmericanFootballScore, TSupportedMatchScore } from 'jl-sprt-match';

// Core (jl-sprt-core) — superficie PÚBLICA mínima.
//
// Solo se reexporta lo que el consumidor (frontend / API) necesita como contrato de
// CONSTRUCCIÓN o LECTURA. Las clases abstractas internas del dominio de core
// (A_Match, A_MatchPlay, A_Result, A_Serie, A_Team, A_TeamRoster, A_TeamTableItem,
// Person) y sus tipos de implementación (IMatchCreationInfo, IResultInfo, MatchContext,
// TMatchScore, etc.) NO se exponen: con el ElementController devolviendo DTOs, el front
// ya no instancia ni manipula esas clases. Quien las necesite las importa de
// 'jl-sprt-core' directamente. (Ver docs/plans/API_CONTROLLERS.md §3 y §5.)
export {
  CATEGORIES,
  getCategoryList,
} from 'jl-sprt-core';
export type {
  AnyMatch,
  AnyTeam,
  ITeamCreator,
  AnySportProfile,
  AnyTeamTableItem,
  arr2,
  TypeBaseStageOption,
  TypeCategory,
  TypeCategoryList,
} from 'jl-sprt-core';

// ============================================================================
// Examples runner - solo se ejecuta si este archivo se corre directamente
// ============================================================================

import { APIExample } from './examples/APIExample';
import { baseStageExample } from './examples/baseStageExample';
import { volleyBaseStageExample } from './examples/volleyBaseStageExample';
import { americanFootballBaseStageExample } from './examples/americanFootballBaseStageExample';
import { fede_inst_Example } from './examples/fede_inst_Example';
// import {graphExample} from './examples/graphExample';
import { specialStageGroupExample } from './examples/specialStageGroupExample';
import { stageExample01 } from './examples/stageExample01';
import { stageExample02 } from './examples/stageExample02';
import { stageExample03 } from './examples/stageExample03';
import { stageLeagueExample } from './examples/stageLeagueExample';
import { systemExample_01 } from './examples/systemExample_01';
import { confederationExample } from './examples/confederationExample';

/**
 * Ejecuta un ejemplo específico.
 * Descomenta el que quieras probar y ejecuta con `npm start`.
 */
function runExamples() {
  baseStageExample();
  volleyBaseStageExample();
  americanFootballBaseStageExample();
  stageExample01();
  stageExample02();
  stageLeagueExample();
  specialStageGroupExample();
  stageExample03();
  // graphExample();
  systemExample_01();
  fede_inst_Example();
  confederationExample();
  APIExample();
}

// Se ejecuta solo si se invoca directamente (npm start / node dist/index.js)
if (require.main === module) {
  runExamples();

  const formatMemoryUsage = (data: number) => `${Math.round(data / 1024 / 1024 * 100) / 100} MB`;
  const memoryData = process.memoryUsage();
  console.log({
    rss: `${formatMemoryUsage(memoryData.rss)} -> Resident Set Size`,
    heapTotal: `${formatMemoryUsage(memoryData.heapTotal)} -> total heap`,
    heapUsed: `${formatMemoryUsage(memoryData.heapUsed)} -> used heap`,
    external: `${formatMemoryUsage(memoryData.external)} -> V8 external`,
  });
}