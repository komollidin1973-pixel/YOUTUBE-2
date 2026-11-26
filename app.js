const { createClient } = supabase;
const db = createClient(window.YOUTUBE2_SUPABASE_URL, window.YOUTUBE2_SUPABASE_KEY);
const FAVORITES_KEY = "youtube2_favorites_v1";
let movies = [], activeCategory = "Barchasi", activeGenre = "", searchTerm = "", selectedMovie = null, favoritesOnly = false, favorites = new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]")), adminUser = null;
const $ = id => document.getElementById(id);
function safeText(v){return String(v??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function safeHttpUrl(v){try{const u=new URL(v);return ["https:","http:"].includes(u.protocol)?u.href:"";}catch{return "";}}
function toast(msg){$("toast").textContent=msg;$("toast").classList.remove("hidden");setTimeout(()=>$("toast").classList.add("hidden"),3500);}
function fromDb(row){return {id:row.id,title:row.title,year:row.year,type:row.type||"Film",genre:row.genre||"",language:row.language||"",description:row.description||"",poster:row.poster_url||"",url:row.video_url||"",previewUrl:row.preview_url||"",previewStart:Number(row.preview_start_seconds??2400),featured:!!row.featured,trending:!!row.trending,is_published:!!row.is_published};}
function toDb(m){return {title:m.title,year:m.year, type:m.type,genre:m.genre,language:m.language,description:m.description,poster_url:m.poster,video_url:m.url,preview_url:m.previewUrl||null,preview_start_seconds:Number(m.previewStart)||2400,featured:m.featured,is_published:m.is_published};}
async function loadMovies(){ $("resultCount").textContent="Yuklanmoqda…";const {data,error}=await db.from("movies").select("*").eq("is_published",true).order("created_at",{ascending:false});if(error){console.error(error);toast("Katalogni yuklashda xatolik: "+error.message);movies=[];}else movies=(data||[]).map(fromDb);render();}
function filteredMovies(){let a=[...movies];if(favoritesOnly)a=a.filter(m=>favorites.has(String(m.id)));else if(activeGenre)a=a.filter(m=>(m.genre||"").toLowerCase().includes(activeGenre.toLowerCase()));else if(activeCategory==="Trend")a=a.filter(m=>m.trending||m.featured);else if(activeCategory==="Tarjima")a=a.filter(m=>m.type==="Tarjima");else if(activeCategory==="Serial")a=a.filter(m=>m.type==="Serial");if(searchTerm)a=a.filter(m=>(m.title+" "+m.genre+" "+m.year).toLowerCase().includes(searchTerm));return a;}
function posterMarkup(m){const u=safeHttpUrl(m.poster);return u?'<img loading="lazy" src="'+safeText(u)+'" alt="'+safeText(m.title)+'" onerror="this.remove()">':'<div class="poster-placeholder">▶</div>';}
function previewSource(m){const candidate=safeHttpUrl(m.previewUrl)||safeHttpUrl(m.url);return /\.(mp4|m3u8|webm)(?:$|[?#])/i.test(candidate)?candidate:"";}
function render(){
  stopAllPreviews();
  const base = filteredMovies();
  const homeView = !favoritesOnly && !activeGenre && activeCategory === "Barchasi" && !searchTerm;
  const sections = homeView ? [
    {title:"Trenddagi kinolar", items:base.filter(m=>m.trending||m.featured)},
    {title:"Rus tilida kinolar", items:base.filter(m=>/рус|rus/i.test(m.language||""))},
    {title:"Qo‘rqinchli kinolar", items:base.filter(m=>/dahshat|qo‘rq|qorq|horror|ужас/i.test((m.genre||"")+" "+(m.type||"")))},
    {title:"Jangari kinolar", items:base.filter(m=>/jangari|action|бой|боевик/i.test((m.genre||"")+" "+(m.type||"")))},
    {title:"Komediya kinolar", items:base.filter(m=>/komediya|comedy|комеди/i.test((m.genre||"")+" "+(m.type||"")))},
    {title:"Tarjima kinolar", items:base.filter(m=>m.type==="Tarjima"||/tarjima/i.test(m.type||""))},
    {title:"Seriallar", items:base.filter(m=>m.type==="Serial"||/serial/i.test(m.type||""))},
    {title:"Yangi qo‘shilgan kinolar", items:base}
  ].filter(section=>section.items.length) : [
    {title:favoritesOnly?"Sevimlilar":activeGenre||({Trend:"Trenddagi kinolar",Tarjima:"Tarjima kinolar",Serial:"Seriallar"}[activeCategory]||"Kinolar"),items:base}
  ];

  const cardHTML = m => '<article class="movie-card" data-id="'+safeText(m.id)+'" tabindex="0" role="button" aria-label="'+safeText(m.title)+'"><div class="poster">'+posterMarkup(m)+'<video class="card-preview" playsinline preload="none" aria-hidden="true"></video>'+(m.featured?'<span class="poster-badge">TAVSIYA</span>':'')+'<span class="poster-type">'+safeText(m.type)+'</span><span class="preview-hint">KO‘RIB CHIQISH</span></div><div class="movie-info"><div class="movie-title">'+safeText(m.title)+'</div><div class="movie-meta">'+safeText(m.year||"—")+' · '+safeText(m.genre||"Kino")+'</div></div></article>';

  $("movieGrid").innerHTML = sections.map((section,index)=>
    '<section class="catalog-row" data-row="'+index+'"><div class="catalog-row-heading"><h2>'+safeText(section.title)+'</h2><span>'+section.items.length+' ta</span></div><div class="movie-row-track">'+section.items.map(cardHTML).join("")+'</div></section>'
  ).join("");

  $("emptyState").classList.toggle("hidden",base.length!==0);
  $("resultCount").textContent=base.length+" ta kino";
  if($("sectionTitle")) $("sectionTitle").textContent=favoritesOnly?"Sevimlilar":activeGenre||({Trend:"Trenddagi kinolar",Tarjima:"Tarjima kinolar",Serial:"Seriallar"}[activeCategory]||"Barcha kinolar");
  document.querySelectorAll(".chip").forEach(c=>c.classList.toggle("selected",c.dataset.filter===activeCategory&&!activeGenre&&!favoritesOnly));
}

// Poster preview: autoplay boshlanishida brauzer siyosati sabab ovozsiz; foydalanuvchi pult/sichqoncha bilan harakat qilgach ovoz yoqiladi.
const PREVIEW_DURATION_SECONDS = 12;
let activePreviewCard = null;
let activePreviewHls = null;
let previewStopTimer = null;
let previewUserGesture = false;

function stopPreview(card = activePreviewCard) {
  if (!card) return;
  const video = card.querySelector(".card-preview");
  if (previewStopTimer) clearTimeout(previewStopTimer);
  previewStopTimer = null;
  if (video) {
    try { video.pause(); video.removeAttribute("src"); video.load(); } catch (_) {}
    video.classList.remove("is-playing");
    video.onloadedmetadata = null;
    video.onerror = null;
  }
  if (activePreviewHls) { try { activePreviewHls.destroy(); } catch (_) {} }
  activePreviewHls = null;
  card.classList.remove("preview-active");
  if (activePreviewCard === card) activePreviewCard = null;
}
function stopAllPreviews() { if (activePreviewCard) stopPreview(activePreviewCard); }
function startCardPreview(card) {
  if (!card || $("playerDialog").open || card.classList.contains("preview-active")) return;
  const movie = movies.find(m => String(m.id) === String(card.dataset.id));
  if (!movie) return;
  const source = previewSource(movie);
  if (!source) return;
  stopAllPreviews();
  const video = card.querySelector(".card-preview");
  if (!video) return;

  activePreviewCard = card;
  card.classList.add("preview-active");
  // Muted autoplay is permitted by Chrome/Android WebView. Audio is enabled on a real remote/key gesture below.
  video.muted = !previewUserGesture;
  video.defaultMuted = !previewUserGesture;
  video.volume = 0.65;
  video.playsInline = true;
  video.controls = false;
  video.preload = "auto";

  const isSeparateClip = !!safeHttpUrl(movie.previewUrl);
  const startAt = isSeparateClip ? 0 : Math.max(0, Number(movie.previewStart ?? 2400));
  let timerStarted = false;
  const markPlaying = () => {
    if (activePreviewCard !== card) return;
    video.classList.add("is-playing");
    if (!timerStarted) {
      timerStarted = true;
      previewStopTimer = setTimeout(() => stopPreview(card), PREVIEW_DURATION_SECONDS * 1000);
    }
  };
  video.onerror = () => {
    console.warn("YOUTUBE-2 preview video error", video.error?.code, source);
    card.classList.remove("preview-active");
    if (activePreviewCard === card) activePreviewCard = null;
  };
  video.addEventListener("loadedmetadata", () => {
    if (activePreviewCard !== card) return;
    if (startAt > 0 && Number.isFinite(video.duration) && startAt < video.duration - 1) {
      try { video.currentTime = startAt; } catch (_) {}
    }
  }, {once:true});
  video.addEventListener("ended", () => stopPreview(card), {once:true});

  if (/\.m3u8(?:$|[?#])/i.test(source) && !video.canPlayType("application/vnd.apple.mpegurl")) {
    if (window.Hls && window.Hls.isSupported()) {
      activePreviewHls = new window.Hls({enableWorker:true});
      activePreviewHls.loadSource(source);
      activePreviewHls.attachMedia(video);
      activePreviewHls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        const p = video.play();
        if (p && p.then) p.then(markPlaying).catch(err => { console.warn("Preview autoplay blocked", err); stopPreview(card); });
        else markPlaying();
      });
      activePreviewHls.on(window.Hls.Events.ERROR, (_e, data) => { if (data.fatal) stopPreview(card); });
    } else stopPreview(card);
    return;
  }

  video.src = source;
  video.load();
  const playPromise = video.play();
  if (playPromise && playPromise.then) {
    playPromise.then(markPlaying).catch(err => {
      console.warn("Preview play failed", err, source);
      card.classList.remove("preview-active");
      if (activePreviewCard === card) activePreviewCard = null;
    });
  } else markPlaying();
}

// Arrow/OK/Enter from an Android TV remote is a user gesture. Enable sound on the newly focused preview.
document.addEventListener("keydown", e => {
  if (!["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Enter", " "].includes(e.key)) return;
  previewUserGesture = true;
  const focusedCard = document.activeElement?.closest?.(".movie-card");
  if (focusedCard) {
    const v = focusedCard.querySelector(".card-preview");
    if (v && activePreviewCard === focusedCard) {
      v.muted = false;
      v.defaultMuted = false;
      v.volume = 0.65;
      const p = v.play();
      if (p?.catch) p.catch(err => console.info("Audible preview still blocked by WebView policy", err));
    }
  }
}, true);
// Mouse/touch interaction also unlocks audio where the browser allows it.
document.addEventListener("pointerdown", e => {
  const card = e.target.closest?.(".movie-card");
  if (!card) return;
  previewUserGesture = true;
  const v = card.querySelector(".card-preview");
  if (v && activePreviewCard === card) {
    v.muted = false; v.defaultMuted = false; v.volume = 0.65;
    const p = v.play(); if (p?.catch) p.catch(() => {});
  }
}, true);

function showMovie(id){stopAllPreviews();const m=movies.find(x=>String(x.id)===String(id));if(!m)return;selectedMovie=m;openPlayer();}

let activePlayerJS = null;

function isDirectVideoUrl(url) {
  return /\.(mp4|m3u8|mpd|webm)(?:$|[?#])/i.test(url);
}

function openPlayer() {
  if (!selectedMovie) return;

  const url = safeHttpUrl(selectedMovie.url);
  if (!url) {
    toast("Bu kino uchun video manbasi qo‘shilmagan.");
    return;
  }

  const wrap = $("playerFrameWrap");
  wrap.replaceChildren();
  $("playerTitle").textContent = selectedMovie.title || "YOUTUBE-2";

  const dialog = $("playerDialog");
  dialog.showModal();

  // Make the player occupy the whole TV screen as soon as a movie is selected.
  // The CSS full-viewport dialog is the fallback for WebViews that reject the
  // Fullscreen API. requestFullscreen is attempted directly from the click flow.
  try {
    if (dialog.requestFullscreen && !document.fullscreenElement) {
      const fullscreenRequest = dialog.requestFullscreen();
      if (fullscreenRequest && typeof fullscreenRequest.catch === "function") {
        fullscreenRequest.catch(error => console.info("Fullscreen API fallback:", error));
      }
    }
  } catch (error) {
    console.info("Fullscreen API unavailable; using full-screen dialog.", error);
  }

  // Direct MP4 / HLS / DASH sources use PlayerJS.
  if (isDirectVideoUrl(url)) {
    if (typeof window.Playerjs === "function") {
      const playerBox = document.createElement("div");
      playerBox.id = "youtube2Player";
      playerBox.className = "youtube2-player";
      wrap.append(playerBox);

      try {
        activePlayerJS = new window.Playerjs({
          id: "youtube2Player",
          file: url,
          poster: safeHttpUrl(selectedMovie.poster),
          title: selectedMovie.title || "YOUTUBE-2",
          autoplay: 1
        });
        return;
      } catch (error) {
        console.error("PlayerJS ishga tushmadi:", error);
        toast("PlayerJS ochilmadi. Video havolasini tekshiring.");
        wrap.replaceChildren();
      }
    } else {
      toast("PlayerJS fayli topilmadi. playerjs.js faylini saytga yuklang.");
    }
  }

  // Embed pages remain in an iframe; PlayerJS cannot replace an arbitrary
  // third-party embed page with a direct video player.
  const frame = document.createElement("iframe");
  frame.src = url;
  frame.title = selectedMovie.title || "YOUTUBE-2";
  frame.allow = "autoplay; fullscreen; picture-in-picture";
  frame.allowFullscreen = true;
  frame.referrerPolicy = "strict-origin-when-cross-origin";
  wrap.append(frame);
}

function closePlayer() {
  try {
    if (activePlayerJS && typeof activePlayerJS.api === "function") {
      activePlayerJS.api("stop");
    }
  } catch (error) {
    console.warn("PlayerJS stop xatosi:", error);
  }
  activePlayerJS = null;
  $("playerFrameWrap").replaceChildren();
  if (document.fullscreenElement && document.exitFullscreen) {
    try {
      const exitRequest = document.exitFullscreen();
      if (exitRequest && typeof exitRequest.catch === "function") exitRequest.catch(()=>{});
    } catch (error) { console.info("Fullscreen exit:", error); }
  }
  $("playerDialog").close();
  if (selectedMovie) {
    const card = [...document.querySelectorAll('.movie-card')].find(el => el.dataset.id === String(selectedMovie.id));
    if (card) card.focus({preventScroll:true});
  }
}

function clearForm(){$("movieForm").reset();$("movieId").value="";$("movieLanguage").value="O‘zbek tilida";$("moviePreviewStart").value="40";$("moviePublished").checked=true;}
async function refreshAdmin(){const {data,error}=await db.from("movies").select("*").order("created_at",{ascending:false});if(error){toast("Admin katalogini yuklab bo‘lmadi: "+error.message);return;}const all=(data||[]).map(fromDb);$("adminCount").textContent=all.length+" ta";$("adminMovieList").innerHTML=all.map(m=>'<div class="admin-row"><div class="mini-poster"></div><div class="admin-row-title">'+safeText(m.title)+'<div class="movie-meta">'+safeText(m.year||"")+' · '+safeText(m.type)+' · '+(m.is_published?"Ommaviy":"Yashirin")+'</div></div><div class="admin-row-actions"><button data-edit="'+safeText(m.id)+'">Tahrir</button><button class="delete" data-delete="'+safeText(m.id)+'">O‘chir</button></div></div>').join("");}
function updateAdminView(){const logged=!!adminUser;$("adminLoginSection").classList.toggle("hidden",logged);$("adminTools").classList.toggle("hidden",!logged);if(logged){$("adminIdentity").textContent=adminUser.email||"Admin";refreshAdmin();}}
async function editMovie(id){const {data,error}=await db.from("movies").select("*").eq("id",id).single();if(error){toast(error.message);return;}const m=fromDb(data);$("movieId").value=m.id;$("movieTitle").value=m.title;$("movieYear").value=m.year||"";$("movieType").value=m.type||"Film";$("movieGenre").value=m.genre;$("movieLanguage").value=m.language;$("moviePoster").value=m.poster;$("movieDescription").value=m.description;$("movieUrl").value=m.url;$("moviePreviewUrl").value=m.previewUrl||"";$("moviePreviewStart").value=Math.round((m.previewStart||2400)/60);$("movieFeatured").checked=m.featured;$("moviePublished").checked=m.is_published;$("movieTitle").focus();}
$("year").textContent=new Date().getFullYear();$("footerYear").textContent=new Date().getFullYear();
$("movieGrid").addEventListener("pointerover",e=>{const c=e.target.closest(".movie-card");if(c && !c.contains(e.relatedTarget))startCardPreview(c);});
$("movieGrid").addEventListener("pointerout",e=>{const c=e.target.closest(".movie-card");if(c && !c.contains(e.relatedTarget))stopPreview(c);});
$("movieGrid").addEventListener("focusin",e=>{const c=e.target.closest(".movie-card");if(c)startCardPreview(c);});
$("movieGrid").addEventListener("focusout",e=>{const c=e.target.closest(".movie-card");if(c && !c.contains(e.relatedTarget))stopPreview(c);});
$("movieGrid").addEventListener("click",e=>{const c=e.target.closest("[data-id]");if(c)showMovie(c.dataset.id);});
$("movieGrid").addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches("[data-id]")){e.preventDefault();showMovie(e.target.dataset.id);}});
$("searchInput").addEventListener("input",e=>{searchTerm=e.target.value.trim().toLowerCase();render();});$("searchForm").addEventListener("submit",e=>{e.preventDefault();render();});
document.querySelectorAll("[data-category]").forEach(b=>b.addEventListener("click",()=>{activeCategory=b.dataset.category;activeGenre="";favoritesOnly=false;$("sidebar").classList.remove("open");render();}));
document.querySelectorAll("[data-genre]").forEach(b=>b.addEventListener("click",()=>{activeGenre=b.dataset.genre;activeCategory="Barchasi";favoritesOnly=false;$("sidebar").classList.remove("open");render();}));
document.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{activeCategory=b.dataset.filter;activeGenre="";favoritesOnly=false;render();}));
$("favoritesNav").addEventListener("click",()=>{favoritesOnly=true;activeGenre="";$("sidebar").classList.remove("open");render();});

$("playerClose").addEventListener("click",closePlayer);
$("adminToggle").addEventListener("click",()=>{$("adminDialog").showModal();updateAdminView();});
let logoTapCount=0,logoTapTimer=null,logoHoldTimer=null;
const brandSecret=$("brandSecret");
function openHiddenAdmin(){logoTapCount=0;clearTimeout(logoTapTimer);$("adminDialog").showModal();updateAdminView();}
brandSecret.addEventListener("click",e=>{e.preventDefault();logoTapCount++;clearTimeout(logoTapTimer);if(logoTapCount>=5){openHiddenAdmin();return;}logoTapTimer=setTimeout(()=>logoTapCount=0,2200);});
brandSecret.addEventListener("pointerdown",()=>{logoHoldTimer=setTimeout(openHiddenAdmin,1200);});
["pointerup","pointerleave","pointercancel"].forEach(ev=>brandSecret.addEventListener(ev,()=>clearTimeout(logoHoldTimer)));
$("adminClose").addEventListener("click",()=>$("adminDialog").close());$("resetForm").addEventListener("click",clearForm);
$("loginForm").addEventListener("submit",async e=>{e.preventDefault();const {data,error}=await db.auth.signInWithPassword({email:$("adminEmail").value.trim(),password:$("adminPassword").value});if(error){toast("Kirish amalga oshmadi: "+error.message);return;}adminUser=data.user;updateAdminView();toast("Admin sifatida kirdingiz.");});
$("logoutButton").addEventListener("click",async()=>{await db.auth.signOut();adminUser=null;updateAdminView();clearForm();toast("Tizimdan chiqdingiz.");});
$("movieForm").addEventListener("submit",async e=>{e.preventDefault();if(!adminUser){toast("Avval admin sifatida kiring.");return;}const id=$("movieId").value;const m={title:$("movieTitle").value.trim(),year:Number($("movieYear").value)||null,type:$("movieType").value,genre:$("movieGenre").value.trim(),language:$("movieLanguage").value.trim(),poster:safeHttpUrl($("moviePoster").value),description:$("movieDescription").value.trim(),url:safeHttpUrl($("movieUrl").value),previewUrl:safeHttpUrl($("moviePreviewUrl").value),previewStart:Math.max(0,Number($("moviePreviewStart").value||40)*60),featured:$("movieFeatured").checked,is_published:$("moviePublished").checked};if(!m.title){toast("Kino nomini kiriting.");return;}const query=id?db.from("movies").update(toDb(m)).eq("id",id):db.from("movies").insert(toDb(m));const {error}=await query;if(error){toast("Saqlashda xatolik: "+error.message);return;}clearForm();await loadMovies();await refreshAdmin();toast("Kino bazaga saqlandi.");});
$("adminMovieList").addEventListener("click",async e=>{const edit=e.target.closest("[data-edit]"),del=e.target.closest("[data-delete]");if(edit)await editMovie(edit.dataset.edit);if(del){const id=del.dataset.delete;if(confirm("Bu kino o‘chirilsinmi?")){const {error}=await db.from("movies").delete().eq("id",id);if(error)toast("O‘chirishda xatolik: "+error.message);else{await loadMovies();await refreshAdmin();toast("Kino o‘chirildi.");}}}});
$("menuToggle").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
db.auth.onAuthStateChange((_event,session)=>{adminUser=session?.user||null;if($("adminDialog").open)updateAdminView();});
loadMovies();


/* YOUTUBE-2 horizontal category shelves */
(function(){
  if(document.getElementById("youtube2-horizontal-rows-style")) return;
  const style=document.createElement("style");
  style.id="youtube2-horizontal-rows-style";
  style.textContent=`
    #movieGrid{display:flex!important;flex-direction:column!important;gap:30px!important;width:100%}
    .catalog-row{display:block;width:100%;min-width:0}
    .catalog-row-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:0 0 13px}
    .catalog-row-heading h2{margin:0;font-size:clamp(19px,1.7vw,27px);font-weight:700;color:#f4f4f4}
    .catalog-row-heading span{font-size:13px;color:#999;white-space:nowrap}
    .movie-row-track{display:flex;flex-direction:row;gap:20px;overflow-x:auto;overflow-y:hidden;padding:3px 4px 12px;scroll-behavior:smooth;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;scrollbar-width:thin}
    .movie-row-track .movie-card{flex:0 0 clamp(220px,22vw,330px);width:clamp(220px,22vw,330px);min-width:0;scroll-snap-align:start}
    .movie-row-track .poster{width:100%;aspect-ratio:16/9;overflow:hidden}
    .movie-row-track .poster img,.movie-row-track .card-preview{width:100%;height:100%;object-fit:cover}
    .movie-row-track .movie-card:focus{outline:3px solid #f22;outline-offset:4px;transform:scale(1.025);z-index:2}
    .movie-row-track .movie-info{padding:8px 2px 3px}
    .movie-row-track::-webkit-scrollbar{height:6px}
    .movie-row-track::-webkit-scrollbar-thumb{background:#555;border-radius:8px}
    @media(max-width:700px){.movie-row-track .movie-card{flex-basis:72vw;width:72vw}}
  `;
  document.head.append(style);
})();

// Android TV remote: left/right move along a row; up/down switch rows.
function focusMovieCard(index, rowIndex = 0){
  const rows=[...document.querySelectorAll('.movie-row-track')];
  if(!rows.length)return;
  const row=rows[Math.max(0,Math.min(rowIndex,rows.length-1))];
  const cards=[...row.querySelectorAll('.movie-card')];
  if(!cards.length)return;
  const target=cards[Math.max(0,Math.min(index,cards.length-1))];
  target.focus({preventScroll:false});
}
document.addEventListener("keydown",e=>{
  if((e.key==="Escape"||e.key==="Backspace")&&$("playerDialog").open){e.preventDefault();closePlayer();return;}
  if($("playerDialog").open)return;
  const current=document.activeElement;
  const row=current?.closest?.('.movie-row-track');
  if(row && current.matches('.movie-card') && ["ArrowRight","ArrowLeft","ArrowDown","ArrowUp"].includes(e.key)){
    e.preventDefault();
    const rows=[...document.querySelectorAll('.movie-row-track')];
    const rowIndex=rows.indexOf(row);
    const cards=[...row.querySelectorAll('.movie-card')];
    const index=cards.indexOf(current);
    if(e.key==="ArrowRight")focusMovieCard(index+1,rowIndex);
    if(e.key==="ArrowLeft")focusMovieCard(index-1,rowIndex);
    if(e.key==="ArrowDown")focusMovieCard(index,rowIndex+1);
    if(e.key==="ArrowUp"){
      if(rowIndex>0)focusMovieCard(index,rowIndex-1);
      else $("searchInput")?.focus();
    }
    return;
  }
  if((e.key==="ArrowDown"||e.key==="ArrowUp") && (current===$("searchInput")||current===document.body)){
    const first=document.querySelector('.movie-row-track .movie-card');
    if(first){e.preventDefault();first.focus({preventScroll:false});}
  }
});
// Put initial focus on the first movie when the catalogue has loaded.
const movieFocusObserver=new MutationObserver(()=>{
  const first=document.querySelector('.movie-row-track .movie-card');
  if(first && !document.activeElement?.closest?.('input,button,.movie-card')) first.focus({preventScroll:true});
});
movieFocusObserver.observe($('movieGrid'),{childList:true,subtree:true});
