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
 * ReOrderStageNode (ROR) — invierte el orden de DOS rankings de entrada.
 *
 * POR QUÉ EXISTE (ejemplo real, competiciones de confederación tipo UEFA):
 * en la Europa League, los terceros de los grupos de Champions "bajan" y juegan
 * un playoff previo a octavos contra los segundos de los grupos de Europa League;
 * recién luego los ganadores enfrentan a los primeros de los grupos de Europa
 * League.
 *
 * El problema: en el ranking global del torneo (el "sourceRank" con el que se
 * arma todo), los que vienen "primeros" de su grupo están ARRIBA. Pero para que
 * ese cruce funcione, los equipos entrantes (los que bajan) tienen que quedar
 * POR DEBAJO de los primeros de grupo del otro lado del cruce. Si no se invierte
 * el orden de esos dos rankings, el emparejamiento no puede formarse: los
 * "primeros" quedarían enfrentados entre sí en lugar de contra los entrantes.
 *
 * ReOrder resuelve esto intercambiando los dos rankings, de modo que el orden
 * relativo quede como lo necesita la ronda (los entrantes por debajo de los
 * locales), sin alterar el contenido de cada ranking.
 *
 * INVARIANTE: recibe exactamente 2 rankings (es una operación binaria de
 * intercambio).
 */
export class ReOrderStageNode extends NoneStageNode<ITableStageNodeData> {
  constructor(data: ITableStageNodeData, r: Ranking[]) {
    super(data, r)
    if (r.length !== 2) {
      throw new Error(`una ReOrderStageNode debe recibir exactamente 2 rankings de entrada (recibió ${r.length})`);
    }
  }

  /** Devuelve los dos rankings en orden inverso (intercambiados). */
  getRanksGroups(): Ranking[] {
    return [this.r[1], this.r[0]];
  }
}
