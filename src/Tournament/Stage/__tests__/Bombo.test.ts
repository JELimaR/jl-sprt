import { describe, it, expect, beforeEach } from "vitest";
import Bombo from "../Bombo";
import { reseedRandom } from "../../../JSportModule/Match/randomSource";

const SEED = 13;

// -----------------------------------------------------------------------------
// Capa 4 — Bombo (sorteo determinista)
//
// El Bombo baraja sus elementos usando la fuente de aleatoriedad compartida
// (randomFloat), de modo que con reseedRandom(seed) el sorteo es reproducible.
// -----------------------------------------------------------------------------

/** Vacía el bombo devolviendo todos sus elementos en orden de extracción. */
function drain<T>(b: Bombo<T>): T[] {
  const out: T[] = [];
  while (b.state !== 'finished') out.push(b.getNextElement());
  return out;
}

describe("Bombo - extracción", () => {
  beforeEach(() => reseedRandom(SEED));

  it("devuelve todos los elementos exactamente una vez (permutación)", () => {
    const elems = [1, 2, 3, 4, 5, 6];
    const b = new Bombo(elems);
    const out = drain(b);
    expect(out.length).toBe(elems.length);
    expect([...out].sort((a, z) => a - z)).toEqual(elems);
  });

  it("state pasa de reseted -> started -> finished", () => {
    const b = new Bombo([1, 2]);
    expect(b.state).toBe('reseted');
    b.getNextElement();
    expect(b.state).toBe('started');
    b.getNextElement();
    expect(b.state).toBe('finished');
  });

  it("lanza cuando ya no quedan elementos", () => {
    const b = new Bombo([1]);
    b.getNextElement(); // último -> finished
    expect(() => b.getNextElement()).toThrow();
  });
});

describe("Bombo - determinismo", () => {
  it("misma semilla -> mismo orden de extracción", () => {
    const build = () => {
      reseedRandom(SEED);
      return drain(new Bombo([1, 2, 3, 4, 5, 6, 7, 8]));
    };
    expect(build()).toEqual(build());
  });

  it("reset permite volver a sortear (nuevo shuffle desde 'reseted')", () => {
    reseedRandom(SEED);
    const b = new Bombo([1, 2, 3, 4]);
    const first = drain(b);
    b.reset();
    expect(b.state).toBe('reseted');
    reseedRandom(SEED);
    const second = drain(b);
    // con la misma semilla, el segundo sorteo reproduce el primero
    expect(second).toEqual(first);
  });
});
