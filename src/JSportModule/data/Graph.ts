import { ITCCConfig } from "../../patterns/templateConfigCreator";

export abstract class Graph<N extends Node<ITCCConfig>, R extends Relation<N>> {
  nodes: Map<string, N> = new Map<string, N>();
  edges: Map<string, R> = new Map<string, R>();

  complete: boolean = false;

  existNode(nid: string): boolean {
    const out = this.nodes.get(nid);
    return !!out;
  }

  getNodeById(nid: string): N {
    const out = this.nodes.get(nid);
    if (!out)
      throw new Error(`No se encontro el node: ${nid}`);
    return out;
  }

  addNode(node: N) {
    // if (existingNode)
    //   throw new Error(`Ya existe un node con el id: ${node.config.idConfig}`);

    this.nodes.set(node.config.idConfig, node);
    this.updateRelations();
  }

  removeNode(node: N) {
    this.nodes.delete(node.config.idConfig);
    this.updateRelations();
  }

  abstract updateRelations(): void;

  /**
   * 
   * @param node aparece en el source de todos y se podrian ordenar
   */
  getDestinationsOfNode(node: N): N[] {
    let out: N[] = [];
    this.edges.forEach((r: R) => {
      if (r.source.config.idConfig == node.config.idConfig) {
        out.push(r.destiny);
      }
    })
    return out;
  }

  /**
   * 
   * @param node aparece en el destiny de todos
   */
  getSourcesOfNode(node: N): N[] {
    let out: N[] = [];
    this.edges.forEach((r: R) => {
      if (r.destiny.config.idConfig == node.config.idConfig) {
        out.push(r.source);
      }
    })
    return out;
  }

}

export interface INodeData<T extends ITCCConfig> {
  config: T;
  tid: string;
}
export class Node<T extends ITCCConfig> {
  private _data: INodeData<T>;
  nodeEdges: Relation<Node<T>>[] = [];
  constructor(data: INodeData<T>) {
    this._data = { ...data };
  }

  get config(): T { return this._data.config }
  get tid(): string { return this._data.tid }

  addEdge(rel: Relation<Node<T>>) {
    if (
      (rel.source._data.config.idConfig !== this.config.idConfig) &&
      (rel.destiny.config.idConfig !== this.config.idConfig)) {
      throw new Error(`No corresponde. StageNode.addEdge`)
    }
    this.nodeEdges.push(rel);
  }

  getData(): INodeData<T> {
    return { ...this._data }
  }

  getInfo() {

  }
}

export abstract class Relation<T extends Node<ITCCConfig>> {
  constructor(public source: T,
    public destiny: T,
    public season: 'toTheSame' | 'toTheNext') {
  }

}