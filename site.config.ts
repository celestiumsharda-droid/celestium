/**
 * Celestium — site-wide identity.
 * Single source of truth for the origin URL, brand, default social card.
 * When a real domain is registered, change `origin` here and nowhere else.
 */
export interface SiteConfig {
  origin: string;
  name: string;
  tagline: string;
  defaultDescription: string;
  twitterHandle: string;
  themeColor: string;
  ogImage: string;
  ogImageWidth: number;
  ogImageHeight: number;
}

const config: SiteConfig = {
  origin: "https://celestium.uk",
  name: "Celestium",
  tagline: "A pinnacle of science",
  defaultDescription:
    "Celestium is a science publication built to be felt: a navigable cosmic timeline, scale tool, and immersive discoveries — from the Big Bang to the instruments watching the sky right now.",
  twitterHandle: "",
  themeColor: "#050609",
  ogImage: "/og-cover.png",
  ogImageWidth: 1200,
  ogImageHeight: 630,
};

export default config;
