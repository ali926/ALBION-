"use client";

import { useState, useMemo } from "react";
import { calculators, MOUNT_DB, BAG_DB } from "@/lib/calculators";
import AlbionCard from "@/components/ui/AlbionCard";

export default function BMTable({
  item,
  bmData,
  cityPrices,
}: {
  item: any;
  bmData: any[];
  cityPrices: any[];
}) {
  const [mount, setMount] = useState("None");
  const [bag, setBag] = useState("None");
  const [porkPie, setPorkPie] = useState(false);
  const [lymhurstBonus, setLymhurstBonus] = useState(false);
  const [avalonianRoads, setAvalonianRoads] = useState(false);

  const [sortBy, setSortBy] = useState("profit");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
  };

  /** ----------------------------------------
   *  COMPUTED TABLE ROWS (auto best-tier logic)
   * ---------------------------------------- */
  const rows = useMemo(() => {
    if (!item || !bmData?.length) return [];

    const bmPrice = Math.max(
      ...bmData.map((tier: any) => tier.sellPrice || 0)
    );

    return Object.values(cityPrices || []).map((p: any) => {
      const city = p.city;

      const weight = calculators.getItemWeight(item);
      const transport = calculators.calcTransportCostClassic({
        itemWeight: weight,
        qty: 1,
        mount,
        bag,
        porkPie,
        lymhurstBonus,
        avalonianRoads,
        fromCity: city,
      });

      const journal = calculators.autoDetectJournal(item);
      const journalValue = journal.journalSilverValue;

      const cityBuy = p.buy_price_max || 0;
      const profit = bmPrice - cityBuy - transport + journalValue;

      return {
        city,
        cityBuy,
        transport,
        journalValue,
        bmPrice,
        profit,
        ppw: weight ? Math.round((profit / weight) * 10) / 10 : 0,
        roi:
          cityBuy > 0
            ? Math.round(((profit / cityBuy) * 100) * 10) / 10
            : 0,
      };
    });
  }, [item, bmData, cityPrices, mount, bag, porkPie, lymhurstBonus, avalonianRoads]);

  /** ----------------------------------------
   *  SORT rows
   * ---------------------------------------- */
  const sorted = useMemo(() => {
    return [...rows].sort((a: any, b: any) => {
      const v1 = a[sortBy];
      const v2 = b[sortBy];

      if (v1 === v2) return 0;
      if (sortDir === "asc") return v1 > v2 ? 1 : -1;
      return v1 < v2 ? 1 : -1;
    });
  }, [rows, sortBy, sortDir]);

  const bestRow = sorted[0];

  /** ----------------------------------------
   *  UI
   * ---------------------------------------- */
  return (
    <AlbionCard className="mt-6 p-4 space-y-4">
      <h2 className="albion-title">Black Market Calculator</h2>

      {/* CONTROLS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Mount */}
        <div className="space-y-1">
          <label className="text-amber-400 text-sm">Mount</label>
          <select
            className="albion-input"
            value={mount}
            onChange={(e) => setMount(e.target.value)}
          >
            {Object.keys(MOUNT_DB).map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Bag */}
        <div className="space-y-1">
          <label className="text-amber-400 text-sm">Bag</label>
          <select
            className="albion-input"
            value={bag}
            onChange={(e) => setBag(e.target.value)}
          >
            {Object.keys(BAG_DB).map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Pork Pie */}
        <div className="space-y-1">
          <label className="text-amber-400 text-sm">Pork Pie</label>
          <button
            className={`albion-btn w-full ${
              porkPie ? "bg-green-700" : "opacity-70"
            }`}
            onClick={() => setPorkPie(!porkPie)}
          >
            {porkPie ? "Enabled" : "Disabled"}
          </button>
        </div>

        {/* Lymhurst Bonus */}
        <div className="space-y-1">
          <label className="text-amber-400 text-sm">Lymhurst Bonus</label>
          <button
            className={`albion-btn w-full ${
              lymhurstBonus ? "bg-green-700" : "opacity-70"
            }`}
            onClick={() => setLymhurstBonus(!lymhurstBonus)}
          >
            {lymhurstBonus ? "Enabled" : "Disabled"}
          </button>
        </div>

        {/* Avalonian Roads */}
        <div className="space-y-1">
          <label className="text-amber-400 text-sm">Avalonian Roads</label>
          <button
            className={`albion-btn w-full ${
              avalonianRoads ? "bg-green-700" : "opacity-70"
            }`}
            onClick={() => setAvalonianRoads(!avalonianRoads)}
          >
            {avalonianRoads ? "Enabled" : "Disabled"}
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto mt-4">
        <table className="albion-table min-w-full text-amber-200 text-sm">
          <thead className="albion-table-header">
            <tr>
              {[
                ["city", "City"],
                ["cityBuy", "Buy Price"],
                ["transport", "Transport"],
                ["journalValue", "Journal"],
                ["bmPrice", "BM Price"],
                ["profit", "Profit"],
                ["ppw", "PPW"],
                ["roi", "ROI %"],
              ].map(([key, label]) => (
                <th
                  key={key}
                  className="px-3 py-2 cursor-pointer"
                  onClick={() => handleSort(key)}
                >
                  {label}
                  {sortBy === key ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sorted.map((row: any, index: number) => (
              <tr
                key={row.city}
                className={`albion-table-row ${
                  index === 0 ? "best-row-highlight" : ""
                }`}
              >
                <td className="px-3 py-2">{row.city}</td>
                <td className="px-3 py-2">{row.cityBuy.toLocaleString()}</td>
                <td className="px-3 py-2">{row.transport.toLocaleString()}</td>
                <td className="px-3 py-2">{row.journalValue.toLocaleString()}</td>
                <td className="px-3 py-2">{row.bmPrice.toLocaleString()}</td>
                <td
                  className={`px-3 py-2 ${
                    row.profit >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {row.profit.toLocaleString()}
                </td>
                <td className="px-3 py-2">{row.ppw}</td>
                <td className="px-3 py-2">{row.roi}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AlbionCard>
  );
}
