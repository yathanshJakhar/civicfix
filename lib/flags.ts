/**
 * TESTING ONLY: when true, department officers, the admin and contractors sign in with just their
 * email (it must still be on the officer or contractor list), with no emailed code. That lets the
 * demo use made-up addresses like roads@civicfix.in that can't receive mail.
 * Citizens always verify with an emailed code, whatever this is set to.
 * Set this to false before a real deployment, since otherwise anyone who knows a staff email can
 * sign in as that person.
 * Read by both the sign-in API and the login page, so one switch controls both.
 */
export const STAFF_SIGN_IN_WITHOUT_CODE = true;

/**
 * TESTING ONLY: when true, every contractor covers all of Delhi NCR, so a department can assign
 * any of its contractors to any of its tickets regardless of their service radius. They're still
 * listed nearest first, with distance and workload. Set to false to use each contractor's radius.
 */
export const CONTRACTORS_COVER_ALL_NCR = true;
