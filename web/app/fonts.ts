import localFont from "next/font/local";

/*
 * Fonts are self-hosted from npm (@fontsource) rather than fetched from Google
 * at build time, so builds work offline and no visitor data goes to a third party.
 */

export const youngSerif = localFont({
  src: "../node_modules/@fontsource/young-serif/files/young-serif-latin-400-normal.woff2",
  weight: "400",
  variable: "--font-young-serif",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

export const instrumentSans = localFont({
  src: "../node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2",
  weight: "400 700",
  variable: "--font-instrument-sans",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});
