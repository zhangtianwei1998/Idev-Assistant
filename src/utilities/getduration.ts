import { isTestMode } from "../constant";

export function getDurationString(ms: number): string {
  const hours = Math.floor(ms / 3600000) + "";
  const remainingMs = ms % 3600000;
  const minutes = Math.floor(remainingMs / 60000) + "";
  const remainSec = ms % 60000;
  const second = Math.floor(remainSec / 1000) + "";
  return isTestMode
    ? `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:${second.padStart(2, "0")}`
    : `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}
