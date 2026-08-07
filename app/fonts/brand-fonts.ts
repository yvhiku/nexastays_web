import localFont from "next/font/local";

/** Self-hosted brand fonts — no runtime fetch from Google Fonts. */
export const playfair = localFont({
  src: [
    {
      path: "./playfair-display-nuFiD-vYSZviVYUb_rj3ij__anPXDTLYgFE_.woff2",
      weight: "400 700",
      style: "normal",
    },
    {
      path: "./playfair-display-nuFiD-vYSZviVYUb_rj3ij__anPXDTzYgA.woff2",
      weight: "400 700",
      style: "normal",
    },
  ],
  variable: "--font-playfair",
  display: "swap",
  preload: true,
});

export const dmSans = localFont({
  src: [
    {
      path: "./dm-sans-rP2Yp2ywxg089UriI5-g4vlH9VoD8Cmcqbu6-K6h9Q.woff2",
      weight: "300 600",
      style: "normal",
    },
    {
      path: "./dm-sans-rP2Yp2ywxg089UriI5-g4vlH9VoD8Cmcqbu0-K4.woff2",
      weight: "300 600",
      style: "normal",
    },
  ],
  variable: "--font-dm-sans",
  display: "swap",
  preload: true,
});

export const notoArabic = localFont({
  src: [
    {
      path: "./noto-sans-arabic-nwpCtLGrOAZMl5nJ_wfgRg3DrWFZWsnVBJ_sS6tlqHHFlj4wv4r4xA.woff2",
      weight: "400 700",
      style: "normal",
    },
    {
      path: "./noto-sans-arabic-nwpCtLGrOAZMl5nJ_wfgRg3DrWFZWsnVBJ_sS6tlqHHFlj47v4r4xA.woff2",
      weight: "400 700",
      style: "normal",
    },
    {
      path: "./noto-sans-arabic-nwpCtLGrOAZMl5nJ_wfgRg3DrWFZWsnVBJ_sS6tlqHHFlj41v4o.woff2",
      weight: "400 700",
      style: "normal",
    },
  ],
  variable: "--font-arabic",
  display: "swap",
  preload: true,
});
