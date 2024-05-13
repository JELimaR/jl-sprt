import { IDivisionCondition } from ".";
import { globalFinishedRankingsMap } from "../../../Tournament/globalFinishedRankingsMap";
import { ITournamentFromGSGData } from "../../GeneralStageGraph/tournamentFromGSG";
import { IGenericRankItem, IRankItem, Ranking } from "../../Ranking";
import Team from "../Team";
import { CATEGORIES, getCategoryList, TypeCategory, TypeCategoryList } from "../types";
import { Country } from "./GeogEntity";
import { Institution } from "./Institution";
import LeagueSystem, { CupSystem, ICupSystemCreator, IDivisionConfig, ILeagueSystemCreator } from "./LeagueSystem";
import SportOrganization, { ISportOrganizationCreator, ISportOrganizationData } from "./SportOrganization";

export interface IFederationData extends ISportOrganizationData {
  insts: string[];
  lSys: TypeCategoryList<ILeagueSystemCreator>;
  cSys: TypeCategoryList<ICupSystemCreator>;
  rnks: TypeCategoryList<string[]>
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

  getDivTourId(category: TypeCategory, level: number): string {
    if (0 >= level && level >= 100) {
      throw new Error(`
      En Federation.getDivTourId`)
    }
    return `${category}_${this.id}_D${String(level).padStart(2, '0')}`
  }
  getDivGenericRank(category: TypeCategory, conditions: IDivisionCondition[]) {
    let out: Array<IGenericRankItem[]> = [];
    let pos = 0;
    const IGRIList = this.getRanking(category).getGenericRankItems();
    conditions.forEach((cond: IDivisionCondition) => {
      const items: IGenericRankItem[] = []
      for (let i = pos; i < pos + cond.N && i < IGRIList.length; i++) {
        items.push(IGRIList[i])
      }
      if (items.length !== cond.N) {
        console.log(IGRIList.length)
        console.log(items.length)
        console.log(cond)
        throw new Error(`
        En Federation.getDivGenericRank`)
      }
      out.push(items)
      pos += cond.N
    })
    return out;
  }

  private getRankList(category: TypeCategory): Team[] {
    let out: Team[];
    const rankList = this._rankings[category]
    if (rankList) {
      out = [...rankList];
    } else {
      out = [];
    }
    return out
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
    const category: TypeCategory = ls.category;
    let franking = this.getRanking(category)
    let categoryTeams = this.getRankList(category);

    if (ls.getTeamsCount() > franking.size) {
      throw new Error(`El league system requiere: ${ls.getTeamsCount()} teams, mientras que
      para la categoria (${category}) hay "incriptos" un total de ${franking.size} teams.
      En Federation.updateLeagueSystem`)
    }
    ls.getGenericRankOrdered().forEach((igri: IGenericRankItem, idx: number) => {
      const item = franking.getGenericRankItems()[idx]
      if (!(item.origin == igri.origin && item.pos == igri.pos)) {
        throw new Error(`${item.origin}, ${item.pos}, ${igri.origin}, ${igri.pos}, 
        En Federation.updateLeagueSystem`)
      }
    })
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
        origin: `fr_${category}_${this.id}`, pos: i + 1, team: team
      }
    })
    return Ranking.fromRankItemArr(`fr_${category}_${this.id}`, out)
  }

  // Se actualizan los rankings por categoria de la federation al final de temporada
  updateRankings() {
    CATEGORIES.forEach((cat: TypeCategory) => {
      this.updateRankingsPerCategory(cat)
    })
  }
  private updateRankingsPerCategory(category: TypeCategory) {
    const ls = this._leagueSystem[category];
    const teamListCategory = this.getRankList(category)
    let pos = 0
    if (!!ls) {
      ls.getDivisionConfigList().forEach((idc: IDivisionConfig) => {
        const trank = globalFinishedRankingsMap.get(`tr_${this.getDivTourId(category, idc.level)}`)
        const p = idc.condition.p
        const r = idc.condition.r
        // Si no existe el rank es porque no terminó el tournament
        if (!trank) {
          console.log('keys', globalFinishedRankingsMap.keys())
          throw new Error(`No se debe actualizar hasta el final de temporada
          En Federation.updateRankingsPerCategory`)
        }

        trank.getRankTable().forEach((iri: IRankItem, iriIdx: number) => {
          // console.log(iri.team)
          const iripos = iriIdx + 1;
          // los que ascienden
          if (iripos <= p) {
            // console.log('pro', iripos, p)
            teamListCategory[pos - p] = iri.team;
            // los que desceienden
          } else if (iripos > trank.size - r) {
            // console.log('rel', iripos, r)
            teamListCategory[pos + r] = iri.team;
            // los demas
          } else {
            teamListCategory[pos] = iri.team
          }

          pos++
        })

      })


      this.setTeamInRanking(teamListCategory, category)
    }
  }
  private setTeamInRanking(teamsArr: Team[], category: TypeCategory) {
    const teamsPrevList = [...this.getRankList(category)];
    // verifico que no haya repetidos
    const teamsMap = new Map(teamsArr.map(t => [t.id, t]))
    if (teamsMap.size !== teamsArr.length) {
      console.log(teamsArr.map(t => t.id))
      throw new Error(`Hay elementos que se repiten en teamsArr.
      En Federation.setTeamInRanking`)
    }
    // verifico que existe cada institution
    teamsArr.forEach((team: Team) => {
      const inst = this.members.get(team.entity.id)
      if (!inst) {
        console.log(team)
        throw new Error(`Al actualizar el teamRanking se intenta agregar el team ${team.id},
        pero la insttution ${team.entity.id} no es miembro de la federation: ${this.id}
        En Federation.setTeamInRanking`)
      }
    })
    // verifico que todos siguen estando
    teamsPrevList.forEach((team: Team) => {
      if (!teamsMap.get(team.id)) {
        console.log(this.getRankList(category).map(t => t.entity.id))
        throw new Error(`en la lista de instituciones no se incluye el elemento: ${team.entity.id}.
        En Federation.updateRanking`)
      }
    })

    this._rankings[category] = teamsArr;
  }

}