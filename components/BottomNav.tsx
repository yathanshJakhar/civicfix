"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { isContractor, isStaff, useAuth } from "@/lib/auth";

type NavItem = { href: string; label: string; icon: React.ReactNode; primary?: boolean };

// A ticket with a notch bitten out of each side.
const TICKETS_ICON = <path d="M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4V6Zm11 0v12" />;
const DASH_ICON = <path d="M4 4h7v7H4V4Zm9 0h7v4h-7V4Zm0 6h7v10h-7V10ZM4 13h7v7H4v-7Z" />;
const ACCOUNT: NavItem = { href: "/account", label: "Account", icon: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9a8 8 0 0 1 16 0" /> };
const MAP: NavItem = { href: "/map", label: "Map", icon: <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14" /> };

/** Citizens: report and follow their own tickets. */
const CITIZEN_ITEMS: NavItem[] = [
  { href: "/tickets", label: "My tickets", icon: TICKETS_ICON },
  { href: "/report", label: "Report", icon: <path d="M12 5v14M5 12h14" />, primary: true },
  ACCOUNT,
];

/** Officers: their contractors, the department dashboard, and its map. */
const OFFICER_ITEMS: NavItem[] = [
  { href: "/authority/contractors", label: "Contractors", icon: <path d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6 9a6 6 0 0 1 12 0m-2-6.5A6 6 0 0 1 22 20" /> },
  { href: "/authority", label: "Dashboard", icon: DASH_ICON, primary: true },
  MAP,
];

/** Admin: approvals first; the dashboard is a read-only overview. */
const ADMIN_ITEMS: NavItem[] = [
  { href: "/authority", label: "Overview", icon: DASH_ICON },
  { href: "/admin/contractors", label: "Approvals", icon: <path d="m5 12 4 4 10-10" />, primary: true },
  ACCOUNT,
];

/** Contractors: their assigned jobs. */
const CONTRACTOR_ITEMS: NavItem[] = [
  { href: "/contractor", label: "My jobs", icon: TICKETS_ICON, primary: true },
  ACCOUNT,
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
  const { user } = useAuth();
  // Signed out (the login page) shows no nav at all.
  if (!user) return null;
  const items =
    user.role === "admin" ? ADMIN_ITEMS
    : isStaff(user) ? OFFICER_ITEMS
    : isContractor(user) ? CONTRACTOR_ITEMS
    : CITIZEN_ITEMS;
  const cols = items.length === 3 ? "grid-cols-[1fr_1.3fr_1fr]" : items.length === 2 ? "grid-cols-[1.3fr_1fr]" : "grid-cols-1";
  // The longest matching href wins, so /authority/contractors doesn't also light up /authority.
  const activeHref = items
    .map((i) => i.href)
    .filter((h) => pathname === h || pathname.startsWith(`${h}/`))
    .sort((a, b) => b.length - a.length)[0];
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-1000">
      <ul className={`manila pb-safe pointer-events-auto mx-auto grid h-[calc(4rem+env(safe-area-inset-bottom,0px))] max-w-lg ${cols} items-stretch border-t border-line-strong sm:border-x`}>
        {items.map((item) => {
          const active = item.href === activeHref;
          const svg = (
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={item.primary ? 2.6 : 1.9}
              strokeLinecap="square"
              strokeLinejoin="miter"
              aria-hidden
            >
              {item.icon}
            </svg>
          );

          if (item.primary) {
            return (
              <li key={item.href} className="flex p-2">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`btn flex-1 px-0 text-base ${active ? "bg-marigold-lo text-ink" : "btn-primary"}`}
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
                  active ? "text-ink shadow-[inset_0_2px_0_var(--color-marigold)]" : "text-faint hover:text-dim"
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
