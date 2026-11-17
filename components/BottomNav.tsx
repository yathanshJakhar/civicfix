"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const items = [
  {
    href: "/",
    label: "Board",
    icon: <path d="M4 5h16M4 10h16M4 15h16M4 20h10" />,
  },
  {
    href: "/report",
    label: "Report",
    icon: <path d="M12 5v14M5 12h14" />,
  },
  {
    href: "/map",
    label: "Map",
    icon: <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14" />,
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
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-1000 border-t border-line bg-ground">
      <ul className="mx-auto grid h-16 max-w-lg grid-cols-[1fr_1.3fr_1fr] items-stretch sm:border-x sm:border-line">
        {items.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" || pathname.startsWith("/issue") : pathname.startsWith(item.href);
          const svg = (
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={item.href === "/report" ? 2.6 : 1.9}
              strokeLinecap="square"
              strokeLinejoin="miter"
              aria-hidden
            >
              {item.icon}
            </svg>
          );

          if (item.href === "/report") {
            return (
              <li key={item.href} className="flex p-2">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`btn flex-1 px-0 text-base ${active ? "bg-marigold-lo text-ground" : "btn-primary"}`}
                >
                  {svg}
                  {item.label}
                </Link>
              </li>
            );
          }

          return (
            <li key={item.href} className="flex">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-1 flex-col items-center justify-center gap-1 font-cond text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
                  active ? "text-paper shadow-[inset_0_2px_0_var(--color-marigold)]" : "text-faint hover:text-dim"
                }`}
              >
                {svg}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
