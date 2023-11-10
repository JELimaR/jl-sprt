import graphology, { DirectedGraph } from "graphology";
import { ANode, FinalNode, IANodeData, IStageNodeData, RankGroupNode, StageNode } from "./nodes";
import { TableStageNode } from "./NoneStageNode";
import { StageGroupNode } from "./RealStageNode";

export type NodeAttributes = ANode<IANodeData>;

type EdgeAttributes = {}

type TYPE_IdOrAttr = unknown | NodeAttributes;

export class GeneralStageGraph /*extends DirectedGraph<NodeAttributes>*/ {
  _graph: DirectedGraph<NodeAttributes>;
  _phases: PhaseNode[] = [];
  constructor() {
    this._graph = new DirectedGraph<NodeAttributes>();
  }

  getNode(entry: TYPE_IdOrAttr): NodeAttributes {
    const id = entry instanceof ANode ? entry.getId() : entry;
    if (!this._graph.hasNode(id)) {
      throw new Error(`No existe nodo con id: ${id}`);
    }
    return this._graph.getNodeAttributes(id);
  }

  addNode(attributes: NodeAttributes): string {
    let out = this._graph.addNode(attributes.getId(), attributes);

    if (!(attributes instanceof RankGroupNode || attributes instanceof FinalNode)) {
      attributes.getRanksGroups().forEach((value: number, i: number) => {
        const rgn: RankGroupNode = new RankGroupNode({
          id: `r_${attributes.getId()}_${i + 1}`, nodeLvl: attributes.data.nodeLvl, gNumber: value,
        })
        this._graph.addNode(rgn.getId(), rgn);

        this.addDirectedEdge(attributes, rgn);
      })
    }

    return out;
  }

  /**
   * Devuelve en un arreglo los vecinos que son fuentes de target
   * @param target 
   */
  getSourceNeigbhors(targetEntry: TYPE_IdOrAttr): NodeAttributes[] {
    const target = this.getNode(targetEntry);
    let out: string[] = [];
    this._graph.directedNeighbors(target.getId()).forEach((dirNeig: string) => {
      if (this._graph.areOutNeighbors(dirNeig, target.getId())) {
        out.push(dirNeig);
      }
    })
    return out.map((id: string) => this.getNode(id));
  }

  getTargetNeigbhors(sourceEntry: TYPE_IdOrAttr):  NodeAttributes[] {
    const source = this.getNode(sourceEntry)
    let out: string[] = [];
    this._graph.directedNeighbors(source.getId()).forEach((dirNeig: string) => {
      if (this._graph.areOutNeighbors(source.getId(), dirNeig)) {
        out.push(dirNeig);
      }
    })
    return out.map((id: string) => this.getNode(id));
  }

  addDirectedEdge(sourceNode: NodeAttributes, targetNode: NodeAttributes/*, attributes?: EdgeAttributes | undefined*/): string {
    const source = sourceNode.getId();
    const target = targetNode.getId();
    if (!(this._graph.hasNode(source) && this._graph.hasNode(target))) {
      console.log('source', source, this._graph.hasNode(source));
      console.log('target', target, this._graph.hasNode(target));
      throw new Error(`source: ${source} y target: ${target}`);
    }

    // const sourceNode = this._graph.getNodeAttributes(source);
    // const targetNode = this._graph.getNodeAttributes(target);

    const sourceIsRGN = sourceNode instanceof RankGroupNode;
    const targetIsRGN = targetNode instanceof RankGroupNode;

    if (sourceIsRGN == targetIsRGN) {
      throw new Error(`source y target son del mismo tipo`);
    }

    // si el source es el rank group entonces debe tener solo 1 target
    if (sourceIsRGN) {
      // const targets = this.getTargetNeigbhors(sourceNode);
      // this._graph.outDegree(source)
      if (this._graph.outDegree(source) > 0) {
        throw new Error(`source: ${source} es rankgroup y ya tiene al menos un target`)
      }
    }
    if (targetIsRGN) {
      const sources = this.getSourceNeigbhors(targetNode);
      if (sources.length > 0) {
        throw new Error(`target: ${target} es rankgroup y ya tiene al menos un source: ${source}`)
      }
    }

    // si el targetNode es TableStageNode, el source debe "venir" de un StageGroupNode
    if (targetNode instanceof TableStageNode) {
      const sourceSources = this.getSourceNeigbhors(sourceNode);
      sourceSources.forEach((dirNeig: NodeAttributes) => {
        if (dirNeig instanceof StageGroupNode)
          throw new Error(`dn: ${dirNeig.getId()} source: ${source} target: ${target}`)
      })
    }
    // let ok = true;

    // if (!sourceAtributes.isStage) {
    //   // si source es rank, entonces ambos deben ser del mismo tipo
    //   if (sourceAtributes.type != targetAtributes.type) {
    //     throw new Error(``);
    //   }
    //   // si source es rank del tipo E, entonces el target que es un stage debe tener un level mayor
    //   if (sourceAtributes.type == 'E') {
    //     if (sourceAtributes.sLevel >= targetAtributes.sLevel) {
    //       throw new Error(``);
    //     } else {
    //       if (sourceAtributes.sLevel !== targetAtributes.sLevel) {
    //         throw new Error(``);
    //       }
    //     }
    //   }
    //    // si source es rank del tipo Q, entonces el target que es un stage debe ser de subtype stg o non
    //    if (sourceAtributes.type == 'Q') {
    //      const stage = targetAtributes as IStageNode;
    //      if (stage.subType == 'tab') {
    //        throw new Error(``)
    //      }
    //    }
    // } else {
    //   // si source es stage

    // }


    return this._graph.addDirectedEdge(sourceNode.getId(), targetNode.getId()/*, attributes*/);
  }

  forEachDirectedEdgeCustom(callBackFunc: (sourceAtributes: NodeAttributes, targetAtributes: NodeAttributes) => void) {
    this._graph.forEachDirectedEdge((edge: string, attr: EdgeAttributes, source: string, target: string) => {
      const sourceAtributes = this._graph.getNodeAttributes(source);
      const targetAtributes = this._graph.getNodeAttributes(target);
      callBackFunc(sourceAtributes, targetAtributes);
    })
  }

}

export class PhaseNode {
  constructor(
    public phaseNumber: number,
    public stages: StageNode<IStageNodeData>[],
    public graph: GeneralStageGraph,
  ) {
    stages.forEach((sn: StageNode<IStageNodeData>) => {
      graph.getNode(sn);
    })
    this.graph._phases.push(this);

  }
  getTargetRanksGroups() {
    const out: RankGroupNode[] = [];
    this.stages.forEach((sn: StageNode<IStageNodeData>) => {
      const rgArr = this.graph.getTargetNeigbhors(sn);
      rgArr.forEach((rg: NodeAttributes) => {
        // const rg = this.graph.getNodeAttributes(value);
        out.push(rg as RankGroupNode)
      })
    })
    return out;
  }
  getSourceRanksGroups() {
    const out: RankGroupNode[] = [];
    this.stages.forEach((stageNode: StageNode<IStageNodeData>) => {
      const rgArr = this.graph.getSourceNeigbhors(stageNode);
      rgArr.forEach((rg: NodeAttributes) => {
        // const rg = this.graph.getNodeAttributes(value);
        out.push(rg as RankGroupNode)
      })

    })

    return out;
  }
}

/****************************************************************************************************
 * 
 * @param gsg 
 */
function f(gsg: GeneralStageGraph) {
  gsg.forEachDirectedEdgeCustom((s: NodeAttributes, t: NodeAttributes) => {
    console.log('s', s);
    console.log('t', t);
  })
}