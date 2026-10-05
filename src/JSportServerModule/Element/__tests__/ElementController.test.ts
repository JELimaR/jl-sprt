import { describe, it, expect, beforeEach } from "vitest";
import { SportServerAPI } from "../../../JSportServerModule";
import { SportFactoryServer } from "../../SportFactoryServer";
import type {
  ICreateSimpleLeagueInput,
  IMatchDTO,
  IStandingRowDTO,
} from "../../../JSportModule";

// -----------------------------------------------------------------------------
// ElementController — simulación de liga simple sobre el SportWorld.
//
// Verifica el ciclo de vida de una simulación y que los DTOs planos salen correctos:
// fixture, tabla, calendario, avance y cierre.
//
// MODELO SportWorld: todas las simulaciones viven en el MISMO mundo del proceso (un
// único calendario). Para aislar cada caso de test, `beforeEach` resetea el mundo del
// factory (calendario + rankings + entidades limpios).
// -----------------------------------------------------------------------------

const elements = () => SportServerAPI().getElementController();

beforeEach(() => {
  // Mundo limpio por caso: evita que el calendario compartido acumule eventos de
  // simulaciones de casos anteriores.
  SportFactoryServer.instance.resetWorld();
});

type Api = ReturnType<typeof elements>;

/**
 * Avanza la simulación hasta que el draw del stage materializa el fixture (los
 * partidos existen recién tras el Event_StageStart). Guard para no colgar el test.
 *
 * Usa `advanceToNextEvent` (salta el tiempo muerto hasta el intervalo anterior al
 * próximo evento) seguido de un `advance` (un tick) que ejecuta ese evento. `advance`
 * por sí solo es un único intervalo y no salta tiempo muerto, por lo que no sirve para
 * recorrer rápido el calendario hasta el draw.
 */
function advanceUntilMatches(api: Api, simulationId: string, guard = 200): void {
  let i = 0;
  while (api.getMatches(simulationId).length === 0 && i < guard) {
    api.advanceToNextEvent(simulationId);
    api.advance(simulationId);
    i++;
  }
}

/** Input de liga de N equipos con nombres legibles. */
function leagueInput(
  n: number,
  overrides: Partial<ICreateSimpleLeagueInput> = {},
): ICreateSimpleLeagueInput {
  return {
    sport: "football",
    opt: "h&a",
    teams: Array.from({ length: n }, (_, i) => ({ id: `T${i}`, name: `Team ${i}` })),
    ...overrides,
  };
}

describe("ElementController - createSimpleLeague y estado inicial", () => {
  it("crea la sesión y devuelve un simulationId", () => {
    const api = elements();
    const ref = api.createSimpleLeague(leagueInput(6));
    expect(typeof ref.simulationId).toBe("string");
    expect(ref.simulationId.length).toBeGreaterThan(0);
  });

  // NOTA sobre el modelo: los turns/partidos de la liga se crean en el DRAW del
  // stage (Event_StageStart), que ocurre al AVANZAR el calendario, no al crear el
  // torneo. Por eso el fixture no existe en el instante 0; aparece tras el primer
  // avance. (Ver comentario en simpleLeague.ts: "cuando P1 se implemente en jl-sprt
  // este relleno se vuelve innecesario".)
  it("al inicio los partidos CONCRETOS aún no existen (se materializan en el draw) pero se puede avanzar", () => {
    const api = elements();
    const { simulationId } = api.createSimpleLeague(leagueInput(6));
    const state = api.getState(simulationId);

    expect(state.matches.length).toBe(0); // el draw todavía no ocurrió
    expect(state.finished).toBe(false);
    expect(state.canAdvance).toBe(true);
    expect(state.hasNextEvent).toBe(true);
  });

  it("tras el draw el fixture completo queda disponible, con equipos legibles y sin resultados", () => {
    const api = elements();
    const { simulationId } = api.createSimpleLeague(leagueInput(6));

    // Avanzar hasta que el draw materialice los partidos.
    advanceUntilMatches(api, simulationId);
    const state = api.getState(simulationId);

    // Liga de 6, ida y vuelta -> 10 jornadas * 3 partidos = 30 partidos.
    expect(state.matches.length).toBe(30);

    // Tabla con 6 filas, nombres legibles.
    expect(state.standings.length).toBe(6);
    const names = state.standings.map((r) => r.teamName).sort();
    expect(names).toEqual(["Team 0", "Team 1", "Team 2", "Team 3", "Team 4", "Team 5"]);
  });

  it("los partidos del fixture tienen nombres legibles de ambos equipos y jornada", () => {
    const api = elements();
    const { simulationId } = api.createSimpleLeague(leagueInput(4));
    advanceUntilMatches(api, simulationId);
    const matches = api.getMatches(simulationId);

    expect(matches.length).toBe(12); // 4 equipos h&a -> 6 jornadas * 2
    matches.forEach((m) => {
      expect(m.homeName).toMatch(/^Team \d$/);
      expect(m.awayName).toMatch(/^Team \d$/);
      expect(m.homeName).not.toBe(m.awayName);
      expect(m.turn).toBeGreaterThanOrEqual(1);
    });
  });

  it("el calendario incluye un evento por cada partido del fixture (tras el draw)", () => {
    const api = elements();
    const { simulationId } = api.createSimpleLeague(leagueInput(4));
    advanceUntilMatches(api, simulationId);
    const events = api.getCalendarEvents(simulationId);
    const matches = api.getMatches(simulationId);

    const matchEventIds = new Set(
      events.filter((e) => e.kind === "match").map((e) => e.matchId),
    );
    matches.forEach((m) => expect(matchEventIds.has(m.id)).toBe(true));

    // Eventos ordenados por instante.
    for (let i = 1; i < events.length; i++) {
      expect(events[i].date.absolute).toBeGreaterThanOrEqual(events[i - 1].date.absolute);
    }
  });

  it("getCurrentDate devuelve el instante inicial con label legible", () => {
    const api = elements();
    const { simulationId } = api.createSimpleLeague(leagueInput(4));
    const date = api.getCurrentDate(simulationId);
    expect(typeof date.absolute).toBe("number");
    expect(typeof date.label).toBe("string");
    expect(date.label.length).toBeGreaterThan(0);
  });
});

