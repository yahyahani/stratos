import { DateTime } from 'luxon';

interface TimeResult {
  city: string;
  timezone: string;
  datetime: string;
  date: string;
  time: string;
  utc_offset: string;
  day_of_week: string;
}

// Resolve city name → IANA timezone via Open-Meteo geocoding
// (same API already used by weather.ts — returns a `timezone` field)
async function resolveTimezone(city: string): Promise<{ name: string; timezone: string }> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Geocoding service unavailable');

  const json = await res.json();
  if (!json.results?.length) throw new Error(`City not found: "${city}"`);

  const place = json.results[0];
  const tz = place.timezone as string | undefined;
  if (!tz) throw new Error(`No timezone data for "${city}"`);

  const displayName = [place.name, place.country].filter(Boolean).join(', ');
  return { name: displayName, timezone: tz };
}

export async function getTime(city: string): Promise<TimeResult> {
  const { name, timezone } = await resolveTimezone(city);

  const dt = DateTime.now().setZone(timezone);
  if (!dt.isValid) throw new Error(`Invalid timezone returned for "${city}": ${timezone}`);

  const offsetMinutes = dt.offset;
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absMinutes = Math.abs(offsetMinutes);
  const utcOffset = `UTC${sign}${String(Math.floor(absMinutes / 60)).padStart(2, '0')}:${String(absMinutes % 60).padStart(2, '0')}`;

  return {
    city: name,
    timezone,
    datetime: dt.toISO()!,
    date: dt.toFormat('EEEE, d MMMM yyyy'),
    time: dt.toFormat('HH:mm:ss'),
    utc_offset: utcOffset,
    day_of_week: dt.toFormat('EEEE'),
  };
}
