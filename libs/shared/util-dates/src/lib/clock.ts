/** '2026-10-01T09:05:07Z' → '11:05:07': the local time of day, with seconds. */
export const clock = (iso: string): string =>
  new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
