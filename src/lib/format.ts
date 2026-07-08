export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
export const pct = (x: number) => (x >= 0 ? "+" : "") + (x * 100).toFixed(1) + "%";
