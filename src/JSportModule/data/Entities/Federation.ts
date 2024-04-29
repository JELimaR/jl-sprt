import { globalFinishedRankingsMap } from "../../../Tournament/Rank/globalFinishedRankingsMap";
import { ITournamentFromGSGData } from "../../GeneralStageGraph/tournamentFromGSG";
import { IRankItem, Ranking } from "../../Ranking";
import { ISportOrganizationData } from "../entities";
import Team from "../Team";
import { CATEGORIES, getCategoryList, TypeCategory, TypeCategoryList } from "../types";
import { Country } from "./GeogEntity";
import { Institution } from "./Institution";
import LeagueSystem, { CupSystem, ICupSystemCreator, IDivisionConfig, ILeagueSystemCreator } from "./LeagueSystem";
import SportOrganization, { ISportOrganizationCreator } from "./SportOrganization";

export interface IFederationData extends ISportOrganizationData {
  institutionIds: string[];
  leagueSystem: TypeCategoryList<ILeagueSystemCreator>;
  cupSystem: TypeCategoryList<ICupSystemCreator>;
  rankings: TypeCategoryList<string[]>
}

export interface IFederationCreator extends ISportOrganizationCreator<Country, Institution> {
  institutions: Institution[];
  leagueSystem: TypeCategoryList<ILeagueSystemCreator>;
  cupSystem: TypeCategoryList<ICupSystemCreator>;
  rankings: TypeCategoryList<Team[]>
}

export class Federation extends SportOrganization<Country, Institution> {

  // sistema de divisiones, definido por categoria
  private _leagueSystem: TypeCategoryList<LeagueSystem> = {};
  // sistema de torneos de copa, definido por categoria
  private _cupSystem: TypeCategoryList<CupSystem> = {};
  // cada categoria tiene un ranking
  private _rankings: TypeCategoryList<Team[]> = {}; //

  constructor(ifc: IFederationCreator) {
    super(ifc)
    ifc.institutions.forEach((ii) => {
      this.addMember(ii)
    })
    this._rankings = { S13: [], S15: [], S17: [], S19: [], S21: [], S23: [], S: [] };
    CATEGORIES.forEach((c: TypeCategory) => {
      const cupSystem_c = ifc.cupSystem[c]
      if (cupSystem_c)
        this._cupSystem[c] = new CupSystem(cupSystem_c)
      const leagueSystem = ifc.leagueSystem[c];
      if (leagueSystem)
        this._leagueSystem[c] = new LeagueSystem(leagueSystem);

      const ranking_c = ifc.rankings[c];
      if (ranking_c) {
        this._rankings[c] = [...ranking_c]
      }
    })
  }

  private getRankList(category: TypeCategory) {
    let rankList: Team[];
    if (this._rankings[category]) {
      rankList = [...this._rankings[category] as Team[]];
    } else {
      rankList = [];
    }
    return rankList
  }

  // la institution pasa a formar parte de una categoria, implica que empieza a competir en dicha categoria
  addInstitutionToCategory(inst: Institution, category: TypeCategory) {
    let rankList: Team[];
    if (this._rankings[category]) {
      rankList = this._rankings[category] as Team[];
    } else {
      rankList = [];
    }
    if (rankList) {
      if (rankList.includes(inst.getTeam(category)!)) {
        console.log(rankList, inst.id)
        throw new Error(`1 En Federation.addInstitutionToCategory`)
      } else {
        rankList.push(inst.getTeam(category)!);
      }
    } else {
      throw new Error(`2 En Federation.addInstitutionToCategory`)
    }
  }
  // se actualiza el sistema de ligas
  // actualizar el leaguesistem
  updateLeagueSystem(ls: LeagueSystem) {
    const category: TypeCategory = ls._category;
    let categoryTeams = this.getRankList(category);

    if (ls.getTeamsCount() > categoryTeams.length) {
      throw new Error(`El league system requiere: ${ls.getTeamsCount()} teams, mientras que
      para la categoria (${category}) hay "incriptos" un total de ${categoryTeams.length} teams.
      EN Federation.updateLeagueSystem`)
    }
    this._leagueSystem[category] = ls;
  }

