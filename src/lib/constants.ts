// Ported from TrendDeal_1.jsx + spec Appendix A/B/D. Single source of truth for
// color pairing rules, demo-user prefs, and the Shopify adapter's inference vocab.

export const DEMO_USER_ID = process.env.DEMO_USER_ID || "demo-user-0001";

export const COLOR_RULES: Record<string, string[]> = {
  black: ["white", "grey", "beige", "olive", "denim blue"],
  white: ["black", "navy", "beige", "olive", "denim blue"],
  navy: ["white", "beige", "grey", "tan"],
  beige: ["white", "black", "navy", "olive", "brown"],
  olive: ["black", "white", "beige", "tan"],
  grey: ["black", "white", "navy", "burgundy"],
  "denim blue": ["white", "black", "beige", "grey"],
  brown: ["beige", "white", "navy"],
  tan: ["navy", "olive", "white"],
};

// Appendix A color keyword list, synonyms mapped onto the fixed palette used by COLOR_RULES.
export const COLOR_KEYWORD_MAP: Record<string, string> = {
  black: "black",
  white: "white",
  "off white": "white",
  offwhite: "white",
  ivory: "white",
  grey: "grey",
  gray: "grey",
  navy: "navy",
  beige: "beige",
  khaki: "beige",
  olive: "olive",
  green: "olive",
  brown: "brown",
  tan: "tan",
  blue: "denim blue",
  denim: "denim blue",
  indigo: "denim blue",
  maroon: "burgundy",
  wine: "burgundy",
  burgundy: "burgundy",
  cream: "beige",
  charcoal: "charcoal",
  pink: "pink",
  red: "red",
  purple: "purple",
  mustard: "mustard",
};

export const SWATCH: Record<string, string> = {
  black: "#1c1c1c",
  white: "#f2f1ea",
  grey: "#8f8f88",
  navy: "#26324f",
  beige: "#cbb894",
  olive: "#6b6f3c",
  "denim blue": "#43618f",
  brown: "#6b4a32",
  tan: "#b99a6b",
  burgundy: "#5e2230",
  cream: "#e6ddc7",
  charcoal: "#3a3a38",
  pink: "#d998a6",
  red: "#a53a30",
  purple: "#5b4a8a",
  mustard: "#c99a2e",
};

// Appendix B — demo user default preferences
export const PREFS = {
  gender: "Men",
  priceMin: 500,
  priceMax: 3000,
  retailers: ["Snitch", "Powerlook"],
  categories: ["t-shirts", "shirts", "trousers", "jeans", "co-ords", "jackets", "sneakers", "accessories"],
  styleTags: [
    "streetwear",
    "oversized",
    "casual",
    "linen shirts",
    "cuban collar",
    "korean pants",
    "graphic tees",
    "relaxed",
    "co-ords",
  ],
};

// §7 category map — order matters, first match wins.
export const CATEGORY_MAP: [RegExp, string][] = [
  [/t-?shirt|tee/i, "t-shirts"],
  [/co-?ord/i, "co-ords"],
  [/shirt|polo/i, "shirts"],
  [/jean|denim/i, "jeans"],
  [/cargo|trouser|pant|short|jogger/i, "trousers"],
  [/jacket|overshirt|sweat|hoodie/i, "jackets"],
];
export const CATEGORY_FALLBACK = "t-shirts";

export const STYLE_VOCAB = [
  "streetwear",
  "oversized",
  "graphic",
  "linen",
  "cuban",
  "korean",
  "cargo",
  "washed",
  "resort",
  "relaxed",
  "baggy",
  "polo",
  "smart casual",
  "old money",
  "minimal",
  "utility",
  "chunky",
];

export const SIZE_TOKEN_RE = /^(XS|S|M|L|XL|XXL|3XL|4XL|\d{2}|OS)$/i;

export const RETAILER_SEED: {
  name: string;
  base_url: string;
  trust_score: number;
  priority: number;
  adapter_config: Record<string, unknown>;
}[] = [
  {
    name: "Snitch",
    base_url: "https://www.snitch.co.in",
    trust_score: 0.95,
    priority: 1,
    adapter_config: {
      sizeOptionIndex: null,
      colorFromTitleOnly: false,
      excludeTags: ["blue monkey"],
      productTypeReliable: true,
    },
  },
  {
    name: "Powerlook",
    base_url: "https://www.powerlook.in",
    trust_score: 0.85,
    priority: 2,
    adapter_config: {
      sizeOptionIndex: null,
      colorFromTitleOnly: false,
      excludeTags: [],
      productTypeReliable: false,
    },
  },
];

// Appendix D trend clusters
export const TREND_CLUSTER_SEED: {
  trend_name: string;
  category: string;
  keywords: string[];
  hashtags: string[];
}[] = [
  {
    trend_name: "Oversized washed tees",
    category: "t-shirts",
    keywords: ["oversized", "washed", "drop shoulder", "graphic"],
    hashtags: ["#oversizedtshirt", "#streetwearindia"],
  },
  {
    trend_name: "Relaxed / Korean pants",
    category: "trousers",
    keywords: ["korean", "relaxed", "wide", "pleated", "barrel", "baggy"],
    hashtags: ["#koreanpants", "#baggyjeans"],
  },
  {
    trend_name: "Utility cargos",
    category: "trousers",
    keywords: ["cargo", "utility", "pocket"],
    hashtags: ["#streetwearindia"],
  },
  {
    trend_name: "Cuban collar shirts",
    category: "shirts",
    keywords: ["cuban", "camp collar", "resort", "boxy"],
    hashtags: ["#cubancollarshirt", "#mensfashionindia"],
  },
  {
    trend_name: "Old money / linen",
    category: "shirts",
    keywords: ["linen", "old money", "polo", "oxford"],
    hashtags: ["#oldmoneyoutfit"],
  },
  {
    trend_name: "Minimal white sneakers",
    category: "sneakers",
    keywords: ["white sneaker", "minimal", "clean"],
    hashtags: ["#airportlook"],
  },
];
