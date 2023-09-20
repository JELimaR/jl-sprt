import { IJDateTimeCreator, JDateTime } from "../DateTime/JDateTime";
import JCalendar from "../JCalendar";

export interface IJEventInfo {
    dateTime: IJDateTimeCreator;
    calendar: JCalendar;
}

export abstract class JEvent {
    private _dateTime: JDateTime;
    private _calendar: JCalendar;

    constructor(ec: IJEventInfo) {
        this._dateTime = new JDateTime(ec.dateTime);
        this._calendar = ec.calendar;
    }

    get dateTime(): JDateTime {
        return this._dateTime;
    }

    get calendar(): JCalendar {
        return this._calendar;
    }

    /*abstract*/ advance() { // para los eventos que duran mas de un intervalo y tienen acciones y estados
        console.log('advance event');
    }

    abstract execute(): any; // execute o run o start
}

export interface IJEventOthersInfo extends IJEventInfo {
    dateTime: IJDateTimeCreator;
    calendar: JCalendar;
}

export abstract class JEventOthers extends JEvent {
    private _state: 'created' | 'process' | 'finished';

    constructor(eo: IJEventOthersInfo) {
        super(eo)
        this._state = 'created';
    }


    /*abstract*/ advance() { // para los eventos que duran mas de un intervalo y tienen acciones y estados
        console.log('advance event');
    }

    abstract execute(): void;
}


/*
current date
event list
current date event

creacion de trn simple tipo LB
crear Trn
    - event

-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
tipos de eventos:
 - eventos que duran algunos intervalos de tiempo p.e JMatch (tienen DateTime de inicio)
 - eventos que requieren de ingreso de datos manuales p.e asignacion de fecha y hora de otros eventos (tienen DateTime de inicio o vencimiento)
 - eventos que duran algunos días p.e Fechs, Trns, Stages, temps
 - eventos que son generados por otros agentes p.e creacion de elementos
 - eventos que se generan manualmente
-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

agente externo crea la lb
la lb, en base a una configuracion inicial, crea un calendario con los siguientes eventos:
 un evento para asignacion de jtms (sorteo): JEventTeamsAssignation (debe ser previo a todos los JEventMatchsOfFechSchedule)
 un evento para asignacion de jmtchs para cada jfch: JEventMatchsOfFechSchedule).
     Se crean eventos de jmtchs para cada uno de estos: JEventMatch (hora max: 21:00 - interv: 252; min: 10:00 - interv: 120)
         genera JEventMatchInterval: (27: 6 de prev; 9 de PT; 3 de ET; 9 de ST) + 1 + (7: 3 de PTE, 1 de ETE, 3 de STE) + 1 + (2 de Pens)
         peor caso: total de 38 eq a 190 mins
*/
