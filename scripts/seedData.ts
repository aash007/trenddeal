// Appendix C verified real sample data + prototype OWNED[] wardrobe, copied
// verbatim from TrendDeal_1.jsx / TrendDeal_MVP_Build_Spec.md.

export type SeedProductRaw = {
  retailer: "Snitch" | "Powerlook";
  title: string;
  category: string;
  subCategory: string;
  color: string;
  fit: string;
  occasion: string;
  seasonalTags: string[];
  price: number; // "usual" anchor price to simulate 30d history around
  mrp: number; // 0 = none
  sizesAvailable: number; // count
  sizesTotal: string[]; // full size list
  styleTags: string[];
  newArrival: boolean;
};

// field order per spec Appendix C: [title, category, color, fit, price, mrp(0=none), sizesAvailableCount, sizesTotalCount, sizes, styleTags]
export const SNITCH_PRODUCTS: SeedProductRaw[] = [
  { retailer: "Snitch", title: "Green Baggy Trousers", category: "trousers", subCategory: "baggy", color: "olive", fit: "relaxed", occasion: "casual", seasonalTags: ["all-season"], price: 1999, mrp: 0, sizesAvailable: 5, sizesTotal: "28|30|32|34|36".split("|"), styleTags: ["baggy", "casual"], newArrival: false },
  { retailer: "Snitch", title: "Brown Baggy Trousers", category: "trousers", subCategory: "baggy", color: "brown", fit: "relaxed", occasion: "casual", seasonalTags: ["all-season"], price: 1999, mrp: 0, sizesAvailable: 5, sizesTotal: "28|30|32|34|36".split("|"), styleTags: ["baggy", "casual"], newArrival: false },
  { retailer: "Snitch", title: "Khaki Baggy Trousers", category: "trousers", subCategory: "baggy", color: "beige", fit: "relaxed", occasion: "casual", seasonalTags: ["all-season"], price: 1999, mrp: 0, sizesAvailable: 5, sizesTotal: "28|30|32|34|36".split("|"), styleTags: ["baggy", "casual"], newArrival: true },
  { retailer: "Snitch", title: "Off White Baggy Trousers", category: "trousers", subCategory: "baggy", color: "white", fit: "relaxed", occasion: "casual", seasonalTags: ["all-season"], price: 1999, mrp: 0, sizesAvailable: 5, sizesTotal: "28|30|32|34|36".split("|"), styleTags: ["baggy", "casual"], newArrival: false },
  { retailer: "Snitch", title: "Viscose Luxe Polo T-Shirt (White)", category: "t-shirts", subCategory: "polo", color: "white", fit: "regular", occasion: "smart casual", seasonalTags: ["all-season"], price: 1699, mrp: 0, sizesAvailable: 6, sizesTotal: "XS|S|M|L|XL|XXL".split("|"), styleTags: ["polo"], newArrival: false },
  { retailer: "Snitch", title: "Viscose Luxe Polo T-Shirt (Brown)", category: "t-shirts", subCategory: "polo", color: "brown", fit: "regular", occasion: "smart casual", seasonalTags: ["all-season"], price: 1699, mrp: 0, sizesAvailable: 5, sizesTotal: "XS|S|M|L|XL|XXL".split("|"), styleTags: ["polo"], newArrival: false },
  { retailer: "Snitch", title: "Viscose Luxe Polo T-Shirt (Blue)", category: "t-shirts", subCategory: "polo", color: "denim blue", fit: "regular", occasion: "smart casual", seasonalTags: ["all-season"], price: 1699, mrp: 0, sizesAvailable: 6, sizesTotal: "XS|S|M|L|XL|XXL".split("|"), styleTags: ["polo"], newArrival: true },
  { retailer: "Snitch", title: "Viscose Luxe Polo T-Shirt (Olive)", category: "t-shirts", subCategory: "polo", color: "olive", fit: "regular", occasion: "smart casual", seasonalTags: ["all-season"], price: 1699, mrp: 0, sizesAvailable: 6, sizesTotal: "XS|S|M|L|XL|XXL".split("|"), styleTags: ["polo"], newArrival: false },
  { retailer: "Snitch", title: "Black Slim Fit Stretch T-Shirt", category: "t-shirts", subCategory: "basics", color: "black", fit: "slim", occasion: "casual", seasonalTags: ["all-season"], price: 1199, mrp: 0, sizesAvailable: 6, sizesTotal: "XS|S|M|L|XL|XXL".split("|"), styleTags: ["basics"], newArrival: false },
  { retailer: "Snitch", title: "Off White Slim Fit Stretch T-Shirt", category: "t-shirts", subCategory: "basics", color: "white", fit: "slim", occasion: "casual", seasonalTags: ["all-season"], price: 1199, mrp: 0, sizesAvailable: 6, sizesTotal: "XS|S|M|L|XL|XXL".split("|"), styleTags: ["basics"], newArrival: false },
  { retailer: "Snitch", title: "Maroon Slim Fit Stretch T-Shirt", category: "t-shirts", subCategory: "basics", color: "burgundy", fit: "slim", occasion: "casual", seasonalTags: ["all-season"], price: 1199, mrp: 0, sizesAvailable: 6, sizesTotal: "XS|S|M|L|XL|XXL".split("|"), styleTags: ["basics"], newArrival: false },
  { retailer: "Snitch", title: "Cotton Oversized Polo T-Shirt (Brown)", category: "t-shirts", subCategory: "oversized", color: "brown", fit: "oversized", occasion: "casual", seasonalTags: ["all-season"], price: 1299, mrp: 0, sizesAvailable: 5, sizesTotal: "S|M|L|XL|XXL".split("|"), styleTags: ["oversized", "casual"], newArrival: true },
  { retailer: "Snitch", title: "Cotton Oversized Polo T-Shirt (Navy)", category: "t-shirts", subCategory: "oversized", color: "navy", fit: "oversized", occasion: "casual", seasonalTags: ["all-season"], price: 1299, mrp: 0, sizesAvailable: 5, sizesTotal: "S|M|L|XL|XXL".split("|"), styleTags: ["oversized", "casual"], newArrival: false },
  { retailer: "Snitch", title: "Cotton Oversized Polo T-Shirt (Blue)", category: "t-shirts", subCategory: "oversized", color: "denim blue", fit: "oversized", occasion: "casual", seasonalTags: ["all-season"], price: 1299, mrp: 0, sizesAvailable: 5, sizesTotal: "S|M|L|XL|XXL".split("|"), styleTags: ["oversized"], newArrival: false },
];

