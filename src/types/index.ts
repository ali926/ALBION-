//
// Basic Market Entry (unchanged)
//
export type PriceEntry = {
  item_id: string;
  city: string;
  sell_price_min?: number;
  buy_price_max?: number;
  sell_quantity?: number;
  buy_quantity?: number;
};

//
// Extended Item Metadata for Crafting / BM / Refining
//
export type ItemMeta = {
  id: string;            // "T4_BAG", "T5_2H_BOW"
  name: string;          // Localized name
  type?: string;         // Weapon, Armor, Offhand, Resource, etc.
  tier?: number;         // 4, 5, 6, 7, 8
  craftable?: boolean;   // For Crafting tab
  refine?: boolean;      // For Refining tab

  // 🔥 NEW FIELDS FOR BLACK MARKET + PROFIT CALC
  weight?: number;       // Official Albion item weight (needed for transport cost)
  category?: string;     // example: "equipment", "resource", "accessory"
  subCategory?: string;  // example: "plate", "leather", "fiber", "ranged"

  // BM specific values (cached per item)
  itemPower?: number;    
  maxStack?: number;     
};

//
// BM Tier Stats (AO2D enhanced API)
//
export type BMTierStats = {
  tier: number;          // 4, 5, 6, 7, 8
  sellPrice: number;     // BM sell price
  buyPrice: number;      // BM buy price (rarely)
  volume: number;        // Order volume
  fillTime: number;      // Avg fill time in minutes
  demand: number;        // Demand score (0–100)
};

//
// Response from getBMStats() (AO2D enhanced)
//
export type BMStatsResponse = {
  itemId: string;
  tiers: Record<number, BMTierStats>; // e.g. { 4: {...}, 5: {...} }
};

//
// Transport Safety & City Data
//
export type CityTransportProfile = {
  city: string;           // Bridgewatch
  risk: "SAFE" | "MEDIUM" | "HIGH";
  distance: number;       // relative distance to Caerleon (1–5 scale)
  multiplier: number;     // (auto computed from risk + distance)
};

//
// Final BM Calculator Result for 1 Tier
//
export type BMTierResult = {
  tier: number;
  bmPrice: number;
  cityPrice: number;
  transportCost: number;

  profit: number;
  profitPerWeight: number;
  roi: number;

  weight: number;
  fillTime: number;
  volume: number;
  demand: number;

  risk: "SAFE" | "MEDIUM" | "HIGH";
};

//
// Final BM Results Structure for the Page
//
export type BMFullResult = {
  autoBestTier: number;          // T4–T8 based on volume-profit ratio
  recommended: BMTierResult;     // Best tier
  allTiers: BMTierResult[];      // T4–T8 table
};
