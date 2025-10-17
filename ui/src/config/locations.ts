export type CityOption = {
  id: number;
  name: string;
};

export type CountryOption = {
  id: number;
  name: string;
  cities: CityOption[];
};

export const COUNTRIES: CountryOption[] = [
  {
    id: 1,
    name: 'United States',
    cities: [
      { id: 101, name: 'New York' },
      { id: 102, name: 'Los Angeles' },
      { id: 103, name: 'San Francisco' },
    ],
  },
  {
    id: 2,
    name: 'Canada',
    cities: [
      { id: 201, name: 'Toronto' },
      { id: 202, name: 'Vancouver' },
      { id: 203, name: 'Montreal' },
    ],
  },
  {
    id: 3,
    name: 'United Kingdom',
    cities: [
      { id: 301, name: 'London' },
      { id: 302, name: 'Manchester' },
      { id: 303, name: 'Edinburgh' },
    ],
  },
  {
    id: 4,
    name: 'Germany',
    cities: [
      { id: 401, name: 'Berlin' },
      { id: 402, name: 'Munich' },
      { id: 403, name: 'Frankfurt' },
    ],
  },
  {
    id: 5,
    name: 'Japan',
    cities: [
      { id: 501, name: 'Tokyo' },
      { id: 502, name: 'Osaka' },
      { id: 503, name: 'Kyoto' },
    ],
  },
];

const countryIndex = new Map<number, CountryOption>();
const cityIndex = new Map<number, { name: string; countryId: number }>();

for (const country of COUNTRIES) {
  countryIndex.set(country.id, country);
  for (const city of country.cities) {
    cityIndex.set(city.id, { name: city.name, countryId: country.id });
  }
}

export function getCountryOptions(): CountryOption[] {
  return COUNTRIES;
}

export function getCitiesForCountry(countryId: number): CityOption[] {
  const country = countryIndex.get(countryId);
  return country ? country.cities : [];
}

export function getCountryNameById(countryId: number): string | null {
  const country = countryIndex.get(countryId);
  return country ? country.name : null;
}

export function getCityNameById(cityId: number): string | null {
  const city = cityIndex.get(cityId);
  return city ? city.name : null;
}

export function getCountryIdForCity(cityId: number): number | null {
  const city = cityIndex.get(cityId);
  return city ? city.countryId : null;
}
