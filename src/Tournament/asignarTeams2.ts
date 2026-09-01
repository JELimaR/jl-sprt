
import { Ranking, IGenericRankItem, TypeRanking } from "../JSportModule";
import Team from "../JSportModule/data/Team";
import { SimulationContext } from "./SimulationContext";
import Tournament from "./Tournament";

/**
 * MOEVER ESTA FUNCION
 * @param tournament
 * @param ctx contexto de simulación (provee el store de rankings)
 */

export const asignarTeams2 = (tournament: Tournament, ctx: SimulationContext) => {
  const items: IGenericRankItem[] = [];
  const teams: Team[] = [];
  const gsg = tournament.graph;
  // asignar teams
  const iniRankings = gsg.getInitialRankings()
  iniRankings.forEach(v => v.getGenericRankItems().forEach(it => items.push(it)))
  console.log('iniRankings', iniRankings.map(v => v.getGenericRankItems()))
  console.log(items)

  tournament.qualyGenericRankItemList.forEach((igri: IGenericRankItem) => {
    const sourceRanking = ctx.store.get(igri.origin);
    if (!sourceRanking) {
      console.log(ctx.store.keys())
      console.log(igri.origin)
      throw new Error(``);
    }

    const team = sourceRanking.getFromPosition(igri.pos).team;
    teams.push(team);

  })

  // gsg.getQualyRankList().forEach((igri: IGenericRankItem) => {
  //   const sourceRanking = globalFinishedRankingsMap.get(igri.origin);
  //   if (!sourceRanking) {
  //     console.log(globalFinishedRankingsMap.keys())
  //     console.log(igri.origin)
  //     throw new Error(``);
  //   }

  //   const team = sourceRanking.getFromPosition(igri.pos).team;
  //   teams.push(team);

  // })

  // const ini_ttiidd_ranking = iniRankings[0].getInterface();
  // ini_ttiidd_ranking.items = [];
  // iniRankings.forEach((rank: Ranking, ri: number) => {
  //   console.log(ri, rank);
  //   const teams: Team[] = [];
  //   rank.getGenericRankItems().forEach((value: IGenericRankItem, index: number) => {
  //     const sourceItem = gsg.getQualyRankList()[currIdx];

  //     console.log('valueItem', value);
  //     console.log('sourceItem', sourceItem);

  //     const sourceRanking = globalFinishedRankingsMap.get(sourceItem.origin);
  //     if (!sourceRanking) {
  //       console.log(globalFinishedRankingsMap.keys())
  //       console.log(sourceItem.origin)
  //       throw new Error(``);
  //     }

  //     const team = sourceRanking.getFromPosition(sourceItem.pos).team;
  //     teams.push(team);

  //     currIdx++;
  //   })

  //   rank.addTeams(teams);
  //   ini_ttiidd_ranking.items.push(...rank.getGenericRankItems())
  //   ini_ttiidd_ranking.teams.push(...teams)

  // })
  // console.log(teams.length)
  // teams.pop()
  // console.log(teams.length === items.length)
  let out = Ranking.fromTypeRanking({
    context: `ini_${tournament.config.idConfig}`,
    items: items,
    teams: teams,
  });
  // console.log(out.getInterface())
  // throw new Error(`stop`)
  ctx.store.set(out.context, out)
}