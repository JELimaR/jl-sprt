import { describe, it, expect } from "vitest";
import { JDate } from "jl-calendar";
import { IKitSpec, fieldKitSlots, requiredKitSlotIds } from "jl-sprt-core";
import { ProfilesFactory, SPORTS, TSport } from "jl-sprt-match";
import {
  KIT_BLACK, KIT_PARAMS, KIT_WHITE, contrastRatio, deltaE, readableTextColor, relativeLuminance,
  IKitDesign, IKitSet, shirtDominant,
  assertIdentity, assertKitDesign, assertKitSet,
  kitSetFromData, kitSetToData,
  generateIdentity, generateInstitutionKits,
  selectMatchKits,
} from "..";
import { Institution } from "../../Institution";
import { Town } from "../../GeogEntity";

const specOf = (sport: TSport): IKitSpec => ProfilesFactory.getProfile(sport).kitSpec;
const FOOTBALL = specOf('football');

function plainKit(color: string, garments: IKitSpec['garments'] = FOOTBALL.garments): IKitDesign {
  const kit: IKitDesign = {
    shirt: { pattern: 'plain', base: color, sleeves: color, cuffs: KIT_WHITE, collar: { type: 'round', color: KIT_WHITE } },
  };
  if (garments.includes('shorts')) kit.shorts = { base: color };
  if (garments.includes('socks')) kit.socks = { base: color };
  return kit;
}

// -----------------------------------------------------------------------------
// Color
// -----------------------------------------------------------------------------
describe("colorMath", () => {
  it("luminancia y contraste WCAG", () => {
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 6);
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 6);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 6);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 6);
  });

  it("texto legible: negro sobre amarillo, blanco sobre azul marino", () => {
    expect(readableTextColor('#f5c400')).toBe(KIT_BLACK);
    expect(readableTextColor('#14213d')).toBe(KIT_WHITE);
  });

  it("ΔE: 0 entre iguales, chico entre parecidos, grande entre opuestos", () => {
    expect(deltaE('#d21f2b', '#d21f2b')).toBe(0);
    expect(deltaE('#d21f2b', '#d8222e')).toBeLessThan(KIT_PARAMS.clashDeltaE);
    expect(deltaE('#ffffff', '#111111')).toBeGreaterThan(90);
  });

  it("rechaza hex inválidos", () => {
    expect(() => relativeLuminance('red')).toThrow(/invalid hex/);
    expect(() => relativeLuminance('#12345')).toThrow(/invalid hex/);
  });
});

