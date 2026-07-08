"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Shirt, Upload, TrendingUp, Heart, Settings } from "lucide-react";

const NAV = [
  { href: "/feed", icon: Home, label: "Feed" },
  { href: "/wardrobe", icon: Shirt, label: "Wardrobe" },
  { href: "/wardrobe/import", icon: Upload, label: "Import" },
  { href: "/trends", icon: TrendingUp, label: "Trends" },
  { href: "/saved", icon: Heart, label: "Saved" },
  { href: "/admin", icon: Settings, label: "Admin" },
];

export function HeaderNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30" style={{ background: "var(--ink)", color: "#fff" }}>
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
        <Link href="/feed" className="flex items-center gap-2">
          <div className="td-disp font-bold text-lg tracking-tight">TrendDeal</div>
          <span className="td-mono text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#ffffff22" }}>
            MVP
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-1">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/feed" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition"
                style={{ background: active ? "#ffffff1a" : "transparent", color: active ? "#fff" : "#ffffffaa" }}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
