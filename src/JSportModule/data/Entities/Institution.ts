import { Town } from "..";
import { JDate } from "jl-calendar";
import { TDC } from "../../patterns/templateDataCreator";
import { AnyTeam, CATEGORIES, ITeamInit, TypeCategory, TypeCategoryList, assertUnitInterval } from "jl-sprt-core";
import { ProfilesFactory, TSport } from "jl-sprt-match";
import { IKitColors, pickKitColors } from "./kitColors";

export interface IInstitutionData {
  i: string; // id
  n: string; // name
  sn: string; // shortName
  ab: string; // abrevName
  hq: string; // headquarters
  fd: number; // funtationDay
  sp: TSport; // sport
  /**
   * Colores de camiseta (hex). OPCIONALES en la ENTRADA (si no vienen, se asignan de
   * forma determinística por id). En la SALIDA de `getData()` siempre vienen definidos.
   */
  pc?: string; // primaryColor
  sc?: string; // secondaryColor
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
   * Colores de camiseta. Opcionales: si no se proveen, se asignan de forma
   * determinística a partir del `id` (misma institución → mismos colores).
   */
  primaryColor?: string;
  secondaryColor?: string;
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

  constructor(iic: IInstitutionCreator) {
    super(iic)
    if (iic.trainingFacilities !== undefined) assertUnitInterval('trainingFacilities', iic.trainingFacilities);
    if (iic.coordination !== undefined) assertUnitInterval('coordination', iic.coordination);
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

  /** Colores de camiseta: los del creator, o un par determinístico por id si faltan. */
  private _kit?: IKitColors;
  private get kit(): IKitColors {
    if (!this._kit) {
      this._kit =
        this.info.primaryColor && this.info.secondaryColor
          ? { primary: this.info.primaryColor, secondary: this.info.secondaryColor }
          : pickKitColors(this.info.id);
    }
    return this._kit;
  }
  get primaryColor(): string { return this.kit.primary; }
  get secondaryColor(): string { return this.kit.secondary; }

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
      pc: this.primaryColor,
      sc: this.secondaryColor,
    }
  }
}
