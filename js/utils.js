/* utils.js: small helpers ($, esc, money format) */
const $=i=>document.getElementById(i),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),f=n=>'£'+n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,','),r2=n=>Math.round(n*100)/100;
