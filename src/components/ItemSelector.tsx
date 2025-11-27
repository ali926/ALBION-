"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function ItemSelector({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (item: any) => void;
}) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [recents, setRecents] = useState<any[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Detect mode based on URL
  let mode: "crafting" | "refining" | "flipping" | "blackmarket" = "flipping";
  if (pathname.includes("crafting")) mode = "crafting";
  else if (pathname.includes("refining")) mode = "refining";
  else if (pathname.includes("blackmarket")) mode = "blackmarket";

  const FAVORITES_LIMIT = 20;
  const RECENTS_LIMIT = 20;

  /* ---------------------------------------------------------
   * Load favorites + recents from localStorage
   * --------------------------------------------------------- */
  useEffect(() => {
    const f = localStorage.getItem("albion_favorites");
    if (f) setFavorites(JSON.parse(f));

    const r = localStorage.getItem(`albion_recents_${mode}`);
    if (r) setRecents(JSON.parse(r));
  }, [mode]);

  /* ---------------------------------------------------------
   * Save favorites
   * --------------------------------------------------------- */
  function saveFavorites(next: any[]) {
    setFavorites(next);
    localStorage.setItem("albion_favorites", JSON.stringify(next));
  }

  /* ---------------------------------------------------------
   * Save recents
   * --------------------------------------------------------- */
  function saveRecents(item: any) {
    const exists = recents.find((x) => x.itemId === item.itemId);
    let next = [];

    if (exists) {
      // Move to front
      next = [exists, ...recents.filter((x) => x.itemId !== item.itemId)];
    } else {
      next = [item, ...recents];
    }

    // Limit recents
    if (next.length > RECENTS_LIMIT) next = next.slice(0, RECENTS_LIMIT);

    setRecents(next);
    localStorage.setItem(`albion_recents_${mode}`, JSON.stringify(next));
  }

  /* ---------------------------------------------------------
   * Toggle Favorite
   * --------------------------------------------------------- */
  function toggleFavorite(item: any) {
    const exists = favorites.find((x) => x.itemId === item.itemId);

    let next;
    if (exists) {
      next = favorites.filter((x) => x.itemId !== item.itemId);
    } else {
      next = [item, ...favorites];
      if (next.length > FAVORITES_LIMIT)
        next = next.slice(0, FAVORITES_LIMIT);
    }

    saveFavorites(next);
  }

  function isFavorite(id: string) {
    return favorites.some((x) => x.itemId === id);
  }

  /* ---------------------------------------------------------
   * Debounced search
   * --------------------------------------------------------- */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/items?q=${query}&mode=${mode}`);
      const data = await res.json();
      setResults(data);
    }, 300);
  }, [query, mode]);

  /* ---------------------------------------------------------
   * Extract tier
   * --------------------------------------------------------- */
  function getTier(itemId: string) {
    const t = itemId.match(/T([4-8])/);
    return t ? t[1] : "";
  }

  /* ---------------------------------------------------------
   * SELECT ITEM
   * --------------------------------------------------------- */
  function selectItem(item: any) {
    onSelect(item);
    setQuery(item.localized);
    setResults([]);
    saveRecents(item);
  }

  /* ---------------------------------------------------------
   * UI
   * --------------------------------------------------------- */
  return (
    <div className="space-y-3">
      <label className="text-amber-300 font-semibold">Item</label>

      {/* Search Input */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search item..."
        className="
          w-full bg-[rgb(18,18,18)] border border-amber-600
          text-amber-200 rounded-md px-3 py-2
          focus:outline-none focus:ring-2 focus:ring-amber-500
        "
      />

      {/* Favorites Section */}
      {favorites.length > 0 && (
        <div className="albion-card p-2 bg-[rgb(12,12,12)]">
          <div className="text-amber-400 text-sm mb-2 font-semibold">
            ⭐ Favorites
          </div>

          <div className="flex flex-wrap gap-2">
            {favorites.map((fav) => (
              <button
                key={fav.itemId}
                onClick={() => selectItem(fav)}
                className="
                  px-2 py-1 text-xs rounded
                  bg-[rgba(255,200,80,0.15)]
                  hover:bg-[rgba(255,200,80,0.25)]
                  text-amber-300
                "
              >
                {fav.localized}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recents Section */}
      {recents.length > 0 && (
        <div className="albion-card p-2 bg-[rgb(12,12,12)] mt-2">
          <div className="text-amber-400 text-sm mb-2 font-semibold">
            🕑 Recent Items
          </div>

          <div className="flex flex-wrap gap-2">
            {recents.map((item) => (
              <button
                key={item.itemId}
                onClick={() => selectItem(item)}
                className="
                  px-2 py-1 text-xs rounded
                  bg-[rgba(120,120,120,0.15)]
                  hover:bg-[rgba(120,120,120,0.25)]
                  text-amber-300
                "
              >
                {item.localized}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div
          className="
            albion-card p-2 bg-[rgb(14,14,14)]
            max-h-64 overflow-y-auto space-y-1
          "
        >
          {results.map((item) => (
            <div
              key={item.itemId}
              className="flex items-center justify-between px-3 py-2 
              hover:bg-[rgba(255,200,80,0.15)] transition rounded"
            >
              <button
                onClick={() => selectItem(item)}
                className="flex items-center gap-2 text-left"
              >
                <span className="text-amber-400 font-bold">
                  {getTier(item.itemId)}
                </span>
                <span className="text-amber-200">{item.localized}</span>
              </button>

              {/* Favorite Button */}
              <button
                onClick={() => toggleFavorite(item)}
                className="text-amber-300 hover:text-amber-200 px-2"
              >
                {isFavorite(item.itemId) ? "⭐" : "☆"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
