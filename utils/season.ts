// A holiday "season" runs from August 1 through July 31 of the next year,
// so reviews left in January still count toward the previous Christmas.
// Keep in sync with currentSeasonStart() in api/reviews.ts.
export const currentSeasonYear = (now: Date = new Date()): number =>
  now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
