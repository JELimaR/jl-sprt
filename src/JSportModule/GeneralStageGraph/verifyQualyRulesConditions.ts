import { Ranking } from "../Ranking";
import { GeneralStageGraph } from "./GeneralStageGraph";

/**
   * QualyRulesSets
   * Sea una QRS, defino una lista listQRS
   * Por otro lado tengo listas de RankGroups finales que llamo listRG
   * Para cada elemento e de listQRS, se debe verificar a que RG pertenece, digamos RGe
   * Se crea ahora un conjunto com todos los elementos de cada RGe. Ese conjunto debe contener
   * los mismos elementos que contiene la listQRS
   * ‐------------------------------------------------------
   * * * * * Algoritmo * * * * 
   * para cada e en listQRS
   * Hallar RGe y agregar sus elementos a un conjunto ComparatorSet
   */
export function verifyQualyRulesConditions(gsg: GeneralStageGraph, qualyRules: { minRankPos: number, maxRankPos: number }[]) {
  const finalRankingsArray: Ranking[] = gsg.getFinalRankings()
  const listRankGroupSets: Set<number>[] = [];
  let elementsCount = 0;
  finalRankingsArray.forEach((ranking: Ranking) => {
    const rlist = new Set<number>()
    ranking.getGenericRankItems().forEach((_) => {
      elementsCount++
      rlist.add(elementsCount)
    })
    listRankGroupSets.push(rlist)
  })
  // verifico cada qualyRule
  qualyRules.forEach((q: { minRankPos: number; maxRankPos: number; }) => {
    if (q.minRankPos < 1 || q.minRankPos > elementsCount || q.minRankPos > q.maxRankPos || q.maxRankPos > elementsCount) {
      throw new Error(`La qualyRule: {min: ${q.minRankPos}, max: ${q.maxRankPos}} no se puede aplicar al
        tournament: ${gsg.id} porque exede el tamaño del mismo: (${elementsCount}).
        En verifyQualyRulesConditions`)
    }
    verifyQualyRule(q, listRankGroupSets)
  })
}

function verifyQualyRule(qualyRule: { minRankPos: number, maxRankPos: number }, listRankGroupSets: Set<number>[]) {

  const ComparetorSet = new Set<number>()
  const listQRS = [];
  // para cada e en listQRS
  for (let e = qualyRule.minRankPos; e <= qualyRule.maxRankPos; e++) {
    listQRS.push(e)
    // Hallar RGe
    let RGe: Set<number> | undefined = undefined
    for (let i = 0; i < listRankGroupSets.length && !RGe; i++) {
      const RG = listRankGroupSets[i];
      if (RG.has(e))
        RGe = RG
    }
    // agregar sus elementos a un conjunto ComparatorSet
    if (RGe) {
      RGe.forEach(v => ComparetorSet.add(v))
    } else {
      console.log(listRankGroupSets)
      throw new Error(`No se encontró RGe para ${e}
      En verifyQualyRulesConditions.verifyQualyRule`)
    }
  }
  // verificó que son iguales listQRS y ComparetorSet
  if (listQRS.length !== ComparetorSet.size) {
    console.log('ComparetorSet', ComparetorSet)
    console.log('qualyRule', qualyRule)
    throw new Error(`la qualyRule no cumple con la condicion de estar compuesta por la union de rankGroups
    En verifyQualyRulesConditions.verifyQualyRule`)
  }
}