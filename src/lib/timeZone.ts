const MEXICO_CITY_TIME_ZONE = "America/Mexico_City";

function normalizeDate(value: Date | string | number) {
  return value instanceof Date ? value : new Date(value);
}

export function formatMexicoDate(
  value: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
) {
  return normalizeDate(value).toLocaleDateString("es-MX", {
    timeZone: MEXICO_CITY_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  });
}

export function formatMexicoTime(
  value: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
) {
  return normalizeDate(value).toLocaleTimeString("es-MX", {
    timeZone: MEXICO_CITY_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
}

export function formatMexicoDateTime(
  value: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
) {
  return normalizeDate(value).toLocaleString("es-MX", {
    timeZone: MEXICO_CITY_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
}

export { MEXICO_CITY_TIME_ZONE };