export const POWERLOOK_PRODUCTS: SeedProductRaw[] = [
  { retailer: "Powerlook", title: "Baggy Fit Denim Jeans", category: "jeans", subCategory: "baggy", color: "denim blue", fit: "relaxed", occasion: "casual", seasonalTags: ["all-season"], price: 1599, mrp: 0, sizesAvailable: 7, sizesTotal: "28|30|32|34|36|38|40|42".split("|"), styleTags: ["baggy"], newArrival: false },
  { retailer: "Powerlook", title: "Ice Blue Washed Barrel Jeans", category: "jeans", subCategory: "baggy", color: "denim blue", fit: "relaxed", occasion: "casual", seasonalTags: ["all-season"], price: 1699, mrp: 0, sizesAvailable: 6, sizesTotal: "28|30|32|34|36|38|40|42".split("|"), styleTags: ["baggy", "washed"], newArrival: false },
  { retailer: "Powerlook", title: "Tinted Blue Barrel Fit Jeans", category: "jeans", subCategory: "baggy", color: "denim blue", fit: "relaxed", occasion: "casual", seasonalTags: ["all-season"], price: 1699, mrp: 0, sizesAvailable: 7, sizesTotal: "28|30|32|34|36|38|40|42".split("|"), styleTags: ["baggy"], newArrival: true },
  { retailer: "Powerlook", title: "Mid Blue Washed Panel Jeans", category: "jeans", subCategory: "baggy", color: "denim blue", fit: "relaxed", occasion: "casual", seasonalTags: ["all-season"], price: 1699, mrp: 0, sizesAvailable: 6, sizesTotal: "28|30|32|34|36|38|40|42".split("|"), styleTags: ["baggy", "washed"], newArrival: false },
  { retailer: "Powerlook", title: "Brown Washed Lego Print T-Shirt", category: "t-shirts", subCategory: "oversized", color: "brown", fit: "oversized", occasion: "casual", seasonalTags: ["all-season"], price: 1299, mrp: 0, sizesAvailable: 7, sizesTotal: "S|M|L|XL|XXL|3XL|4XL".split("|"), styleTags: ["oversized", "graphic"], newArrival: false },
  { retailer: "Powerlook", title: "Burgundy Washed Structure Boxy Shirt", category: "shirts", subCategory: "boxy", color: "burgundy", fit: "oversized", occasion: "smart casual", seasonalTags: ["all-season"], price: 1199, mrp: 0, sizesAvailable: 8, sizesTotal: "S|M|L|XL|XXL|3XL|4XL".split("|"), styleTags: ["oversized"], newArrival: true },
  { retailer: "Powerlook", title: "Grey Ombre Baggy Jeans", category: "jeans", subCategory: "baggy", color: "grey", fit: "relaxed", occasion: "casual", seasonalTags: ["all-season"], price: 1599, mrp: 0, sizesAvailable: 8, sizesTotal: "28|30|32|34|36|38|40|42".split("|"), styleTags: ["baggy"], newArrival: false },
  { retailer: "Powerlook", title: "Black Oxford Shirt", category: "shirts", subCategory: "oxford", color: "black", fit: "regular", occasion: "smart casual", seasonalTags: ["all-season"], price: 1199, mrp: 0, sizesAvailable: 6, sizesTotal: "S|M|L|XL|XXL|3XL|4XL".split("|"), styleTags: ["smart casual"], newArrival: false },
  { retailer: "Powerlook", title: "Off White Printed T-Shirt", category: "t-shirts", subCategory: "oversized", color: "white", fit: "oversized", occasion: "casual", seasonalTags: ["all-season"], price: 999, mrp: 0, sizesAvailable: 8, sizesTotal: "S|M|L|XL|XXL|3XL|4XL".split("|"), styleTags: ["oversized", "graphic"], newArrival: false },
  { retailer: "Powerlook", title: "Navy Overdyed Structure Shirt", category: "shirts", subCategory: "structure", color: "navy", fit: "regular", occasion: "smart casual", seasonalTags: ["all-season"], price: 1399, mrp: 0, sizesAvailable: 8, sizesTotal: "S|M|L|XL|XXL|3XL|4XL".split("|"), styleTags: ["smart casual"], newArrival: false },
  { retailer: "Powerlook", title: "Red Structure Knit Polo T-Shirt", category: "t-shirts", subCategory: "polo", color: "red", fit: "regular", occasion: "casual", seasonalTags: ["all-season"], price: 1099, mrp: 0, sizesAvailable: 7, sizesTotal: "S|M|L|XL|XXL|3XL|4XL".split("|"), styleTags: ["polo"], newArrival: false },
  { retailer: "Powerlook", title: "White Striped Doctor Sleeves Shirt", category: "shirts", subCategory: "oversized", color: "white", fit: "oversized", occasion: "smart casual", seasonalTags: ["all-season"], price: 1199, mrp: 0, sizesAvailable: 5, sizesTotal: "S|M|L|XL|XXL|3XL|4XL".split("|"), styleTags: ["oversized"], newArrival: true },
  { retailer: "Powerlook", title: "Brown Printed Structured T-Shirt", category: "t-shirts", subCategory: "oversized", color: "brown", fit: "oversized", occasion: "casual", seasonalTags: ["all-season"], price: 999, mrp: 0, sizesAvailable: 6, sizesTotal: "S|M|L|XL|XXL|3XL|4XL".split("|"), styleTags: ["oversized", "graphic"], newArrival: false },
  { retailer: "Powerlook", title: "Pastel Pink Structured Printed Shirt", category: "shirts", subCategory: "structure", color: "pink", fit: "regular", occasion: "smart casual", seasonalTags: ["all-season"], price: 1199, mrp: 0, sizesAvailable: 7, sizesTotal: "S|M|L|XL|XXL|3XL|4XL".split("|"), styleTags: ["smart casual"], newArrival: false },
];

