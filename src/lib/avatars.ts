/**
 * Verified, high-resolution portrait avatars for professionals, homeowners, and reviewers.
 * All URLs are direct Unsplash portraits optimized with crop & compression.
 */

const u = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=256&h=256&q=80`;

/**
 * Mapped portraits for each professional (pro-1 through pro-27).
 * Diverse, authentic contractor & tradesperson portraits.
 */
export const proAvatars: Record<string, string> = {
  "pro-1": u("photo-1507003211169-0a1dd7228f2d"), // Luis Ortega (Plumbing)
  "pro-2": u("photo-1573496359142-b8d87734a5a2"), // Priya Shah (Electrical)
  "pro-3": u("photo-1500648767791-00dcc994a43e"), // Dana Whitfield (HVAC)
  "pro-4": u("photo-1506794778202-cad84cf45f1d"), // Chris Nguyen (Painting)
  "pro-5": u("photo-1519085360753-af0119f7cbe7"), // Marcus Vance (Handyman)
  "pro-6": u("photo-1580489944761-15a19d654956"), // Elena Rostova (Appliance Repair)
  "pro-7": u("photo-1472099645785-5658abf4ff4e"), // Travis Boone (Roofing)
  "pro-8": u("photo-1522075469751-3a6694fb2f61"), // Carlos Mendez (Landscaping)
  "pro-9": u("photo-1560250097-0b93528c311a"), // Benjamin Reed (Plumbing)
  "pro-10": u("photo-1573497019940-1c28c88b4f3e"), // Sarah Jenkins (Electrical)
  "pro-11": u("photo-1539571696357-5a69c17a67c6"), // David Kim (HVAC)
  "pro-12": u("photo-1567532939604-b6b5b0db2604"), // Rachel Morales (Handyman)
  "pro-13": u("photo-1501196354995-cbb51c65aaea"), // Anthony Clark (Roofing)
  "pro-14": u("photo-1544005313-94ddf0286df2"), // Jessica Taylor (Painting)
  "pro-15": u("photo-1517841905240-472988babdf9"), // Gabriel Santos (Landscaping)
  "pro-16": u("photo-1560787313-5dff3307e257"), // Olga Romanov (Appliance Repair)
  "pro-17": u("photo-1535713875002-d1d0cf377fde"), // Jason Bell (Pest Control)
  "pro-18": u("photo-1527980965255-d3b416303d12"), // Mateo Alvarez (Plumbing)
  "pro-19": u("photo-1548142813-c348350df52b"), // Emily Watson (Electrical)
  "pro-20": u("photo-1508214751196-bcfd4ca60f91"), // Lucas Meyer (HVAC)
  "pro-21": u("photo-1566492031773-4f4e44671857"), // Brandon Cole (Handyman)
  "pro-22": u("photo-1494790108377-be9c29b29330"), // Hannah Cooper (Painting)
  "pro-23": u("photo-1521119989659-a83eee488004"), // Tyler Howard (Roofing)
  "pro-24": u("photo-1531746020798-e6953c6e8e04"), // Liam O'Connor (Landscaping)
  "pro-25": u("photo-1544717302-de2939b7ef71"), // Nora Hale (Cleaning)
  "pro-26": u("photo-1524504388940-b1c1722653e1"), // Camila Ortiz (Cleaning)
  "pro-27": u("photo-1543610892-0b1f7e6d8ac1"), // Daniel Kim (Cleaning)
};

/**
 * Named customer reviewers with authentic portraits
 */
export const namedAvatars: Record<string, string> = {
  "maya chen": u("photo-1544005313-94ddf0286df2"),
  "luis ortega": u("photo-1507003211169-0a1dd7228f2d"),
  "priya shah": u("photo-1573496359142-b8d87734a5a2"),
  "dana whitfield": u("photo-1500648767791-00dcc994a43e"),
  "chris nguyen": u("photo-1506794778202-cad84cf45f1d"),
  "marcus vance": u("photo-1519085360753-af0119f7cbe7"),
  "elena rostova": u("photo-1580489944761-15a19d654956"),
  "travis boone": u("photo-1472099645785-5658abf4ff4e"),
  "carlos mendez": u("photo-1522075469751-3a6694fb2f61"),
  "benjamin reed": u("photo-1560250097-0b93528c311a"),
  "sarah jenkins": u("photo-1573497019940-1c28c88b4f3e"),
  "david kim": u("photo-1539571696357-5a69c17a67c6"),
  "rachel morales": u("photo-1567532939604-b6b5b0db2604"),
  "anthony clark": u("photo-1501196354995-cbb51c65aaea"),
  "jessica taylor": u("photo-1544005313-94ddf0286df2"),
  "gabriel santos": u("photo-1517841905240-472988babdf9"),
  "olga romanov": u("photo-1560787313-5dff3307e257"),
  "jason bell": u("photo-1535713875002-d1d0cf377fde"),
  "mateo alvarez": u("photo-1527980965255-d3b416303d12"),
  "emily watson": u("photo-1548142813-c348350df52b"),
  "lucas meyer": u("photo-1508214751196-bcfd4ca60f91"),
  "brandon cole": u("photo-1566492031773-4f4e44671857"),
  "hannah cooper": u("photo-1494790108377-be9c29b29330"),
  "tyler howard": u("photo-1521119989659-a83eee488004"),
  "liam o'connor": u("photo-1531746020798-e6953c6e8e04"),
  "nora hale": u("photo-1544717302-de2939b7ef71"),
  "camila ortiz": u("photo-1524504388940-b1c1722653e1"),
  "daniel kim": u("photo-1543610892-0b1f7e6d8ac1"),

  // Verified Customer Reviewers
  "james w.": u("photo-1507003211169-0a1dd7228f2d"),
  "natalie k.": u("photo-1548142813-c348350df52b"),
  "robert c.": u("photo-1500648767791-00dcc994a43e"),
  "amanda p.": u("photo-1494790108377-be9c29b29330"),
  "jordan hale": u("photo-1519085360753-af0119f7cbe7"),
  "elena ruiz": u("photo-1580489944761-15a19d654956"),
  "david h.": u("photo-1506794778202-cad84cf45f1d"),
  "sarah m.": u("photo-1573496359142-b8d87734a5a2"),
  "michael t.": u("photo-1472099645785-5658abf4ff4e"),
  "rachel k.": u("photo-1567532939604-b6b5b0db2604"),
  "carlos g.": u("photo-1522075469751-3a6694fb2f61"),
  "linda b.": u("photo-1544717302-de2939b7ef71"),
  "thomas s.": u("photo-1560250097-0b93528c311a"),
  "karen d.": u("photo-1524504388940-b1c1722653e1"),
  "brian m.": u("photo-1535713875002-d1d0cf377fde"),
  "jennifer l.": u("photo-1573497019940-1c28c88b4f3e"),
  "kevin r.": u("photo-1539571696357-5a69c17a67c6"),
  "stephanie w.": u("photo-1560787313-5dff3307e257"),
  "mark d.": u("photo-1521119989659-a83eee488004"),
  "patricia h.": u("photo-1544005313-94ddf0286df2"),
  "greg s.": u("photo-1508214751196-bcfd4ca60f91"),
  "angela f.": u("photo-1580489944761-15a19d654956"),
};

/** Deterministic palette of fallback photos so dynamic users always get a crisp face */
const fallbackPool = [
  u("photo-1507003211169-0a1dd7228f2d"),
  u("photo-1573496359142-b8d87734a5a2"),
  u("photo-1500648767791-00dcc994a43e"),
  u("photo-1506794778202-cad84cf45f1d"),
  u("photo-1519085360753-af0119f7cbe7"),
  u("photo-1580489944761-15a19d654956"),
  u("photo-1472099645785-5658abf4ff4e"),
  u("photo-1544005313-94ddf0286df2"),
  u("photo-1567532939604-b6b5b0db2604"),
  u("photo-1522075469751-3a6694fb2f61"),
  u("photo-1560250097-0b93528c311a"),
  u("photo-1573497019940-1c28c88b4f3e"),
  u("photo-1539571696357-5a69c17a67c6"),
  u("photo-1548142813-c348350df52b"),
  u("photo-1494790108377-be9c29b29330"),
  u("photo-1527980965255-d3b416303d12"),
  u("photo-1544717302-de2939b7ef71"),
  u("photo-1524504388940-b1c1722653e1"),
];

/**
 * Returns a high-res portrait avatar URL for any person, pro, or reviewer.
 */
export function getAvatar(name?: string, id?: string): string {
  if (id && proAvatars[id]) {
    return proAvatars[id];
  }
  if (name) {
    const key = name.trim().toLowerCase();
    if (namedAvatars[key]) return namedAvatars[key];

    // Check partial matches (e.g. "Ortega Plumbing" -> "Luis Ortega")
    if (key.includes("ortega")) return proAvatars["pro-1"];
    if (key.includes("shah")) return proAvatars["pro-2"];
    if (key.includes("whitfield")) return proAvatars["pro-3"];
    if (key.includes("northline") || key.includes("nguyen")) return proAvatars["pro-4"];
    if (key.includes("apex") || key.includes("vance")) return proAvatars["pro-5"];
    if (key.includes("precision appliance") || key.includes("rostova")) return proAvatars["pro-6"];
    if (key.includes("lone star roofing") || key.includes("boone")) return proAvatars["pro-7"];
    if (key.includes("greenleaf") || key.includes("mendez")) return proAvatars["pro-8"];
    if (key.includes("reed")) return proAvatars["pro-9"];
    if (key.includes("voltcraft") || key.includes("jenkins")) return proAvatars["pro-10"];
    if (key.includes("climate works") || key.includes("david kim")) return proAvatars["pro-11"];
    if (key.includes("cleanedge") || key.includes("morales")) return proAvatars["pro-12"];
    if (key.includes("summit shield") || key.includes("clark")) return proAvatars["pro-13"];
    if (key.includes("brush & blade") || key.includes("taylor")) return proAvatars["pro-14"];
    if (key.includes("hill country") || key.includes("santos")) return proAvatars["pro-15"];
    if (key.includes("capital appliance") || key.includes("romanov")) return proAvatars["pro-16"];
    if (key.includes("pest shield") || key.includes("bell")) return proAvatars["pro-17"];
    if (key.includes("flowright") || key.includes("alvarez")) return proAvatars["pro-18"];
    if (key.includes("ampere") || key.includes("watson")) return proAvatars["pro-19"];
    if (key.includes("breezeair") || key.includes("meyer")) return proAvatars["pro-20"];
    if (key.includes("finish carpentry") || key.includes("cole")) return proAvatars["pro-21"];
    if (key.includes("palette perfection") || key.includes("cooper")) return proAvatars["pro-22"];
    if (key.includes("titan ridge") || key.includes("howard")) return proAvatars["pro-23"];
    if (key.includes("sprinklers") || key.includes("o'connor")) return proAvatars["pro-24"];
    if (key.includes("brightspace") || key.includes("hale")) return proAvatars["pro-25"];
    if (key.includes("ortiz")) return proAvatars["pro-26"];

    // Deterministic hash into pool
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % fallbackPool.length;
    return fallbackPool[idx];
  }
  return fallbackPool[0];
}
