import { Town } from "..";
import { JDate } from "jl-calendar";
import { TDC } from "../../patterns/templateDataCreator";
import { AnyTeam, CATEGORIES, IKitSpec, ITeamInit, TypeCategory, TypeCategoryList, assertUnitInterval } from "jl-sprt-core";
import { ProfilesFactory, TSport } from "jl-sprt-match";
import {
  HexColor, IInstitutionIdentity, IInstitutionKits, IKitSet, IKitSetData, IWebColors,
  assertIdentity, assertKitSet, generateInstitutionKits, kitSetToData, shirtDominant, webColorsOf,
} from "./Kits";

export interface IInstitutionData {
  i: string; // id
  n: string; // name
  sn: string; // shortName
  ab: string; // abrevName
  hq: string; // headquarters
  fd: number; // funtationDay
  sp: TSport; // sport
  /**
   * Colores institucionales y equipaciones. Opcionales en la ENTRADA (si faltan, se
   * generan por id); en la SALIDA de `getData()` siempre vienen.
   */
  ic?: HexColor[];   // identity colors
  kt?: IKitSetData;  // kits, por id de equipación
}


export interface IInstitutionCreator {
  id: string;
  name: string; // name
  shortName: string; // shortName
  abrevName: string; // abrevName
  headquarters: Town; // headquarters
  funtationDay: JDate; // funtationDay
  sport: TSport; // sport
  /**
   * Colores institucionales. Opcional: si falta, se genera a partir del `id`.
   */
  identity?: IInstitutionIdentity;
  /**
   * Equipaciones. Opcional: si falta, se generan a partir del `id` (con `identity` si
   * vino). Si viene, debe venir `identity` y cumplir el `kitSpec` del deporte.
   */
  kits?: IKitSet;
  /**
   * Calidad de las instalaciones de entrenamiento (0..1). Si falta, los teams usan el
   * valor por defecto de jl-sprt-core. A futuro se descompone (físico, recuperación...).
   */
  trainingFacilities?: number;
  /**
   * Coordinación de la institución (0..1): alineación de sus teams y cantera con un
   * mismo estilo de juego. Hoy es sólo dato.
   */
  coordination?: number;
}

export class Institution extends TDC<IInstitutionData, IInstitutionCreator> {
  _teams: TypeCategoryList<AnyTeam> = {};
  private readonly _kits: IInstitutionKits;

  constructor(iic: IInstitutionCreator) {
    super(iic)
    if (iic.trainingFacilities !== undefined) assertUnitInterval('trainingFacilities', iic.trainingFacilities);
    if (iic.coordination !== undefined) assertUnitInterval('coordination', iic.coordination);
    this._kits = Institution.resolveKits(iic, ProfilesFactory.getProfile(iic.sport).kitSpec);
  }

  /**
   * Identidad y equipaciones, una sola vez al crear. Si vienen, se validan y se usan
   * tal cual (nunca se regeneran); si no, se generan por id.
   */
  private static resolveKits(iic: IInstitutionCreator, spec: IKitSpec): IInstitutionKits {
    if (iic.kits) {
      if (!iic.identity) throw new Error(`institution ${iic.id}: kits requires identity`);
      assertIdentity(iic.identity);
      assertKitSet(iic.kits, spec);
      return { identity: { colors: [...iic.identity.colors] }, kits: { ...iic.kits } };
    }
    if (iic.identity) return generateInstitutionKits(iic.id, spec, iic.identity);
    return generateInstitutionKits(iic.id, spec);
  }

  /** Implementa `ITeamOwner.trainingFacilities`: lo leen los teams de la institución. */
  get trainingFacilities(): number | undefined { return this.info.trainingFacilities }
  /** Implementa `ITeamOwner.coordination`. */
  get coordination(): number | undefined { return this.info.coordination }

  get id() { return this.info.id }
  get name(): string { return this.info.name }
  get shortName(): string { return this.info.shortName }
  get abrevName(): string { return this.info.abrevName }
  get sport(): TSport { return this.info.sport; }
  get headquarters(): Town { return this.info.headquarters; }

  /** Colores institucionales. */
  get identity(): IInstitutionIdentity { return this._kits.identity; }
  /** Equipaciones, por id de equipación del deporte. */
  get kits(): IKitSet { return this._kits.kits; }

  /** Colores de interfaz de la institución, a partir de su color principal. */
  webColors(): IWebColors { return webColorsOf(this._kits.identity.colors[0]); }

  /** Colores de interfaz de una equipación, a partir del dominante de su camiseta. */
  kitWebColors(slotId: string): IWebColors {
    const kit = this._kits.kits[slotId];
    if (!kit) throw new Error(`institution ${this.id} has no kit '${slotId}'`);
    return webColorsOf(shirtDominant(kit));
  }

  /**
   * Crea el team de la institución en una categoría. Sus atributos y su staff son
   * obligatorios y explícitos (`init`), del tipo que define el deporte de la
   * institución.
   */
  createTeam(category: TypeCategory, init: ITeamInit) {
    if (this._teams[category])
      throw new Error(`la inst ${this.info.id} ya cuenta con un team en la categoria: ${category}`);

    const profile = ProfilesFactory.getProfile(this.sport);
    this._teams[category] = profile.createTeam({
      id: `${category}_${this.id}`,
      category: category,
      owner: this,
      ...init,
    });
  }

  getTeam(category: TypeCategory): AnyTeam | undefined {
    return this._teams[category]
  }

  /** Categorías en las que la institución tiene equipo, en el orden canónico. */
  get categories(): TypeCategory[] {
    return CATEGORIES.filter((c) => this._teams[c] !== undefined);
  }

  /** Equipos de la institución (uno por categoría existente), en orden canónico. */
  get teams(): AnyTeam[] {
    return this.categories.map((c) => this._teams[c]!);
  }

  getData(): IInstitutionData {
    return {
      i: this.info.id, n: this.info.name, sn: this.info.shortName, ab: this.info.abrevName,
      hq: this.info.headquarters.id,
      fd: this.info.funtationDay.getDate().dayAbsolute,
      sp: this.sport,
      ic: [...this.identity.colors],
      kt: kitSetToData(this.kits),
    }
  }
}