export const SEED_PRODUCTS: SeedProductRaw[] = [...SNITCH_PRODUCTS, ...POWERLOOK_PRODUCTS];

export type SeedOwnedItem = {
  retailer: string;
  brand: string;
  name: string;
  category: string;
  color: string;
  fit: string;
  occasion: string;
  styleTags: string[];
};

// Copied verbatim from TrendDeal_1.jsx OWNED[] — deliberately bottoms-light,
// no sneakers/accessories/layering so the gap-detection rules in §11 fire.
export const SEED_OWNED_ITEMS: SeedOwnedItem[] = [
  { retailer: "The Souled Store", brand: "TSS", name: "Oversized black tee", category: "t-shirts", color: "black", fit: "oversized", occasion: "casual", styleTags: ["streetwear", "oversized"] },
  { retailer: "Bewakoof", brand: "Bewakoof", name: "Oversized white tee", category: "t-shirts", color: "white", fit: "oversized", occasion: "casual", styleTags: ["streetwear", "oversized"] },
  { retailer: "The Souled Store", brand: "TSS", name: "Black graphic tee", category: "t-shirts", color: "black", fit: "regular", occasion: "casual", styleTags: ["graphic tees", "streetwear"] },
  { retailer: "Bewakoof", brand: "Bewakoof", name: "White graphic tee", category: "t-shirts", color: "white", fit: "regular", occasion: "casual", styleTags: ["graphic tees"] },
  { retailer: "Snitch", brand: "Snitch", name: "Washed grey oversized tee", category: "t-shirts", color: "grey", fit: "oversized", occasion: "casual", styleTags: ["oversized", "washed"] },
  { retailer: "Snitch", brand: "Snitch", name: "Navy Cuban collar shirt", category: "shirts", color: "navy", fit: "relaxed", occasion: "smart casual", styleTags: ["cuban collar"] },
  { retailer: "Powerlook", brand: "Powerlook", name: "White linen shirt", category: "shirts", color: "white", fit: "relaxed", occasion: "smart casual", styleTags: ["linen shirts"] },
  { retailer: "Snitch", brand: "Snitch", name: "Blue relaxed jeans", category: "jeans", color: "denim blue", fit: "relaxed", occasion: "casual", styleTags: ["relaxed"] },
  { retailer: "Bewakoof", brand: "Bewakoof", name: "Black joggers", category: "trousers", color: "black", fit: "relaxed", occasion: "casual", styleTags: ["relaxed", "streetwear"] },
  { retailer: "Snitch", brand: "Snitch", name: "Beige oversized tee", category: "t-shirts", color: "beige", fit: "oversized", occasion: "casual", styleTags: ["oversized"] },
  { retailer: "The Souled Store", brand: "TSS", name: "Olive graphic tee", category: "t-shirts", color: "olive", fit: "regular", occasion: "casual", styleTags: ["graphic tees"] },
  { retailer: "Uniqlo India", brand: "Uniqlo", name: "White plain tee", category: "t-shirts", color: "white", fit: "regular", occasion: "casual", styleTags: ["basics"] },
];
