/**
 * src/lib/calculators.ts
 *
 * Advanced calculators for:
 * - Transport cost (Classic transport formula)
 * - Mount & bag weight bonuses
 * - Auto-detect journal values
 * - Return Rate (RR) helpers for crafting/refining
 * - Best city / best route detection for BM & crafting
 *
 * Drop-in replacement for your project (TypeScript).
 */

import {
  PriceEntry,
  BMStatsResponse,
  ItemMeta,
  CityTransportProfile,
  BMTierStats,
} from "@/types";

/* ------------------------------------------------------------------
   Constants: default route multipliers and base unit costs
   ------------------------------------------------------------------ */
export const BASE_SILVER_PER_WEIGHT = 5; // base silver per weight unit (configurable)
export const DEFAULT_ROUTE_MULTIPLIERS: Record<string, number> = {
  Caerleon: 1.0,
  Bridgewatch: 1.4,
  Martlock: 1.5,
  Lymhurst: 1.3,
  "Fort Sterling": 1.6,
  Thetford: 1.4,
};

/* ------------------------------------------------------------------
   Mount Database (Exact Individual Mount List)
   Each mount defines a weight capacity multiplier or bonus factor.
   Values are representative and configurable.
   ------------------------------------------------------------------ */
export type MountKey =
  | "None"
  | "T3_Ox"
  | "T4_Ox"
  | "T5_Ox"
  | "T6_Ox"
  | "T7_Ox"
  | "T8_Ox"
  | "Elite_Ox"
  | "Transport_Mammoth"
  | "Spectral_Ox"
  | "Giant_Stag"
  | "Swiftclaw";

export const MOUNT_DB: Record<MountKey, { carryMultiplier: number; note?: string }> =
  {
    None: { carryMultiplier: 1.0, note: "No mount" },
    T3_Ox: { carryMultiplier: 1.8 },
    T4_Ox: { carryMultiplier: 2.0 },
    T5_Ox: { carryMultiplier: 2.2 },
    T6_Ox: { carryMultiplier: 2.4 },
    T7_Ox: { carryMultiplier: 2.6 },
    T8_Ox: { carryMultiplier: 2.8 },
    Elite_Ox: { carryMultiplier: 3.4 },
    Transport_Mammoth: { carryMultiplier: 6.0, note: "Huge carry capacity" },
    Spectral_Ox: { carryMultiplier: 3.0 },
    Giant_Stag: { carryMultiplier: 1.6 },
    Swiftclaw: { carryMultiplier: 1.3 },
  };

/* ------------------------------------------------------------------
   Bag bonuses: represents extra carry multiplier from bags / backpacks
   - Use realistic values; these multiply total carry capacity.
   ------------------------------------------------------------------ */
export type BagKey = "None" | "T2_Bag" | "T3_Bag" | "T4_Bag" | "T5_Bag" | "T6_Bag";
export const BAG_DB: Record<BagKey, { multiplier: number; note?: string }> = {
  None: { multiplier: 1.0 },
  T2_Bag: { multiplier: 1.05 },
  T3_Bag: { multiplier: 1.1 },
  T4_Bag: { multiplier: 1.15 },
  T5_Bag: { multiplier: 1.25 },
  T6_Bag: { multiplier: 1.35 },
};

/* ------------------------------------------------------------------
   Other manual bonuses (pork pie, Lymhurst, Avalonian roads)
   - Pork pie: temporary carry multiplier
   - Lymhurst: city talent that reduces weight usage / increases carry (modeled as multiplier)
   - Avalonian roads / carrier bonus: additional multiplier when applicable
   ------------------------------------------------------------------ */
export const PORK_PIE_MULTIPLIER = 1.12; // 12% temporary carry bonus (example)
export const LYM_HURST_BONUS = 1.05; // 5% carry bonus if applicable
export const AVALONIAN_ROADS_MULTIPLIER = 1.2; // 20% bonus for roads carrier

