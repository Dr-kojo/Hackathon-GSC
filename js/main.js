/* main.js: tab navigation and first render */
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('nav button,.pane').forEach(x=>x.classList.remove('on'));b.classList.add('on');$(b.dataset.t).classList.add('on')});
render();
