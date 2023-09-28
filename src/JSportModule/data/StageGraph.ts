import { sizeGeneric } from "../interfaces";
import { IStageConfig } from "./elementsConfig";
import { getStageGenericRank, getStageGenericSource, getStageSourceIds } from "./elementsDataFunc";
import { Graph, INodeData, Node, Relation } from "./Graph";

export class StageGraph extends Graph<StageNode, StageRelation> {

  updateRelations() {
    this.complete = true;
    this.edges.clear();
    this.nodes.forEach((node: StageNode) => {
      const sourceIds = getStageSourceIds(node.config).map(e => e.slice(3, 800)); // OJO

      sourceIds.forEach((sid: string) => {
        if (this.existNode(sid)) {
          // si el node existe, agrego la relation
          const source = this.getNodeById(sid);
          const relation: StageRelation = new StageRelation(
            source,
            node,
            'toTheSame' // FALTA VER ESTO
          );
          relation.verifyStageRelation();
          // node.addEdge(relation);
          // source.addEdge(relation);
          this.edges.set(`${source.config.idConfig}-${node.config.idConfig}`, relation);
        } else {
          // si no existe es porque el graph no está completo
          this.complete = false;
        }
      })
    })
  }

  /**
   * Devuelve para cada tournament un array ordenado de StageNodes que son el "destino" de la entrada node.
   * En otras palabras, indica a "donde" se clasifican el GenericRankItems de la stage que representa node.
   * @param node 
   */
  getDestinationsOfNodeByTournament(node: StageNode): Map<string, StageNode[]> {
    let out = new Map<string, StageNode[]>();
    let destinations: StageNode[] = this.getDestinationsOfNode(node);
    // destinations.sort((a,b) => a.tid < b.tid ? -1 : 1);
    destinations.forEach((value: StageNode) => {
      if (!out.get(value.getData().tid)) out.set(value.getData().tid, []);
      const list: StageNode[] = out.get(value.tid)!;
      list.push(value);

    }) 

    out.forEach((nodeArr: StageNode[]) => {
      nodeArr.sort((a,b) => {
        const aa = a.config.qualifyConditions.find(e => e.rankId.slice(3,800) == node.config.idConfig)!;
        const bb = b.config.qualifyConditions.find(e => e.rankId.slice(3,800) == node.config.idConfig)!;
        return aa.minRankPos - bb.maxRankPos;
      })
    })


    return out;
  }

}

interface IStageNodeData extends INodeData<IStageConfig> {  };

export class StageNode extends Node<IStageConfig> {  }

export class StageRelation extends Relation<StageNode> {

  verifyStageRelation() {
    const sourceConfig = this.source.config;
    const destinyConfig = this.destiny.config;
    // la stage source debe ser una de las source de destiny
    const includes = getStageSourceIds(destinyConfig).includes(`sr_${sourceConfig.idConfig}`); // OJO
    if (!includes) {
      throw new Error(`la stage source: ${sourceConfig.idConfig} debe ser una de las source
      de la stage destiny ${destinyConfig.idConfig}. (StageRelation.verifyStageRelation)`)
    }
    // la source debe terminar antes de que empiece la destiny
    if (sourceConfig.hwEnd >= destinyConfig.hwStart) {
      throw new Error(`la stage source: ${sourceConfig.idConfig} debe terminar antes 
      de que empiece la stage destiny ${destinyConfig.idConfig}. (StageRelation.verifyStageRelation)`)
    }
    // el tamaño del GenericRank de la stage source debe ser menor al mayor item de la GenericSourceItem de la stage destiny
    const grLen = sizeGeneric(getStageGenericRank(sourceConfig));
    const SOURCEListOfS = getStageGenericSource(destinyConfig).list.filter(item => item.origin == `sr_${sourceConfig.idConfig}`);
    if (SOURCEListOfS.length == 0) {
      console.log(this);
      console.log('getStageGenericSource(destinyConfig).list', getStageGenericSource(destinyConfig).list);
      throw new Error(`la stage source: ${sourceConfig.idConfig} debe ser una de las source
      de la stage destiny ${destinyConfig.idConfig}. (StageRelation.verifyStageRelation).
      GenericSource.list of items no tiene elementos.`);
    }
    const gsMaxPos = SOURCEListOfS[SOURCEListOfS.length - 1].pos;
    if (grLen < gsMaxPos) {
      console.log('SOURCEListOfS[SOURCEListOfS.length - 1]', SOURCEListOfS[SOURCEListOfS.length - 1])
      throw new Error(`el tamaño (${grLen}) del GenericRank de la stage source: ${sourceConfig.idConfig} debe ser mayor
      al mayor item pos (${gsMaxPos}) del GenericSource de la stage destiny ${destinyConfig.idConfig}. (StageRelation.verifyStageRelation)`)
    }
  }
}