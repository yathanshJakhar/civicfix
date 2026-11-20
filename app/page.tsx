"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { BoardSkeleton } from "@/components/IssueCard";
import { homeFor, useAuth } from "@/lib/auth";

/**
 * There is no public board any more. The root sends each role to its own home:
 * citizens to their tickets, departments to the dashboard, contractors to their jobs.
 */
export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) router.replace(homeFor(user));
  }, [loading, user, router]);

  return (
    <>
      <PageHeader title="CivicFix" subtitle={<span className="label">Civic issues · Delhi NCR</span>} display />
      <div className="pt-4">
        <BoardSkeleton />
      </div>
    </>
  );
}
