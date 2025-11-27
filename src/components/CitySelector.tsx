"use client";

import { useState } from "react";

const CITIES = [
  "Caerleon",
  "Martlock",
  "Bridgewatch",
  "Lymhurst",
  "Fort Sterling",
  "Thetford",
];

export default function CitySelector({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (city: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-full max-w-xs">
      {/* Selector button */}
      <button
        onClick={() => setOpen(!open)}
        className="
          w-full px-4 py-2 text-left 
          bg-[rgb(18,18,18)] border border-amber-600 
          rounded-md shadow-[0_0_8px_rgba(255,200,80,0.4)]
          hover:shadow-[0_0_12px_rgba(255,210,120,0.8)]
          transition-all
          text-amber-300 font-semibold
        "
      >
        {selected || "Select City"}
      </button>

      {/* Dropdown list */}
      {open && (
        <div
          className="
            absolute z-10 mt-1 w-full 
            bg-[rgb(15,15,15)] 
            border border-amber-700 rounded-md
            shadow-[0_0_12px_rgba(255,200,80,0.3)]
          "
        >
          {CITIES.map((city) => (
            <button
              key={city}
              onClick={() => {
                onChange(city);
                setOpen(false);
              }}
              className="
                w-full px-4 py-2 text-left 
                hover:bg-[rgba(255,200,80,0.12)] 
                text-amber-200
                border-b border-amber-900/40 last:border-none
              "
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
