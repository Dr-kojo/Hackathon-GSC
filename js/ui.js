/* ui.js: render() builds the four panels (intake, M1, M5, M2 invoices) */
// M1 results: show only what needs attention (failed checks), or one green chip when everything passed
const chips = (r) => {
  const failed = r.ks.filter((k) => !k.ok);
  if (!failed.length)
    return `<span class="ch y" title="${esc(r.ks.map((k) => "✓ " + k.l).join("\n"))}">✓ All ${r.ks.length} checks passed</span>`;
  return failed
    .map((k) => `<span class="ch ${k.st === "Blocked" ? "n" : "r"}" title="${esc(k.tip)}">✗ ${k.l}</span>`)
    .join("");
};

function render() {
  const live = J.map(ev),
    rd = R.filter((r) => r.s === "Ready"),
    cnt = (s) => R.filter((r) => r.s === s).length;
  $("kp").innerHTML = ran
    ? `<div class="card"><div class="k">Straight-through</div><div class="v">${Math.round((rd.length / R.length) * 100)}%</div></div><div class="card"><div class="k">Ready</div><div class="v ok">${rd.length}</div></div><div class="card"><div class="k">Needs review</div><div class="v wn">${cnt("Needs review")}</div></div><div class="card"><div class="k">Blocked</div><div class="v bad">${cnt("Blocked")}</div></div><div class="card"><div class="k">Wrong outputs</div><div class="v ${wrong() ? "bad" : "ok"}">${wrong()}</div></div>`
    : `<div class="card" style="grid-column:1/-1"><b>Inputs changed or not yet checked.</b> <small>Go to panel 2 and press Run checks to refresh results.</small></div>`;
  // P1
  const flag = (i, k, label) =>
    `<label style="white-space:nowrap;margin-right:8px"><input type="checkbox" ${J[i][k] ? "checked" : ""} onchange="S(${i},'${k}',this)"> ${label}</label>`;
  $("p1").innerHTML = `
  <div class="card">
    <h2>Job intake</h2>
    <small>Only admin-verified jobs are billed. Anything else is accepted here but blocked. Edits apply when you leave a field.</small><br><br>
    <button class="btn p" onclick="J.push(mk('J' + String(J.length + 1).padStart(3, '0'), '', 'Wessex Power', 'PDV1 letter', 'Sam', '2026-01-05', 'Pending', ''));ran=false;render()">+ Add job</button>
    <button class="btn" onclick="location.reload()">Reset sample data</button>
  </div>
  <div class="card tw"><table>
    <tr><th>Job ID</th><th title="Used to spot duplicate visits">Postcode</th><th>Client</th><th>Job type</th><th>Agent</th><th>Service date</th><th>Verification</th><th>Price modifiers</th><th>Rate card</th><th>Deduction</th><th>Check</th></tr>
    ${J.map((j, i) => {
      const m = [];
      if (!j.id || !j.pc) m.push('<span class="bad">Job ID and postcode required</span>');
      if (j.vst !== "Verified") m.push('<span class="bad">Will be blocked</span>');
      else if (!j.vd) m.push('<span class="wn">Add verified date</span>');
      if (j.card !== "auto" && j.card !== auto(j.date)) m.push('<span class="wn">Card does not match date</span>');
      if (wkd(j.date)) m.push('<span class="m">Weekend rate applies</span>');
      return `<tr>
        <td>${I(i, "id", 60)}</td>
        <td>${I(i, "pc", 75)}</td>
        <td>${Sel(i, "client", Object.keys(CL))}</td>
        <td>${Sel(i, "type", T)}</td>
        <td>${Sel(i, "agent", Object.keys(AG))}</td>
        <td>${I(i, "date", 125, "date")}</td>
        <td>${Sel(i, "vst", ["Verified", "Pending", "Rejected"])}${j.vst === "Verified" ? "<br>" + I(i, "vd", 125, "date") : ""}</td>
        <td>${flag(i, "em", "Emergency")}<br>${flag(i, "rev", "Revisit")}<br>${flag(i, "na", "No access")}</td>
        <td>${Sel(i, "card", [
          ["auto", "Auto by date"],
          ["v1", "Card v1"],
          ["v2", "Card v2"],
        ])}</td>
        <td>${Sel(i, "dedT", ["None", ...Object.keys(DED)])}${j.dedT !== "None" ? "<br>£ " + I(i, "ded", 55, "number") : ""}</td>
        <td>${m.join("<br>") || '<span class="ok">✓</span>'}</td>
      </tr>`;
    }).join("")}
  </table></div>
  <div class="card">
    <h3>Bulk upload (CSV)</h3>
    <small>Header row with any of: id, pc, client, type, agent, date, vst, vd, flags, card, ded, dedT. Flags are letters: E emergency, R revisit, N no access.</small><br>
    <input type="file" accept=".csv,text/csv" onchange="const r=new FileReader();r.onload=()=>csvLoad(r.result);r.readAsText(this.files[0])"> <small>or paste:</small>
    <textarea id="cv" style="height:70px"></textarea><button class="btn" onclick="csvLoad($('cv').value)">Load pasted CSV</button>
  </div>`;
  // P2
  const cardT = (k) =>
    `<div class="card"><h3>${CARDS[k].n}${CARDS[k].from ? ' (effective from <input type="date" value="' + CARDS[k].from + '" onchange="CARDS.v2.from=this.value;ran=false;render()">)' : " (before change)"}</h3><table>${T.map((t) => `<tr><td>${t}</td><td><input type="number" step="0.01" style="width:80px" value="${CARDS[k].p[t]}" onchange="CARDS.${k}.p['${t}']=+this.value;ran=false;render()"></td></tr>`).join("")}</table></div>`;
  $("p2").innerHTML =
    `<div class="card"><h2>M1 Pricing and readiness</h2><small>Price comes from the card in force on the service date. Modifiers: weekend x1.25, emergency x1.5, no access x0.5, revisit x0.75 (placeholders: replace with the real rate card).</small><br><br><button class="btn p" onclick="run()">Run checks on ${J.length} jobs</button></div><div class="two">${cardT("v1")}${cardT("v2")}</div>
${ran ? `<div class="card tw"><table><tr><th>Job</th><th>Card</th><th>Price</th><th>Checks (hover)</th><th>State</th><th>Code and reason</th></tr>${R.map((r) => `<tr><td><b>${esc(r.j.id)}</b></td><td>${r.c}</td><td>${r.net == null ? "-" : f(r.net)}</td><td>${chips(r)}</td><td><span class="b ${cls(r.s)}">${r.s}</span></td><td><b>${r.code}</b> ${esc(r.why)}${r.own ? "<br><small>Decision owner: " + r.own + "</small>" : ""}<details ${op[r.j.id] ? "open" : ""} ontoggle="op['${r.j.id}']=this.open"><summary>Traceability</summary><small>Job ${esc(r.j.id)} → verification VER-${esc(r.j.id)} (${r.j.vst} ${r.j.vd || ""}) → ${CARDS[r.c].n} ${r.net == null ? "no line" : 'line "' + r.j.type + '"'} → ${r.L.map((l) => l[0] + " " + f(l[1])).join("; ") || "no price"} → ${r.code} ${esc(r.why)}</small></details></td></tr>`).join("")}</table></div>` : '<div class="card"><small>No results yet. Press Run checks.</small></div>'}`;
  // P3
  const bad = live.filter((r) => r.ks.slice(7).some((k) => !k.ok) || r.ks[2].ok === false);
  $("p3").innerHTML =
    `<div class="card"><h2>M5 Compliance rules</h2><small>Every toggle below feeds M1 decisions and M2 invoice content. Not legal advice: confirm against GSC contracts and HMRC guidance.</small></div>
<div class="two"><div class="card tw"><h3>Agent tax and status</h3><table><tr><th>Agent</th><th>Status</th><th title="VAT-registered">VAT</th><th title="Self-billing agreement on file">Self-bill</th><th title="Employment status reviewed">Reviewed</th><th>Result</th></tr>${Object.entries(
      AG,
    )
      .map(
        ([n, a]) =>
          `<tr><td>${n}</td><td><select onchange="AG['${n}'].st=this.value;ran=false;render()">${["Self-employed", "Company"].map((o) => `<option ${o === a.st ? "selected" : ""}>${o}</option>`).join("")}</select></td><td><input type="checkbox" ${a.vat ? "checked" : ""} onchange="AG['${n}'].vat=+this.checked;ran=false;render()"></td><td><input type="checkbox" ${a.sba ? "checked" : ""} onchange="AG['${n}'].sba=+this.checked;ran=false;render()"></td><td><input type="checkbox" ${a.rev ? "checked" : ""} onchange="AG['${n}'].rev=+this.checked;ran=false;render()"></td><td>${a.vat && !a.sba ? '<span class="b Review">Review: no agreement</span>' : a.vat ? '<span class="b Ready">VAT added</span>' : '<span class="b Ready">No VAT</span>'}${a.st === "Self-employed" && !a.rev ? ' <span class="b Review">Status unreviewed</span>' : ""}</td></tr>`,
      )
      .join("")}</table></div>
<div class="card tw"><h3>Contractual billing rights (client x job type)</h3><table><tr><th></th>${T.map((t) => `<th>${t.split(" ")[0]}</th>`).join("")}</tr>${Object.keys(
      CL,
    )
      .map(
        (c) =>
          `<tr><td>${c}</td>${T.map((t) => `<td><input type="checkbox" title="${t}" ${CL[c][t] ? "checked" : ""} onchange="CL['${c}']['${t}']=+this.checked;ran=false;render()"></td>`).join("")}</tr>`,
      )
      .join("")}</table></div></div>
<div class="two"><div class="card"><h3>Legally allowed deductions</h3>${Object.keys(DED)
      .map(
        (d) =>
          `<label style="display:block"><input type="checkbox" ${DED[d] ? "checked" : ""} onchange="DED['${d}']=+this.checked;ran=false;render()"> ${d}</label>`,
      )
      .join(
        "",
      )}<br>Max deductions: <input type="number" style="width:60px" value="${cap}" onchange="cap=+this.value;ran=false;render()"> % of agent pay</div>
<div class="card"><h3>Data protection (UK GDPR)</h3><label style="display:block"><input type="checkbox" checked disabled> Mask customer name and address on invoices</label><label style="display:block"><input type="checkbox" checked disabled> Photos and reports never leave GSC systems or exports</label><label style="display:block"><input type="checkbox" checked disabled> Audit trails store job IDs, not customer details</label><small>Locked on: invoices show the postcode district only.</small></div></div>
<div class="card"><h3>Live M5 impact on jobs</h3>${bad.length ? bad.map((r) => `<div class="msg"><span class="b ${cls(r.s)}">${r.s}</span> <b>${esc(r.j.id)}</b> ${esc(r.why)}</div>`).join("") : "<small>No M5 issues.</small>"}</div>`;
  // P4
  TX = [];
  const csv = ["Type,Ref,TaxPoint,Account,Net,TaxCode,Tax,Total"];
  const ln = (a, b, t) => `<div class="ln ${t ? "t" : ""}"><span>${a}</span><span>${b}</span></div>`;
  $("p4").innerHTML =
    `<div class="card"><h2>M2 Two-invoice generator</h2><small>Two invoices for every Ready job. Agent pay is set as a % of client price (placeholder).</small><br><br>Agent share <input type="number" style="width:60px" value="${share}" onchange="share=+this.value;ran=false;render()"> % <button class="btn" onclick="try{window.print()}catch(e){}">Print</button></div>` +
    (ran
      ? rd.length
        ? rd
            .map((r) => {
              const j = r.j,
                a = r.a,
                sb = a.vat && a.sba,
                ci = `SI-${j.id}`,
                pi = `PI-${j.id}`;
              csv.push(
                `Sales,${ci},${j.date},${j.client},${r.net.toFixed(2)},T1,${r.cv.toFixed(2)},${(r.net + r.cv).toFixed(2)}`,
                `Purchase,${pi},${j.date},${j.agent},${r.an.toFixed(2)},${sb ? "T1" : "T0"},${r.av.toFixed(2)},${(r.an + r.av).toFixed(2)}`,
              );
              const t1 = `Client invoice ${ci}\nTo: ${j.client}\nJob: ${j.id} (${j.type}) ${mask(j)}\nTax point: ${j.date}\n${r.L.map((l) => l[0] + ": " + f(l[1])).join("\n")}\nNet ${f(r.net)} VAT ${f(r.cv)} Total ${f(r.net + r.cv)}`,
                t2 = `Self-billed agent invoice ${pi}\nIssued by GSC on behalf of ${j.agent}\nJob: ${j.id} (${j.type})\nAgent fee: ${f(r.pay)}\n${r.ded ? "Deduction (" + j.dedT + "): -" + f(r.ded) + "\n" : ""}Net ${f(r.an)} VAT ${f(r.av)} Total ${f(r.an + r.av)}`;
              TX.push(t1, t2);
              const k = TX.length - 2;
              return `<div class="card"><details ${op["i" + j.id] ? "open" : ""} ontoggle="op['i${j.id}']=this.open"><summary>${esc(j.id)} · ${esc(j.client)} · ${j.type} <span class="b Ready">Ready</span> <span class="pill">${f(r.net + r.cv)} / ${f(r.an + r.av)}</span></summary><br><div class="two"><div class="inv"><h3>Client invoice ${ci}</h3><small>To ${esc(j.client)} · ${esc(mask(j))} · tax point ${j.date} · invoice period ${mon(r.per)}</small>${r.L.map((l) => ln(esc(l[0]), f(l[1]))).join("")}${ln("Net", f(r.net))}${ln("VAT 20%", f(r.cv))}${ln("Total", f(r.net + r.cv), 1)}<button class="btn" onclick="cp(TX[${k}],this)">Copy invoice</button></div>
<div class="inv"><h3>Agent invoice ${pi}</h3><small>Self-billed by GSC for ${esc(j.agent)} (${a.st}). ${sb ? "VAT-registered, self-billing agreement on file." : "Not VAT-registered: no VAT."}</small>${ln("Agent fee (" + share + "%)", f(r.pay))}${r.ded ? ln("Deduction: " + esc(j.dedT), "-" + f(r.ded)) : ""}${ln("Net", f(r.an))}${ln("VAT" + (sb ? " 20%" : ""), f(r.av))}${ln("Total", f(r.an + r.av), 1)}<button class="btn" onclick="cp(TX[${k + 1}],this)">Copy invoice</button></div></div>
<details><summary>Audit trail</summary><small>Job ${esc(j.id)} → VER-${esc(j.id)} (${j.vst} ${j.vd}) → ${CARDS[r.c].n}, in force on ${j.date} → ${r.L.map((l) => l[0]).join(" + ")} → M5: ${a.st}, VAT ${a.vat ? "registered" : "not registered"}, self-billing ${a.vat ? (a.sba ? "on file" : "missing") : "n/a"}, deduction ${r.ded ? esc(j.dedT) + " allowed" : "none"}, customer data masked → ${ci} + ${pi}</small></details></details></div>`;
            })
            .join("") +
          `<div class="card"><h3>Sage-ready export (all Ready jobs)</h3><textarea readonly id="sg">${csv.join("\n")}</textarea><br><br><button class="btn p" onclick="cp($('sg').value,this)">Copy CSV</button></div>`
        : '<div class="card"><small>No Ready jobs.</small></div>'
      : '<div class="card"><small>Run checks in panel 2 to generate invoices.</small></div>');
}