describe("ElementController - fixture estructural (slots)", () => {
  it("el fixture está disponible desde el instante 0, antes del draw, como slots por seed", () => {
    const api = elements();
    const { simulationId } = api.createSimpleLeague(leagueInput(6));

    // Los partidos concretos aún no existen...
    expect(api.getMatches(simulationId).length).toBe(0);

    // ...pero el fixture estructural sí: 10 jornadas * 3 = 30 slots.
    const fixture = api.getFixture(simulationId);
    expect(fixture.length).toBe(30);

    // Antes del draw, los participantes son posiciones (seed), sin equipo ni matchId.
    fixture.forEach((slot) => {
      expect(slot.home.kind).toBe("seed");
      expect(slot.away.kind).toBe("seed");
      expect(slot.matchId).toBeUndefined();
      expect(slot.turn).toBeGreaterThanOrEqual(1);
      expect(typeof slot.halfWeek).toBe("number");
    });

    // Los seeds cubren las 6 posiciones del ranking.
    const seedPositions = new Set<number>();
    fixture.forEach((slot) => {
      if (slot.home.kind === "seed") seedPositions.add(slot.home.pos);
      if (slot.away.kind === "seed") seedPositions.add(slot.away.pos);
    });
    expect([...seedPositions].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("tras el draw, los slots se completan con equipos legibles y matchId", () => {
    const api = elements();
    const { simulationId } = api.createSimpleLeague(leagueInput(6));
    advanceUntilMatches(api, simulationId);

    const fixture = api.getFixture(simulationId);
    expect(fixture.length).toBe(30);

    fixture.forEach((slot) => {
      expect(slot.home.kind).toBe("team");
      expect(slot.away.kind).toBe("team");
      if (slot.home.kind === "team") expect(slot.home.teamName).toMatch(/^Team \d$/);
      expect(typeof slot.matchId).toBe("string");
    });

    // Cada matchId del fixture corresponde a un partido real.
    const matchIds = new Set(api.getMatches(simulationId).map((m) => m.id));
    fixture.forEach((slot) => expect(matchIds.has(slot.matchId!)).toBe(true));
  });

  it("el número de slots por jornada es coherente (N/2 partidos por fecha)", () => {
    const api = elements();
    const { simulationId } = api.createSimpleLeague(leagueInput(4));
    const fixture = api.getFixture(simulationId);

    const byTurn = new Map<number, number>();
    fixture.forEach((s) => byTurn.set(s.turn, (byTurn.get(s.turn) ?? 0) + 1));
    // 4 equipos: 2 partidos por jornada, 6 jornadas (ida y vuelta).
    expect([...byTurn.values()].every((c) => c === 2)).toBe(true);
    expect(byTurn.size).toBe(6);
  });
});

describe("ElementController - avance y cierre de la liga", () => {
  it("advance mueve el instante actual hacia adelante", () => {
    const api = elements();
    const { simulationId } = api.createSimpleLeague(leagueInput(4));
    const before = api.getCurrentDate(simulationId).absolute;
    api.advance(simulationId);
    const after = api.getCurrentDate(simulationId).absolute;
    expect(after).toBeGreaterThanOrEqual(before);
  });

  it("runAll termina la liga: todos los partidos finished y tabla final completa", () => {
    const api = elements();
    const { simulationId } = api.createSimpleLeague(leagueInput(6));
    const result = api.runAll(simulationId);

    expect(result.state.finished).toBe(true);
    expect(result.state.canAdvance).toBe(false);
    expect(result.pendingEvents).toEqual([]);

    const matches = api.getMatches(simulationId);
    expect(matches.length).toBe(30);
    expect(matches.every((m) => m.state === "finished")).toBe(true);
    // Con el partido jugado, el marcador formateado está disponible.
    expect(matches.every((m) => m.scoreText !== null)).toBe(true);
  });

  it("la tabla final está ordenada por posición 1..N sin huecos", () => {
    const api = elements();
    const { simulationId } = api.createSimpleLeague(leagueInput(6));
    api.runAll(simulationId);
    const standings = api.getStandings(simulationId);

    expect(standings.map((r) => r.pos)).toEqual([1, 2, 3, 4, 5, 6]);
    standings.forEach((r) => {
      expect(typeof r.teamId).toBe("string");
      expect(r.teamName).toMatch(/^Team \d$/);
      // Las columnas propias del deporte vienen como números.
      expect(Object.values(r.values).every((v) => typeof v === "number")).toBe(true);
    });
  });

  it("runAll es idempotente una vez terminada (no quedan eventos por procesar)", () => {
    const api = elements();
    const { simulationId } = api.createSimpleLeague(leagueInput(4));
    api.runAll(simulationId);
    const again = api.runAll(simulationId);
    expect(again.state.finished).toBe(true);
    expect(again.pendingEvents).toEqual([]);
  });
});

describe("ElementController - deportes (profiles)", () => {
  it("fútbol: scoreText con formato de goles y sin desglose de sets", () => {
    const api = elements();
    const { simulationId } = api.createSimpleLeague(leagueInput(4, { sport: "football" }));
    api.runAll(simulationId);
    const matches = api.getMatches(simulationId);
    const m = matches[0] as IMatchDTO;

    expect(m.scoreText).not.toBeNull();
    expect(m.sets).toEqual([]); // fútbol no tiene sets
    expect(typeof m.homeScore).toBe("number");
    expect(typeof m.awayScore).toBe("number");
    // Metadatos de torneo y ganador (partido ya terminado tras runAll).
    expect(typeof m.tournamentId).toBe("string");
    expect(m.tournamentName.length).toBeGreaterThan(0);
    expect(["home", "away", "draw"]).toContain(m.winner);
  });

  it("vóley: cada partido terminado tiene desglose de sets y un ganador", () => {
    const api = elements();
    const { simulationId } = api.createSimpleLeague(leagueInput(4, { sport: "volleyball" }));
    api.runAll(simulationId);
    const matches = api.getMatches(simulationId);

    matches.forEach((m) => {
      expect(m.state).toBe("finished");
      expect(m.sets.length).toBeGreaterThan(0);
      // En vóley no hay empate: un equipo gana más sets que el otro.
      expect(m.homeScore).not.toBe(m.awayScore);
      // Y por lo mismo, el ganador es home o away (nunca draw).
      expect(["home", "away"]).toContain(m.winner);
    });
  });
});

describe("ElementController - queries puntuales y errores", () => {
  it("getMatch devuelve el partido por id, o null si no existe", () => {
    const api = elements();
    const { simulationId } = api.createSimpleLeague(leagueInput(4));
    advanceUntilMatches(api, simulationId);
    const matches = api.getMatches(simulationId);
    const first = matches[0];

    const found = api.getMatch(simulationId, first.id);
    expect(found?.id).toBe(first.id);
    expect(api.getMatch(simulationId, "no-existe")).toBeNull();
  });

  it("getMatch con simulación inexistente devuelve null (query tolerante)", () => {
    const api = elements();
    expect(api.getMatch("sim-fantasma", "x")).toBeNull();
  });

  it("createSimpleLeague con menos de 2 equipos lanza", () => {
    const api = elements();
    expect(() => api.createSimpleLeague(leagueInput(1))).toThrow(/al menos 2 equipos/);
  });

  it("los comandos/queries de estado lanzan ante simulationId inexistente", () => {
    const api = elements();
    expect(() => api.getState("sim-fantasma")).toThrow(/sim-fantasma/);
    expect(() => api.advance("sim-fantasma")).toThrow(/sim-fantasma/);
    expect(() => api.getStandings("sim-fantasma")).toThrow(/sim-fantasma/);
  });

  it("dispose elimina la sesión; luego las queries de estado lanzan", () => {
    const api = elements();
    const { simulationId } = api.createSimpleLeague(leagueInput(4));
    expect(api.dispose(simulationId)).toBe(true);
    // Ya no existe: dispose de nuevo es false y getState lanza.
    expect(api.dispose(simulationId)).toBe(false);
    expect(() => api.getState(simulationId)).toThrow();
  });

  // UN MUNDO = UNA SIMULACIÓN: crear una liga simple REINICIA el mundo. No coexisten
  // dos simulaciones; la nueva reemplaza a la anterior y la previa deja de existir.
  it("crear una nueva liga reinicia el mundo: la simulación anterior deja de existir", () => {
    const api = elements();
    const a = api.createSimpleLeague(leagueInput(4)).simulationId;
    expect(api.getFixture(a).length).toBe(12);

    // Crear otra liga descarta el mundo anterior: `a` ya no existe.
    const b = api.createSimpleLeague(leagueInput(6)).simulationId;
    expect(a).not.toBe(b);
    expect(api.getFixture(b).length).toBe(30);
    expect(() => api.getState(a)).toThrow();
  });
});

describe("ElementController - vistas de equipo (team)", () => {
  it("getTeam devuelve info del equipo + su institución, o null si no existe", () => {
    const api = elements();
    const { simulationId } = api.createSimpleLeague(leagueInput(4));
    advanceUntilMatches(api, simulationId);
    const anyMatch = api.getMatches(simulationId)[0];

    const team = api.getTeam(simulationId, anyMatch.homeTeamId);
    expect(team).not.toBeNull();
    expect(team!.teamId).toBe(anyMatch.homeTeamId);
    expect(team!.name).toBe(anyMatch.homeName);
    expect(team!.category).toBe("S");
    expect(team!.sport).toBe("football");
    expect(typeof team!.institutionId).toBe("string");
    expect(team!.institutionName.length).toBeGreaterThan(0);

    expect(api.getTeam(simulationId, "no-existe")).toBeNull();
  });

  it("getTeam con simulación inexistente devuelve null (query tolerante)", () => {
    const api = elements();
    expect(api.getTeam("sim-fantasma", "x")).toBeNull();
  });

  it("getTeamTournaments devuelve el torneo del equipo con su posición y estado", () => {
    const api = elements();
    const { simulationId } = api.createSimpleLeague(leagueInput(6));
    advanceUntilMatches(api, simulationId);
    const teamId = api.getMatches(simulationId)[0].homeTeamId;

    const tournaments = api.getTeamTournaments(simulationId, teamId);
    expect(tournaments.length).toBe(1);
    expect(tournaments[0].finished).toBe(false);
    expect(tournaments[0].position).toBeGreaterThanOrEqual(1);
    expect(tournaments[0].position).toBeLessThanOrEqual(6);

    // Tras terminar, el torneo figura como finished.
    api.runAll(simulationId);
    expect(api.getTeamTournaments(simulationId, teamId)[0].finished).toBe(true);
  });

  it("getTeamMatches: TODOS los partidos del equipo, ordenados por instante", () => {
    const api = elements();
    const { simulationId } = api.createSimpleLeague(leagueInput(4));
    advanceUntilMatches(api, simulationId);
    const teamId = api.getMatches(simulationId)[0].homeTeamId;

    const teamMatches = api.getTeamMatches(simulationId, teamId);
    // Liga de 4 h&a: cada equipo juega 6 partidos (2 por rival).
    expect(teamMatches.length).toBe(6);
    // Todos involucran al equipo.
    teamMatches.forEach((m) => {
      expect(m.homeTeamId === teamId || m.awayTeamId === teamId).toBe(true);
    });
    // Ordenados por instante (no decreciente).
    for (let i = 1; i < teamMatches.length; i++) {
      expect(teamMatches[i].date.absolute).toBeGreaterThanOrEqual(teamMatches[i - 1].date.absolute);
    }
  });

  it("getTeamMatches filtrado por torneo coincide con el total (un solo torneo en Fase A)", () => {
    const api = elements();
    const { simulationId } = api.createSimpleLeague(leagueInput(4));
    advanceUntilMatches(api, simulationId);
    const teamId = api.getMatches(simulationId)[0].homeTeamId;

    const all = api.getTeamMatches(simulationId, teamId);
    const tournamentId = api.getTeamTournaments(simulationId, teamId)[0].tournamentId;
    const byTournament = api.getTeamMatches(simulationId, teamId, tournamentId);
    expect(byTournament.length).toBe(all.length);
  });
});
