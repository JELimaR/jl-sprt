import { JCalendar } from "jl-calendar";
import { AnySportProfile } from "jl-sprt-core";
import { RankingStore } from "../JSportModule/Ranking/RankingStore";
import { Confederation } from "../JSportModule/data/Entities/Confederation";
import { Federation } from "../JSportModule/data/Entities/Federation";
import { Institution } from "../JSportModule/data/Entities/Institution";
import { Continent, Country, Town } from "../JSportModule/data/Entities/GeogEntity";
import { SimulationContext } from "../Tournament/SimulationContext";
import { Tournament } from "../Tournament/Tournament";
import { teamsAssign } from "../Tournament/teamsAssign";
import { AdvanceAll } from "../Tournament/Advance";
import { ProfilesFactory } from "jl-sprt-match";

/**
 * SportWorld — agregado dueño del ESTADO DEL MUNDO de simulación.
 *
 * Ver docs/plans/SPORT_WORLD.md. Reemplaza el andamiaje de la Fase A del
 * ElementController (sesión con `tournaments: Map` + `teamNames: Map`), que mezclaba
 * estado del mundo con parches de conveniencia.
 *
 * Un `SportWorld` agrupa:
 *  - ENTIDADES: geografía (continentes/países/ciudades) y deportivas
 *    (confederaciones/federaciones/instituciones, con sus teams por categoría).
 *  - CALENDARIO: un único `JCalendar` (tiempo lineal; temporada = año). Ver §1.3.
 *  - RANKINGS: un único `RankingStore` que ya provee estado VIGENTE (`_current`) e
 *    HISTÓRICO por temporada (`getBySeason`, con `metadata.season`). Ver §1.4.
 *  - `currentSeason`: el año en curso.
 *
 * Principios del modelo (SPORT_WORLD.md §1):
 *  - Temporada = año; el tiempo avanza en un solo sentido y es secuencial estricto
 *    (el año N+1 depende del cierre del año N). No hay temporadas en paralelo.
 *  - El calendario mueve el tiempo INTRA-temporada; la transición INTER-temporada
 *    (cerrar N → abrir N+1) es un paso EXPLÍCITO (futuro `closeSeason()`, Paso 4), no
 *    un evento del calendario.
 *
 * NOTA Paso 1 (esqueleto): esta clase define estructura y accesores. El LOD (Paso 5) y
 * la transición de temporada (Paso 4) se agregan después. El nombre de un team NO
 * necesita un mapa paralelo: `A_Team` ya expone `name`/`entity` (derivado de su
 * Institution).
 */
export class SportWorld {
  /** Año en curso (temporada vigente). */
  private _currentSeason: number;

  /** Calendario único del mundo (tiempo lineal). */
  private readonly _calendar: JCalendar;

  /** Rankings del mundo: vigente (`_current`) + histórico por temporada (`getBySeason`). */
  private readonly _rankings: RankingStore;

  // --- Entidades geográficas ---
  private _continents: Map<string, Continent> = new Map();
  private _countries: Map<string, Country> = new Map();
  private _towns: Map<string, Town> = new Map();

  // --- Entidades deportivas ---
  private _confederations: Map<string, Confederation> = new Map();
  private _federations: Map<string, Federation> = new Map();
  private _institutions: Map<string, Institution> = new Map();

  /**
   * Vista del mundo hacia el motor de torneos: comparte el calendario y el store de
   * rankings del mundo, con su propio registro de configs de torneo. Es el contexto
   * que se pasa a `Tournament.create` / `teamsAssign`.
   */
  private readonly _ctx: SimulationContext;

  /** Torneos de la temporada en curso, por `idConfig`. */
  private _tournaments: Map<string, Tournament> = new Map();

  constructor(season: number, calendar?: JCalendar, rankings?: RankingStore) {
    this._currentSeason = season;
    this._calendar = calendar ?? JCalendar.createFromYear(season);
    this._rankings = rankings ?? new RankingStore();
    this._ctx = new SimulationContext(this._calendar, this._rankings);
  }

  /** Crea un mundo nuevo cuyo calendario arranca en el año `season`. */
  static createFromYear(season: number): SportWorld {
    return new SportWorld(season);
  }

  // ==========================================================================
  // Tiempo / temporada
  // ==========================================================================

  get currentSeason(): number { return this._currentSeason; }
  get calendar(): JCalendar { return this._calendar; }
  get rankings(): RankingStore { return this._rankings; }
  /** Contexto del mundo para el motor de torneos (vista: calendar + rankings + configs). */
  get ctx(): SimulationContext { return this._ctx; }
  /** Torneos de la temporada en curso. */
  get tournaments(): Tournament[] { return [...this._tournaments.values()]; }

  // ==========================================================================
  // Entidades geográficas
  // ==========================================================================

  addContinent(c: Continent): boolean { return this.addUnique(this._continents, c.id, c); }
  addCountry(c: Country): boolean { return this.addUnique(this._countries, c.id, c); }
  addTown(t: Town): boolean { return this.addUnique(this._towns, t.id, t); }

  getContinents(): Continent[] { return [...this._continents.values()]; }
  getCountries(): Country[] { return [...this._countries.values()]; }
  getTowns(): Town[] { return [...this._towns.values()]; }

  getContinent(id: string): Continent | undefined { return this._continents.get(id); }
  getCountry(id: string): Country | undefined { return this._countries.get(id); }
  getTown(id: string): Town | undefined { return this._towns.get(id); }

  // ==========================================================================
  // Entidades deportivas
  // ==========================================================================

