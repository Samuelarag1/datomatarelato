import assert from "node:assert/strict";
import { test } from "node:test";
import { CITIES, COUNTRY, GBA_PARTIDOS, getPlace, PLACES, placeFromLocation, REGIONS, regionNote } from "./places";

test("están las 24 jurisdicciones", () => {
  const ids = new Set(PLACES.flatMap((place) => (place.provinceId ? [place.provinceId] : [])));
  assert.equal(ids.size, 24);
});

test("los lugares tienen slug único", () => {
  assert.equal(new Set(PLACES.map((place) => place.slug)).size, PLACES.length);
});

test("cada lugar con provincia tiene región y al menos una ciudad conocida", () => {
  for (const place of PLACES.filter((candidate) => candidate !== COUNTRY)) {
    assert.ok(place.region && REGIONS[place.region], place.slug);
    assert.ok(place.cities.length > 0, place.slug);
    for (const city of place.cities) assert.ok(CITIES[city], `${place.slug}: ${city}`);
  }
});

test("todas las ciudades pertenecen a un lugar", () => {
  const used = new Set(PLACES.flatMap((place) => place.cities));
  assert.deepEqual(Object.keys(CITIES).filter((city) => !used.has(city)), []);
});

test("son los 24 partidos del Gran Buenos Aires", () => {
  assert.equal(GBA_PARTIDOS.size, 24);
});

test("la ubicación separa el conurbano del interior de Buenos Aires", () => {
  assert.equal(placeFromLocation("06", "06490")?.slug, "conurbano"); // Lomas de Zamora
  assert.equal(placeFromLocation("06", "06441")?.slug, "buenos-aires"); // La Plata
  assert.equal(placeFromLocation("06", "06357")?.slug, "buenos-aires"); // Mar del Plata
  assert.equal(placeFromLocation("06", "06490")?.region, "gba");
  assert.equal(placeFromLocation("06", "06441")?.region, "pampeana");
});

test("la ubicación resuelve las demás provincias", () => {
  assert.equal(placeFromLocation("90", "90084")?.slug, "tucuman");
  assert.equal(placeFromLocation("02", "02042")?.slug, "caba");
});

test("una ubicación fuera de Argentina no devuelve lugar", () => {
  assert.equal(placeFromLocation(null, null), undefined);
});

test("la nota nunca presenta un dato regional como provincial", () => {
  const tucuman = getPlace("tucuman");
  assert.ok(tucuman);
  assert.match(regionNote(tucuman, "los precios"), /por región, no por provincia/);
  assert.match(regionNote(tucuman, "los precios"), /Noroeste/);
});
