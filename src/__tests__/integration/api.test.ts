import { describe, it, expect } from "vitest";
import SportServerAPI from "../../JSportServerModule";
import {
  IContinentData,
  ICountryData,
  ITownData,
  IInstitutionData,
  IFederationData,
  IConfederationData,
} from "../../JSportModule";

// -----------------------------------------------------------------------------
// Capa 7 — Integración de la API de entidades (SportServerAPI)
//
// Mirror reducido y auto-contenido del flujo de APIExample.ts: cargar geografía,
// crear instituciones / federaciones / confederaciones y asociarlas, verificando
// las queries del EntityController de punta a punta.
//
// IMPORTANTE: EntityController / EntityHandler son singletons de modulo SIN reset.
// Vitest aisla el registro de modulos por archivo de test, por lo que el singleton
// arranca limpio para este archivo. Aun asi, para no depender de estado compartido
// entre casos, todo el flujo se ejecuta en UN SOLO `it` que carga y consulta en
// secuencia (igual que hace APIExample).
// -----------------------------------------------------------------------------

/** Geografía mínima: 2 continentes, 3 países (país 1 y 3 -> continente 1; país 2 -> continente 2). */
function continents(): IContinentData[] {
  return [
    { i: '1', n: 'Continent_1', p: 1000, a: 100 },
    { i: '2', n: 'Continent_2', p: 2000, a: 200 },
  ];
}
function countries(): ICountryData[] {
  return [
    { i: '1', n: 'Country_1', r: '1', p: 100, a: 10 },
    { i: '2', n: 'Country_2', r: '2', p: 200, a: 20 },
    { i: '3', n: 'Country_3', r: '1', p: 300, a: 30 },
  ];
}
function towns(): ITownData[] {
  return [
    { i: '1', n: 'Town_1', c: '1', p: 10, a: 1 },
    { i: '2', n: 'Town_2', c: '2', p: 20, a: 2 },
    { i: '3', n: 'Town_3', c: '3', p: 30, a: 3 },
  ];
}
function institutions(): IInstitutionData[] {
  return [
    { i: 'I1', ab: 'I1', sn: 'Inst 1', n: 'Institution 1', hq: '1', fd: 100 },
    { i: 'I2', ab: 'I2', sn: 'Inst 2', n: 'Institution 2', hq: '2', fd: 200 },
  ];
}
function federations(): IFederationData[] {
  return [
    // fed 1 en país 1 (continente 1), con I1 como fundador y miembro
    { i: '1', sn: 'F1', n: 'Federation 1', aa: '1', hq: '1', fd: 1, fs: ['I1'], ms: ['I1'], lSys: {}, cSys: {}, rnks: {} },
    // fed 2 en país 2 (continente 2), con I2 como miembro
    { i: '2', sn: 'F2', n: 'Federation 2', aa: '2', hq: '2', fd: 2, fs: [], ms: ['I2'], lSys: {}, cSys: {}, rnks: {} },
  ];
}
function confederations(): IConfederationData[] {
  return [
    { i: 'C1', sn: 'C1', n: 'Confederation 1', aa: '1', hq: '1', fs: [], ms: [], fd: 1 },
    { i: 'C2', sn: 'C2', n: 'Confederation 2', aa: '2', hq: '2', fs: [], ms: [], fd: 2 },
  ];
}

describe("Integración - API de entidades (EntityController end-to-end)", () => {
  it("carga geografía, crea entidades, las asocia y responde las queries", () => {
    const entities = SportServerAPI().getEntityController();

    // 1) geografía
    entities.loadGeogExampleData(continents(), countries(), towns());

    // 2) instituciones
    institutions().forEach((inst) => {
      expect(entities.createInstitution(inst)).toBe(true);
    });
    const insts = entities.getInstitutions({});
    expect(insts.length).toBe(2);
    // getData de Institution: usa town.id + funtationDay (no llama geog.getData)
    const i1 = insts.find((x) => x.i === 'I1')!;
    expect(i1.hq).toBe('1');
    expect(i1.n).toBe('Institution 1');
    expect(i1.fd).toBe(100);

    // 3) federaciones
    federations().forEach((fed) => {
      expect(entities.createFederation(fed)).toBe(true);
    });
    const feds = entities.getFederations({});
    expect(feds.length).toBe(2);
    // getData de Federation: serializa founders y members por id
    const f1 = feds.find((x) => x.i === '1')!;
    expect(f1.aa).toBe('1');
    expect(f1.hq).toBe('1');
    expect(f1.fs).toEqual(['I1']);
    expect(f1.ms).toEqual(['I1']);

    // getFederationById devuelve los datos de una federación puntual
    expect(entities.getFederationById('2').n).toBe('Federation 2');

    // 4) confederaciones
    confederations().forEach((conf) => {
      expect(entities.createConfederation(conf)).toBe(true);
    });
    const confs = entities.getAllConfederations();
    expect(confs.length).toBe(2);
    // recien creadas, sin miembros
    confs.forEach((c) => expect(c.ms).toEqual([]));

    // 5) asociaciones (validadas por continente: country.r === continent.i)
    // fed 1 (país 1, r='1') -> conf 1 (continente '1'): OK
    expect(entities.associateFederation('1', 'C1')).toBe(true);
    // fed 2 (país 2, r='2') -> conf 2 (continente '2'): OK
    expect(entities.associateFederation('2', 'C2')).toBe(true);
    // fed 1 (r='1') -> conf 2 (continente '2'): rechazada
    expect(entities.associateFederation('1', 'C2')).toBe(false);

    // 6) las asociaciones quedan reflejadas en getData de las confederaciones
    const confsAfter = entities.getAllConfederations();
    const c1 = confsAfter.find((c) => c.i === 'C1')!;
    const c2 = confsAfter.find((c) => c.i === 'C2')!;
    expect(c1.ms).toEqual(['1']);
    expect(c2.ms).toEqual(['2']);
  });
});
