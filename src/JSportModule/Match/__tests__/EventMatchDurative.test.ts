import { describe, it, expect, beforeEach } from 'vitest';
import { JCalendar, JDateTime } from 'jl-calendar';
import { JEventMatch } from '../EventMatch';
import { FootballProfile } from '../../profiles/football/FootballProfile';
import { VolleyballProfile } from '../../profiles/volleyball/VolleyballProfile';
import { AmericanFootballProfile } from '../../profiles/americanFootball/AmericanFootballProfile';
import { ISportProfile, IMatchCreationInfo } from '../../profiles/ISportProfile';
import { reseedRandom } from '../randomSource';
import Team, { TeamMatch } from '../../data/Team';

const SEED = 13;

function fakeTeam(id: string): Team {
  const t: Partial<Team> = {
    id,
    getTeamMatch: () => new TeamMatch(id),
    addNewMatch: () => {},
    addStage: () => {},
  };
  return t as unknown as Team;
}

function matchInfo(overrides: Partial<IMatchCreationInfo> = {}): IMatchCreationInfo {
  return {
    id: 'm1',
    hw: 10,
    season: 2000,
    homeTeam: fakeTeam('A'),
    awayTeam: fakeTeam('B'),
    allowedDraw: true,
    isNeutral: false,
    ...overrides,
  };
}

// Cada profile con un tope de intervalos holgado para garantizar que termine.
const PROFILES: { name: string; profile: ISportProfile<any, any, any, any>; maxIntervals: number }[] = [
  { name: 'football', profile: new FootballProfile(), maxIntervals: 60 },
  { name: 'volleyball', profile: new VolleyballProfile(), maxIntervals: 400 },
  { name: 'americanFootball', profile: new AmericanFootballProfile(), maxIntervals: 60 },
];

describe.each(PROFILES)('JEventMatch durativo - profile $name', ({ profile, maxIntervals }) => {
  beforeEach(() => reseedRandom(SEED));

  function setup() {
    const base = JDateTime.createFromDayOfYearAndYear(1, 2000);
    const cal = new JCalendar(base.getIJDateTimeCreator());

    const match = profile.createMatch(matchInfo({ allowedDraw: false }));
    const start = base.copy();
    start.addInterv(1);
    match.schedule(start); // debe estar 'scheduled' para start()

    const ev = new JEventMatch({
      dateTime: start.getIJDateTimeCreator(),
      calendar: cal,
      match,
    });
    cal.addEvent(ev);
    return { cal, ev, match };
  }

  it('kind/label expuestos', () => {
    const { ev } = setup();
    expect(ev.kind).toBe('match');
    expect(ev.label).toBe('A vs B');
  });

  it('start pone el match en juego al alcanzar su instante', () => {
    const { cal, ev, match } = setup();
    expect(match.state).toBe('scheduled');

    cal.tick(); // procesa base (vacío) -> base+1
    expect(match.state).toBe('scheduled');

    cal.tick(); // now == inicio -> start() (+ un advance en el mismo tick)
    expect(ev.lifecycle).toBe('process');
    expect(['playing', 'finished']).toContain(match.state);
    expect(ev.status).toBe('idle'); // no interactivo, no bloquea
    expect(cal.getPendingInteractiveEvent()).toBeNull();
  });

  it('avanzar pocos intervalos muestra el partido EN JUEGO (progreso parcial)', () => {
    const { cal, match } = setup();
    cal.advanceIntervals(1); // start
    cal.advanceIntervals(2); // pocos pasos
    // el tiempo interno de la simulación avanzó
    expect(match['_playing'].time).toBeGreaterThan(0);
    // aún no debería haber terminado tan pronto
    expect(match.isFinished).toBe(false);
    expect(match.state).toBe('playing');
  });

  it('avanzar suficientes intervalos termina el partido (finish + resolved)', () => {
    const { cal, ev, match } = setup();
    cal.advanceIntervals(maxIntervals);
    expect(match.isFinished).toBe(true);
    expect(ev.lifecycle).toBe('finished');
    expect(ev.status).toBe('resolved');
    expect(match.result).toBeDefined();
    expect(cal.getActiveEvents()).not.toContain(ev);
  });

  it('execute() sigue funcionando como fallback (partido completo de una)', () => {
    const base = JDateTime.createFromDayOfYearAndYear(1, 2000);
    const cal = new JCalendar(base.getIJDateTimeCreator());
    const match = profile.createMatch(matchInfo({ allowedDraw: false }));
    const start = base.copy();
    start.addInterv(1);
    match.schedule(start);
    const ev = new JEventMatch({ dateTime: start.getIJDateTimeCreator(), calendar: cal, match });

    ev.execute();
    expect(match.isFinished).toBe(true);
    expect(match.result).toBeDefined();
  });
});
