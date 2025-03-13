export function getDurationString(ms: number): string {
  const hours = Math.floor(ms / 3600000) + "";
  const remainingMs = ms % 3600000;
  const minutes = Math.floor(remainingMs / 60000) + "";
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}
