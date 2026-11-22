import { query } from './_db.js';

// A holiday season runs Aug 1 – Jul 31 and is named by the year it starts in
// (the 2026 season = Aug 1 2026 – Jul 31 2027). Keep in sync with utils/season.ts.
export const currentSeason = (now: Date = new Date()): number =>
  now.getUTCMonth() >= 7 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;

export const currentSeasonStart = (now: Date = new Date()): string =>
  `${currentSeason(now)}-08-01T00:00:00.000Z`;

// locations.active_season = the season a house is confirmed for. Anything else
// (older season or NULL) is archived: hidden from the public map but kept in the DB.
// Added lazily so no manual migration is needed; runs once per function instance.
// Checks first so the ALTER (which briefly locks the table) only ever runs once.
let schemaReady: Promise<unknown> | null = null;
export const ensureLocationSeasonColumn = () => {
  if (!schemaReady) {
    schemaReady = query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_name = 'locations' AND column_name = 'active_season'`
    )
      .then(({ rowCount }) =>
        rowCount ? null : query('ALTER TABLE locations ADD COLUMN IF NOT EXISTS active_season INTEGER')
      )
      .catch((err) => {
        schemaReady = null; // retry on the next request
        throw err;
      });
  }
  return schemaReady;
};
