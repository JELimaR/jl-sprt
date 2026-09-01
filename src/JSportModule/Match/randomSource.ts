import { RandomNumberGenerator } from "jl-utlts";

/**
 * Fuente de aleatoriedad compartida para la simulación de partidos.
 *
 * Envuelve el generador determinista de jl-utlts (RandomNumberGenerator).
 * Por defecto se siembra con una semilla basada en el tiempo actual, de modo
 * que el comportamiento es efectivamente aleatorio en ejecución normal.
 *
 * Para tests reproducibles, llamar `reseedRandom(seed)` antes de simular:
 * la misma semilla siempre produce la misma secuencia de resultados.
 */
let _randomFloat: () => number = RandomNumberGenerator.makeRandomFloat(Date.now());

/**
 * Devuelve un número pseudoaleatorio en el rango [0, 1).
 * Reemplaza a Math.random() en la simulación, permitiendo reproducibilidad.
 */
export function randomFloat(): number {
  return _randomFloat();
}

/**
 * Reinicia la fuente de aleatoriedad con una semilla determinada.
 * La misma semilla produce siempre la misma secuencia (útil para tests).
 */
export function reseedRandom(seed: number): void {
  _randomFloat = RandomNumberGenerator.makeRandomFloat(seed);
}
