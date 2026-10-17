/**
 * Generates the demo images in public/demo/ as illustrated still lifes.
 *
 *   npm run images
 *
 * Every image is drawn from code (SVG rendered to WebP with sharp), so the
 * repo ships no stock photography and anyone can regenerate or restyle them.
 * Output is deterministic: the speckle pattern comes from a seeded generator.
 */
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const root = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(root, "..", "public", "demo");
const content = JSON.parse(
  await readFile(path.join(root, "..", "content", "kiln-studio.json"), "utf8"),
);

// Colours from the site palette, plus glaze and clay tones.
const C = {
  porcelain: "#E9ECE6",
  slip: "#DCE0D8",
  iron: "#2A2420",
  cobalt: "#233C8F",
  cobaltDeep: "#172968",
  celadon: "#9DB5A6",
  celadonDeep: "#7E9A89",
  oatmeal: "#D9CDB5",
  oatmealDeep: "#C7B898",
  tenmoku: "#5B3420",
  bisque: "#E6D5C6",
  bisqueDeep: "#D5BFAC",
  wetClay: "#8C7B6E",
  wetClayDeep: "#6F6056",
  shelf: "#C9C3B6",
  shelfEdge: "#ABA496",
};

/** Seeded random numbers so every run draws the same speckles. */
function random(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * A vessel profile as [height fraction, half-width] pairs from rim (0) to
 * foot (1), mirrored around the centre into a closed, smoothed path.
 */
function vesselPath(cx, baseY, height, profile) {
  const right = profile.map(([t, w]) => [cx + w, baseY - height + t * height]);
  const left = [...right].reverse().map(([x, y]) => [2 * cx - x, y]);
  return smoothClosed([...right, ...left]);
}

/** Catmull-Rom through the points, as cubic Béziers. */
function smoothClosed(points) {
  const n = points.length;
  const p = (i) => points[(i + n) % n];
  let d = `M${p(0)[0].toFixed(1)} ${p(0)[1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    // Sharp corners at the rim and foot: don't smooth across the mirror line.
    const k = 1 / 6;
    const c1 = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2 = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + "Z";
}

let uid = 0;

/**
 * One vessel: body, optional dipped glaze with a drip edge, speckles, rim
 * opening and a contact shadow.
 */
function vessel({
  cx,
  baseY,
  height,
  profile,
  body,
  bodyDeep,
  glaze,
  glazeDeep,
  glazeTo = 1,
  drips = 0,
  speckle = 0,
  seed = 1,
  rim = true,
  handle,
}) {
  const id = `v${uid++}`;
  const d = vesselPath(cx, baseY, height, profile);
  const rimWidth = profile[0][1];
  const footWidth = profile[profile.length - 1][1];
  const maxWidth = Math.max(...profile.map(([, w]) => w));
  const rnd = random(seed);
  const top = baseY - height;

  let out = `<defs>
    <clipPath id="${id}-clip"><path d="${d}"/></clipPath>
    <linearGradient id="${id}-body" x1="0" x2="1">
      <stop offset="0" stop-color="${bodyDeep}"/>
      <stop offset="0.38" stop-color="${body}"/>
      <stop offset="0.62" stop-color="${body}"/>
      <stop offset="1" stop-color="${bodyDeep}"/>
    </linearGradient>`;
  if (glaze) {
    out += `<linearGradient id="${id}-glaze" x1="0" x2="1">
      <stop offset="0" stop-color="${glazeDeep}"/>
      <stop offset="0.35" stop-color="${glaze}"/>
      <stop offset="0.55" stop-color="${glaze}"/>
      <stop offset="1" stop-color="${glazeDeep}"/>
    </linearGradient>`;
  }
  out += `<radialGradient id="${id}-shine" cx="0.35" cy="0.3" r="0.5">
      <stop offset="0" stop-color="#fff" stop-opacity="0.32"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
  </defs>`;

  // Contact shadow.
  out += `<ellipse cx="${cx}" cy="${baseY + 2}" rx="${footWidth * 1.35 + 12}" ry="${8 + footWidth * 0.06}" fill="${C.iron}" opacity="0.18"/>`;

  // Handle (mugs and jugs), drawn behind the body.
  if (handle) {
    const hx = cx + maxWidth - 6;
    const hy = top + height * handle.from;
    const hh = height * (handle.to - handle.from);
    out += `<path d="M${hx} ${hy} C${hx + handle.reach} ${hy - 6} ${hx + handle.reach} ${hy + hh + 6} ${hx} ${hy + hh}" fill="none" stroke="${glaze ?? body}" stroke-width="${handle.thickness}" stroke-linecap="round"/>`;
  }

  out += `<path d="${d}" fill="url(#${id}-body)"/>`;

  if (glaze) {
    const edge = top + height * glazeTo;
    let wave = `M${cx - maxWidth - 20} ${top - 40} L${cx + maxWidth + 20} ${top - 40} L${cx + maxWidth + 20} ${edge}`;
    const steps = 14;
    for (let i = steps; i >= 0; i--) {
      const x = cx - maxWidth - 20 + ((2 * maxWidth + 40) * i) / steps;
      const drip = drips && rnd() < drips ? 18 + rnd() * height * 0.16 : rnd() * 8;
      wave += ` Q${x + 6} ${edge + drip + 4} ${x} ${edge + (i % 2 ? drip * 0.4 : 0)}`;
    }
    out += `<path d="${wave}Z" fill="url(#${id}-glaze)" clip-path="url(#${id}-clip)"/>`;
  }

  if (speckle) {
    let dots = "";
    for (let i = 0; i < speckle; i++) {
      const x = cx - maxWidth + rnd() * maxWidth * 2;
      const y = top + rnd() * height;
      const r = 0.8 + rnd() * 1.8;
      dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}"/>`;
    }
    out += `<g fill="${C.tenmoku}" opacity="0.55" clip-path="url(#${id}-clip)">${dots}</g>`;
  }

  out += `<path d="${d}" fill="url(#${id}-shine)"/>`;

  if (rim) {
    const rimY = top + 2;
    out += `<ellipse cx="${cx}" cy="${rimY}" rx="${rimWidth * 1.04}" ry="${Math.max(4, rimWidth * 0.18)}" fill="${glaze ? glazeDeep : bodyDeep}"/>`;
    out += `<ellipse cx="${cx}" cy="${rimY + 1.5}" rx="${rimWidth - 4}" ry="${Math.max(2.5, rimWidth * 0.14)}" fill="${C.iron}" opacity="0.55"/>`;
  }
  return out;
}

