import { IStageConfig, ITournamentConfig } from "./elementsConfig";
import { getStageSourceIds } from "./elementsDataFunc";
import { Graph, INodeData, Node, Relation } from "./Graph";

export class StageTournamentGraph extends Graph<StageTournamentNode, StageTournamentRelation> {
  updateRelations() {
    this.complete = true;
    this.nodes.forEach((node: Node<IStageConfig | ITournamentConfig>) => {
      const tconfig = node.config as ITournamentConfig;
      if (!!tconfig.phases) {
        // es stage
        const stage = node.config as IStageConfig;
        // if (node._data.tid !== '') {
        //   this.removeNode(node);

        // }
        const sourceIds = getStageSourceIds(stage).map(e => e.slice(3, 800)); // OJO

        sourceIds.forEach((sid: string) => {
          if (this.existNode(sid)) {
            // si el node existe, agrego la relation
            const source = this.getNodeById(sid);
            const relation: StageTournamentRelation = new StageTournamentRelation(
              source,
              node,
              'toTheSame' // FALTA VER ESTO
            );

            // node.addEdge(relation);
            // source.addEdge(relation);
            this.edges.set(`${source.config.idConfig}-${node.config.idConfig}`, relation);
          } else {
            // si no existe es porque el graph no está completo o porque se debe considerar un tournament
            
            this.complete = false;
          }
        })
      } else {
        // es tournament
      }
    })
  }


}

export interface IStageTournamentNodeData extends INodeData<IStageConfig | ITournamentConfig> {

}
export class StageTournamentNode extends Node<IStageConfig | ITournamentConfig> {

}

export class StageTournamentRelation extends Relation<StageTournamentNode> {

}