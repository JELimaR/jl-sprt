import { describe, it, expect, beforeEach } from "vitest";
import { FootballProfile } from "../FootballProfile";
import FootballResult from "../FootballResult";
import { footballSortFunc } from "../FootballTeamTableItem";
import { reseedRandom } from "../../../Match/randomSource";
import Team, { TeamMatch } from "../../../data/Team";
import { IMatchCreationInfo } from "../../ISportProfile";

const SEED = 13;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
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

const profile = new FootballProfile();

// -----------------------------------------------------------------------------
// Simulación de un match completo (lifecycle + determinismo)
// -----------------------------------------------------------------------------
describe("FootballProfile - simulación de match", () => {
  beforeEach(() => reseedRandom(SEED));

  it("recorre created -> scheduled -> playing -> finished", () => {
    const match = profile.createMatch(matchInfo());
    expect(match.state).toBe('created');

    // start() exige estar scheduled
    expect(() => match.start()).toThrow(/none scheduled/);

    match.schedule(match.date);
    expect(match.state).toBe('scheduled');

    match.start();
    expect(match.state).toBe('playing');

    let guard = 0;
    while (match.state !== 'finished') {
      match.advance();
      if (++guard > 1000) throw new Error('match no terminó');
    }
    expect(match.state).toBe('finished');
    expect(match.isFinished).toBe(true);
  });

  it("es determinista: misma semilla -> mismo resultado", () => {
    const play = () => {
      reseedRandom(SEED);
      const m = profile.createMatch(matchInfo());
      m.schedule(m.date);
      m.start();
      while (m.state !== 'finished') m.advance();
      const r = m.result!;
      return { one: r.teamOneScore.score, two: r.teamTwoScore.score };
    };
    expect(play()).toEqual(play());
  });

  it("produce un resultado con ganador coherente (o empate si permitido)", () => {
    const match = profile.createMatch(matchInfo({ allowedDraw: true }));
    match.schedule(match.date);
    match.start();
    while (match.state !== 'finished') match.advance();

    const info = match.result!;
    if (info.teamOneScore.score > info.teamTwoScore.score) {
      expect(info.teamWinner).toBe('A');
      expect(info.teamLoser).toBe('B');
    } else if (info.teamOneScore.score < info.teamTwoScore.score) {
      expect(info.teamWinner).toBe('B');
      expect(info.teamLoser).toBe('A');
    } else {
      expect(info.teamWinner).toBe('none');
    }
  });
});

// -----------------------------------------------------------------------------
// updateTableFromResult — puntaje y puntuaciones
// -----------------------------------------------------------------------------
describe("FootballProfile - updateTableFromResult", () => {
  /** Construye un ResultInfo de un 2-1 (A local gana). */
  function result2_1() {
    const r = new FootballResult('A', 'B');
    r.addScore('A'); r.addScore('A'); r.addScore('B');
    return r.getResultInfo();
  }

  it("victoria: 3 puntos, gf/ga correctos", () => {
    const tti = profile.createTableItem(fakeTeam('A'), 'bs');
    profile.updateTableFromResult(tti, result2_1(), 'A');
    expect(tti.ps).toBe(3);     // 3*W
    expect(tti.gf).toBe(2);
    expect(tti.ga).toBe(1);
    expect(tti.W).toBe(1);
  });

  it("derrota: 0 puntos, gf/ga invertidos para el visitante", () => {
    const tti = profile.createTableItem(fakeTeam('B'), 'bs');
    profile.updateTableFromResult(tti, result2_1(), 'B');
    expect(tti.ps).toBe(0);
    expect(tti.gf).toBe(1);
    expect(tti.ga).toBe(2);
    expect(tti.L).toBe(1);
  });

  it("empate: 1 punto para cada uno", () => {
    const r = new FootballResult('A', 'B');
    r.addScore('A'); r.addScore('B'); // 1-1
    const info = r.getResultInfo();

    const a = profile.createTableItem(fakeTeam('A'), 'bs');
    const b = profile.createTableItem(fakeTeam('B'), 'bs');
    profile.updateTableFromResult(a, info, 'A');
    profile.updateTableFromResult(b, info, 'B');
    expect(a.ps).toBe(1);
    expect(b.ps).toBe(1);
    expect((a as any).D).toBe(1);
    expect((b as any).D).toBe(1);
  });

  it("acumula varios partidos", () => {
    const tti = profile.createTableItem(fakeTeam('A'), 'bs');
    profile.updateTableFromResult(tti, result2_1(), 'A'); // W 2-1
    profile.updateTableFromResult(tti, result2_1(), 'A'); // W 2-1
    expect(tti.ps).toBe(6);
    expect(tti.gf).toBe(4);
    expect(tti.ga).toBe(2);
    expect(tti.W).toBe(2);
  });
});

