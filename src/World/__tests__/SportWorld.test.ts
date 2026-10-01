import { describe, it, expect } from "vitest";
import { SportWorld } from "../SportWorld";
import { JCalendar } from "jl-calendar";
import { RankingStore } from "../../JSportModule/Ranking/RankingStore";
import { Continent, Country, Town } from "../../JSportModule/data/Entities/GeogEntity";

// -----------------------------------------------------------------------------
// SportWorld — Paso 1 (esqueleto): estructura del mundo (tiempo + calendario +
// rankings + almacenamiento de entidades). El LOD (Paso 5) y la transición de
// temporada (Paso 4) se prueban en sus propios pasos. Las entidades DEPORTIVAS
// (confederaciones/federaciones/instituciones) se ejercitan a fondo en el Paso 2
// vía EntityController; aquí se valida el almacenamiento genérico con geografía.
// -----------------------------------------------------------------------------

const continent = (id: string): Continent => new Continent({ i: id, n: `Cont ${id}`, p: 1, a: 1 });
const country = (id: string, r: string): Country => new Country({ i: id, n: `Country ${id}`, r, p: 1, a: 1 });
const town = (id: string, c: string): Town => new Town({ i: id, n: `Town ${id}`, c, p: 1, a: 1 });

describe("SportWorld - tiempo y temporada", () => {
  it("createFromYear fija currentSeason y un calendario que arranca en ese año", () => {
    const world = SportWorld.createFromYear(1986);
    expect(world.currentSeason).toBe(1986);
    expect(world.calendar).toBeInstanceOf(JCalendar);
    // El calendario arranca en el año de la temporada.
    expect(world.calendar.now.date.getDate().year).toBe(1986);
  });

  it("acepta un calendario y un RankingStore inyectados (para reconstrucción/persistencia)", () => {
    const cal = JCalendar.createFromYear(2001);
    const store = new RankingStore();
    const world = new SportWorld(2001, cal, store);
    expect(world.calendar).toBe(cal);
    expect(world.rankings).toBe(store);
    expect(world.currentSeason).toBe(2001);
  });

  it("expone un único RankingStore del mundo", () => {
    const world = SportWorld.createFromYear(1990);
    expect(world.rankings).toBeInstanceOf(RankingStore);
    // Mismo store en cada acceso (estado único del mundo).
    expect(world.rankings).toBe(world.rankings);
  });
});

describe("SportWorld - entidades geográficas", () => {
  it("agrega y consulta continentes/países/ciudades", () => {
    const world = SportWorld.createFromYear(1986);
    world.addContinent(continent("1"));
    world.addCountry(country("10", "1"));
    world.addTown(town("100", "10"));

    expect(world.getContinents().map((c) => c.id)).toEqual(["1"]);
    expect(world.getCountries().map((c) => c.id)).toEqual(["10"]);
    expect(world.getTowns().map((t) => t.id)).toEqual(["100"]);

    expect(world.getContinent("1")?.id).toBe("1");
    expect(world.getCountry("10")?.id).toBe("10");
    expect(world.getTown("100")?.id).toBe("100");
  });

  it("getX por id devuelve undefined si no existe", () => {
    const world = SportWorld.createFromYear(1986);
    expect(world.getContinent("nope")).toBeUndefined();
    expect(world.getCountry("nope")).toBeUndefined();
    expect(world.getTown("nope")).toBeUndefined();
  });

  it("no permite ids duplicados (addX devuelve false y no sobrescribe)", () => {
    const world = SportWorld.createFromYear(1986);
    expect(world.addContinent(continent("1"))).toBe(true);
    expect(world.addContinent(continent("1"))).toBe(false);
    expect(world.getContinents().length).toBe(1);

    const first = town("T", "C");
    const second = town("T", "OTRO");
    expect(world.addTown(first)).toBe(true);
    expect(world.addTown(second)).toBe(false);
    // El primero no fue sobrescrito: la referencia guardada es la original.
    expect(world.getTown("T")).toBe(first);
    expect(world.getTowns().length).toBe(1);
  });
});

describe("SportWorld - aislamiento entre mundos", () => {
  it("dos mundos no comparten entidades, calendario ni rankings", () => {
    const a = SportWorld.createFromYear(1986);
    const b = SportWorld.createFromYear(1986);

    a.addContinent(continent("1"));

    expect(a.getContinents().length).toBe(1);
    expect(b.getContinents().length).toBe(0);
    expect(a.calendar).not.toBe(b.calendar);
    expect(a.rankings).not.toBe(b.rankings);
  });
});
