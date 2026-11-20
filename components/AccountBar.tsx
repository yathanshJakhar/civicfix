"use client";

import Link from "next/link";
import { departmentLabel, homeFor, isContractor, isStaff, useAuth } from "@/lib/auth";

const linkClass =
  "flex h-full items-center px-2.5 font-cond text-[13px] font-bold uppercase tracking-[0.08em] transition-colors";

/** Who is signed in, printed as a thin strip across the top of the sheet. */
export default function AccountBar() {
  const { user, loading, logout } = useAuth();

  return (
    <div className="flex h-[calc(2.5rem+env(safe-area-inset-top,0px))] items-center justify-between gap-3 border-b border-line pl-4 pr-1.5 pt-[env(safe-area-inset-top,0px)]">
      {loading ? (
        <span className="label text-faint">Checking account…</span>
      ) : user ? (
        <>
          {isStaff(user) ? (
            // Officers are identified by department here; their name is on the dashboard.
            <p className="label truncate text-saffron" title={user.name}>
              {departmentLabel(user)}
            </p>
          ) : (
            <p className="label truncate text-ink">{user.name}</p>
          )}
          <span className="flex h-full shrink-0 items-center">
            <Link href={homeFor(user)} className={`${linkClass} text-ink hover:text-saffron`}>
              {user.role === "admin" ? "Approvals" : isStaff(user) ? "Dashboard" : isContractor(user) ? "Jobs" : "Tickets"}
            </Link>
            <Link href="/account" className={`${linkClass} text-ink hover:text-saffron`}>
              Account
            </Link>
            <button onClick={logout} className={`${linkClass} text-dim hover:text-ink`}>
              Log out
            </button>
          </span>
        </>
      ) : (
        <>
          <span className="label">Not signed in</span>
          <Link href="/login" className={`${linkClass} text-saffron hover:text-ink`}>
            Sign in
          </Link>
        </>
      )}
    </div>
  );
}
