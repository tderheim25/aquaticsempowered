import { City, State } from "country-state-city";

/** Cities for a US state code (e.g. CA), sorted by name. */
export function getUsCitiesForState(stateCode: string): { name: string }[] {
  if (!stateCode || stateCode.length !== 2) return [];
  const countryCode = "US";
  const states = State.getStatesOfCountry(countryCode);
  const state = states.find((s) => s.isoCode === stateCode);
  if (!state) return [];
  const cities = City.getCitiesOfState(countryCode, state.isoCode);
  return cities
    .map((c) => ({ name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
