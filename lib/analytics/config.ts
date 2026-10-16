/** A visit is a visitor's page views with no gap longer than this. */
export const VISIT_GAP_MS = 30 * 60_000;

/** Timezone used to group analytics into days and hours. */
export const ANALYTICS_TIMEZONE = process.env.ANALYTICS_TIMEZONE || "UTC";
