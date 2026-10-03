/* actions.js: input handlers, CSV loader, copy-to-clipboard, run checks */
function S(i, k, el) {
  let v = el.type === "checkbox" ? (el.checked ? 1 : 0) : el.value;
  if (k === "ded") v = +v || 0;
  J[i][k] = v;
  if (k === "dedT" && v === "None") J[i].ded = 0;
  ran = false;
  render();
}
const I = (i, k, w, t = "text") =>
    `<input type="${t}" value="${esc(J[i][k])}" style="width:${w}px" onchange="S(${i},'${k}',this)">`,
  C = (i, k, t) => `<input type="checkbox" title="${t}" ${J[i][k] ? "checked" : ""} onchange="S(${i},'${k}',this)">`,
  Sel = (i, k, o) =>
    `<select onchange="S(${i},'${k}',this)">${o
      .map((x) => {
        x = Array.isArray(x) ? x : [x, x];
        return `<option value="${esc(x[0])}" ${x[0] === J[i][k] ? "selected" : ""}>${esc(x[1])}</option>`;
      })
      .join("")}</select>`;
function run() {
  R = J.map(ev);
  ran = true;
  render();
}
function csvLoad(t) {
  const L = t
    .trim()
    .split(/\r?\n/)
    .map((l) => l.split(",").map((s) => s.trim()));
  const h = L.shift();
  const out = L.filter((r) => r.length > 1).map((r) => {
    const o = mk("", "", "Wessex Power", "PDV1 letter", "Sam", "", "Pending", "");
    h.forEach((k, x) => {
      if (k === "flags") {
        o.em = /E/.test(r[x]) ? 1 : 0;
        o.rev = /R/.test(r[x]) ? 1 : 0;
        o.na = /N/.test(r[x]) ? 1 : 0;
        return;
      }
      if (!(k in o)) return;
      o[k] = k === "ded" ? +r[x] || 0 : r[x];
    });
    return o;
  });
  if (out.length) {
    J = out;
    ran = false;
    render();
  }
}
function cp(t, b) {
  try {
    navigator.clipboard.writeText(t).catch(() => fb(t));
  } catch (e) {
    fb(t);
  }
  b.textContent = "Copied";
}
function fb(t) {
  const a = document.createElement("textarea");
  a.value = t;
  document.body.appendChild(a);
  a.select();
  try {
    document.execCommand("copy");
  } catch (e) {}
  a.remove();
}
const mask = (j) => j.pc.split(" ")[0]; // postcode district only: no customer names on invoices
let TX = [];