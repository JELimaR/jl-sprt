import { describe, it, expect } from "vitest";
import { SportServerAPI } from "../../../JSportServerModule";
import type {
  ICreateSimpleLeagueInput,
  IMatchDTO,
  IStandingRowDTO,
} from "../../../JSportModule";

// -----------------------------------------------------------------------------
// ElementController — Fase A (liga simple end-to-end)
//
// Verifica el ciclo de vida de una simulación (sesión = mundo con un torneo) y que
// los DTOs planos salen correctos: fixture, tabla, calendario, avance y cierre.
//
// El controller es singleton de proceso, pero cada createSimpleLeague crea una
// sesión aislada (simulationId distinto). Los casos no comparten estado porque cada
// uno crea su propia sesión; igual se agrupan en describe por área.
// -----------------------------------------------------------------------------

const elements = () => SportServerAPI().getElementController();

type Api = ReturnType<typeof elements>;

/**
 * Avanza la simulación hasta que el draw del stage materializa el fixture (los
 * partidos existen recién tras el Event_StageStart). Guard para no colgar el test.
 */
function advanceUntilMatches(api: Api, simulationId: string, guard = 200): void {
  let i = 0;
  while (api.getMatches(simulationId).length === 0 && i < guard) {
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

  it("sesiones distintas no comparten estado (aislamiento por simulationId)", () => {
    const api = elements();
    const a = api.createSimpleLeague(leagueInput(4)).simulationId;
    const b = api.createSimpleLeague(leagueInput(6)).simulationId;

    api.runAll(a);
    // 'a' terminada no afecta a 'b' (que nunca se avanzó).
    expect(api.getState(a).finished).toBe(true);
    expect(api.getState(b).finished).toBe(false);
    expect(api.getMatches(a).length).toBe(12);  // 'a' jugada
    expect(api.getMatches(b).length).toBe(0);   // 'b' sin draw todavía
    // El fixture estructural de 'b' sí existe desde el inicio y es independiente.
    expect(api.getFixture(a).length).toBe(12);
    expect(api.getFixture(b).length).toBe(30);
  });
});