// -----------------------------------------------------------------------------
// footballSortFunc — desempates
// -----------------------------------------------------------------------------
describe("FootballProfile - ordenamiento (footballSortFunc)", () => {
  /** Item con partidos ya cargados para ordenar. isSE=false (liga). */
  function itemWith(id: string, results: { w: number; d: number; l: number; gf: number; ga: number }) {
    const tti = profile.createTableItem(fakeTeam(id), 'bs');
    for (let i = 0; i < results.w; i++) {
      const r = new FootballResult(id, 'x'); r.addScore(id);
      profile.updateTableFromResult(tti, r.getResultInfo(), id);
    }
    // ajustamos gf/ga finos aparte
    return tti;
  }

  it("ordena por puntos (ps) descendente", () => {
    const win = itemWith('WIN', { w: 2, d: 0, l: 0, gf: 0, ga: 0 }); // 6 pts
    const mid = itemWith('MID', { w: 1, d: 0, l: 0, gf: 0, ga: 0 }); // 3 pts
    const low = itemWith('LOW', { w: 0, d: 0, l: 0, gf: 0, ga: 0 }); // 0 pts
    const sorted = [low, mid, win].sort((a, b) => footballSortFunc(a, b, false));
    expect(sorted.map((i) => i.team.id)).toEqual(['WIN', 'MID', 'LOW']);
  });

  it("a igualdad de puntos, desempata por diferencia de gol (sg)", () => {
    // ambos 1 victoria (3 pts) pero distinta diferencia de gol
    const big = profile.createTableItem(fakeTeam('BIG'), 'bs');
    const small = profile.createTableItem(fakeTeam('SMALL'), 'bs');
    // BIG gana 3-0, SMALL gana 1-0
    const rBig = new FootballResult('BIG', 'x'); rBig.addScore('BIG'); rBig.addScore('BIG'); rBig.addScore('BIG');
    const rSmall = new FootballResult('SMALL', 'y'); rSmall.addScore('SMALL');
    profile.updateTableFromResult(big, rBig.getResultInfo(), 'BIG');
    profile.updateTableFromResult(small, rSmall.getResultInfo(), 'SMALL');

    expect(big.ps).toBe(small.ps); // mismos puntos
    const sorted = [small, big].sort((a, b) => footballSortFunc(a, b, false));
    expect(sorted.map((i) => i.team.id)).toEqual(['BIG', 'SMALL']); // BIG tiene mejor sg
  });
});

// -----------------------------------------------------------------------------
// Serie ida y vuelta (h&a) — acumula el resultado global
// -----------------------------------------------------------------------------
describe("FootballProfile - serie ida y vuelta", () => {
  beforeEach(() => reseedRandom(SEED));

  it("juega los 2 matches y resuelve un ganador (sin empate global)", () => {
    const serie = profile.createSerie({
      id: 'S1',
      teamOne: fakeTeam('A'),
      teamTwo: fakeTeam('B'),
      hws: [10, 12],
      season: 2000,
      opt: 'h&a',
    });
    expect(serie.matches.length).toBe(2);

    serie.matches.forEach((m) => {
      m.schedule(m.date);
      m.start();
      let guard = 0;
      while (m.state !== 'finished') {
        m.advance();
        if (++guard > 2000) throw new Error('match de serie no terminó');
      }
    });

    expect(serie.isFinished).toBe(true);
    // winner y loser son consistentes (no lanza, y son distintos)
    expect(serie.winner.id).not.toBe(serie.loser.id);
    expect(['A', 'B']).toContain(serie.winner.id);
  });
});
