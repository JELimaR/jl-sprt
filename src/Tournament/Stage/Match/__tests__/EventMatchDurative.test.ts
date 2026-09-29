import { describe, it, expect, beforeEach } from 'vitest';
import { JCalendar, JDateTime } from 'jl-calendar';
import { MatchScheduler } from '../MatchScheduler';
import { AnyTeam, IMatchCreationInfo } from 'jl-sprt-core';
import { FootballProfile, reseedRandom } from 'jl-sprt-match';

// -----------------------------------------------------------------------------
// JEventMatch + MatchScheduler — ORQUESTACIÓN del partido dentro del calendario.
//
// Este test cubre lo que es PROPIO de jl-sprt: cómo el evento durativo agenda un
// partido, lo pone en juego al alcanzar su instante, lo hace avanzar tick a tick
// y lo cierra, integrándose con el calendario (JCalendar).
//
// NO verifica la simulación del partido (goles, sets, duración por deporte): eso
// es responsabilidad de jl-sprt-match y se testea allí. Aquí un FootballProfile es
// sólo el motor mínimo necesario para tener un match que orquestar.
// -----------------------------------------------------------------------------

const SEED = 13;
const profile = new FootballProfile();

function fakeTeam(id: string): AnyTeam {
  const t: Partial<AnyTeam> = {
    id,
    name: id,
    getTeamMatch: () => profile.createTeam({ id, category: 'S', owner: { id: `o-${id}`, name: id } }).getTeamMatch(),
    addNewMatch: () => { },
    addStage: () => { },
  };
  return t as unknown as AnyTeam;
}

function matchInfo(overrides: Partial<IMatchCreationInfo<any, any>> = {}): IMatchCreationInfo<any, any> {
  return {
    id: 'm1',
    hw: 10,
    season: 2000,
    homeTeam: fakeTeam('A'),
    awayTeam: fakeTeam('B'),
    isNeutral: false,
    ...overrides,
  };
}

function setup() {
  const base = JDateTime.createFromDayOfYearAndYear(1, 2000);
  const cal = new JCalendar(base.getCreator());
  const match = profile.createMatch(matchInfo());
  const start = base.copy();
  start.addInterv(1);
  const ev = MatchScheduler(match, start, cal); // deja el match 'scheduled'
  return { cal, ev, match };
}

describe('JEventMatch - metadatos del evento', () => {
  beforeEach(() => reseedRandom(SEED));

  it('expone kind = "match" y un label legible con ambos equipos', () => {
    const { ev } = setup();
    expect(ev.kind).toBe('match');
    expect(ev.label).toBe('A vs B');
  });

  it('MatchScheduler deja el match agendado (scheduled)', () => {
    const { match } = setup();
    expect(match.state).toBe('scheduled');
  });
});

describe('JEventMatch - ciclo de vida en el calendario', () => {
  beforeEach(() => reseedRandom(SEED));

  it('pone el match en juego al alcanzar su instante, sin bloquear (no interactivo)', () => {
    const { cal, ev, match } = setup();
    expect(match.state).toBe('scheduled');

    cal.tick(); // base (vacío) -> base+1
    expect(match.state).toBe('scheduled');

    cal.tick(); // now == inicio -> start()
    expect(ev.lifecycle).toBe('process');
    expect(['playing', 'finished']).toContain(match.state);
    expect(ev.status).toBe('idle'); // evento no interactivo: no frena el calendario
    expect(cal.getPendingInteractiveEvents().length).toBe(0);
  });

  it('avanzar el calendario progresa el partido y termina el evento (resolved)', () => {
    const { cal, ev, match } = setup();
    // Tope holgado de intervalos: al avanzar el calendario, el evento debe cerrarse.
    cal.advanceIntervals(1 + 100);
    expect(match.isFinished).toBe(true);
    expect(ev.lifecycle).toBe('finished');
    expect(ev.status).toBe('resolved');
    expect(match.result).toBeDefined();
    expect(cal.getActiveEvents()).not.toContain(ev);
  });

  it('execute() funciona como fallback: corre el partido completo de una', () => {
    const { match, ev } = setup();
    ev.execute();
    expect(match.isFinished).toBe(true);
    expect(match.result).toBeDefined();
  });
});
