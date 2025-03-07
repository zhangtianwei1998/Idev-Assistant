import * as duration from "dayjs/plugin/duration";
import * as dayjs from "dayjs";

dayjs.extend(duration);

export function getDurationString(time: number): string {
  const total = dayjs.duration(time);
  return `${total.hours()}h ${total.minutes()}m ${total.seconds()}s`;
}