  createTournamentList(): ITournamentFromGSGData[] {
    let out: ITournamentFromGSGData[] = []
    CATEGORIES.forEach((category: TypeCategory) => {
      const ls = this._leagueSystem[category];
      if (!!ls) {
        // hacer esto en LeagueSystem
        ls.getDivisionConfigList().forEach((idc: IDivisionConfig) => {
          out.push(idc.fromGSGData)
        })
        // out.push(...ls.getDivisionConfigList().map(idc => idc.fromGSGData))
      }
    })
    return out
  }

  //
  getRanking(category: TypeCategory): Ranking {
    let rankList: Team[] = this.getRankList(category);
    const out: IRankItem[] = rankList.map((team: Team, i: number) => {
      return {
        origin: this.id, pos: i + 1, team: team
      }
    })
    return Ranking.fromRankItemArr(`fr_${category}_${this.id}`, out)
  }

  // FALTA PULIR
  updateRanking(category: TypeCategory) {
    const ls = this._leagueSystem[category];
    const rankListCategory = this.getRankList(category)
    const teams: (Team | undefined)[] = [...Array(rankListCategory.length).keys()].map((_) => undefined)
    const divRankings: Ranking[] = []
    let pos = 0
    if (!!ls) {
      ls.getDivisionConfigList().forEach((idc: IDivisionConfig) => {
        const trank = globalFinishedRankingsMap.get('tr_' + idc.fromGSGData.gsgData.initialCreator.tournamentId)
        if (!!trank) {
          divRankings.push(trank)
        } else {
          throw new Error(`No se debe actualizar hasta el final de temporada`)
        }

      })

      ls.getDivisionConfigList().forEach((idc: IDivisionConfig, i: number) => {
        const NR = divRankings[i];
        const p = idc.condition.p
        const r = idc.condition.r

        NR.getRankTable().forEach((iri: IRankItem, iriIdx: number) => {
          // console.log(iri.team)
          const iripos = iriIdx + 1;
          // los que ascienden
          if (iripos <= p) {
            // console.log('pro', iripos, p)
            teams[pos - p] = iri.team;
          // los que desceienden
          } else if (iripos > NR.getGenericRankItems().length - r) {
            // console.log('rel', iripos, r)
            teams[pos + r] = iri.team;
          // los demas
          } else {
            teams[pos] = iri.team
          }

          pos++
        })
      })
      // console.log('--------------------------')
      // console.log('teams antes', teams)
      // console.log('rankListCategory', rankListCategory)
      for (let i = pos; i < rankListCategory.length; i++) {
        teams[i] = rankListCategory[i]
      }
      // console.log('teams despues', teams)
      // console.log('------------------------------------------------------')

      this.f2(Ranking.fromRankItemArr('F', teams.map((t, i) => {
        if (!t) {
          console.log(teams)
          throw new Error(`FALTA PULIR`)
        }
        return { origin: 's', pos: i + 1, team: t }
      })), category)
    }
  }

  // usar getRanking
  private f2(rank: Ranking, category: TypeCategory) {
    const rankList: Team[] = [...this.getRankList(category)]
    const teamsPrevList = [...rankList];
    const teamsArr = rank.getRankTable().map(iri => iri.team)
    for (let i = 0; i < teamsArr.length; i++) {
      // no se enceuntra una institucion con un id de teams
      const inst = this.members.get(teamsArr[i].id.split('-')[1])
      if (!!inst) {
        rankList[i] = inst.getTeam(category)!;
      } else {
        console.table(rank.getRankTable())
        console.log(inst, 'En updateRanking')
        throw new Error(``)
      }
    }
    // verifico que todos siguen estando
    teamsPrevList.forEach((elem: Team) => {
      if (!this.members.get(elem.id.split('-')[1])) {
        console.log(this._rankings[category]!.map(e => e.id.split('-')[1]))
        throw new Error(`en la lista de instituciones no se incluye el elemento: ${elem.id.split('-')[1]}.
        En Federation.updateRanking`)
      }
    })
  }

}