/* data.js: rate cards, agents, client contracts, deductions, sample jobs, app state. Replace with the real data pack. */
const T = ["PDV1 letter", "Meter reading", "Engineer visit", "Disconnection", "Empty property check"],
  MULT = [
    ["wk", "Weekend uplift", 1.25],
    ["em", "Emergency uplift", 1.5],
    ["na", "No-access rate", 0.5],
    ["rev", "Revisit rate", 0.75],
  ];
const CARDS = {
  v1: {
    n: "Rate card v1",
    p: {
      "PDV1 letter": 18,
      "Meter reading": 14,
      "Engineer visit": 45,
      Disconnection: 85,
      "Empty property check": 22,
    },
  },
  v2: {
    n: "Rate card v2",
    from: "2026-01-15",
    p: {
      "PDV1 letter": 19.5,
      "Meter reading": 15,
      "Engineer visit": 48,
      Disconnection: 90,
      "Empty property check": 23.5,
    },
  },
};
const AG = {
  Sam: { st: "Self-employed", vat: 0, sba: 0, rev: 1 },
  "BrightFix Ltd": { st: "Company", vat: 1, sba: 1, rev: 1 },
  "A. Patel": { st: "Self-employed", vat: 0, sba: 0, rev: 1 },
  "Northgate Ltd": { st: "Company", vat: 1, sba: 0, rev: 1 },
  "J. Cole": { st: "Self-employed", vat: 0, sba: 0, rev: 0 },
};
const CL = { "Wessex Power": {}, "Severn Utilities": {}, "Mercia Legal": {} };
Object.keys(CL).forEach((c) => T.forEach((t) => (CL[c][t] = 1)));
CL["Mercia Legal"]["Disconnection"] = 0;
const DED = {
  Materials: 1,
  "Equipment hire": 1,
  "Damage recovery": 0,
  "Admin fee": 0,
};
let cap = 25,
  share = 70,
  R = [],
  ran = false,
  tab = "p1",
  op = {},
  VAT = 0.2;
// flags: E = emergency, R = revisit, N = no access
const mk = (id, pc, client, type, agent, date, vst, vd, flags = "", card = "auto", ded = 0, dedT = "None") => ({
  id,
  pc,
  client,
  type,
  agent,
  date,
  vst,
  vd,
  em: /E/.test(flags) ? 1 : 0,
  rev: /R/.test(flags) ? 1 : 0,
  na: /N/.test(flags) ? 1 : 0,
  card,
  ded,
  dedT,
});

let J = [
  mk("J001", "BS1 4DJ", "Wessex Power", "PDV1 letter", "Sam", "2026-01-06", "Verified", "2026-01-08"),
  mk("J002", "BA1 2QT", "Severn Utilities", "Disconnection", "BrightFix Ltd", "2026-01-06", "Verified", "2026-01-08"),
  mk("J003", "BS5 6TL", "Wessex Power", "Meter reading", "A. Patel", "2026-01-10", "Verified", "2026-01-12"),
  mk(
    "J004",
    "BA2 3AB",
    "Severn Utilities",
    "Engineer visit",
    "BrightFix Ltd",
    "2026-01-14",
    "Verified",
    "2026-01-16",
    "E",
  ),
  mk("J005", "BS8 1HH", "Wessex Power", "PDV1 letter", "Sam", "2026-01-15", "Verified", "2026-01-17"),
  mk("J006", "BS8 1HH", "Wessex Power", "PDV1 letter", "Sam", "2026-01-15", "Verified", "2026-01-17"),
  mk("J007", "BS3 2PP", "Mercia Legal", "PDV1 letter", "Northgate Ltd", "2026-01-16", "Verified", "2026-01-18"),
  mk("J008", "BS6 7QA", "Wessex Power", "Empty property check", "Sam", "2026-01-18", "Pending", ""),
  mk("J009", "BA1 5ZZ", "Severn Utilities", "Engineer visit", "Sam", "2026-01-19", "Verified", "2026-01-21", "RN"),
  mk("J010", "BS4 4RT", "Mercia Legal", "Disconnection", "BrightFix Ltd", "2026-01-21", "Verified", "2026-01-23"),
  mk(
    "J011",
    "BA3 1CD",
    "Severn Utilities",
    "Meter reading",
    "A. Patel",
    "2026-01-22",
    "Verified",
    "2026-01-24",
    "R",
    "auto",
    6,
    "Damage recovery",
  ),
  mk("J012", "BS9 3EE", "Wessex Power", "Engineer visit", "Sam", "2026-01-20", "Verified", "2026-01-22", "", "v1"),
  mk(
    "J013",
    "BS2 8UU",
    "Wessex Power",
    "Meter reading",
    "Sam",
    "2026-01-24",
    "Verified",
    "2026-01-26",
    "",
    "auto",
    3,
    "Materials",
  ),
  mk("J014", "BA2 9FF", "Severn Utilities", "PDV1 letter", "J. Cole", "2026-01-26", "Verified", "2026-01-28"),
  mk("J015", "BS7 0GG", "Mercia Legal", "PDV1 letter", "Sam", "2026-01-29", "Verified", "2026-02-02", "N"),
];