// -----------------------------------------------------------------------------
// Validación
// -----------------------------------------------------------------------------
describe("validación", () => {
  it("identidad: 1 a 4 colores hex", () => {
    expect(() => assertIdentity({ colors: ['#ffffff'] })).not.toThrow();
    expect(() => assertIdentity({ colors: [] })).toThrow(/1 to 4/);
    expect(() => assertIdentity({ colors: ['#111111', '#222222', '#333333', '#444444', '#555555'] })).toThrow(/1 to 4/);
    expect(() => assertIdentity({ colors: ['blue'] })).toThrow(/#rrggbb/);
  });

  it("un patrón distinto de 'plain' exige detail", () => {
    const kit = plainKit('#d21f2b');
    kit.shirt.pattern = 'vertical-stripes';
    expect(() => assertKitDesign('home', kit, FOOTBALL.garments)).toThrow(/detail is required/);
    kit.shirt.detail = KIT_WHITE;
    expect(() => assertKitDesign('home', kit, FOOTBALL.garments)).not.toThrow();
  });

  it("pantalón y medias presentes si y sólo si el deporte los declara", () => {
    const sinShort = plainKit('#d21f2b');
    delete sinShort.shorts;
    expect(() => assertKitDesign('home', sinShort, ['shirt', 'shorts', 'socks'])).toThrow(/shorts must be present/);
    expect(() => assertKitDesign('home', plainKit('#d21f2b'), ['shirt'])).toThrow(/must be absent/);
  });

  it("set: faltan obligatorias o hay ids desconocidos", () => {
    const required = requiredKitSlotIds(FOOTBALL);
    const full: IKitSet = Object.fromEntries(required.map((id) => [id, plainKit('#d21f2b')]));
    expect(() => assertKitSet(full, FOOTBALL)).not.toThrow();

    const missing = { ...full };
    delete missing[required[0]];
    expect(() => assertKitSet(missing, FOOTBALL)).toThrow(/missing required kit/);

    expect(() => assertKitSet({ ...full, nope: plainKit('#d21f2b') }, FOOTBALL)).toThrow(/unknown kit slot/);
  });
});

// -----------------------------------------------------------------------------
// Generación
// -----------------------------------------------------------------------------
describe("generación", () => {
  const IDS = Array.from({ length: 200 }, (_, i) => `INST_${i}`);

  it("es determinística por id", () => {
    expect(generateInstitutionKits('X1', FOOTBALL)).toEqual(generateInstitutionKits('X1', FOOTBALL));
    expect(generateIdentity('X1')).toEqual(generateIdentity('X1'));
  });

  it("identidad: 1 a 3 colores, sin chocar entre sí", () => {
    for (const id of IDS) {
      const { colors } = generateIdentity(id);
      expect(colors.length).toBeGreaterThanOrEqual(1);
      expect(colors.length).toBeLessThanOrEqual(3);
      for (let i = 0; i < colors.length; i++)
        for (let j = i + 1; j < colors.length; j++)
          expect(deltaE(colors[i], colors[j])).toBeGreaterThanOrEqual(KIT_PARAMS.clashDeltaE);
    }
  });

  for (const sport of SPORTS as readonly TSport[]) {
    it(`${sport}: cumple el kitSpec, titular = color principal, alternativa distinta de la titular`, () => {
      const spec = specOf(sport);
      const [home, away] = fieldKitSlots(spec).map((s) => s.id);
      for (const id of IDS) {
        const { identity, kits } = generateInstitutionKits(id, spec);
        expect(() => assertKitSet(kits, spec)).not.toThrow();
        expect(kits[home].shirt.base).toBe(identity.colors[0]);
        expect(deltaE(shirtDominant(kits[home]), shirtDominant(kits[away]))).toBeGreaterThanOrEqual(KIT_PARAMS.clashDeltaE);
      }
    });
  }

  it("las especiales se distinguen de las equipaciones de campo", () => {
    for (const id of IDS) {
      const { kits } = generateInstitutionKits(id, FOOTBALL);
      const fieldDominants = fieldKitSlots(FOOTBALL).filter((s) => kits[s.id]).map((s) => shirtDominant(kits[s.id]));
      for (const fd of fieldDominants) expect(deltaE(shirtDominant(kits.gk1), fd)).toBeGreaterThanOrEqual(KIT_PARAMS.clashDeltaE);
    }
  });

  it("aparecen equipaciones opcionales en algunas instituciones y no en todas", () => {
    const withThird = IDS.filter((id) => generateInstitutionKits(id, FOOTBALL).kits.third !== undefined).length;
    expect(withThird).toBeGreaterThan(0);
    expect(withThird).toBeLessThan(IDS.length);
  });

  it("respeta la identidad indicada", () => {
    const { identity, kits } = generateInstitutionKits('X1', FOOTBALL, { colors: ['#74b3e0', '#ffffff'] });
    expect(identity.colors).toEqual(['#74b3e0', '#ffffff']);
    expect(kits.home.shirt.base).toBe('#74b3e0');
  });
});

// -----------------------------------------------------------------------------
// Guardado
// -----------------------------------------------------------------------------
describe("guardado", () => {
  it("ida y vuelta sin pérdidas", () => {
    const { kits } = generateInstitutionKits('X1', FOOTBALL);
    expect(kitSetFromData(kitSetToData(kits))).toEqual(kits);
  });

  it("no escribe claves opcionales vacías", () => {
    const data = kitSetToData({ home: plainKit('#d21f2b') });
    expect(Object.keys(data.home.s)).not.toContain('d');
    expect(Object.keys(data.home.s)).not.toContain('dm');
    expect(Object.keys(data.home.sh!)).toEqual(['b']);
  });
});

// -----------------------------------------------------------------------------
// Elección por partido
// -----------------------------------------------------------------------------
describe("selectMatchKits", () => {
  const RED = '#d21f2b', WHITE = '#ffffff', BLUE = '#1f4fa8', GREEN = '#1b8a3a', YELLOW = '#f5c400';
  const set = (home: string, away: string, gk1: string): IKitSet =>
    ({ home: plainKit(home), away: plainKit(away), gk1: plainKit(gk1) });

  it("sin choque, cada uno usa su titular", () => {
    const sel = selectMatchKits(FOOTBALL, set(RED, WHITE, GREEN), set(BLUE, WHITE, YELLOW));
    expect(sel.home.field).toBe('home');
    expect(sel.away.field).toBe('home');
    expect(sel.awayChanged).toBe(false);
  });

  it("si las titulares chocan, el visitante cambia", () => {
    const sel = selectMatchKits(FOOTBALL, set(RED, WHITE, GREEN), set('#d8222e', WHITE, YELLOW));
    expect(sel.away.field).toBe('away');
    expect(sel.awayChanged).toBe(true);
  });

  it("arquero: si choca con el campo rival, usa su segunda equipación", () => {
    const away: IKitSet = { ...set(BLUE, WHITE, RED), gk2: plainKit(YELLOW) };
    const sel = selectMatchKits(FOOTBALL, set(RED, WHITE, GREEN), away);
    expect(sel.away.special.goalkeeper).toBe('gk2');
    expect(sel.home.special.goalkeeper).toBe('gk1');
  });

  it("líbero: sólo contrasta con su propio equipo", () => {
    const VOLLEY = specOf('volleyball');
    const vSet = (home: string, away: string, l1: string): IKitSet => ({
      home: plainKit(home, VOLLEY.garments), away: plainKit(away, VOLLEY.garments), libero1: plainKit(l1, VOLLEY.garments),
    });
    // El líbero local es del color del rival: no importa.
    const sel = selectMatchKits(VOLLEY, vSet(RED, WHITE, BLUE), vSet(BLUE, WHITE, GREEN));
    expect(sel.home.special.libero).toBe('libero1');
  });
});

// -----------------------------------------------------------------------------
// Institution
// -----------------------------------------------------------------------------
describe("Institution: identidad y equipaciones", () => {
  const make = (extra: Partial<ConstructorParameters<typeof Institution>[0]> = {}) => new Institution({
    id: 'I1', name: 'I1', shortName: 'I1', abrevName: 'I1',
    headquarters: new Town({ i: 'T1', n: 'T1', c: 'C', a: 1, p: 1 }),
    funtationDay: new JDate(1), sport: 'football', ...extra,
  });

  it("sin datos, genera; getData los guarda y releerlos no regenera", () => {
    const inst = make();
    const data = inst.getData();
    expect(data.ic).toEqual(inst.identity.colors);
    expect(kitSetFromData(data.kt!)).toEqual(inst.kits);

    const custom = { colors: ['#74b3e0'] };
    const kits = generateInstitutionKits('OTRO', FOOTBALL, custom).kits;
    const reread = make({ identity: custom, kits });
    expect(reread.kits).toEqual(kits);
  });

  it("kits sin identity, o que no cumplen el spec, se rechazan", () => {
    const kits = generateInstitutionKits('I1', FOOTBALL).kits;
    expect(() => make({ kits })).toThrow(/requires identity/);
    const { home } = kits;
    expect(() => make({ identity: { colors: ['#ffffff'] }, kits: { home } })).toThrow(/missing required kit/);
  });

  it("colores web: fondo = color principal, texto legible", () => {
    const inst = make({ identity: { colors: ['#f5c400'] } });
    expect(inst.webColors()).toEqual({ bg: '#f5c400', fg: KIT_BLACK });
    expect(inst.kitWebColors('home').bg).toBe(shirtDominant(inst.kits.home));
    expect(() => inst.kitWebColors('nope')).toThrow(/has no kit/);
  });
});
