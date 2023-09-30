import graphology, { DirectedGraph } from "graphology";
import { IGenericRank } from "../JSportModule/interfaces";
import { ANode, IANodeData } from "./nodes";
// IGenericTable?

export type NodeAttributes = ANode<IANodeData>;

type EdgeAttributes = {}

export class GeneralStageGraph extends DirectedGraph<NodeAttributes> {

  addNode(node: unknown, attributes: NodeAttributes): string {
    return super.addNode(node, attributes);
  }

  addDirectedEdge(source: unknown, target: unknown, attributes?: EdgeAttributes | undefined): string {
    // let ok = true;
    // if (!(this.hasNode(source) && this.hasNode(target))) {
    //   // ambos deben existir
    //   throw new Error();
    // }
    // const sourceAtributes = this.getNodeAttributes(source);
    // const targetAtributes = this.getNodeAttributes(target);

    // // no pueden ambos ser stages
    // if (sourceAtributes.isStage && targetAtributes.isStage) {
    //   throw new Error();
    // }

    // // no pueden ambos ser ranks
    // if (!sourceAtributes.isStage && !targetAtributes.isStage) {
    //   throw new Error();
    // }

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


    return super.addDirectedEdge(source, target, attributes);
  }

  forEachDirectedEdgeCustom(callBackFunc: (sourceAtributes: NodeAttributes, targetAtributes: NodeAttributes) => void) {
    super.forEachDirectedEdge( (edge: string, attr: EdgeAttributes, source: string, target: string) => {
      const sourceAtributes = this.getNodeAttributes(source);
      const targetAtributes = this.getNodeAttributes(target);
      callBackFunc(sourceAtributes, targetAtributes);
    })
  }

}

function f(gsg: GeneralStageGraph) {
  gsg.forEachDirectedEdgeCustom((s: NodeAttributes, t: NodeAttributes) => {
    console.log('s', s);
    console.log('t', t);
  })
}