/* ------------------------------------------------------------------
   Default weights fallback table (basic kinds)
   Extend this with your full weight DB or integrate your weight DB file.
   ------------------------------------------------------------------ */
export const WEIGHT_FALLBACK_TABLE: Record<string, number> = {
  BAG: 1.0,
  BOW: 4.0,
  ARMOR: 6.0,
  SWORD: 5.0,
  PLATE: 8.0,
  TOOL: 2.0,
  RESOURCE: 1.0,
  DEFAULT: 3.0,
};

/* ------------------------------------------------------------------
   Helper: normalize item id to find tier / base type
   ------------------------------------------------------------------ */
export function extractTierFromItemId(itemId: string): number | null {
  // Matches T4, T5, T6, T7, T8
  const m = itemId.match(/T([4-8])/);
  if (!m) return null;
  return Number(m[1]);
}

export function extractEnchantFromItemId(itemId: string): number {
  const m = itemId.match(/@(\d)/);
  if (!m) return 0;
  return Number(m[1]);
}

/* ------------------------------------------------------------------
   Weight helpers
   - getItemWeight: attempts to use item.weight if present on ItemMeta,
     otherwise falls back to the WEIGHT_FALLBACK_TABLE.
   ------------------------------------------------------------------ */
export function getItemWeight(item: ItemMeta | string): number {
  if (!item) return WEIGHT_FALLBACK_TABLE.DEFAULT;

  // If passed an ItemMeta
  if (typeof item !== "string") {
    if (typeof item.weight === "number" && item.weight > 0) return item.weight;
    if (item.id) {
      // try fallback by id patterns (BOW, SWORD, ARMOR, BAG, TOOL, RESOURCE)
      const id = item.id.toUpperCase();
      for (const key of Object.keys(WEIGHT_FALLBACK_TABLE)) {
        if (key === "DEFAULT") continue;
        if (id.includes(key)) return WEIGHT_FALLBACK_TABLE[key];
      }
    }
  } else {
    // item is string (itemId)
    const id = (item as string).toUpperCase();
    for (const key of Object.keys(WEIGHT_FALLBACK_TABLE)) {
      if (key === "DEFAULT") continue;
      if (id.includes(key)) return WEIGHT_FALLBACK_TABLE[key];
    }
  }

  return WEIGHT_FALLBACK_TABLE.DEFAULT;
}

/* ------------------------------------------------------------------
   Transport formula (Classic Transport Formula)
   transportCost = itemWeight × qty × effectiveCarryMultiplier × routeMultiplier × baseSilverPerWeight
   - effectiveCarryMultiplier = 1 / (mountCarryMultiplier × bagMultiplier × otherBonuses)
     (we model it as the cost scaling by route and inversely to your carry capacity)
   ------------------------------------------------------------------ */

export function calcEffectiveCarryMultiplier(options: {
  mount?: MountKey;
  bag?: BagKey;
  porkPie?: boolean;
  lymhurstBonus?: boolean;
  avalonianRoads?: boolean;
}): number {
  const mount = options.mount || ("None" as MountKey);
  const bag = options.bag || ("None" as BagKey);

  const mountMultiplier = MOUNT_DB[mount]?.carryMultiplier || 1.0;
  const bagMultiplier = BAG_DB[bag]?.multiplier || 1.0;

  let bonusMultiplier = 1.0;
  if (options.porkPie) bonusMultiplier *= PORK_PIE_MULTIPLIER;
  if (options.lymhurstBonus) bonusMultiplier *= LYM_HURST_BONUS;
  if (options.avalonianRoads) bonusMultiplier *= AVALONIAN_ROADS_MULTIPLIER;

  // Total carry factor
  const totalCarry = mountMultiplier * bagMultiplier * bonusMultiplier;

  // Effective cost multiplier = 1 / totalCarry (more carry reduces transport cost)
  // We clamp to reasonable range to avoid zero division
  const effective = Math.max(0.25, 1 / Math.max(1, totalCarry));
  return effective;
}

