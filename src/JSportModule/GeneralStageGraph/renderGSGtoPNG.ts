import { renderToPNG } from "graphology-canvas/node";
import { GeneralStageGraph, NodeAttributes, PhaseNode } from "./GeneralStageGraph";
import { StageNode, IStageNodeData, RankGroupNode } from "./nodes";
import { TransferStageNode, TableStageNode } from "./NoneStageNode";
import { StageGroupNode, StagePlayoffNode } from "./RealStageNode";

export function renderGSGtoPNG(gsg: GeneralStageGraph) {
  try {
    // Configuración fija
    const STEP_SIZE = 50; // 50px por paso
    const STAGE_NODE_SIZE = 20;
    const RANK_NODE_SIZE = 10;
    const MARGIN = 30; // Margen alrededor del grafo

    // Calcular dimensiones del layout
    const mapPositions = new Map<string, { x: number, y: number }>()

    // Calcular pasos horizontales: ini + (stages + rankgroups) * phases + fin
    const horizontalSteps = 1 + (gsg.phases.length * 2) + 1;

    // Calcular máximo de nodos verticales en cualquier columna
    let maxVerticalNodes = 1; // Al menos ini/fin

    // Verificar nodos iniciales
    const initialTargets = gsg.getTargetNeigbhors(gsg.getNode('ini'));
    maxVerticalNodes = Math.max(maxVerticalNodes, initialTargets.length);

    // Verificar cada fase
    gsg.phases.forEach((pn: PhaseNode) => {
      maxVerticalNodes = Math.max(maxVerticalNodes, pn.stages.length);
      const rgArr = pn.getTargetRanksGroups();
      maxVerticalNodes = Math.max(maxVerticalNodes, rgArr.length);
    });

    // Calcular dimensiones del canvas
    const canvasWidth = horizontalSteps * STEP_SIZE + (MARGIN * 2);
    const canvasHeight = maxVerticalNodes * STEP_SIZE + (MARGIN * 2);

    console.log(`Canvas dimensions: ${canvasWidth}x${canvasHeight} (${horizontalSteps} horizontal steps, ${maxVerticalNodes} max vertical nodes)`);

    // Posicionamiento con coordenadas absolutas
    let currentX = MARGIN;

    // Posicionar nodo inicial (centrado verticalmente)
    const nd = gsg.getNode('ini');
    const centerY = canvasHeight / 2;
    mapPositions.set(nd.getId(), { x: currentX, y: centerY });
    currentX += STEP_SIZE;

    // Posicionar targets del nodo inicial
    const arr = gsg.getTargetNeigbhors(nd);
    if (arr.length > 0) {
      const startY = centerY - ((arr.length - 1) * STEP_SIZE) / 2;
      arr.forEach((value: NodeAttributes, idx: number) => {
        mapPositions.set(value.getId(), {
          x: currentX,
          y: startY + (idx * STEP_SIZE)
        });
      });
    }
    currentX += STEP_SIZE;

    // Posicionar cada fase y sus targets
    gsg.phases.forEach((pn: PhaseNode) => {
      // Posicionar stages de la fase
      if (pn.stages.length > 0) {
        const stageStartY = centerY - ((pn.stages.length - 1) * STEP_SIZE) / 2;
        pn.stages.forEach((sn: StageNode<IStageNodeData>, idx: number) => {
          mapPositions.set(sn.getId(), {
            x: currentX,
            y: stageStartY + (idx * STEP_SIZE)
          });
        });
      }
      currentX += STEP_SIZE;

      // Posicionar rank groups de la fase
      const rgArr = pn.getTargetRanksGroups();
      if (rgArr.length > 0) {
        const rgStartY = centerY - ((rgArr.length - 1) * STEP_SIZE) / 2;
        rgArr.forEach((value: NodeAttributes, idx: number) => {
          mapPositions.set(value.getId(), {
            x: currentX,
            y: rgStartY + (idx * STEP_SIZE)
          });
        });
      }
      currentX += STEP_SIZE;
    });

    // Posicionar nodo final (centrado verticalmente)
    mapPositions.set('fin', { x: currentX, y: centerY });

    // Asegurar que todos los nodos del grafo tengan posiciones
    console.log('Total nodes in graph:', gsg.graph.order);
    console.log('Positioned nodes:', mapPositions.size);

    // Asignar posiciones directamente a los nodos del grafo
    gsg.graph.forEachNode((nodeId: string, attributes: NodeAttributes) => {
      const position = mapPositions.get(nodeId);
      if (!position) {
        console.warn(`Node ${nodeId} not positioned, assigning default position`);
        mapPositions.set(nodeId, { x: 0, y: 0 });
      }

      // Asignar posición al nodo en el grafo (invertir Y para corregir orientación)
      const pos = mapPositions.get(nodeId)!;
      gsg.graph.setNodeAttribute(nodeId, 'x', pos.x);
      gsg.graph.setNodeAttribute(nodeId, 'y', canvasHeight - pos.y); // Invertir coordenada Y

      // Asignar color, tamaño y texto basado en el tipo
      let color = '#0A0A0A';
      let size = STAGE_NODE_SIZE; // Tamaño por defecto para stages
      let label = ''; // Texto del nodo

      const nodeIdStr = attributes.getId();
      if (nodeIdStr === 'ini') {
        color = '#29524A';
        size = STAGE_NODE_SIZE;
        label = 'INI';
      } else if (nodeIdStr === 'fin') {
        color = '#4E0110';
        size = STAGE_NODE_SIZE;
        label = 'FIN';
      } else if (attributes instanceof RankGroupNode) {
        color = '#06070E';
        size = RANK_NODE_SIZE; // Tamaño más pequeño para rank groups
        label = 'RG';
      } else if (attributes instanceof StageGroupNode) {
        color = '#03254E';
        size = STAGE_NODE_SIZE;
        label = 'GRP';
      } else if (attributes instanceof StagePlayoffNode) {
        color = '#6184D8';
        size = STAGE_NODE_SIZE;
        label = 'PLY';
      } else if (attributes instanceof TransferStageNode) {
        color = '#C5AFA0';
        size = STAGE_NODE_SIZE;
        label = 'TRF';
      } else if (attributes instanceof TableStageNode) {
        color = '#E9BCB7';
        size = STAGE_NODE_SIZE;
        label = 'TBL';
      }

      gsg.graph.setNodeAttribute(nodeId, 'color', color);
      gsg.graph.setNodeAttribute(nodeId, 'size', size);
      // Usar nombres de atributos estándar para etiquetas
      gsg.graph.setNodeAttribute(nodeId, 'label', label);
      // gsg.graph.setNodeAttribute(nodeId, 'labelColor', '#000000');
      // gsg.graph.setNodeAttribute(nodeId, 'labelSize', 18);
      // gsg.graph.setNodeAttribute(nodeId, 'type', 'circle');

      console.log(`Node ${nodeId} positioned at (${pos.x}, ${pos.y}) with color ${color}`);
    });

    console.log('All nodes positioned and styled');

    // Renderizar con dimensiones calculadas dinámicamente
    renderToPNG(gsg.graph, './graph.png', {
      width: canvasWidth,
      height: canvasHeight,
      nodes: {
        // Usar configuración más simple sin reducer personalizado
      },
      edges: {
        defaultColor: '#0A090C',
        reducer: () => {
          return {
            color: '#0A090C',
            size: 2
          };
        }
      }
    }, (error?: Error) => {
      if (error) {
        console.error('Error rendering graph:', error);
      } else {
        console.log(`Graph rendered successfully to ./graph.png (${canvasWidth}x${canvasHeight})`);
      }
    })

  } catch (error) {
    console.error('Error in renderGSGtoPNG:', error);
    console.log('Falling back to simple node positioning...');

    try {
      // Fallback: posicionar todos los nodos en una grilla simple
      const nodes = gsg.graph.nodes();
      const gridSize = Math.ceil(Math.sqrt(nodes.length));
      const FALLBACK_STEP = 50;
      const FALLBACK_MARGIN = 30;

      const fallbackWidth = gridSize * FALLBACK_STEP + (FALLBACK_MARGIN * 2);
      const fallbackHeight = gridSize * FALLBACK_STEP + (FALLBACK_MARGIN * 2);

      // Asignar posiciones de grilla directamente a los nodos
      nodes.forEach((nodeId, index) => {
        const x = (index % gridSize) * FALLBACK_STEP + FALLBACK_MARGIN;
        const y = Math.floor(index / gridSize) * FALLBACK_STEP + FALLBACK_MARGIN;

        gsg.graph.setNodeAttribute(nodeId, 'x', x);
        gsg.graph.setNodeAttribute(nodeId, 'y', y);
        gsg.graph.setNodeAttribute(nodeId, 'size', 15);

        const color = nodeId === 'ini' ? '#29524A' :
          nodeId === 'fin' ? '#4E0110' : '#0A0A0A';
        gsg.graph.setNodeAttribute(nodeId, 'color', color);

        // Agregar etiqueta simplificada para fallback
        const label = nodeId === 'ini' ? 'INI' :
          nodeId === 'fin' ? 'FIN' :
            nodeId.substring(0, 3).toUpperCase();
        gsg.graph.setNodeAttribute(nodeId, 'label', label);
      });

      renderToPNG(gsg.graph, './graph_fallback.png', {
        width: fallbackWidth,
        height: fallbackHeight,
        nodes: {
          reducer: (_, nodeId: string) => {
            const x = gsg.graph.getNodeAttribute(nodeId, 'x');
            const y = gsg.graph.getNodeAttribute(nodeId, 'y');
            const color = gsg.graph.getNodeAttribute(nodeId, 'color');
            const size = gsg.graph.getNodeAttribute(nodeId, 'size');
            const label = gsg.graph.getNodeAttribute(nodeId, 'label');

            return {
              x,
              y,
              color,
              size,
              label: label,
              labelColor: '#FFFFFF',
              labelSize: 6
            };
          }
        },
        edges: {
          defaultColor: '#0A090C',
          reducer: () => {
            return {
              color: '#0A090C',
              size: 1
            };
          }
        }
      }, (error?: Error) => {
        if (error) {
          console.error('Fallback rendering also failed:', error);
        } else {
          console.log(`Fallback graph rendered to ./graph_fallback.png (${fallbackWidth}x${fallbackHeight})`);
        }
      });
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
    }
  }
}