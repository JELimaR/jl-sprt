import { IKitSpec, KitGarment } from "jl-sprt-core";
import { isHexColor } from "./colorMath";
import { COLLAR_TYPES, IInstitutionIdentity, IKitDesign, IKitSet, SHIRT_PATTERNS } from "./kitTypes";

const fail = (msg: string): never => { throw new Error(`invalid kit: ${msg}`); };

function assertHex(where: string, value: unknown): void {
  if (!isHexColor(value)) fail(`${where} must be a '#rrggbb' color (got '${String(value)}')`);
}

/** 1 a 4 colores institucionales, todos hex válidos. */
export function assertIdentity(identity: IInstitutionIdentity): void {
  if (!identity || !Array.isArray(identity.colors)) fail('identity.colors must be a list');
  const n = identity.colors.length;
  if (n < 1 || n > 4) fail(`identity must have 1 to 4 colors (got ${n})`);
  identity.colors.forEach((c, i) => assertHex(`identity.colors[${i}]`, c));
}

/**
 * Valida una equipación contra las prendas del deporte: camiseta completa, y
 * pantalón y medias presentes si y sólo si el deporte los declara.
 */
export function assertKitDesign(slotId: string, kit: IKitDesign, garments: readonly KitGarment[]): void {
  const at = (p: string) => `${slotId}.${p}`;
  if (!kit || !kit.shirt) fail(`${slotId} must have a shirt`);

  const s = kit.shirt;
  if (!SHIRT_PATTERNS.includes(s.pattern)) fail(`${at('shirt.pattern')}: unknown pattern '${s.pattern}'`);
  assertHex(at('shirt.base'), s.base);
  if (s.pattern === 'plain') {
    if (s.detail !== undefined) assertHex(at('shirt.detail'), s.detail);
  } else {
    if (s.detail === undefined) fail(`${at('shirt.detail')} is required for pattern '${s.pattern}'`);
    assertHex(at('shirt.detail'), s.detail);
  }
  if (s.dominant !== undefined) assertHex(at('shirt.dominant'), s.dominant);
  assertHex(at('shirt.sleeves'), s.sleeves);
  assertHex(at('shirt.cuffs'), s.cuffs);
  if (!s.collar) fail(`${at('shirt.collar')} is required`);
  if (!COLLAR_TYPES.includes(s.collar.type)) fail(`${at('shirt.collar.type')}: unknown type '${s.collar.type}'`);
  assertHex(at('shirt.collar.color'), s.collar.color);

  const wantsShorts = garments.includes('shorts');
  if (wantsShorts !== (kit.shorts !== undefined)) {
    fail(`${at('shorts')} must be ${wantsShorts ? 'present' : 'absent'} for this sport`);
  }
  if (kit.shorts) {
    assertHex(at('shorts.base'), kit.shorts.base);
    if (kit.shorts.trim !== undefined) assertHex(at('shorts.trim'), kit.shorts.trim);
  }

  const wantsSocks = garments.includes('socks');
  if (wantsSocks !== (kit.socks !== undefined)) {
    fail(`${at('socks')} must be ${wantsSocks ? 'present' : 'absent'} for this sport`);
  }
  if (kit.socks) {
    assertHex(at('socks.base'), kit.socks.base);
    if (kit.socks.band !== undefined) assertHex(at('socks.band'), kit.socks.band);
  }
}

/**
 * Valida las equipaciones de una institución contra el `IKitSpec` de su deporte:
 * están todas las obligatorias, no hay ids desconocidos y cada una es válida.
 */
export function assertKitSet(kits: IKitSet, spec: IKitSpec): void {
  if (!kits || typeof kits !== 'object') fail('kits must be an object');
  const known = new Set(spec.slots.map((s) => s.id));
  for (const id of Object.keys(kits)) {
    if (!known.has(id)) fail(`unknown kit slot '${id}' (valid: ${[...known].join(', ')})`);
  }
  for (const slot of spec.slots) {
    const kit = kits[slot.id];
    if (kit === undefined) {
      if (slot.required) fail(`missing required kit '${slot.id}'`);
      continue;
    }
    assertKitDesign(slot.id, kit, spec.garments);
  }
}
