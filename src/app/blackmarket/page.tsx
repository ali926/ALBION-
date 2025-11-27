"use client";

import { useState } from "react";
import AlbionCard from "@/components/ui/AlbionCard";
import ItemSelector from "@/components/ItemSelector";
import FavoritesPanel from "@/components/FavoritesPanel";
import BMTable from "@/components/BMTable";
import { calculators } from "@/lib/calculators";

export default function BlackMarketPage() {
  const [item, setItem] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSelectItem = async (itemObj: any) => {
    setItem(itemObj);
    fetchBM(itemObj.itemId);
  };

  const handleSelectFromFavorites = async (it: any) => {
    setItem(it);
    fetchBM(it.itemId);
  };

  async function fetchBM(itemId: string) {
    setLoading(true);

    try {
      const res = await fetch(`/api/bm/full?item=${itemId}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("BM fetch error:", err);
    }

    setLoading(false);
  }

  // ------------------------------
  // Derived analytics
  // ------------------------------

  const avgPrice = data
    ? calculators.bmAveragePrice(data)
    : 0;

  const demandRating = data
    ? calculators.bmDemandScore(data)
    : 0;

  const minSell = data?.minSellOrder || 0;
  const maxBuy = data?.maxBuyOrder || 0;

  const spread =
    minSell && maxBuy ? minSell - maxBuy : 0;

  const roi =
    maxBuy > 0 ? Math.round(((spread / maxBuy) * 100) * 10) / 10 : 0;

  return (
    <div className="p-6 space-y-6">

      <h1 className="albion-title text-2xl">Black Market Analyzer</h1>

      {/* A3 layout with Favorites left */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* LEFT SIDEBAR */}
        <div className="w-full lg:w-[250px]">
          <FavoritesPanel mode="blackmarket" onSelect={handleSelectFromFavorites} />
        </div>

        {/* MAIN AREA */}
        <div className="flex-1 space-y-6">

          <AlbionCard className="p-4 space-y-4">

            <ItemSelector
              selected={item?.localized || ""}
              onSelect={handleSelectItem}
            />

            {item && (
              <p className="text-amber-300 text-sm">
                Selected: {item.localized} ({item.itemId})
              </p>
            )}
          </AlbionCard>

          {loading && (
            <AlbionCard className="p-4">
              <p className="text-amber-300">Fetching Black Market stats…</p>
            </AlbionCard>
          )}

          {item && data && !loading && (
            <>
              <AlbionCard className="p-4 space-y-4">

                <h2 className="albion-title text-xl">BM Summary</h2>

                {/* Analytics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                  <AlbionCard className="p-4 text-center">
                    <p className="text-amber-400 text-sm">Avg Price</p>
                    <p className="text-green-400 font-bold text-lg">
                      {avgPrice?.toLocaleString()}
                    </p>
                  </AlbionCard>

                  <AlbionCard className="p-4 text-center">
                    <p className="text-amber-400 text-sm">Demand Rating</p>
                    <p className="text-amber-300 font-bold text-lg">
                      {demandRating}/10
                    </p>
                  </AlbionCard>

                  <AlbionCard className="p-4 text-center">
                    <p className="text-amber-400 text-sm">Spread</p>
                    <p className={spread >= 0 ? "text-green-400" : "text-red-400"}>
                      {spread.toLocaleString()}
                    </p>
                  </AlbionCard>

                  <AlbionCard className="p-4 text-center">
                    <p className="text-amber-400 text-sm">ROI</p>
                    <p className={roi >= 0 ? "text-green-400" : "text-red-400"}>
                      {roi}%
                    </p>
                  </AlbionCard>
                </div>
              </AlbionCard>

              {/* BM Table View */}
              <AlbionCard className="p-4">
                <h2 className="albion-title text-xl mb-4">Order Book</h2>
                <BMTable data={data} />
              </AlbionCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
