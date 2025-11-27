"use client";

import { useState, useEffect } from "react";
import AlbionCard from "@/components/ui/AlbionCard";
import ItemSelector from "@/components/ItemSelector";
import FavoritesPanel from "@/components/FavoritesPanel";
import { calculators, MOUNT_DB, BAG_DB } from "@/lib/calculators";

export default function CraftingPage() {
  const [item, setItem] = useState<any>(null);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [prices, setPrices] = useState<any>({});
  const [outputPrice, setOutputPrice] = useState(0);

  const [rrCity, setRrCity] = useState(0.15);
  const [rrFocus, setRrFocus] = useState(0);

  const [mount, setMount] = useState("None");
  const [bag, setBag] = useState("None");
  const [porkPie, setPorkPie] = useState(false);
  const [lymhurstBonus, setLymhurstBonus] = useState(false);
  const [avalonianRoads, setAvalonianRoads] = useState(false);
  const [craftCity, setCraftCity] = useState("Caerleon");

  const [loading, setLoading] = useState(false);

  async function loadItemData(itemObj: any) {
    setLoading(true);

    try {
      const r1 = await fetch(`/api/items/recipe?item=${itemObj.itemId}`);
      const recipe = await r1.json();
      setIngredients(recipe?.ingredients || []);

      const ids = [itemObj.itemId, ...recipe.ingredients.map((i: any) => i.id)];
      const r2 = await fetch(`/api/prices/multi?ids=${ids.join(",")}`);
      const priceData = await r2.json();
      setPrices(priceData);

      setOutputPrice(priceData[itemObj.itemId]?.sell_price_min || 0);
    } catch (e) {
      console.error("Crafting error:", e);
    }

    setLoading(false);
  }

  const handleSelectItem = (itemObj: any) => {
    setItem(itemObj);
    loadItemData(itemObj);
  };

  let ingredientCost = 0;
  ingredients.forEach((ing: any) => {
    const p = prices[ing.id]?.buy_price_max || 0;
    ingredientCost += p * ing.count;
  });

  const combinedRR = calculators.combineReturnRates(rrCity, rrFocus);
  const rrCost = calculators.applyReturnRate(ingredientCost, combinedRR);

  const journal = item ? calculators.autoDetectJournal(item) : null;
  const journalValue = journal?.journalSilverValue || 0;

  const weight = item ? calculators.getItemWeight(item) : 0;
  const transportCost = calculators.calcTransportCostClassic({
    itemWeight: weight,
    qty: 1,
    mount,
    bag,
    porkPie,
    lymhurstBonus,
    avalonianRoads,
    fromCity: craftCity,
  });

  const totalCost = rrCost + transportCost;
  const profit = outputPrice - totalCost + journalValue;
  const ppw = weight > 0 ? Math.round((profit / weight) * 10) / 10 : 0;
  const roi = rrCost > 0 ? Math.round(((profit / rrCost) * 100) * 10) / 10 : 0;

  return (
    <div className="space-y-6">

      <h1 className="albion-title text-2xl">Crafting Profit Calculator</h1>

      <div className="flex flex-col lg:flex-row gap-6">

        <div className="w-full lg:w-[250px]">
          <FavoritesPanel mode="crafting" onSelect={handleSelectItem} />
        </div>

        <div className="flex-1 space-y-6">

          <AlbionCard className="p-4 space-y-4">
            <ItemSelector selected={item?.localized || ""} onSelect={handleSelectItem} />
            {item && <p className="text-amber-300 text-sm">Selected: {item.localized} ({item.itemId})</p>}
          </AlbionCard>

          {loading && (
            <AlbionCard className="p-4">
              <p className="text-amber-300">Loading...</p>
            </AlbionCard>
          )}

          {item && !loading && (
            <AlbionCard className="p-4 space-y-5">

              <h2 className="albion-title text-xl">Crafting Summary</h2>

              <div className="space-y-2">
                <label className="text-amber-400 text-sm">City RR</label>
                <input className="albion-input" type="number" min="0" max="0.5" value={rrCity} onChange={e=>setRrCity(Number(e.target.value))} />

                <label className="text-amber-400 text-sm">Focus RR</label>
                <input className="albion-input" type="number" min="0" max="0.5" value={rrFocus} onChange={e=>setRrFocus(Number(e.target.value))} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                
                <div>
                  <label className="text-amber-400 text-sm">City</label>
                  <select className="albion-input" value={craftCity} onChange={e=>setCraftCity(e.target.value)}>
                    <option>Caerleon</option>
                    <option>Bridgewatch</option>
                    <option>Martlock</option>
                    <option>Lymhurst</option>
                    <option>Fort Sterling</option>
                    <option>Thetford</option>
                  </select>
                </div>

                <div>
                  <label className="text-amber-400 text-sm">Mount</label>
                  <select className="albion-input" value={mount} onChange={e=>setMount(e.target.value)}>
                    {Object.keys(MOUNT_DB).map(k=><option key={k}>{k}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-amber-400 text-sm">Bag</label>
                  <select className="albion-input" value={bag} onChange={e=>setBag(e.target.value)}>
                    {Object.keys(BAG_DB).map(k=><option key={k}>{k}</option>)}
                  </select>
                </div>

                <button className={`albion-btn ${porkPie ? "bg-green-700" : "opacity-70"}`} onClick={()=>setPorkPie(!porkPie)}>
                  Pork Pie: {porkPie ? "ON" : "OFF"}
                </button>

                <button className={`albion-btn ${lymhurstBonus ? "bg-green-700" : "opacity-70"}`} onClick={()=>setLymhurstBonus(!lymhurstBonus)}>
                  Lymhurst: {lymhurstBonus ? "ON" : "OFF"}
                </button>

                <button className={`albion-btn ${avalonianRoads ? "bg-green-700" : "opacity-70"}`} onClick={()=>setAvalonianRoads(!avalonianRoads)}>
                  Avalonian: {avalonianRoads ? "ON" : "OFF"}
                </button>
              </div>

              <div className="text-amber-200 text-sm space-y-2 pt-4">
                <p><span className="text-amber-400">Ingredients:</span> {ingredientCost.toLocaleString()}</p>
                <p><span className="text-amber-400">RR Adjusted:</span> {rrCost.toLocaleString()}</p>
                <p><span className="text-amber-400">Transport:</span> {transportCost.toLocaleString()}</p>
                <p><span className="text-amber-400">Journal:</span> {journalValue.toLocaleString()}</p>

                <p className="pt-2 text-lg">
                  <span className="text-amber-400">Profit:</span>
                  <span className={profit >= 0 ? "text-green-400" : "text-red-400"}>
                    {" "}{profit.toLocaleString()}
                  </span>
                </p>

                <p><span className="text-amber-400">ROI:</span> {roi}%</p>
                <p><span className="text-amber-400">PPW:</span> {ppw}</p>
              </div>

            </AlbionCard>
          )}
        </div>
      </div>
    </div>
  );
}
