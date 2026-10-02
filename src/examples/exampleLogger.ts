import { JCalendar, JEvent, DateToString } from "jl-calendar";

/**
 * Logger de observación para los EXAMPLES.
 *
 * Engancha un observador al calendario (`setEventObserver`) que imprime en consola,
 * cada vez que un evento TERMINA de procesarse, la fecha + una descripción del evento.
 * El log vive acá —en la capa de examples—, NO en los `advance()` de los eventos: así
 * la app/el server/los tests NO imprimen nada (no registran observador), y los examples
 * sí ven el detalle "en vivo".
 *
 * La descripción sale de `event.describe()` si el evento la implementa (match con su
 * marcador, inicio/cierre de stage, sorteos, scheduling); si no, se usa `event.label`.
 */
export function attachExampleLogger(cal: JCalendar): void {
  cal.setEventObserver((event: JEvent, at) => {
    const when = DateToString.DateTime_ddd_DD_mmm_YYYY_HHMM_HW(at);
    console.log(`[${when}] ${event.describe()}`);
  });
}

/** Quita el logger (vuelve a modo silencioso). */
export function detachExampleLogger(cal: JCalendar): void {
  cal.setEventObserver(undefined);
}
