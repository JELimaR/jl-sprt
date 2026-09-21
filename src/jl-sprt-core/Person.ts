export interface IPersonData {
  readonly id: string;
  readonly name: string;
}

/**
 * Identidad humana reutilizable por jugadores, entrenadores, árbitros,
 * instituciones y funciones administrativas.
 */
// ES NECESARIO QUE SEA UNA CLASE?
export class Person {
  readonly id: string;
  readonly name: string;

  constructor(data: IPersonData) {
    this.id = data.id;
    this.name = data.name;
  }
}
