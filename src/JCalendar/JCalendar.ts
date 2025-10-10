// Clase de calendario para gestionar eventos temporales y avanzar en el tiempo.
// Permite agregar eventos, avanzar la fecha actual y consultar eventos futuros o actuales.

import { IJDateTimeCreator, JDateTime, TypeIntervalOfDay } from "./JDateTimeModule";
import { JEvent } from "./Event/JEvent";


export default class JCalendar {
  // Mapa de eventos indexados por el valor absoluto de la fecha
  private _eventsMap: Map<number, JEvent[]> = new Map<number, JEvent[]>();
  // Fecha de inicio del calendario
  private _initDate: JDateTime;
  // Fecha actual del calendario
  private _now: JDateTime;

  /**
   * Inicializa el calendario con una fecha base.
   * @param dti Objeto con la información de fecha y hora inicial
   */
  constructor(dti: IJDateTimeCreator) {
    this._now = new JDateTime(dti);
    this._initDate = this._now.copy();
  }

  /**
   * Agrega un evento al calendario en la fecha correspondiente.
   * @param event Evento a agregar (debe ser futuro respecto a la fecha actual)
   */
  addEvent(event: JEvent) {
    let eventsArr = this._eventsMap.get(event.dateTime.absolute)
    if (!eventsArr) {
      eventsArr = [];
    }
    eventsArr.push(event)
    this._eventsMap.set(event.dateTime.absolute, eventsArr)
  }

  /**
   * Obtiene una copia de la fecha actual del calendario.
   */
  get now(): JDateTime { return this._now.copy() }
  /**
   * Cambia la fecha actual del calendario.
   */
  set now(dt: JDateTime) { this._now = dt.copy() }

  /**
   * Devuelve la fecha de inicio del calendario.
   */
  get init(): JDateTime { return this._initDate }

  /**
   * Devuelve todos los eventos del calendario, ordenados por fecha.
   */
  get events(): JEvent[] {
    let out: JEvent[] = [];
    // let keys: number[] = Array.from(this._eventsMap.keys())
    // keys = keys.sort()
    // keys.forEach((k: number) => {
    //   if (k >= this._now.absolute) {
    //     out.push(...this._eventsMap.get(k)!)
    //   }
    // })

    this._eventsMap.forEach((events: JEvent[]) => {
      out.push(...events)
    })
    out.sort((a: JEvent, b: JEvent) => {
      return JDateTime.difBetween(a.dateTime, b.dateTime);
    })
    return out;
  }

  /**
   * Devuelve el siguiente conjunto de eventos futuros y su fecha.
   * @returns Un objeto con la fecha y los eventos próximos
   */
  getNextEvents(): { dt: JDateTime, events: JEvent[] } {
    let events = this._eventsMap.get(this.getNextKey());
    if (!events) {
      events = []
    }
    return {
      dt: new JDateTime({
        day: Math.round(this.getNextKey() / 300),
        interv: this.getNextKey() % 300 as TypeIntervalOfDay
      }),
      events
    };
  }

  /**
   * Busca la clave (fecha absoluta) del siguiente evento futuro respecto a la fecha actual.
   * @returns El valor absoluto de la fecha del siguiente evento, o -1 si no hay futuros
   */
  private getNextKey(): number {
    let out = -1;
    let keys: number[] = Array.from(this._eventsMap.keys())
    keys = keys.sort((a,b) => a-b);
    let i = 0
    while (i < keys.length && out < this._now.absolute) {
      if (keys[i] > this._now.absolute) {
        out = keys[i];
      }
      i++
    }
    return out;
  }

  /**
   * Avanza la fecha actual del calendario en un intervalo.
   */
  advance() {
    this._now.addInterv(1)
  }

  /**
   * Devuelve la lista de eventos programados para la fecha actual.
   */
  getCurrentEventList(): JEvent[] {
    let out = this._eventsMap.get(this._now.absolute)
    if (!!out) {
      return out
    } else {
      return []
    }
  }

  /**
   * Crea un calendario a partir de un año específico (día 1 de ese año).
   * @param year Año base
   * @returns Instancia de JCalendar
   */
  static createFromYear(year: number): JCalendar {
    return new JCalendar(JDateTime.createFromDayOfYearAndYear(1, year).getIJDateTimeCreator());
  }
}