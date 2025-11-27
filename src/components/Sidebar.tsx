"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GiAnvil, GiStoneBlock, GiMoneyStack } from "react-icons/gi";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/crafting", label: "Crafting", icon: <GiAnvil size={20} /> },
    { href: "/refining", label: "Refining", icon: <GiStoneBlock size={20} /> },
    { href: "/flipping", label: "Flipping", icon: <GiMoneyStack size={20} /> },
    { href: "/blackmarket", label: "Black Market", icon: <GiMoneyStack size={20} /> },
  ];

  return (
    <aside className="albion-sidebar">
      <div className="text-center text-gold font-bold text-xl mb-6">
        Albion Tool
      </div>

      <nav className="space-y-2">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`albion-sidebar-link ${active ? "bg-white/10 pl-5 text-gold" : ""}`}
            >
              {link.icon}
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
