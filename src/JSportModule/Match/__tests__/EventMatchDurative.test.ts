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
    name: id,
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

// Modelo emergente: cada advance() = 1 intervalo (5 min de juego). La duración del
// partido EMERGE de la simulación (no se declara). `maxReasonable` es un tope holgado
// para verificar que termina en una cantidad realista de intervalos (no 15 horas).
const PROFILES: { name: string; profile: ISportProfile<any, any, any, any>; maxReasonable: number }[] = [
  { name: 'football', profile: new FootballProfile(), maxReasonable: 40 },       // ~90 min → ~18 int
  { name: 'volleyball', profile: new VolleyballProfile(), maxReasonable: 80 },    // ~4 rallies/int
  { name: 'americanFootball', profile: new AmericanFootballProfile(), maxReasonable: 60 },
];

describe.each(PROFILES)('JEventMatch durativo - profile $name', ({ profile, maxReasonable }) => {
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

  it('el partido termina en una cantidad REALISTA de intervalos (no 15 horas)', () => {
    const { cal, ev, match } = setup();
    // Avanzar hasta un tope holgado pero realista: debe haber terminado dentro de él.
    cal.advanceIntervals(1 + maxReasonable);
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

describe('Descansos', () => {
  beforeEach(() => reseedRandom(SEED));

  function driveMatch(profile: ISportProfile<any, any, any, any>) {
    const base = JDateTime.createFromDayOfYearAndYear(1, 2000);
    const match = profile.createMatch(matchInfo({ allowedDraw: false }));
    const start = base.copy();
    start.addInterv(1);
    match.schedule(start);
    match.start();
    return match;
  }

  it('football: hay un entretiempo (un intervalo sin avanzar el tiempo de juego)', () => {
    const match = driveMatch(new FootballProfile());
    let sawPause = false;
    let guard = 0;
    while (match.state !== 'finished' && guard < 200) {
      const before = match['_playing'].time;
      match.advance();
      // pausa = el partido sigue jugándose pero el tiempo de juego no avanzó
      if (match.state === 'playing' && match['_playing'].time === before) {
        sawPause = true;
      }
      guard++;
    }
    expect(sawPause).toBe(true);
  });

  it('vóley: activa un descanso entre sets (breakLeft > 0 tras cerrar un set)', () => {
    const match = driveMatch(new VolleyballProfile());
    const play = match['_playing'];

    let sawBreakActivated = false;
    let guard = 0;
    while (match.state !== 'finished' && guard < 500) {
      match.advance();
      // Tras un advance que cerró un set (partido en curso), el mecanismo deja pendiente
      // al menos un intervalo de descanso.
      if (match.state === 'playing' && play['_breakLeft'] > 0) {
        sawBreakActivated = true;
      }
      guard++;
    }
    expect(sawBreakActivated).toBe(true);
  });
});
