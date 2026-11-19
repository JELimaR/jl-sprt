import { HexColor } from "./colorMath";
import { CollarType, IKitDesign, IKitSet, ShirtPattern } from "./kitTypes";

/**
 * Formato de guardado de una equipación, con claves cortas como el resto de
 * `IInstitutionData`. Se guarda la configuración, nunca una imagen.
 */
export interface IKitData {
  /** Camiseta. */
  s: {
    p: ShirtPattern;   // pattern
    b: HexColor;       // base
    d?: HexColor;      // detail
    dm?: HexColor;     // dominant
    sl: HexColor;      // sleeves
    cf: HexColor;      // cuffs
    ct: CollarType;    // collar type
    cc: HexColor;      // collar color
  };
  /** Pantalón. */
  sh?: { b: HexColor; t?: HexColor };
  /** Medias. */
  so?: { b: HexColor; bd?: HexColor };
}

/** Equipaciones guardadas, por id de equipación. */
export type IKitSetData = Record<string, IKitData>;

export function kitDesignToData(kit: IKitDesign): IKitData {
  const s = kit.shirt;
  const out: IKitData = {
    s: { p: s.pattern, b: s.base, sl: s.sleeves, cf: s.cuffs, ct: s.collar.type, cc: s.collar.color },
  };
  if (s.detail !== undefined) out.s.d = s.detail;
  if (s.dominant !== undefined) out.s.dm = s.dominant;
  if (kit.shorts) {
    out.sh = { b: kit.shorts.base };
    if (kit.shorts.trim !== undefined) out.sh.t = kit.shorts.trim;
  }
  if (kit.socks) {
    out.so = { b: kit.socks.base };
    if (kit.socks.band !== undefined) out.so.bd = kit.socks.band;
  }
  return out;
}

export function kitDesignFromData(data: IKitData): IKitDesign {
  const s = data.s;
  const out: IKitDesign = {
    shirt: {
      pattern: s.p, base: s.b, sleeves: s.sl, cuffs: s.cf,
      collar: { type: s.ct, color: s.cc },
    },
  };
  if (s.d !== undefined) out.shirt.detail = s.d;
  if (s.dm !== undefined) out.shirt.dominant = s.dm;
  if (data.sh) {
    out.shorts = { base: data.sh.b };
    if (data.sh.t !== undefined) out.shorts.trim = data.sh.t;
  }
  if (data.so) {
    out.socks = { base: data.so.b };
    if (data.so.bd !== undefined) out.socks.band = data.so.bd;
  }
  return out;
}

export function kitSetToData(kits: IKitSet): IKitSetData {
  const out: IKitSetData = {};
  for (const [id, kit] of Object.entries(kits)) out[id] = kitDesignToData(kit);
  return out;
}

export function kitSetFromData(data: IKitSetData): IKitSet {
  const out: IKitSet = {};
  for (const [id, kit] of Object.entries(data)) out[id] = kitDesignFromData(kit);
  return out;
}
