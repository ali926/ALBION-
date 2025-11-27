"use client";

import { useState } from "react";
import AlbionCard from "@/components/ui/AlbionCard";
import ItemSelector from "@/components/ItemSelector";
import FavoritesPanel from "@/components/FavoritesPanel";
import { calculators, MOUNT_DB, BAG_DB } from "@/lib/calculators";

export default function FlippingPage() {
  const [item, setItem] = useState<any>(null);
  const [market, setMarket] = useState<any>(null);

  const [fromCity, setFromCity] = useState("Bridgewatch");
  const [toCity, setToCity] = useState("Caerleon");

  const [mount, setMount] = useState("None");
  const [bag, setBag] = useState("None");

  const [porkPie, setPorkPie] = useState(false);
  const [lymhurstBonus, setLymhurstBonus] = useState(false);
  const [avalonianRoads, setAvalonianRoads] = useState(false);

  const [loading, setLoading] = useState(false);

  const CITIES = [
    "Caerleon",
    "Bridgewatch",
    "Martlock",
    "Fort Sterling",
    "Lymhurst",
    "Thetford",
    "BlackMarket"
  ];

  // ---------------- Fetch multi city prices ----------------
  const handleSelectItem = async (itemObj: any) => {
    setItem(itemObj);
    fetchMarket(itemObj.itemId);
  };

  const handleSelectFromFavorites = async (it: any) => {
    setItem(it);
    fetchMarket(it.itemId);
  };

  async function fetchMarket(itemId: string) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/prices/multi-city?item=${itemId}&cities=${CITIES.join(",")}`
      );
      const data = await res.json();
      setMarket(data);
    } catch (e) {
      console.error("Flip market fetch error:", e);
    }
    setLoading(false);
  }

  // ---------------- Best Buy / Best Sell ----------------
  let bestBuy: any = null;
  let bestSell: any = null;

  if (market && item) {
    bestBuy = calculators.getBestBuyOrder(market);
    bestSell = calculators.getBestSellOrder(market);
  }

  const weight = item ? calculators.getItemWeight(item) : 0;

  const transportCost = item
    ? calculators.calcTransportCostClassic({
        itemWeight: weight,
        qty: 1,
        mount,
        bag,
        porkPie,
        lymhurstBonus,
        avalonianRoads,
        fromCity
      })
    : 0;

  const buyPrice = bestBuy?.price || 0;
  const sellPrice = bestSell?.price || 0;

  const sellAfterTax = Math.floor(sellPrice * 0.935);
  const profit = sellAfterTax - buyPrice - transportCost;

  const roi =
    buyPrice > 0
      ? Math.round(((profit / buyPrice) * 100) * 10) / 10
      : 0;

  const ppw =
    weight > 0
      ? Math.round((profit / weight) * 10) / 10
      : 0;

  return (
    <div className="space-y-6">

      <h1 className="albion-title text-2xl">Market Flipping Scanner</h1>

      {/* A3 Responsive layout */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* LEFT SIDEBAR */}
        <div className="w-full lg:w-[250px]">
          <FavoritesPanel mode="flipping" onSelect={handleSelectFromFavorites} />
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 space-y-6">

          {/* Item Selection */}
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

          {/* LOADING */}
          {loading && (
            <AlbionCard className="p-4">
              <p className="text-amber-300">Fetching all city prices...</p>
            </AlbionCard>
          )}

          {/* SUMMARY BLOCK */}
          {item && market && !loading && (
            <AlbionCard className="p-4 space-y-6">

              <h2 className="albion-title text-xl">Flip Summary</h2>

              {/* BEST BUY / BEST SELL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <AlbionCard className="p-4">
                  <h3 className="text-amber-300 font-bold text-lg">Best Buy</h3>
                  <p className="text-amber-200 mt-2">
                    City: <span className="text-amber-400">{bestBuy?.city}</span>
                  </p>
                  <p className="text-amber-200">
                    Price:{" "}
                    <span className="text-green-400 font-bold">
                      {bestBuy?.price?.toLocaleString()}
                    </span>
                  </p>
                </AlbionCard>

                <AlbionCard className="p-4">
                  <h3 className="text-amber-300 font-bold text-lg">Best Sell</h3>
                  <p className="text-amber-200 mt-2">
                    City: <span className="text-amber-400">{bestSell?.city}</span>
                  </p>
                  <p className="text-amber-200">
                    Price:{" "}
                    <span className="text-green-400 font-bold">
                      {bestSell?.price?.toLocaleString()}
                    </span>
                  </p>
                </AlbionCard>

              </div>

              {/* TRANSPORT CONTROLS */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">

                <div>
                  <label className="text-amber-400 text-sm">From City</label>
                  <select
                    className="albion-input"
                    value={fromCity}
                    onChange={(e) => setFromCity(e.target.value)}
                  >
                    {CITIES.filter((c) => c !== "BlackMarket").map((city) => (
                      <option key={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-amber-400 text-sm">Mount</label>
                  <select
                    className="albion-input"
                    value={mount}
                    onChange={(e) => setMount(e.target.value)}
                  >
                    {Object.keys(MOUNT_DB).map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-amber-400 text-sm">Bag</label>
                  <select
                    className="albion-input"
                    value={bag}
                    onChange={(e) => setBag(e.target.value)}
                  >
                    {Object.keys(BAG_DB).map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                </div>

                <button
                  className={`albion-btn ${porkPie ? "bg-green-700" : "opacity-70"}`}
                  onClick={() => setPorkPie(!porkPie)}
                >
                  Pork Pie: {porkPie ? "ON" : "OFF"}
                </button>

                <button
                  className={`albion-btn ${lymhurstBonus ? "bg-green-700" : "opacity-70"}`}
                  onClick={() => setLymhurstBonus(!lymhurstBonus)}
                >
                  Lymhurst: {lymhurstBonus ? "ON" : "OFF"}
                </button>

                <button
                  className={`albion-btn ${avalonianRoads ? "bg-green-700" : "opacity-70"}`}
                  onClick={() => setAvalonianRoads(!avalonianRoads)}
                >
                  Avalonian: {avalonianRoads ? "ON" : "OFF"}
                </button>

              </div>

              {/* FINAL SUMMARY */}
              <div className="pt-4 space-y-2 text-amber-200 text-sm">

                <p>
                  <span className="text-amber-400 font-semibold">Buy Price:</span>{" "}
                  {buyPrice.toLocaleString()}
                </p>

                <p>
                  <span className="text-amber-400 font-semibold">Sell After Tax:</span>{" "}
                  {sellAfterTax.toLocaleString()}
                </p>

                <p>
                  <span className="text-amber-400 font-semibold">Transport Cost:</span>{" "}
                  {transportCost.toLocaleString()}
                </p>

                <p className="text-lg pt-2">
                  <span className="text-amber-400 font-semibold">Profit:</span>{" "}
                  <span className={profit >= 0 ? "text-green-400" : "text-red-400"}>
                    {profit.toLocaleString()}
                  </span>
                </p>

                <p>
                  <span className="text-amber-400 font-semibold">PPW:</span> {ppw}
                </p>

                <p>
                  <span className="text-amber-400 font-semibold">ROI:</span> {roi}%
                </p>

              </div>

            </AlbionCard>
          )}
        </div>
      </div>
    </div>
  );
}
