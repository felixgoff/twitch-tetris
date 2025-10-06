import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js'
import { getDatabase, set, ref, query, orderByChild, get} from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js'
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-analytics.js'

(() => {
  const cfg = {
    apiKey: "AIzaSyBb6xPrdyoPcjsXhEvGSZXBEMVO0ShMi7A",
    authDomain: "twitch-tetris.firebaseapp.com",
    databaseURL: "https://twitch-tetris-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "twitch-tetris",
    storageBucket: "twitch-tetris.firebasestorage.app",
    messagingSenderId: "253624242137",
    appId: "1:253624242137:web:4849d947081d90d225d3c8",
    measurementId: "G-0GLM69Q3G7"
  };
  initializeApp(cfg); getAnalytics();
  const DB = () => getDatabase();

  // private compress / decompress (gzip => base64)
  async function _c(s){
    const b = new TextEncoder().encode(s);
    const cs = new CompressionStream("gzip"), w = cs.writable.getWriter();
    w.write(b); w.close();
    const ab = await new Response(cs.readable).arrayBuffer();
    return btoa(String.fromCharCode(...new Uint8Array(ab)));
  }
  async function _d(s){
    const buf = new Uint8Array([...atob(s)].map(ch=>ch.charCodeAt(0)));
    const cs = new DecompressionStream("gzip"), w = cs.writable.getWriter();
    w.write(buf); w.close();
    return new TextDecoder().decode(await new Response(cs.readable).arrayBuffer());
  }

  function wk(d){
    d=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
    d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));
    const s=new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return [d.getUTCFullYear(), Math.ceil((((d-s)/86400000)+1)/7)];
  }
  const fmt = x => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // write score using push() so we don't overwrite entries with same score
  async function writeScore(obj){
    if(!obj || !obj.isodate) return;
    if(!localStorage.username) localStorage.username = "Unnamed";
    document.getElementById("name").value = localStorage.username;
    const [y,wkNo] = wk(new Date(obj.isodate));
    const p = ref(DB(), `weeks/${y}-${wkNo}/${obj.score}`);
    await set(p, { score: obj.score, name: document.getElementById("name").value, isodate: obj.isodate });
  }

  // robust aggregator for all-time
  async function getAllHighScores(){
    try{
      const snap = await get(ref(DB(), 'weeks'));
      const all = [];
	  console.log(DB());
      if(snap.exists()){
        snap.forEach(weekSnap => {
          weekSnap.forEach(entrySnap => {
            const v = entrySnap.val();
            if(v && v.score !== undefined) all.push(v);
          });
        });
      }
      all.sort((a,b)=>parseInt(b.score,10) - parseInt(a.score,10));
      renderScores(all,"allScoreDiv");
    }catch(err){ console.error('allScores err', err); }
  }

  // weekly
  async function getWeeklyHighScores(){
    try{
      const [y,wkNo] = wk(new Date());
      const q = query(ref(DB(), `weeks/${y}-${wkNo}`), orderByChild("score"));
      const snap = await get(q);
      const arr = [];
      if(snap.exists()){
        snap.forEach(p=>arr.push(p.val()));
        arr.sort((a,b)=>b.score - a.score);
      }
      renderScores(arr,"weeklyScoreDiv");
    }catch(err){ console.error('weekScores err', err); }
  }

  function renderScores(list, id){
    let out = '<table class="highScoreTable"><tr class="highScoreTableHeader"><td>#</td><td>Date</td><td>Name</td><td>Score</td></tr>';
    list.forEach((s,i)=>{
      out += `<tr><td>${i+1}</td><td>${new Date(s.isodate).toLocaleString("sv-SE",{hour:"2-digit",minute:"2-digit",year:'numeric',month:'numeric',day:'numeric',hour12:false})}</td><td>${s.name||''}</td><td>${fmt(s.score)}</td></tr>`;
    });
    out += '</table>';
    const el = document.getElementById(id);
    if(el) el.innerHTML = out;
  }

  // onLoad: decode local storage, optionally upload local scores ONCE (prevent re-uploads)
  async function onLoad(){
    document.getElementById("name").value = localStorage.username || "";
    let dataArr = [];
    try{
      const raw = await _d(localStorage.highscore);
      dataArr = raw.split(",");
    }catch(e){
      try{
        const decoded = atob(localStorage.highscore || "");
        dataArr = decoded.split(",");
        localStorage.highscore = await _c(decoded);
      }catch(er){
        if(localStorage.highscore) dataArr = localStorage.highscore.split(",");
      }
    }
    // Upload local scores once to avoid duplicates (toggle if you want auto re-sync)
    if(localStorage._hs_uploaded == "0" || !localStorage._hs_uploaded){
	console.log("Uploading local scores...");
      for(const item of dataArr){
        try{
          const parsed = JSON.parse(item.replaceAll("'",",")); // keep compatibility
          await writeScore(parsed);
        }catch(e){ /* ignore bad entries */ }
      }
      localStorage._hs_uploaded = "1";
    }

    // render lists
    await getWeeklyHighScores();
    await getAllHighScores();

    // local daily list rendering (kept similar logic)
    const arr = dataArr.map(x=> {
      try{ return JSON.parse(x.replaceAll("'",",")); }catch(e){ return null; }
    }).filter(Boolean).sort((a,b)=>b.score - a.score);
    let out = '<table class="highScoreTable"><tr class="highScoreTableHeader"><td>#</td><td>Date</td><td>Score</td></tr>';
    const scores = [];
    arr.forEach((d,i)=>{
      const S = +d.score;
      const date = new Date(d.isodate).toLocaleString("sv-SE",{hour:"2-digit",minute:"2-digit",year:'numeric',month:'numeric',day:'numeric',hour12:false});
      if(S>50){ scores.push(S); out += `<tr><td>${i+1}</td><td>${date}</td><td>${fmt(S)}</td></tr>`; }
    });
    const avg = scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length).toString().substring(0,5) : "0";
    out += '</table>';
    const dailyEl = document.getElementById("dailyScoreDiv");
    if(dailyEl) dailyEl.innerHTML = out;
    const avgEl = document.getElementById("average");
    if(avgEl) avgEl.innerHTML = "Average: " + avg;
  }

  // small public API
  window.HS = {
    onLoad,
    saveName: ()=>{ localStorage.username = document.getElementById("name").value; }
  };
})();

// hook
document.body.onload = HS.onLoad;
document.getElementById("savename").onclick = HS.saveName;
