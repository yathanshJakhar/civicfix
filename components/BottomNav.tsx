"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const items = [
  {
    href: "/",
    label: "Home",
    icon: (
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" />
    ),
  },
  {
    href: "/map",
    label: "Map",
    icon: (
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14" />
    ),
  },
  {
    href: "/report",
    label: "Report",
    icon: <path d="M12 5v14M5 12h14" />,
  },
];

// usePathname() is runtime data under Cache Components, so it must sit inside <Suspense>.
// The fallback renders the same bar with no tab highlighted.
export default function BottomNav() {
  return (
    <Suspense fallback={<NavBar pathname="" />}>
      <ActiveNavBar />
    </Suspense>
  );
}

function ActiveNavBar() {
  return <NavBar pathname={usePathname()} />;
}

function NavBar({ pathname }: { pathname: string }) {
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-1000 border-t border-zinc-800 bg-black">
      <ul className="mx-auto flex h-16 max-w-lg items-stretch justify-around">
        {items.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" || pathname.startsWith("/issue") : pathname.startsWith(item.href);
          const isReport = item.href === "/report";
          return (
            <li key={item.href} className="relative flex flex-1">
              {active && <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-violet-500" />}
              <Link
                href={item.href}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-bold transition-colors ${
                  active ? "text-violet-400" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <span
                  className={`flex items-center justify-center ${
                    isReport ? "h-8 w-11 rounded-lg bg-violet-600 text-white" : "h-7 w-7"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className={isReport ? "h-5 w-5" : "h-6 w-6"}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={isReport ? 2.5 : 1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {item.icon}
                  </svg>
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
