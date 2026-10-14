import { Suspense } from "react";
import IssueDetail, { IssueDetailSkeleton } from "./IssueDetail";

// With Cache Components, params are runtime data and must be read inside Suspense.
export default function IssuePage({ params }: PageProps<"/issue/[id]">) {
  return (
    <Suspense fallback={<IssueDetailSkeleton />}>
      {params.then(({ id }) => (
        <IssueDetail id={id} />
      ))}
    </Suspense>
  );
}
