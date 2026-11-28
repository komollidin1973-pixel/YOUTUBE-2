const { createClient } = supabase;
const db = createClient(window.YOUTUBE2_SUPABASE_URL, window.YOUTUBE2_SUPABASE_KEY);
const FAVORITES_KEY = "youtube2_favorites_v1";
let movies = [], activeCategory = "Barchasi", activeGenre = "", searchTerm = "", selectedMovie = null, favoritesOnly = false, favorites = new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]")), adminUser = null;
const $ = id => document.getElementById(id);
function safeText(v){return String(v??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function safeHttpUrl(v){try{const u=new URL(v);return ["https:","http:"].includes(u.protocol)?u.href:"";}catch{return "";}}
function mediaKind(raw){try{const u=new URL(raw);const p=u.pathname.toLowerCase();if(/\.m3u8$/.test(p))return "hls";if(/\.mpd$/.test(p))return "dash";if(/\.(mp4|m4v|webm|mov)$/.test(p))return "file";return "embed";}catch{return "embed";}}
function toast(msg){$("toast").textContent=msg;$("toast").classList.remove("hidden");setTimeout(()=>$ ("toast").classList.add("hidden"),3500);}
function fromDb(row){return {id:row.id,title:row.title,year:row.year,type:row.type||"Film",genre:row.genre||"",language:row.language||"",description:row.description||"",poster:row.poster_url||"",url:row.video_url||"",featured:!!row.featured,trending:!!row.trending,is_published:!!row.is_published};}
function toDb(m){return {title:m.title,year:m.year, type:m.type,genre:m.genre,language:m.language,description:m.description,poster_url:m.poster,video_url:m.url,featured:m.featured,is_published:m.is_published};}
async function loadMovies(){
  $("resultCount").textContent="Yuklanmoqda…";
  try {
    const {data,error}=await db.from("movies").select("*").eq("is_published",true).order("created_at",{ascending:false});
    if(error){console.error("Supabase movies query:",error);toast("Katalogni yuklashda xatolik: "+error.message);movies=[];}
    else movies=(data||[]).map(fromDb);
  } catch(error) {
    console.error("Katalog yuklashda kutilmagan xato:",error);
    toast("Katalogni yuklab bo‘lmadi. Internet yoki Supabase ulanishini tekshiring.");
    movies=[];
  }
  render();
}
function filteredMovies(){let a=[...movies];if(favoritesOnly)a=a.filter(m=>favorites.has(String(m.id)));else if(activeGenre)a=a.filter(m=>(m.genre||"").toLowerCase().includes(activeGenre.toLowerCase()));else if(activeCategory==="Trend")a=a.filter(m=>m.trending||m.featured);else if(activeCategory==="Tarjima")a=a.filter(m=>m.type==="Tarjima");else if(activeCategory==="Serial")a=a.filter(m=>m.type==="Serial");if(searchTerm)a=a.filter(m=>(m.title+" "+m.genre+" "+m.year).toLowerCase().includes(searchTerm));return a;}
function posterMarkup(m){const u=safeHttpUrl(m.poster);return u?'<img loading="lazy" src="'+safeText(u)+'" alt="'+safeText(m.title)+'" onerror="this.remove()">':'<div class="poster-placeholder">▶</div>';}
function render(){const list=filteredMovies();$("movieGrid").innerHTML=list.map(m=>'<article class="movie-card" data-id="'+safeText(m.id)+'" tabindex="0" role="button"><div class="poster">'+posterMarkup(m)+(m.featured?'<span class="poster-badge">TAVSIYA</span>':'')+'<span class="poster-type">'+safeText(m.type)+'</span></div><div class="movie-info"><div class="movie-title">'+safeText(m.title)+'</div><div class="movie-meta">'+safeText(m.year||"—")+' · '+safeText(m.genre||"Kino")+'</div></div></article>').join("");$("emptyState").classList.toggle("hidden",list.length!==0);$("resultCount").textContent=list.length+" ta kino";$("sectionTitle").textContent=favoritesOnly?"Sevimlilar":activeGenre||({Trend:"Trenddagi kinolar",Tarjima:"Tarjima kinolar",Serial:"Seriallar"}[activeCategory]||"Barcha kinolar");document.querySelectorAll(".chip").forEach(c=>c.classList.toggle("selected",c.dataset.filter===activeCategory&&!activeGenre&&!favoritesOnly));}
function showMovie(id){const m=movies.find(x=>String(x.id)===String(id));if(!m)return;selectedMovie=m;$("dialogTitle").textContent=m.title;$("dialogMeta").textContent=[m.year,m.type,m.genre,m.language].filter(Boolean).join(" · ");$("dialogDescription").textContent=m.description||"Tavsif hali qo‘shilmagan.";$("dialogPoster").style.backgroundImage=safeHttpUrl(m.poster)?"url('"+safeHttpUrl(m.poster).replace(/'/g,"%27")+"')":"linear-gradient(110deg,#252525,#171717)";$("favoriteButton").textContent=favorites.has(String(id))?"♥ Sevimlilardan olish":"♡ Sevimlilarga";$("watchButton").disabled=!safeHttpUrl(m.url);$("watchButton").style.opacity=m.url?1:.5;$("sourceNote").textContent=m.url?"Manbaning embed ruxsati va mavjudligi sayt egasiga bog‘liq.":"Bu kinoga video manbasi qo‘shilmagan.";$("movieDialog").showModal();}
function openBrowserMedia(url,title,kind){
  const wrap=$("playerFrameWrap");wrap.replaceChildren();$("playerTitle").textContent=title;
  if(kind==="embed") { const frame=document.createElement("iframe");frame.src=url;frame.title=title;frame.allow="autoplay; fullscreen; picture-in-picture";frame.allowFullscreen=true;wrap.append(frame); }
  else {
    const video=document.createElement("video");video.controls=true;video.autoplay=true;video.playsInline=true;video.preload="metadata";video.style.cssText="width:100%;height:100%;max-height:80vh;background:#000;object-fit:contain";wrap.append(video);
    if(kind==="hls"&&!video.canPlayType("application/vnd.apple.mpegurl")){
      const start=()=>{if(window.Hls&&Hls.isSupported()){const h=new Hls({enableWorker:true,lowLatencyMode:false,backBufferLength:30});h.loadSource(url);h.attachMedia(video);h.on(Hls.Events.ERROR,(_,data)=>{if(data.fatal)toast("HLS ijro xatosi: "+data.type);});}else{toast("Bu brauzer HLS formatini qo‘llamaydi.");}};
      if(window.Hls)start();else{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/hls.js@1.5.18/dist/hls.min.js";s.onload=start;s.onerror=()=>toast("HLS kutubxonasini yuklab bo‘lmadi.");document.head.append(s);}
    } else video.src=url;
  }
  $("movieDialog").close();$("playerDialog").showModal();
}
function openPlayer(){
  if(!selectedMovie)return;const url=safeHttpUrl(selectedMovie.url);if(!url){toast("Bu kino uchun video manbasi qo‘shilmagan.");return;}
  const kind=mediaKind(url),title=selectedMovie.title||"YOUTUBE-2";
  // Native Android playback for direct media files/manifests. Do not send these through an iframe/WebView.
  if(kind!=="embed"&&window.AndroidPlayer&&typeof window.AndroidPlayer.play==="function"){
    try{window.AndroidPlayer.play(url,title);$("movieDialog").close();return;}catch(e){console.error("Native Media3 launch failed",e);toast("Native pleer ochilmadi: "+(e.message||e));}
  }
  // Embed pages stay in their provider-owned player; a web JS player cannot replace an arbitrary cross-origin iframe.
  if(kind==="embed"&&window.AndroidPlayer&&typeof window.AndroidPlayer.playEmbed==="function"){
    try{window.AndroidPlayer.playEmbed(url,title,location.href);$("movieDialog").close();return;}catch(e){console.error("Embed launch failed",e);}
  }
  openBrowserMedia(url,title,kind);
}
function clearForm(){$("movieForm").reset();$("movieId").value="";$("movieLanguage").value="O‘zbek tilida";$("moviePublished").checked=true;}
async function refreshAdmin(){const {data,error}=await db.from("movies").select("*").order("created_at",{ascending:false});if(error){toast("Admin katalogini yuklab bo‘lmadi: "+error.message);return;}const all=(data||[]).map(fromDb);$("adminCount").textContent=all.length+" ta";$("adminMovieList").innerHTML=all.map(m=>'<div class="admin-row"><div class="mini-poster"></div><div class="admin-row-title">'+safeText(m.title)+'<div class="movie-meta">'+safeText(m.year||"")+' · '+safeText(m.type)+' · '+(m.is_published?"Ommaviy":"Yashirin")+'</div></div><div class="admin-row-actions"><button data-edit="'+safeText(m.id)+'">Tahrir</button><button class="delete" data-delete="'+safeText(m.id)+'">O‘chir</button></div></div>').join("");}
function updateAdminView(){const logged=!!adminUser;$("adminLoginSection").classList.toggle("hidden",logged);$("adminTools").classList.toggle("hidden",!logged);if(logged){$("adminIdentity").textContent=adminUser.email||"Admin";refreshAdmin();}}
async function editMovie(id){const {data,error}=await db.from("movies").select("*").eq("id",id).single();if(error){toast(error.message);return;}const m=fromDb(data);$("movieId").value=m.id;$("movieTitle").value=m.title;$("movieYear").value=m.year||"";$("movieType").value=m.type||"Film";$("movieGenre").value=m.genre;$("movieLanguage").value=m.language;$("moviePoster").value=m.poster;$("movieDescription").value=m.description;$("movieUrl").value=m.url;$("movieFeatured").checked=m.featured;$("moviePublished").checked=m.is_published;$("movieTitle").focus();}
$("year").textContent=new Date().getFullYear();$("footerYear").textContent=new Date().getFullYear();
$("movieGrid").addEventListener("click",e=>{const c=e.target.closest("[data-id]");if(c)showMovie(c.dataset.id);});
$("movieGrid").addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches("[data-id]")){e.preventDefault();showMovie(e.target.dataset.id);}});
$("searchInput").addEventListener("input",e=>{searchTerm=e.target.value.trim().toLowerCase();render();});$("searchForm").addEventListener("submit",e=>{e.preventDefault();render();});
document.querySelectorAll("[data-category]").forEach(b=>b.addEventListener("click",()=>{activeCategory=b.dataset.category;activeGenre="";favoritesOnly=false;$("sidebar").classList.remove("open");render();}));
document.querySelectorAll("[data-genre]").forEach(b=>b.addEventListener("click",()=>{activeGenre=b.dataset.genre;activeCategory="Barchasi";favoritesOnly=false;$("sidebar").classList.remove("open");render();}));
document.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{activeCategory=b.dataset.filter;activeGenre="";favoritesOnly=false;render();}));
$("favoritesNav").addEventListener("click",()=>{favoritesOnly=true;activeGenre="";$("sidebar").classList.remove("open");render();});
$("favoriteButton").addEventListener("click",()=>{if(!selectedMovie)return;const id=String(selectedMovie.id);if(favorites.has(id))favorites.delete(id);else favorites.add(id);localStorage.setItem(FAVORITES_KEY,JSON.stringify([...favorites]));$("favoriteButton").textContent=favorites.has(id)?"♥ Sevimlilardan olish":"♡ Sevimlilarga";render();});
$("watchButton").addEventListener("click",openPlayer);$("dialogClose").addEventListener("click",()=>$("movieDialog").close());$("playerClose").addEventListener("click",()=>{$("playerFrameWrap").replaceChildren();$("playerDialog").close();});
$("adminToggle").addEventListener("click",()=>{$("adminDialog").showModal();updateAdminView();});$("adminClose").addEventListener("click",()=>$("adminDialog").close());$("resetForm").addEventListener("click",clearForm);
$("loginForm").addEventListener("submit",async e=>{e.preventDefault();const {data,error}=await db.auth.signInWithPassword({email:$("adminEmail").value.trim(),password:$("adminPassword").value});if(error){toast("Kirish amalga oshmadi: "+error.message);return;}adminUser=data.user;updateAdminView();toast("Admin sifatida kirdingiz.");});
$("logoutButton").addEventListener("click",async()=>{await db.auth.signOut();adminUser=null;updateAdminView();clearForm();toast("Tizimdan chiqdingiz.");});
$("movieForm").addEventListener("submit",async e=>{e.preventDefault();if(!adminUser){toast("Avval admin sifatida kiring.");return;}const id=$("movieId").value;const m={title:$("movieTitle").value.trim(),year:Number($("movieYear").value)||null,type:$("movieType").value,genre:$("movieGenre").value.trim(),language:$("movieLanguage").value.trim(),poster:safeHttpUrl($("moviePoster").value),description:$("movieDescription").value.trim(),url:safeHttpUrl($("movieUrl").value),featured:$("movieFeatured").checked,is_published:$("moviePublished").checked};if(!m.title){toast("Kino nomini kiriting.");return;}const query=id?db.from("movies").update(toDb(m)).eq("id",id):db.from("movies").insert(toDb(m));const {error}=await query;if(error){toast("Saqlashda xatolik: "+error.message);return;}clearForm();await loadMovies();await refreshAdmin();toast("Kino bazaga saqlandi.");});
$("adminMovieList").addEventListener("click",async e=>{const edit=e.target.closest("[data-edit]"),del=e.target.closest("[data-delete]");if(edit)await editMovie(edit.dataset.edit);if(del){const id=del.dataset.delete;if(confirm("Bu kino o‘chirilsinmi?")){const {error}=await db.from("movies").delete().eq("id",id);if(error)toast("O‘chirishda xatolik: "+error.message);else{await loadMovies();await refreshAdmin();toast("Kino o‘chirildi.");}}}});
$("menuToggle").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
db.auth.onAuthStateChange((_event,session)=>{adminUser=session?.user||null;if($("adminDialog").open)updateAdminView();});
loadMovies();

// Android TV / keyboard BACK handling for dialogs
document.addEventListener("keydown", e => {
  if (e.key === "Escape" || e.key === "Backspace") {
    if ($("playerDialog").open) {
      $("playerFrameWrap").replaceChildren();
      $("playerDialog").close();
      e.preventDefault();
    } else if ($("movieDialog").open) {
      $("movieDialog").close();
      e.preventDefault();
    } else if ($("adminDialog").open) {
      $("adminDialog").close();
      e.preventDefault();
    }
  }
});
