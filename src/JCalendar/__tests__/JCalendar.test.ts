import { describe, it, expect, beforeEach } from 'vitest';
import JCalendar from '../JCalendar';
import { JDateTime } from '../JDateTimeModule';
import { IJEventInfo, JEvent } from '../Event/JEvent';

class TestEvent extends JEvent {
  
  constructor(options: IJEventInfo) {
    super(options);
  }

  execute() {
    // Simula la ejecución del evento, por ejemplo, marcando una bandera interna
    this.executed = true;
    return `Evento ejecutado en ${this.dateTime.toString()}`;
  }

  executed = false;
  
}

describe('JCalendar', () => {
  let calendar: JCalendar;
  let baseDate: JDateTime;

  beforeEach(() => {
    baseDate = JDateTime.createFromDayOfYearAndYear(1, 2025);
    calendar = new JCalendar(baseDate.getIJDateTimeCreator());
  });

  it('debe inicializarse con la fecha actual', () => {
    expect(calendar.now.absolute).toBe(baseDate.absolute);
    expect(calendar.init.absolute).toBe(baseDate.absolute);
  });

  it('debe permitir cambiar la fecha actual', () => {
    const newDate = JDateTime.createFromDayOfYearAndYear(10, 2025);
    calendar.now = newDate;
    expect(calendar.now.absolute).toBe(newDate.absolute);
    expect(calendar.init.absolute).toBe(baseDate.absolute);
  });

  it('debe agregar y recuperar eventos futuros', () => {
    // Evento en el futuro (siempre sumar al menos un intervalo)
    const futureDate = baseDate.copy();
    futureDate.addInterv(1);
    const event = new TestEvent({
      dateTime: futureDate.getIJDateTimeCreator(),
      calendar,
    });
    calendar.addEvent(event);
    expect(calendar.events.length).toBe(1);
    expect(calendar.events[0]).toBe(event);
  });

  it('debe avanzar la fecha actual', () => {
    const prev = calendar.now.absolute;
    calendar.advance();
    expect(calendar.now.absolute).toBe(prev + 1);
  });

  it('debe devolver eventos actuales y próximos correctamente', () => {
    // Evento en el futuro inmediato
    const eventNowDate = baseDate.copy();
    eventNowDate.addInterv(1);
    const eventNow = new TestEvent({
      dateTime: eventNowDate.getIJDateTimeCreator(),
      calendar,
    });
    calendar.addEvent(eventNow);
    // Evento más adelante
    const futureDate = baseDate.copy();
    futureDate.addInterv(3);
    const eventFuture = new TestEvent({
      dateTime: futureDate.getIJDateTimeCreator(),
      calendar,
    });
    calendar.addEvent(eventFuture);
    // No hay eventos en el presente
    expect(calendar.getCurrentEventList().length).toBe(0);
    // Avanzar a primer evento
    calendar.advance();
    const current = calendar.getCurrentEventList();
    expect(current.length).toBe(1);
    expect(current[0]).toBe(eventNow);
    // Avanzar a segundo evento
    calendar.now = futureDate;
    const next = calendar.getCurrentEventList();
    expect(next.length).toBe(1);
    expect(next[0]).toBe(eventFuture);
  });

  it('debe crear un calendario desde un año', () => {
    const cal = JCalendar.createFromYear(2030);
    expect(cal.now.absolute).toBeGreaterThan(0);
    expect(cal.init.absolute).toBe(cal.now.absolute);
  });
});