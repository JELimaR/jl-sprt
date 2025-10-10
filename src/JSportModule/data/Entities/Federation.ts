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

  /**
   * Devuelve el identificador único de un torneo de división para una categoría y nivel dados.
   * @param category Categoría deportiva
   * @param level Nivel de la división
   * @returns string con el id único del torneo de división
   */
  getDivTourId(category: TypeCategory, level: number): string {
    if (0 >= level && level >= 100) {
      throw new Error(`
      En Federation.getDivTourId`)
    }
    return `${category}_${this.id}_D${String(level).padStart(2, '0')}`
  }
  /**
   * Divide el ranking genérico de una categoría en grupos según las condiciones de división.
   * Cada grupo representa los equipos asignados a una división específica.
   * @param category Categoría deportiva (ej: S, S17, etc)
   * @param conditions Lista de condiciones de división (cantidad de equipos por división)
   * @returns Array de arrays, cada uno con los IGenericRankItem de una división
   *
   * IMPORTANTE: El método asume que el ranking está ordenado y que la suma de N en conditions
   * coincide exactamente con la cantidad de equipos en el ranking. Si no, lanza error.
   */
  getDivGenericRank(category: TypeCategory, conditions: IDivisionCondition[]): IGenericRankItem[][] {
    let out: Array<IGenericRankItem[]> = [];
    let pos = 0;
    // Obtiene la lista de items genéricos del ranking de la categoría
    const IGRIList = this.getRanking(category).getGenericRankItems();
    const totalN = conditions.reduce((acc, cond) => acc + cond.N, 0);
    if (totalN !== IGRIList.length) {
      const teamIds = this.getRankList(category).map(t => t.id);
      throw new Error(
        [
          'Error en Federation.getDivGenericRank:',
          `  - Cantidad de equipos en ranking: ${IGRIList.length}`,
          `  - Suma de N en conditions: ${totalN}`,
          `  - Conditions:`,
          ...conditions.map((c, i) => `      ${i + 1}: ${JSON.stringify(c)}`),
          `  - Equipos en ranking:`,
          ...teamIds.map((id, i) => `      ${i + 1}: ${id}`),
          '  Solución: Verifica que la suma de N coincida con la cantidad de equipos en el ranking.'
        ].join('\n')
      );
    }
    conditions.forEach((cond: IDivisionCondition) => {
      const items: IGenericRankItem[] = [];
      // Toma N elementos consecutivos del ranking para esta división
      for (let i = pos; i < pos + cond.N; i++) {
        items.push(IGRIList[i]);
      }
      out.push(items);
      pos += cond.N;
    });
    return out;
  }

  /**
   * Devuelve la lista de equipos (Team[]) que forman el ranking de una categoría específica.
   * Se basa en la información almacenada en this.info.rankings.
   * @param category Categoría deportiva
   * @returns Array de equipos en el ranking de la categoría
   */
  /**
   * Devuelve la lista de equipos (Team[]) que forman el ranking de una categoría específica.
   * Se basa en la información almacenada en this.info.rankings.
   * @param category Categoría deportiva
   * @returns Array de equipos en el ranking de la categoría
   */
  private getRankList(category: TypeCategory): Team[] {
    let out: Team[];
    const rankList = this.info.rankings[category];
    if (rankList) {
      out = [...rankList];
    } else {
      out = [];
    }
    return out;
  }

  /**
   * Agrega el equipo de una institución al ranking de una categoría.
   * - Si no existe ranking para la categoría, lo inicializa con el nuevo equipo.
   * - Si ya existe, agrega el equipo solo si no está repetido.
   * - Lanza error si el equipo ya está en el ranking (no permite duplicados).
   *
   * @param inst Institución a agregar
   * @param category Categoría deportiva
   */
  addInstitutionToCategory(inst: Institution, category: TypeCategory) {
    const team = inst.getTeam(category);
    if (!team) {
      throw new Error(`La institución ${inst.id} no tiene equipo en la categoría ${category}`);
    }
    // Si no hay ranking, inicializarlo con el nuevo equipo
    if (!this.info.rankings[category]) {
      this.info.rankings[category] = [team];
      return;
    }
    // Si ya existe, verificar que no esté repetido
    const rankList = this.info.rankings[category] as Team[];
    if (rankList.find(t => t.id === team.id)) {
      console.log(rankList.map(t => t.id), inst.id);
      throw new Error(`El equipo ${team.id} ya está en el ranking de la categoría ${category}`);
    }
    rankList.push(team);
  }
  // se actualiza el sistema de ligas
  // actualizar el leaguesistem
  /**
   * Actualiza el sistema de ligas de la federación para una categoría, validando que haya suficientes equipos
   * y que el ranking sea consistente con los requerimientos del sistema de ligas.
   * @param ls Nuevo sistema de ligas
   */
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

  /**
   * Crea una lista de datos de torneos a partir de la configuración de ligas de la federación.
   * @returns Lista de datos de torneos (uno por división configurada)
   */
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
  /**
   * Devuelve el ranking de una categoría como un objeto Ranking, usando la lista de equipos de la categoría.
   * @param category Categoría deportiva
   * @returns Objeto Ranking con los equipos ordenados
   */
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
  /**
   * Actualiza los rankings de todas las categorías al final de la temporada,
   * usando los rankings finales de los torneos almacenados en globalFinishedRankingsMap.
   */
  updateRankings() {
    CATEGORIES.forEach((cat: TypeCategory) => {
      this.updateRankingsPerCategory(cat)
    })
  }
  /**
   * Actualiza el ranking de una categoría específica al final de la temporada,
   * reasignando equipos según ascensos y descensos definidos en las divisiones.
   * @param category Categoría deportiva
   */
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
  /**
   * Establece el ranking de equipos para una categoría, validando que no haya repetidos
   * y que todos los equipos pertenezcan a instituciones miembros.
   * @param teamsArr Lista de equipos ordenada
   * @param category Categoría deportiva
   */
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

    this.info.rankings[category] = [...teamsArr];
  }

  /**
   * Devuelve los datos serializados de la federación, incluyendo rankings, sistemas de copa y liga, y miembros.
   * @returns Objeto IFederationData con la información de la federación
   */
  getData(): IFederationData {
    const members: string[] = [];
    this.members.forEach(i => members.push(i.id))
    return {
      i: this.id, n: this.name, sn: this.shortName, fd: this.foundationDate.getDate().dayAbsolute,
      aa: this.areaAsosiated.id, hq: this.headquarters.id,
      fs: this.founderMembers.map(i => i.id), ms: members,
      rnks: {S: this.getRankList('S').map(T => T.id)},
      cSys: {}, /*this._cupSystem,*/ lSys: {}/*this._leagueSystem*/
    }
  }
}