  addConfederation(c: Confederation): boolean { return this.addUnique(this._confederations, c.id, c); }
  addFederation(f: Federation): boolean { return this.addUnique(this._federations, f.id, f); }
  addInstitution(i: Institution): boolean { return this.addUnique(this._institutions, i.id, i); }

  getConfederations(): Confederation[] { return [...this._confederations.values()]; }
  getFederations(): Federation[] { return [...this._federations.values()]; }
  getInstitutions(): Institution[] { return [...this._institutions.values()]; }

  getConfederation(id: string): Confederation | undefined { return this._confederations.get(id); }
  getFederation(id: string): Federation | undefined { return this._federations.get(id); }
  getInstitution(id: string): Institution | undefined { return this._institutions.get(id); }

  removeConfederation(id: string): boolean { return this._confederations.delete(id); }
  removeFederation(id: string): boolean { return this._federations.delete(id); }
  removeInstitution(id: string): boolean { return this._institutions.delete(id); }

  // ==========================================================================
  // Torneos de la temporada en curso
  // ==========================================================================

  /** Registra un torneo ya creado en la temporada en curso. */
  addTournament(t: Tournament): void {
    this._tournaments.set(t.config.idConfig, t);
  }

  getTournament(idConfig: string): Tournament | undefined {
    return this._tournaments.get(idConfig);
  }

  // ==========================================================================
  // Ciclo de temporada
  // ==========================================================================

  /**
   * Avance INTRA-temporada: corre el calendario del mundo hasta vaciarlo (todos los
   * eventos de la temporada en curso: draws, schedules, partidos). Ver SPORT_WORLD §1.
   */
  runSeason(): void {
    AdvanceAll(this._calendar);
  }

  /**
   * Transición INTER-temporada (paso EXPLÍCITO, no evento del calendario). Cierra el
   * año N y prepara el N+1. Ver SPORT_WORLD.md §1.6 y TOURNAMENT_TAXONOMY.md §4.
   *
   * Alcance actual: nivel FEDERACIÓN con clubes (lo único construible hoy). Los niveles
   * confederación y organismo mundial quedan como enganche documentado.
   *
   *  1. Consolida los rankings finales (`tr_`) de los torneos corridos en el store
   *     (Tournament.getRelativeRank no persiste por sí solo).
   *  2. Por cada federación: `updateRankings` (ascensos/descensos). El historial por
   *     temporada ya lo mantiene el RankingStore (metadata.season).
   *  3. Avanza `currentSeason` a N+1.
   *  4. Crea los torneos del año N+1 desde `federation.createTournamentList()` y los
   *     registra; sus eventos se agendan en el calendario del mundo (año N+1).
   *
   * Precondición: la temporada N ya se corrió (`runSeason`), por lo que los `tr_`
   * existen. Si una federación no tiene LeagueSystem configurado, se omite.
   *
   * @param profileFor resuelve el profile de cada torneo. Por defecto, por el sport de
   *   la primera institución miembro de la federación (todas comparten sport).
   */
  closeSeason(profileFor?: (federation: Federation) => AnySportProfile): void {
    // 1. Consolidar rankings finales de los torneos de la temporada que cerró.
    this._tournaments.forEach((t) => {
      const relative = t.getRelativeRank();
      this._rankings.set(relative.context, relative);
    });

    // 2. Ascensos/descensos por federación (lee los tr_ del store).
    this.getFederations().forEach((fed) => {
      fed.updateRankings(this._rankings);
    });

    // 3. Avanzar la temporada.
    this._currentSeason += 1;

    // 4. Crear los torneos del nuevo año desde las federaciones (nivel clubes).
    //    (Confederación / organismo mundial: enganche futuro, ver TOURNAMENT_TAXONOMY.)
    this.openSeasonTournaments(profileFor);
  }

  /**
   * Crea y registra los torneos de la temporada EN CURSO a partir de las federaciones
   * del mundo (nivel clubes). Publica el ranking vigente de cada federación como fuente
   * y agenda los eventos de los torneos en el calendario del mundo.
   *
   * Se usa para sembrar la PRIMERA temporada y lo reutiliza `closeSeason` para el año
   * N+1. Reinicia el registro de torneos de la temporada.
   */
  openSeasonTournaments(profileFor?: (federation: Federation) => AnySportProfile): void {
    this._tournaments = new Map();
    this.getFederations().forEach((fed) => {
      const creators = fed.createTournamentList();
      if (creators.length === 0) return;
      // Publicar el ranking vigente de la federación como fuente de los torneos.
      const franking = fed.getRanking('S');
      this._rankings.set(franking.context, franking);

      const profile = profileFor ? profileFor(fed) : this.defaultProfileFor(fed);
      creators.forEach((data) => {
        const t = Tournament.create({ id: data.name, season: this._currentSeason }, data, this._ctx, profile);
        teamsAssign(t, this._ctx);
        this.addTournament(t);
      });
    });
  }

  /** Profile por defecto de una federación: el sport de su primera institución miembro. */
  private defaultProfileFor(fed: Federation): AnySportProfile {
    const first = [...fed.members.values()][0];
    const sport = first ? first.sport : 'football';
    return ProfilesFactory.getProfile(sport);
  }

  // ==========================================================================
  // Helpers internos
  // ==========================================================================

  /** Inserta en el mapa solo si la clave no existe. Devuelve false si ya existía. */
  private addUnique<T>(map: Map<string, T>, id: string, value: T): boolean {
    if (map.has(id)) return false;
    map.set(id, value);
    return true;
  }
}
