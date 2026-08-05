const OPEN_HOUR = 19;
const OPEN_MINUTE = 30;
const CLOSE_HOUR = 23;
const CLOSE_MINUTE = 0;
const CLOSED_WEEKDAY = 0; // domingo

const WEEKDAY_NAMES = [
  "domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado",
];

export function isWithinBusinessHours(date: Date = new Date()): boolean {
  if (date.getDay() === CLOSED_WEEKDAY) return false;
  const minutes = date.getHours() * 60 + date.getMinutes();
  const open = OPEN_HOUR * 60 + OPEN_MINUTE;
  const close = CLOSE_HOUR * 60 + CLOSE_MINUTE;
  return minutes >= open && minutes < close;
}

export function nextOpeningLabel(date: Date = new Date()): string {
  const day = date.getDay();
  const minutes = date.getHours() * 60 + date.getMinutes();
  const open = OPEN_HOUR * 60 + OPEN_MINUTE;

  if (day !== CLOSED_WEEKDAY && minutes < open) {
    return "hoje às 19h30";
  }

  let daysAhead = 1;
  let nextDay = (day + 1) % 7;
  while (nextDay === CLOSED_WEEKDAY) {
    daysAhead++;
    nextDay = (nextDay + 1) % 7;
  }

  return daysAhead === 1 ? "amanhã às 19h30" : `${WEEKDAY_NAMES[nextDay]} às 19h30`;
}