export function calcTransportCostClassic(params: {
  itemWeight: number;
  qty?: number;
  mount?: MountKey;
  bag?: BagKey;
  porkPie?: boolean;
  lymhurstBonus?: boolean;
  avalonianRoads?: boolean;
  fromCity?: string; // e.g. 'Bridgewatch'
  baseSilverPerWeight?: number;
}): number {
  const qty = params.qty || 1;
  const routeMultiplier =
    DEFAULT_ROUTE_MULTIPLIERS[params.fromCity || "Caerleon"] || 1.0;
  const baseSilver = params.baseSilverPerWeight ?? BASE_SILVER_PER_WEIGHT;

  const effectiveCarry = calcEffectiveCarryMultiplier({
    mount: params.mount,
    bag: params.bag,
    porkPie: !!params.porkPie,
    lymhurstBonus: !!params.lymhurstBonus,
    avalonianRoads: !!params.avalonianRoads,
  });

  // transportCost = itemWeight × qty × routeMultiplier × baseSilver × effectiveCarry
  // We round to nearest integer since silver is discrete
  const raw = params.itemWeight * qty * routeMultiplier * baseSilver * effectiveCarry;
  const cost = Math.max(0, Math.round(raw));
  return cost;
}

/* ------------------------------------------------------------------
   Journals: auto-detect basic journal type & silver value heuristics
   - This is a heuristic: for each item category we return a journal type
   - You can extend with a precise mapping to journal silver values
   ------------------------------------------------------------------ */
export type JournalInfo = {
  journalKey: string;
  journalSilverValue: number; // approximate silver value of journal when sold
};

// Basic mapping of categories -> journalKey, journalSilverValue (example numbers)
export function autoDetectJournal(item: ItemMeta): JournalInfo {
  const id = (item.id || "").toUpperCase();
  const type = (item.type || "").toLowerCase();

  // Heuristic rules (expand as needed)
  if (id.includes("SWORD") || type.includes("weapon")) {
    return { journalKey: "Warrior", journalSilverValue: 4500 };
  }
  if (id.includes("BOW") || type.includes("ranged")) {
    return { journalKey: "Ranger", journalSilverValue: 4200 };
  }
  if (id.includes("ROBE") || type.includes("cloth") || type.includes("magic")) {
    return { journalKey: "Mage", journalSilverValue: 4300 };
  }
  if (id.includes("PLATE") || id.includes("ARMOR")) {
    return { journalKey: "Blacksmith", journalSilverValue: 4800 };
  }
  if (type.includes("resource") || id.includes("ORE") || id.includes("WOOD") || id.includes("FIBER")) {
    return { journalKey: "Gatherer", journalSilverValue: 2000 };
  }

  // Default
  return { journalKey: "General", journalSilverValue: 1500 };
}

/* ------------------------------------------------------------------
   Return Rate (RR) helpers
   - RR is typically provided as a decimal (e.g., 0.24 = 24%)
   - We support combining city RR bonuses and focus points or mastery effects
   ------------------------------------------------------------------ */
export function applyReturnRate(cost: number, rr: number): number {
  // Effective cost after RR
  const effective = Math.round(cost * (1 - rr));
  return effective;
}

export function combineReturnRates(rrBase: number, rrBonus: number): number {
  // Combined multiplicative style (for example)
  // final RR = 1 - (1 - rrBase) * (1 - rrBonus)
  const combined = 1 - (1 - rrBase) * (1 - rrBonus);
  return Number(combined.toFixed(4));
}

/* ------------------------------------------------------------------
   Best-city selection & optimization helpers
   - Given price entries across cities and BM price, pick best city to buy/craft/refine
   - We consider city buy/sell price, transport cost, and approximate net profit
   ------------------------------------------------------------------ */
export type CityComparisonRow = {
  city: string;
  citySellPrice: number; // sell_price_min in that city (you can sell to market)
  cityBuyPrice: number; // buy price (buy from market)
  transportCost: number;
  journalValue: number;
  netProfitToBM: number;
  roi: number;
  riskMultiplier: number;
};

