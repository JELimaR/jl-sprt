import { IDivisionCondition } from "./LeagueSystem";
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
  lSys: TypeCategoryList<ILeagueSystemCreator>;
  cSys: TypeCategoryList<ICupSystemCreator>;
  rnks: TypeCategoryList<string[]>
}

export interface IFederationCreator extends ISportOrganizationCreator<Country, Institution> {
  leagueSystem: TypeCategoryList<LeagueSystem>;
  cupSystem: TypeCategoryList<CupSystem>;
  rankings: TypeCategoryList<Team[]>
}

export class Federation extends SportOrganization<Country, Institution, IFederationData, IFederationCreator> {

  // sistema de divisiones, definido por categoria
  // private _leagueSystem: TypeCategoryList<LeagueSystem> = {};
  // sistema de torneos de copa, definido por categoria
  // private _cupSystem: TypeCategoryList<CupSystem> = {};
  // cada categoria tiene un ranking
  // private _rankings: TypeCategoryList<Team[]> = {}; //

  constructor(ifc: IFederationCreator) {
    super(ifc)
    // ifc.institutions.forEach((ii) => {
    //   this.addMember(ii)
    // })
    // this.info.rankings = { S13: [], S15: [], S17: [], S19: [], S21: [], S23: [], S: [] };
    // CATEGORIES.forEach((c: TypeCategory) => {
    //   const cupSystem_c = ifc.cupSystem[c]
    //   if (cupSystem_c)
    //     this._cupSystem[c] = new CupSystem(cupSystem_c)
    //   const leagueSystem = ifc.leagueSystem[c];
    //   if (leagueSystem)
    //     this._leagueSystem[c] = new LeagueSystem(leagueSystem);

    //   const ranking_c = ifc.rankings[c];
    //   if (ranking_c) {
    //     this.info.rankings[c] = [...ranking_c]
    //   }
    // })
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
        console.log('IGRIList', IGRIList.length)
        console.log('items', items.length)
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
    const rankList = this.info.rankings[category]
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
    if (this.info.rankings[category]) {
      rankList = this.info.rankings[category] as Team[];
    } else {
      rankList = [];
      this.info.rankings[category] = []
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

    // Información detallada para debugging
    console.log(`\n=== UpdateLeagueSystem Debug Info ===`);
    console.log(`Federation: ${this.name} (${this.id})`);
    console.log(`Category: ${category}`);
    console.log(`Teams required by LeagueSystem: ${ls.getTeamsCount()}`);
    console.log(`Teams available in federation: ${franking.size}`);
    console.log(`Teams in category list: ${categoryTeams.length}`);
    console.log(`Total members in federation: ${this.members.size}`);
    
    // Mostrar equipos disponibles
    if (categoryTeams.length > 0) {
      console.log(`Available teams:`, categoryTeams.map(t => t.id));
    } else {
      console.log(`No teams found in category ${category}`);
      
      // Verificar si hay instituciones pero sin equipos en esta categoría
      const institutionsWithoutTeams: string[] = [];
      this.members.forEach((institution, id) => {
        if (!institution.getTeam(category)) {
          institutionsWithoutTeams.push(id);
        }
      });
      
      if (institutionsWithoutTeams.length > 0) {
        console.log(`Institutions without teams in category ${category}:`, institutionsWithoutTeams);
      }
    }
    console.log(`=====================================\n`);

    if (ls.getTeamsCount() > franking.size) {
      throw new Error(`Cannot update LeagueSystem for Federation '${this.name}' (${this.id}):
      
      LeagueSystem Requirements:
      - Category: ${category}
      - Teams required: ${ls.getTeamsCount()}
      - Divisions: ${ls.getDivisionConfigList().length}
      
      Federation Status:
      - Teams available: ${franking.size}
      - Total members: ${this.members.size}
      - Teams in category: ${categoryTeams.length}
      
      Solution: Add more institutions to category '${category}' or reduce LeagueSystem requirements.
      
      (Federation.updateLeagueSystem)`)
    }
    ls.getGenericRankOrdered().forEach((igri: IGenericRankItem, idx: number) => {
      const item = franking.getGenericRankItems()[idx]
      if (!(item.origin == igri.origin && item.pos == igri.pos)) {
        throw new Error(`${item.origin}, ${item.pos}, ${igri.origin}, ${igri.pos}, 
        En Federation.updateLeagueSystem`)
      }
    })
    this.info.leagueSystem[category] = ls;
  }

  createTournamentList(): ITournamentFromGSGData[] {
    let out: ITournamentFromGSGData[] = []
    CATEGORIES.forEach((category: TypeCategory) => {
      const ls = this.info.leagueSystem[category];
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
    const ls = this.info.leagueSystem[category];
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

    this.info.rankings[category] = teamsArr;
  }

  getData(): IFederationData {
    const members: string[] = [];
    this.members.forEach(i => members.push(i.id))
    return {
      i: this.id, n: this.name, sn: this.shortName, fd: this.foundationDate.getDate().dayAbsolute,
      aa: this.areaAsosiated.id, hq: this.headquarters.id,
      fs: this.founderMembers.map(i => i.id), ms: members,
      rnks: {},
      cSys: {}, /*this._cupSystem,*/ lSys: {}/*this._leagueSystem*/
    }
  }

}