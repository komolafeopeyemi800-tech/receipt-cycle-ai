import { getCountryDataList } from "countries-list";

export type CountryRow = { code: string; name: string; search: string };

let cache: CountryRow[] | null = null;

/** ISO 3166-1 alpha-2 countries, sorted by English name (search includes native name). */
export function getIsoCountries(): CountryRow[] {
  if (cache) return cache;
  cache = getCountryDataList()
    .map((c) => ({
      code: c.iso2,
      name: c.name,
      search: `${c.iso2} ${c.name} ${c.native}`.toLowerCase(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return cache;
}