export function buildCityComparison(
  item: ItemMeta,
  prices: PriceEntry[],
  bmPrice: number,
  qty = 1,
  options?: {
    mount?: MountKey;
    bag?: BagKey;
    porkPie?: boolean;
    lymhurstBonus?: boolean;
    avalonianRoads?: boolean;
    baseSilverPerWeight?: number;
  }
): CityComparisonRow[] {
  // Convert city price entries to a map by city; we prefer sell_price_min for selling (what city pays)
  const cityMap: Record<string, PriceEntry> = {};
  prices.forEach((p) => {
    cityMap[p.city] = p;
  });

  const rows: CityComparisonRow[] = [];

  for (const city of Object.keys(DEFAULT_ROUTE_MULTIPLIERS)) {
    const entry = cityMap[city];
    const citySell = entry?.sell_price_min || 0;
    const cityBuy = entry?.buy_price_max || 0;

    const weight = getItemWeight(item);
    const transport = calcTransportCostClassic({
      itemWeight: weight,
      qty,
      mount: options?.mount,
      bag: options?.bag,
      porkPie: !!options?.porkPie,
      lymhurstBonus: !!options?.lymhurstBonus,
      avalonianRoads: !!options?.avalonianRoads,
      fromCity: city,
      baseSilverPerWeight: options?.baseSilverPerWeight,
    });

    // journal detection and approximate silver value (applies if crafting -> BM chain)
    const journal = autoDetectJournal(item);
    const journalSilver = journal.journalSilverValue || 0;

    // Net profit if buy in city and sell to BM (bmPrice is BM sell price that BM will pay)
    // netProfitToBM = (BM pay) - (cityBuy) - transport - optional taxes
    const netProfit = Math.round(bmPrice * qty - cityBuy * qty - transport - journalSilver);

    // ROI: relative to cityBuy
    const roi = cityBuy > 0 ? (netProfit / (cityBuy * qty)) * 100 : 0;

    rows.push({
      city,
      citySellPrice: citySell,
      cityBuyPrice: cityBuy,
      transportCost: transport,
      journalValue: journalSilver,
      netProfitToBM: netProfit,
      roi: Math.round(roi * 10) / 10,
      riskMultiplier: DEFAULT_ROUTE_MULTIPLIERS[city] || 1,
    });
  }

  // Sort by netProfitToBM descending
  rows.sort((a, b) => b.netProfitToBM - a.netProfitToBM);

  return rows;
}

/* ------------------------------------------------------------------
   Small utility: pick best city given city comparison rows
   ------------------------------------------------------------------ */
export function pickBestCityForBM(rows: CityComparisonRow[]): CityComparisonRow | null {
  if (!rows || rows.length === 0) return null;
  return rows[0];
}

/* ------------------------------------------------------------------
   BM Tier helpers (wrap / adapt BMTierStats)
   ------------------------------------------------------------------ */
export function calcProfitToBMFromTier(
  tierStat: BMTierStats,
  cityBuyPrice: number,
  transportCost: number,
  qty = 1
) {
  // BM pays sellPrice (tierStat.sellPrice), but BM buy/sell conventions vary.
  // Using sellPrice as BM payout vs city buy price
  const payout = tierStat.sellPrice * qty;
  const cost = cityBuyPrice * qty + transportCost;
  const profit = Math.round(payout - cost);
  return profit;
}

/* ------------------------------------------------------------------
   Export summary of high-level calculation helpers
   ------------------------------------------------------------------ */
export const calculators = {
  // weights
  getItemWeight,
  getWeightFallback: (id: string) => getItemWeight(id),

  // transport
  calcEffectiveCarryMultiplier,
  calcTransportCostClassic,

  // journals & rr
  autoDetectJournal,
  applyReturnRate,
  combineReturnRates,

  // best city / comparison
  buildCityComparison,
  pickBestCityForBM,

  // tier helpers
  calcProfitToBMFromTier,
  extractTierFromItemId,
  extractEnchantFromItemId,
};
