/**
 * Gera a geometria do globo da tela de login.
 *
 * Emite vetores unitários 3D em vez de coordenadas já projetadas, para o
 * componente conseguir girar o globo com uma multiplicação de matriz — sem
 * carregar d3-geo nem o world-atlas no navegador. Roda com `npm run gen:globe`.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { geoContains } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import type { FeatureCollection, MultiPolygon, Polygon, Position } from "geojson";

const require = createRequire(import.meta.url);
const topology = require("world-atlas/land-110m.json") as Topology;

/** Vista inicial: longitude/latitude que fica de frente. */
const CENTER: [number, number] = [-52, -14];
/** Passo da malha de pontos, em graus. */
const STEP = 2.1;

const land = feature(
  topology,
  topology.objects.land
) as FeatureCollection<Polygon | MultiPolygon>;

const rad = (deg: number) => (deg * Math.PI) / 180;

/** lon/lat -> ponto na esfera unitária. A câmera olha na direção +x. */
function toVec(lon: number, lat: number): [number, number, number] {
  const la = rad(lat);
  const lo = rad(lon);
  return [
    Math.cos(la) * Math.cos(lo),
    Math.cos(la) * Math.sin(lo),
    Math.sin(la),
  ];
}

const round = (v: number) => Math.round(v * 1000) / 1000;

// --- Pontos de terra ---------------------------------------------------------

const dots: number[][] = [];
for (let lat = -84; lat <= 84; lat += STEP) {
  // Compensa a convergência dos meridianos, senão os pontos se amontoam nos polos.
  const lonStep = STEP / Math.max(Math.cos(rad(lat)), 0.2);
  for (let lon = -180; lon < 180; lon += lonStep) {
    if (!geoContains(land, [lon, lat])) continue;
    dots.push(toVec(lon, lat).map(round));
  }
}

// --- Contornos das costas ----------------------------------------------------

/**
 * Reduz os vértices de um anel por distância angular mínima: o 110m traz muito
 * detalhe para o tamanho em que o globo é desenhado.
 */
function simplify(ring: Position[], minDeg: number): Position[] {
  const out: Position[] = [];
  let last: Position | null = null;
  for (const point of ring) {
    if (
      last === null ||
      Math.abs(point[0] - last[0]) + Math.abs(point[1] - last[1]) >= minDeg
    ) {
      out.push(point);
      last = point;
    }
  }
  // Fecha o anel para a costa não ficar com uma fresta.
  if (out.length > 2 && ring.length > 0) out.push(ring[0]);
  return out;
}

const rings: number[][][] = [];
for (const f of land.features) {
  const polygons =
    f.geometry.type === "Polygon"
      ? [f.geometry.coordinates]
      : f.geometry.coordinates;
  for (const polygon of polygons) {
    for (const ring of polygon) {
      const reduced = simplify(ring, 1.1);
      // Ilhas minúsculas viram ruído nesse tamanho.
      if (reduced.length < 5) continue;
      rings.push(reduced.map(([lon, lat]) => toVec(lon, lat).map(round)));
    }
  }
}

// --- Cidades -----------------------------------------------------------------

const CITIES: { name: string; lon: number; lat: number }[] = [
  { name: "Caxias do Sul", lon: -51.1794, lat: -29.1678 },
  { name: "Farroupilha", lon: -51.3478, lat: -29.225 },
  { name: "Nova Petrópolis", lon: -51.1147, lat: -29.3747 },
];

const centroid: [number, number] = [
  CITIES.reduce((s, c) => s + c.lon, 0) / CITIES.length,
  CITIES.reduce((s, c) => s + c.lat, 0) / CITIES.length,
];

/**
 * As três ficam a ~30 km entre si e cairiam no mesmo pixel. Mantemos o grupo na
 * posição real e ampliamos só o deslocamento interno, em graus, antes de
 * projetar — assim o exagero acompanha a rotação em vez de ser fixo na tela.
 */
const SPREAD = 26;
const cities = CITIES.map((city) => ({
  name: city.name,
  vec: toVec(
    centroid[0] + (city.lon - centroid[0]) * SPREAD,
    centroid[1] + (city.lat - centroid[1]) * SPREAD
  ).map(round),
}));

const out = `// GERADO POR scripts/generate-globe.ts — não editar à mão.
// Rode \`npm run gen:globe\` para regenerar.

/** Vetor unitário na esfera. A câmera olha na direção +x. */
export type Vec3 = [number, number, number];

/** Vista inicial, em graus. */
export const GLOBE_CENTER: [number, number] = [${CENTER[0]}, ${CENTER[1]}];

/** Pontos de terra, achatados em x,y,z sequenciais. */
export const GLOBE_DOTS = Float32Array.from(${JSON.stringify(dots.flat())});

/** Anéis de costa, cada um achatado em x,y,z sequenciais. */
export const GLOBE_RINGS: Float32Array[] = [
${rings.map((r) => `  Float32Array.from(${JSON.stringify(r.flat())}),`).join("\n")}
];

/** Cidades da serra gaúcha, com o afastamento interno ampliado ${SPREAD}×. */
export const GLOBE_CITIES = ${JSON.stringify(cities)} as { name: string; vec: Vec3 }[];
`;

mkdirSync("src/lib", { recursive: true });
writeFileSync("src/lib/globe-data.ts", out, "utf8");

const ringPoints = rings.reduce((s, r) => s + r.length, 0);
console.log(`${dots.length} pontos de terra`);
console.log(`${rings.length} anéis de costa, ${ringPoints} vértices`);
console.log(`tamanho do módulo: ${(out.length / 1024).toFixed(0)} KB`);