/** A kiln shelf: a slab with a front edge. */
function shelf(x, y, width, thickness = 22) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${thickness}" fill="${C.shelf}"/>
    <rect x="${x}" y="${y + thickness - 6}" width="${width}" height="6" fill="${C.shelfEdge}"/>
    <rect x="${x}" y="${y + thickness}" width="${width}" height="14" fill="${C.iron}" opacity="0.08"/>`;
}

function backdrop(w, h, from = "#DDE2D9", to = "#CDD3C9") {
  return `<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
    </linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#bg)"/>`;
}

const svg = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;

// Reusable profiles: [height fraction from rim, half-width].
const P = {
  bottle: [[0, 22], [0.08, 20], [0.2, 26], [0.42, 92], [0.7, 104], [0.92, 84], [1, 66]],
  vase: [[0, 54], [0.12, 46], [0.35, 62], [0.62, 96], [0.86, 84], [1, 58]],
  bowl: [[0, 170], [0.25, 160], [0.62, 118], [0.88, 70], [1, 58]],
  cylinder: [[0, 82], [0.15, 86], [0.6, 88], [0.92, 84], [1, 74]],
  jar: [[0, 74], [0.08, 80], [0.4, 150], [0.62, 156], [0.86, 118], [1, 74]],
  mug: [[0, 78], [0.1, 80], [0.7, 82], [0.94, 76], [1, 70]],
  pinch: [[0, 76], [0.3, 82], [0.72, 66], [1, 38]],
  coil: [[0, 118], [0.18, 134], [0.5, 150], [0.82, 128], [1, 96]],
};

