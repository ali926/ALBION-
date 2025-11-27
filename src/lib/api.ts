import {
  BMStatsResponse,
  BMTierStats,
  PriceEntry,
} from "@/types";

const BASE = "https://west.albion-online-data.com/api/v2";

// ------------------------------------------------------------
// Utility: Build Albion ID with enchant (ex: "T6_BOW@3")
// ------------------------------------------------------------
export function withEnchant(itemId: string, enchant: number) {
  if (itemId.includes("@"))
    return itemId.replace(/@\d/, `@${enchant}`);

  return `${itemId}@${enchant}`;
}

// ------------------------------------------------------------
// 1) Fetch CITY PRICES for ALL enchantments (.0 → .4)
// ------------------------------------------------------------
export async function getCityPricesFull(itemId: string) {
  const enchantLevels = [0, 1, 2, 3, 4];

  const urls = enchantLevels.map((e) => {
    const id = withEnchant(itemId, e);

    return `${BASE}/stats/prices/${id}?locations=Bridgewatch,Martlock,Thetford,FtSterling,Lymhurst,Caerleon&qualities=1`;
  });

  try {
    const responses = await Promise.all(urls.map((u) => fetch(u)));
    const data = await Promise.all(responses.map((r) => r.json()));

    // Merge all enchant results into single list
    return data.flat() as PriceEntry[];
  } catch (err) {
    console.error("City price fetch error:", err);
    return [];
  }
}

// ------------------------------------------------------------
// 2) Fetch CITY PRICES for ONE enchant only
// (Used by other pages to reduce traffic)
// ------------------------------------------------------------
export async function getCityPrices(itemId: string) {
  try {
    const url = `${BASE}/stats/prices/${itemId}?locations=Bridgewatch,Martlock,Thetford,FtSterling,Lymhurst,Caerleon&qualities=1`;
    const res = await fetch(url, { cache: "no-store" });
    return await res.json();
  } catch (err) {
    console.error("City price error:", err);
    return [];
  }
}

// ------------------------------------------------------------
// 3) ENHANCED BLACK MARKET (per enchant)
// ------------------------------------------------------------
export async function getBMStatsOne(itemId: string): Promise<BMStatsResponse> {
  try {
    const url = `${BASE}/stats/blackmarket/${itemId}`;
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();

    const tierMap: Record<number, BMTierStats> = {};

    for (const t of Object.keys(data?.tiers || {})) {
      const tierNum = Number(t);
      const entry = data.tiers[t];

      tierMap[tierNum] = {
        tier: tierNum,
        sellPrice: entry?.sell_price_min || 0,
        buyPrice: entry?.buy_price_max || 0,
        volume: entry?.total_volume || 0,
        fillTime: entry?.avg_fill_time || 0,
        demand: entry?.demand || 0,
      };
    }

    return {
      itemId,
      tiers: tierMap,
    };
  } catch (err) {
    console.error("BM stats error:", err);

    return {
      itemId,
      tiers: {},
    };
  }
}

// ------------------------------------------------------------
// 4) Fetch BM Stats for ALL enchant levels (.0 → .4)
// Used for tier-enchant matrix (20 variants)
// ------------------------------------------------------------
export async function getBMStatsFull(itemId: string) {
  const enchantLevels = [0, 1, 2, 3, 4];

  try {
    const results = await Promise.all(
      enchantLevels.map((e) => {
        const id = withEnchant(itemId, e);
        return getBMStatsOne(id);
      })
    );

    return results; // array of 5 enchant responses
  } catch (err) {
    console.error("BM stats full error:", err);
    return [];
  }
}

// ------------------------------------------------------------
// 5) Black Market History (per enchant) — last 10 days
// ------------------------------------------------------------
export async function getBMHistory(itemId: string): Promise<number[]> {
  try {
    const url = `${BASE}/stats/history/${itemId}?locations=Blackmarket&time-scale=24`;
    const res = await fetch(url, { cache: "no-store" });

    const data = await res.json();
    return data.slice(-10).map((d: any) => d.avg_price || 0);
  } catch (err) {
    console.error("BM history error:", err);
    return [];
  }
}

// ------------------------------------------------------------
// 6) Full history for all enchants (.0 → .4)
// ------------------------------------------------------------
export async function getBMHistoryFull(itemId: string) {
  const enchants = [0, 1, 2, 3, 4];

  try {
    const results = await Promise.all(
      enchants.map((e) => {
        const id = withEnchant(itemId, e);
        return getBMHistory(id);
      })
    );

    return results; // [hist0, hist1, hist2, hist3, hist4]
  } catch (err) {
    console.error("BM history full error:", err);
    return [[], [], [], [], []];
  }
}
