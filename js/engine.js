/* engine.js: M1 pricing and readiness + M5 compliance checks. ev() returns Ready / Blocked / Needs review with a reason code. */
const mon = (p) =>
  new Date(p + "-01T12:00:00").toLocaleString("en-GB", {
    month: "short",
    year: "numeric",
  }); // '2026-02' -> 'Feb 2026'
const auto = (d) => (d >= CARDS.v2.from ? "v2" : "v1"),
  wkd = (d) => [0, 6].includes(new Date(d + "T12:00:00").getDay());
function ev(j, i) {
  const c = j.card === "auto" ? auto(j.date) : j.card,
    a = AG[j.agent] || {},
    base = CARDS[c].p[j.type],
    fl = { wk: wkd(j.date), em: j.em, na: j.na, rev: j.rev };
  let L = [],
    net = null;
  if (base != null) {
    let run = base;
    L.push(["Base price: " + j.type + " (" + CARDS[c].n + ")", r2(base)]);
    MULT.forEach(([k, l, m]) => {
      if (fl[k]) {
        const d = r2(run * m - run);
        L.push([l + " x" + m, d]);
        run = r2(run + d);
      }
    });
    net = r2(L.reduce((x, l) => x + l[1], 0));
  }
  const dp = J.findIndex(
      (x, k) => k < i && x.vst === "Verified" && (x.id === j.id || x.pc + x.type + x.date === j.pc + j.type + j.date),
    ),
    ded = +j.ded || 0,
    pay = net == null ? 0 : r2((net * share) / 100),
    an = r2(pay - ded),
    carry = !!j.vd && j.vd.slice(0, 7) > j.date.slice(0, 7),
    per = (carry ? j.vd : j.date).slice(0, 7);
  const K = (l, ok, st, code, why, own, tip) => ({
    l,
    ok,
    st,
    code,
    why,
    own,
    tip,
  });
  const ks = [
    K(
      "Verified",
      j.vst === "Verified",
      "Blocked",
      "R01",
      j.vst === "Rejected" ? "Rejected by admin" : "Not verified by admin",
      "",
      "Only admin-verified jobs can be billed.",
    ),
    K(
      "No duplicate",
      dp < 0,
      "Blocked",
      "R02",
      "Duplicate of " + (J[dp] || {}).id,
      "",
      "Same ID or same postcode, type and date as an earlier verified job.",
    ),
    K(
      "Contract billable",
      !!(CL[j.client] || {})[j.type],
      "Blocked",
      "R11",
      "Client contract does not allow billing " + j.type,
      "",
      "M5: contractual billing rights.",
    ),
    K(
      "Rate line",
      base != null,
      "Needs review",
      "R04",
      "No rate-card line for " + j.type,
      "Contracts manager",
      "Job type must exist on the selected card.",
    ),
    K(
      "Card date",
      j.card === "auto" || j.card === auto(j.date),
      "Needs review",
      "R05",
      "Card " + j.card + " selected but service date needs " + auto(j.date),
      "Contracts manager",
      "New prices apply from " + CARDS.v2.from + " by service date.",
    ),
    K(
      "Flags",
      !(j.rev && j.na),
      "Needs review",
      "R06",
      "Revisit and no-access both set",
      "Operations lead",
      "Conflicting price modifiers.",
    ),
    K(
      "Self-billing",
      !(a.vat && !a.sba),
      "Needs review",
      "R07",
      "VAT-registered agent has no self-billing agreement",
      "Finance controller",
      "M5: GSC may only raise the agent invoice with an agreement.",
    ),
    K(
      "Status",
      a.st !== "Self-employed" || !!a.rev,
      "Needs review",
      "R08",
      "Self-employed status not reviewed",
      "Compliance lead",
      "M5: employment status check.",
    ),
    K(
      "Deduction allowed",
      ded === 0 || !!DED[j.dedT],
      "Needs review",
      "R09",
      'Deduction "' + j.dedT + '" not allowed by contract',
      "Contracts manager",
      "M5: only contractual deductions.",
    ),
    K(
      "Deduction cap",
      ded <= (pay * cap) / 100,
      "Needs review",
      "R10",
      "Deduction exceeds " + cap + "% of agent pay",
      "Finance controller",
      "M5: deduction limit.",
    ),
  ];
  const x = ks.find((k) => !k.ok),
    cv = net == null ? 0 : r2(net * VAT);
  return {
    j,
    i,
    c,
    L,
    net,
    pay,
    ded,
    an,
    cv,
    carry,
    per,
    av: a.vat && a.sba ? r2(an * VAT) : 0,
    ks,
    s: x ? x.st : "Ready",
    code: x ? x.code : "OK",
    why: x ? x.why : carry ? "Verified after month end: carried to the " + mon(per) + " invoice" : "All checks passed",
    own: x ? x.own : "",
    a,
  };
}
const cls = (s) => (s === "Needs review" ? "Review" : s);
function wrong() {
  return R.filter(
    (r) =>
      r.s === "Ready" &&
      !(
        r.j.vst === "Verified" &&
        r.net > 0 &&
        r.net === r2(r.L.reduce((x, l) => x + l[1], 0)) &&
        r.c === auto(r.j.date) &&
        r.an >= 0 &&
        r.av > 0 === !!(r.a.vat && r.a.sba) &&
        !(r.a.vat && !r.a.sba)
      ),
  ).length;
}