"use client";

import { useEffect, useState } from "react";

export default function FavoritesPanel({
  mode,
  onSelect,
}: {
  mode: "crafting" | "refining" | "flipping" | "blackmarket";
  onSelect: (item: any) => void;
}) {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [recents, setRecents] = useState<any[]>([]);

  /* ---------------------------------------------------------
   * Load favorites + recents
   * --------------------------------------------------------- */
  useEffect(() => {
    const f = localStorage.getItem("albion_favorites");
    if (f) setFavorites(JSON.parse(f));

    const r = localStorage.getItem(`albion_recents_${mode}`);
    if (r) setRecents(JSON.parse(r));
  }, [mode]);

  return (
    <div className="albion-card p-4 space-y-4 bg-[rgb(12,12,12)]">
      <h2 className="albion-title text-lg">Quick Select</h2>

      {/* FAVORITES */}
      {favorites.length > 0 && (
        <div>
          <p className="text-amber-400 font-semibold text-sm mb-2">⭐ Favorites</p>

          <div className="flex flex-wrap gap-2">
            {favorites.map((fav) => (
              <button
                key={fav.itemId}
                onClick={() => onSelect(fav)}
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

      {/* RECENTS */}
      {recents.length > 0 && (
        <div>
          <p className="text-amber-400 font-semibold text-sm mb-2">🕑 Recent</p>
          <div className="flex flex-wrap gap-2">
            {recents.map((item) => (
              <button
                key={item.itemId}
                onClick={() => onSelect(item)}
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

      {favorites.length === 0 && recents.length === 0 && (
        <p className="text-amber-500 text-sm opacity-70">
          No favorites or recent items yet.
        </p>
      )}
    </div>
  );
}