const scenes = {
  shelf: ({ width: w, height: h }) => {
    const baseY = h * 0.8;
    const k = 1.22;
    const scale = (profile) => profile.map(([t, x]) => [t, x * k]);
    return svg(w, h,
      backdrop(w, h, "#CFD6CB", "#BFC7BA") +
      vessel({ cx: w * 0.12, baseY, height: 420 * k, profile: scale(P.bottle), body: C.oatmeal, bodyDeep: C.oatmealDeep, speckle: 420, seed: 3 }) +
      vessel({ cx: w * 0.31, baseY, height: 310 * k, profile: scale(P.vase), body: C.bisque, bodyDeep: C.bisqueDeep, glaze: C.cobalt, glazeDeep: C.cobaltDeep, glazeTo: 0.62, drips: 0.45, seed: 7 }) +
      vessel({ cx: w * 0.505, baseY, height: 250 * k, profile: scale(P.jar.map(([t, x]) => [t, x * 0.9])), body: C.celadon, bodyDeep: C.celadonDeep, seed: 11 }) +
      vessel({ cx: w * 0.69, baseY, height: 190 * k, profile: scale(P.cylinder), body: C.porcelain, bodyDeep: C.slip, glaze: C.tenmoku, glazeDeep: "#3E2316", glazeTo: 0.45, drips: 0.3, seed: 5 }) +
      vessel({ cx: w * 0.855, baseY, height: 120 * k, profile: scale(P.pinch), body: C.oatmeal, bodyDeep: C.oatmealDeep, glaze: C.cobalt, glazeDeep: C.cobaltDeep, glazeTo: 0.3, seed: 9 }) +
      shelf(0, baseY, w, 34));
  },

  kiln: ({ width: w, height: h }) => {
    const pad = 120;
    const arch = `M${pad} ${h} V${h * 0.32} A${(w - 2 * pad) / 2} ${(w - 2 * pad) / 2} 0 0 1 ${w - pad} ${h * 0.32} V${h}Z`;
    let stack = "";
    const rows = [h * 0.55, h * 0.82];
    rows.forEach((y, r) => {
      stack += shelf(pad + 40, y, w - 2 * pad - 80, 18);
      for (let i = 0; i < 3; i++) {
        const cx = pad + 160 + i * ((w - 2 * pad - 320) / 2);
        stack += vessel({ cx, baseY: y, height: 110, profile: P.bowl.map(([t, x]) => [t, x * 0.6]), body: C.bisque, bodyDeep: C.bisqueDeep, seed: 20 + r * 3 + i });
      }
      // Kiln posts between shelves.
      stack += `<rect x="${pad + 60}" y="${y + 18}" width="18" height="${(rows[r + 1] ?? h) - y - 18}" fill="${C.shelfEdge}"/>`;
      stack += `<rect x="${w - pad - 78}" y="${y + 18}" width="18" height="${(rows[r + 1] ?? h) - y - 18}" fill="${C.shelfEdge}"/>`;
    });
    return svg(w, h,
      backdrop(w, h, C.slip, C.shelf) +
      `<defs><radialGradient id="glow" cx="0.5" cy="0.62" r="0.7">
        <stop offset="0" stop-color="#4A3A30"/><stop offset="1" stop-color="${C.iron}"/>
      </radialGradient></defs>` +
      `<path d="${arch}" fill="url(#glow)"/>` +
      `<path d="${arch}" fill="none" stroke="${C.shelfEdge}" stroke-width="28"/>` +
      stack);
  },

  wheel: ({ width: w, height: h }) => {
    const cx = w / 2;
    const baseY = h * 0.68;
    let throwLines = "";
    for (let i = 0; i < 6; i++) {
      const y = baseY - 40 - i * 34;
      throwLines += `<path d="M${cx - 150 + i * 4} ${y} Q${cx} ${y + 10} ${cx + 150 - i * 4} ${y}" fill="none" stroke="${C.wetClayDeep}" stroke-width="3" opacity="0.5"/>`;
    }
    return svg(w, h,
      backdrop(w, h) +
      `<ellipse cx="${cx}" cy="${baseY + 30}" rx="${w * 0.42}" ry="${h * 0.12}" fill="${C.shelfEdge}"/>` +
      `<ellipse cx="${cx}" cy="${baseY + 14}" rx="${w * 0.4}" ry="${h * 0.11}" fill="${C.shelf}"/>` +
      `<ellipse cx="${cx}" cy="${baseY + 6}" rx="${w * 0.22}" ry="${h * 0.06}" fill="${C.wetClayDeep}" opacity="0.35"/>` +
      vessel({ cx, baseY, height: 250, profile: P.bowl.map(([t, x]) => [t, x * 0.95]), body: C.wetClay, bodyDeep: C.wetClayDeep, seed: 31 }) +
      throwLines);
  },

  coil: ({ width: w, height: h }) => {
    const cx = w / 2;
    const baseY = h * 0.82;
    const height = 420;
    let coils = "";
    const coilCount = 13;
    const rows = [];
    for (let i = 0; i < coilCount; i++) {
      const t = i / (coilCount - 1);
      // Interpolate the half-width at t from the coil profile.
      const prof = P.coil;
      let k = 0;
      while (k < prof.length - 2 && prof[k + 1][0] < t) k++;
      const [t0, w0] = prof[k];
      const [t1, w1] = prof[k + 1];
      const half = w0 + ((w1 - w0) * (t - t0)) / (t1 - t0);
      rows.push([baseY - height + t * height, half]);
    }
    rows.forEach(([y, half], i) => {
      coils += `<rect x="${cx - half}" y="${y - 15}" width="${half * 2}" height="32" rx="16" fill="${i % 2 ? C.bisqueDeep : C.bisque}"/>`;
      coils += `<rect x="${cx - half + 10}" y="${y - 13}" width="${half * 2 - 20}" height="7" rx="3.5" fill="#fff" opacity="0.25"/>`;
    });
    return svg(w, h,
      backdrop(w, h) +
      `<ellipse cx="${cx}" cy="${baseY + 14}" rx="190" ry="16" fill="${C.iron}" opacity="0.16"/>` +
      coils +
      shelf(0, baseY + 16, w, 26));
  },

  glaze: ({ width: w, height: h }) => {
    const baseY = h * 0.82;
    return svg(w, h,
      backdrop(w, h) +
      vessel({ cx: w / 2, baseY, height: 540, profile: P.vase.map(([t, x]) => [t, x * 1.45]), body: C.porcelain, bodyDeep: C.slip, glaze: C.cobalt, glazeDeep: C.cobaltDeep, glazeTo: 0.5, drips: 0.65, seed: 41 }) +
      shelf(0, baseY, w, 26));
  },

  taster: ({ width: w, height: h }) => {
    const baseY = h * 0.72;
    return svg(w, h,
      backdrop(w, h) +
      vessel({ cx: w * 0.24, baseY, height: 150, profile: P.pinch, body: C.bisque, bodyDeep: C.bisqueDeep, seed: 51 }) +
      vessel({ cx: w * 0.5, baseY, height: 190, profile: P.pinch.map(([t, x]) => [t, x * 1.15]), body: C.oatmeal, bodyDeep: C.oatmealDeep, glaze: C.celadon, glazeDeep: C.celadonDeep, glazeTo: 0.55, seed: 52 }) +
      vessel({ cx: w * 0.76, baseY, height: 140, profile: P.pinch.map(([t, x]) => [t, x * 0.95]), body: C.bisque, bodyDeep: C.bisqueDeep, glaze: C.cobalt, glazeDeep: C.cobaltDeep, glazeTo: 0.35, seed: 53 }) +
      shelf(0, baseY, w, 26));
  },

  studio: ({ width: w, height: h }) => {
    let scene = backdrop(w, h);
    const levels = [h * 0.3, h * 0.6, h * 0.9];
    const kinds = [P.cylinder, P.pinch, P.vase, P.mug, P.bowl.map(([t, x]) => [t, x * 0.55]), P.jar.map(([t, x]) => [t, x * 0.6])];
    levels.forEach((y, row) => {
      const count = 4 + (row % 2);
      for (let i = 0; i < count; i++) {
        const profile = kinds[(i + row * 2) % kinds.length];
        const scale = 0.7 + ((i * 7 + row * 3) % 5) * 0.07;
        scene += vessel({
          cx: (w / (count + 1)) * (i + 1),
          baseY: y,
          height: 260 * scale + 50,
          profile: profile.map(([t, x]) => [t, x * scale]),
          body: C.bisque,
          bodyDeep: C.bisqueDeep,
          seed: 60 + row * 10 + i,
        });
      }
      scene += shelf(0, y, w, 24);
    });
    return svg(w, h, scene);
  },

  "gallery-1": ({ width: w, height: h }) =>
    svg(w, h, backdrop(w, h, "#D6DBD2", "#E2E6DE") +
      vessel({ cx: w / 2, baseY: h * 0.86, height: 640, profile: P.bottle.map(([t, x]) => [t, x * 1.3]), body: C.oatmeal, bodyDeep: C.oatmealDeep, speckle: 420, seed: 71 })),

  "gallery-2": ({ width: w, height: h }) =>
    svg(w, h, backdrop(w, h, "#D6DBD2", "#E2E6DE") +
      vessel({ cx: w / 2, baseY: h * 0.72, height: 260, profile: P.bowl.map(([t, x]) => [t, x * 2.1]), body: C.bisque, bodyDeep: C.bisqueDeep, glaze: C.cobalt, glazeDeep: C.cobaltDeep, glazeTo: 0.92, drips: 0.2, seed: 72 })),

  "gallery-3": ({ width: w, height: h }) =>
    svg(w, h, backdrop(w, h, "#D6DBD2", "#E2E6DE") +
      vessel({ cx: w * 0.33, baseY: h * 0.8, height: 330, profile: P.mug.map(([t, x]) => [t, x * 1.5]), body: C.porcelain, bodyDeep: C.slip, glaze: C.celadon, glazeDeep: C.celadonDeep, glazeTo: 0.55, seed: 73, handle: { from: 0.2, to: 0.75, reach: 90, thickness: 26 } }) +
      vessel({ cx: w * 0.68, baseY: h * 0.8, height: 300, profile: P.mug.map(([t, x]) => [t, x * 1.4]), body: C.porcelain, bodyDeep: C.slip, glaze: C.cobalt, glazeDeep: C.cobaltDeep, glazeTo: 0.4, seed: 74, handle: { from: 0.22, to: 0.72, reach: 80, thickness: 24 } })),

  "gallery-4": ({ width: w, height: h }) =>
    svg(w, h, backdrop(w, h, "#D6DBD2", "#E2E6DE") +
      vessel({ cx: w / 2, baseY: h * 0.86, height: 640, profile: P.jar.map(([t, x]) => [t, x * 1.95]), body: C.celadon, bodyDeep: C.celadonDeep, glaze: "#B4C8BB", glazeDeep: C.celadonDeep, glazeTo: 0.88, drips: 0.15, seed: 75 })),
};

await mkdir(outDir, { recursive: true });

for (const [key, image] of Object.entries(content.images)) {
  const draw = scenes[key];
  if (!draw) throw new Error(`No scene for image "${key}"`);
  const file = path.join(outDir, image.file);
  await sharp(Buffer.from(draw(image)))
    .webp({ quality: 82 })
    .toFile(file);
  console.log(`Wrote public/demo/${image.file} (${image.width}×${image.height})`);
}
