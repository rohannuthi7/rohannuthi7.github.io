// Draws the star map behind Experience and the guestbook tree: the real sky
// over Sussex, Wisconsin at 10 pm local time on 25 September 2005.
//
//   node scripts/night-sky.mjs path/to/stars.6.json
//
// The catalogue is not kept in the repo. It is the naked-eye star list from
// d3-celestial (github.com/ofrohn/d3-celestial, data/stars.6.json): one point
// per star with right ascension and declination in degrees, magnitude and
// colour index. Stars only: no Moon or planets.
//
// The map is a strip of sky as you would see it facing north and tipping your
// head back: the northern horizon along the bottom edge, the point overhead
// half way up, the southern horizon along the top. 10 units per degree.
// Two files are written to public/: the whole strip for wide screens, and its
// middle with smaller dots for phones, where the strip is drawn about twice
// as large.
import { readFileSync, writeFileSync } from 'node:fs';

const LAT = 43.1339, LON = -88.2223;            // Sussex, WI
const WHEN = Date.UTC(2005, 8, 26, 3, 0, 0);    // 25 Sep 2005, 10 pm CDT
const RAD = Math.PI / 180;

const jd = WHEN / 86400000 + 2440587.5;
const gmst = (280.46061837 + 360.98564736629 * (jd - 2451545)) % 360;
const lst = (((gmst + LON) % 360) + 360) % 360;

/** Right ascension and declination (degrees) to a place on the strip, or null if below the horizon. */
export function place(ra, dec) {
  const ha = (lst - ra) * RAD, d = dec * RAD, la = LAT * RAD;
  const up = Math.sin(d) * Math.sin(la) + Math.cos(d) * Math.cos(la) * Math.cos(ha);
  if (up <= 0) return null;
  const north = Math.sin(d) * Math.cos(la) - Math.cos(d) * Math.sin(la) * Math.cos(ha);
  const east = -Math.cos(d) * Math.sin(ha);
  const across = Math.asin(east) / RAD;                 // degrees right of the north-south line
  const along = Math.atan2(up, north) / RAD;            // 0 at the northern horizon, 180 at the southern
  return { x: (90 + across) * 10, y: 1800 - along * 10, alt: Math.asin(up) / RAD };
}

const tint = (bv) => (bv < 0 ? '#CFDCFF' : bv < 0.6 ? '#FFFFFF' : bv < 1.2 ? '#FFF1DC' : '#FFDDBB');

function draw(stars, { x0, x1, pxPerUnit, limit }) {
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} 0 ${x1 - x0} 1800">`;
  let n = 0;
  for (const s of stars) {
    if (s.mag > limit || s.x < x0 || s.x > x1) continue;
    const r = Math.max(0.45, 0.45 + (5.8 - s.mag) * 0.27) / pxPerUnit;
    const o = Math.min(1, 0.3 + ((6 - s.mag) / 6) * 0.7);
    out += `<circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${r.toFixed(2)}" fill="${tint(s.bv)}" fill-opacity="${o.toFixed(2)}"/>`;
    n++;
  }
  return { svg: out + '</svg>\n', n };
}

if (process.argv[2]) {
  const stars = [];
  for (const f of JSON.parse(readFileSync(process.argv[2], 'utf8')).features) {
    const [lon, dec] = f.geometry.coordinates;
    const p = place(((lon % 360) + 360) % 360, dec);
    if (p) stars.push({ ...p, mag: Number(f.properties.mag), bv: Number(f.properties.bv) || 0.5 });
  }
  stars.sort((a, b) => b.mag - a.mag);
  const wide = draw(stars, { x0: 0, x1: 1800, pxPerUnit: 1.2, limit: 5.8 });
  const narrow = draw(stars, { x0: 600, x1: 1200, pxPerUnit: 2.2, limit: 6 });
  writeFileSync('public/night-sky.svg', wide.svg);
  writeFileSync('public/night-sky-narrow.svg', narrow.svg);
  console.log(`wide ${wide.n} stars, narrow ${narrow.n} stars`);
  const show = (name, ra, dec) => { const p = place(ra, dec); console.log(name, p ? `alt ${p.alt.toFixed(1)} x ${p.x.toFixed(0)} y ${p.y.toFixed(0)}` : 'below horizon'); };
  show('Polaris', 37.95, 89.26); show('Vega', 279.23, 38.78); show('Dubhe', 165.93, 61.75); show('Deneb', 310.36, 45.28); show('Fomalhaut', 344.41, -29.62); show('Capella', 79.17, 46.0); show('Arcturus', 213.92, 19.18);
}
