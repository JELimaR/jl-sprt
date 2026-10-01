import { Ranking } from "../Ranking";
import { IStageNodeData, StageNode } from "./nodes";

/**
 * NoneStageNode — nodos de PROCESAMIENTO del grafo (no se juega nada en ellos).
 *
 * A diferencia de los RealStageNode (grupos, playoff), estos nodos no generan
 * partidos ni consumen tiempo: solo reorganizan el flujo de rankings entre
 * etapas. Por eso `getHwsNumber()` (cantidad de half-weeks / fechas que ocupan)
 * es siempre 0.
 *
 * Reciben en el constructor los rankings de entrada (`r`) porque su salida se
 * calcula directamente a partir de ellos (no dependen de resultados de partidos).
 */
export abstract class NoneStageNode<D extends IStageNodeData> extends StageNode<D> {

  constructor(data: D, public r: Ranking[]) {
    super(data);
  }

  /** Los nodos de procesamiento son instantáneos: no ocupan fechas del calendario. */
  getHwsNumber(): number {
    return 0;
  }
}

export interface ITableStageNodeData extends IStageNodeData {
  /** Cantidad de clasificados (los primeros `qNumber` del ranking de entrada). */
  qNumber: number;
}

/**
 * TableStageNode (TBL) — divide UN ranking en dos: clasificados y eliminados.
 *
 * Toma el ranking de entrada y lo parte en:
 *   - los primeros `qNumber` (clasifican / siguen), y
 *   - el resto (quedan eliminados / bajan).
 *
 * Uso típico: tras una fase de grupos, "cortar" la tabla combinada para que solo
 * los mejores avancen (ej. de 16 quedan 8). El segundo grupo puede seguir a otra
 * rama del torneo (repechaje, etc.) o simplemente terminar.
 *
 * INVARIANTE: `qNumber < participants`. Si fuera `qNumber >= participants`, el
 * segundo grupo quedaría vacío y el nodo no dividiría nada: en ese caso sería
 * equivalente a un TransferStageNode (transferencia directa), por lo que no
 * tendría sentido usar un TableStageNode.
 */
export class TableStageNode extends NoneStageNode<ITableStageNodeData> {
  constructor(data: ITableStageNodeData, r: Ranking[]) {
    super(data, r)
    // qNumber debe ser estrictamente menor que participants para que el corte
    // produzca DOS grupos no vacíos (si no, es una transferencia disfrazada).
    if (data.qNumber >= data.participants) {
      throw new Error(`en una TableStageNode el qNumber ${data.qNumber} debe ser menor al numero de participants ${data.participants} ` +
        `(de lo contrario el segundo grupo queda vacío y equivale a un TransferStageNode)`);
    }
    // Divide exactamente 1 ranking (no tiene sentido "cortar" dos tablas a la vez).
    if (r.length !== 1) {
      throw new Error(`una TableStageNode debe recibir exactamente 1 ranking de entrada (recibió ${r.length})`);
    }
  }

  /**
   * Devuelve [clasificados, eliminados]:
   *   - clasificados = las primeras `qNumber` posiciones del ranking de entrada.
   *   - eliminados   = el resto.
   */
  getRanksGroups(): Ranking[] {
    const firsts = this.r[0].getInterface().items.slice(0, this.data.qNumber);
    const lasts = this.r[0].getInterface().items.slice(this.data.qNumber);

    return [
      Ranking.fromTypeRanking({
        ...this.r[0].getInterface(),
        items: firsts,
      }),
      Ranking.fromTypeRanking({
        ...this.r[0].getInterface(),
        items: lasts,
      })
    ]
  }

}

/**
 * TransferStageNode (TRF) — transferencia directa, sin modificar nada.
 *
 * Pasa sus rankings de entrada tal cual a la salida. Sirve para "cablear" el
 * flujo del grafo: cuando una rama tiene que llegar a la siguiente fase sin
 * jugar (ni cortar, ni reordenar). Es el nodo de procesamiento más simple.
 */
export class TransferStageNode extends NoneStageNode<IStageNodeData> {
  getRanksGroups(): Ranking[] {
    return this.r;
  }
}

/**
 * ReOrderStageNode (ROR) — reordena la LISTA de rank groups (intercambia 2).
 *
 * CONTEXTO IMPRESCINDIBLE: el GSG rutea los rank groups de forma POSICIONAL y
 * CONSECUTIVA. Cada stage de la fase siguiente consume un BLOQUE CONTIGUO de la
 * lista ordenada de rank groups que produjo la fase anterior (ver
 * createPhaseNodes: toma `count` rank groups consecutivos por índice). No hay
 * ruteo por identidad: lo único que determina qué grupos caen juntos en un stage
 * es su POSICIÓN en la lista.
 *
 * POR QUÉ EXISTE: justamente porque el consumo es consecutivo, dos rank groups
 * que NO están adyacentes en la lista no pueden terminar en el mismo stage. La
 * única forma de juntarlos (o de separarlos de su vecino actual) es CAMBIAR SU
 * POSICIÓN en la lista ANTES de que el siguiente stage la consuma. Para eso
 * existe este nodo: intercambia el orden de dos rank groups adyacentes de modo
 * que el bloque contiguo que tomará el stage siguiente sea el deseado.
 *
 * Es una operación puramente ESTRUCTURAL sobre el orden de la lista, no sobre el
 * "mérito deportivo" de los equipos. No altera el contenido de cada rank group,
 * solo su posición relativa en la lista.
 *
 * Restricción (Principio B / verifyNoRecross): como reOrder es el único nodo que
 * rompe el orden global, solo es legítimo cuando una de sus dos fuentes es
 * EXTERNA al torneo (torneo acoplado). Reordenar dos ramas internas ya separadas
 * sería re-cruzar ramas (prohibido).
 *
 * INVARIANTE: recibe exactamente 2 rank groups (intercambio binario).
 */
export class ReOrderStageNode extends NoneStageNode<ITableStageNodeData> {
  constructor(data: ITableStageNodeData, r: Ranking[]) {
    super(data, r)
    if (r.length !== 2) {
      throw new Error(`una ReOrderStageNode debe recibir exactamente 2 rankings de entrada (recibió ${r.length})`);
    }
  }

  /**
   * Emite los dos rank groups con su posición intercambiada en la lista, para
   * que el consumo consecutivo posterior empareje el bloque deseado.
   */
  getRanksGroups(): Ranking[] {
    return [this.r[1], this.r[0]];
  }
}
