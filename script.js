const ADMIN_PASSWORD = "s@dr@-18-19=40000";
const STORAGE_KEY = "minab_names_v1";
const VOTED_KEY = "minab_voted_v1";
const JSON_URL = "names.json";
let namesData = [];
let isAdmin = false;
let editId = null;
let tempImage = "";
let voted = [];
try { voted = JSON.parse(localStorage.getItem(VOTED_KEY) || "[]"); if(!Array.isArray(voted)) voted = []; } catch(e){ voted = []; }
const DEFAULT_DATA = [
{ id: 1, name: "نمونه: امیر مینابی", age: "۱۷", date: "18 دی", place: "میناب", desc: "این یک اسم نمونه است. از پنل ادمین حذفش کن و اسم واقعی را با عکس از گالری اضافه کن.", image: "", candles: 12 },
{ id: 2, name: "نمونه: سارا مینابی", age: "۱۶", date: "19 دی", place: "میناب", desc: "این هم نمونه دوم است برای تست ظاهر سایت. متن یادبود را اینجا بنویس.", image: "", candles: 8 }
];
function escapeHtml(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(m){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]; }); }
function safeImg(src){ if(!src) return ""; src = String(src).trim(); if(src.startsWith("data:image/") || src.startsWith("http://") || src.startsWith("https://") || src.startsWith("blob:")) return src; return ""; }
function faNum(n){ var v = Number(n || 0); if(isNaN(v)) v = 0; try { return v.toLocaleString("fa-IR"); } catch(e){ return String(v); } }
function normalizeItem(raw, idx){
if(!raw || typeof raw !== "object") raw = {};
var id = raw.id;
if(id === undefined || id === null || id === "") id = Date.now() + (idx || 0);
var date = String(raw.date || "18 دی").trim();
if(date.indexOf("18") !== -1) date = "18 دی";
else if(date.indexOf("19") !== -1) date = "19 دی";
if(!date) date = "18 دی";
var candles = Number(raw.candles);
if(isNaN(candles) || candles < 0) candles = 0;
candles = Math.floor(candles);
return {
id: id,
name: String(raw.name || "بدون نام").trim() || "بدون نام",
age: String(raw.age == null ? "" : raw.age).trim(),
date: date,
place: String(raw.place || "میناب").trim() || "میناب",
desc: String(raw.desc == null ? "" : raw.desc),
image: raw.image ? String(raw.image) : "",
candles: candles
};
}
function normalizeList(arr){
if(!Array.isArray(arr)) return [];
return arr.map(function(x, i){ return normalizeItem(x, i); });
}
function findById(id){ id = String(id); for(var i=0;i<namesData.length;i++){ if(String(namesData[i].id) === id) return namesData[i]; } return null; }
async function loadData(){
try{
var r = await fetch(JSON_URL + "?v=" + Date.now(), { cache: "no-store" });
if(r.ok){
var txt = await r.text();
txt = txt.replace(/^\uFEFF/, "").trim();
var d = txt ? JSON.parse(txt) : [];
if(!Array.isArray(d)){
if(d && Array.isArray(d.names)) d = d.names;
else if(d && Array.isArray(d.data)) d = d.data;
else if(d && typeof d === "object") d = Object.values(d);
else d = [];
}
if(Array.isArray(d) && d.length > 0){
namesData = normalizeList(d);
saveLocal();
render();
return;
}
if(Array.isArray(d) && d.length === 0){
namesData = [];
saveLocal();
render();
return;
}
}
}catch(e){ console.warn("load from github failed, fallback to local", e); }
try{
var saved = localStorage.getItem(STORAGE_KEY);
if(saved){
var ld = JSON.parse(saved);
if(Array.isArray(ld) && ld.length){
namesData = normalizeList(ld);
render();
return;
}
}
}catch(e){}
namesData = normalizeList(DEFAULT_DATA);
render();
}
function saveLocal(){ try { localStorage.setItem(STORAGE_KEY, JSON.stringify(namesData)); } catch(e){ console.warn("storage full", e); } }
function saveVoted(){ try { localStorage.setItem(VOTED_KEY, JSON.stringify(voted)); } catch(e){} }
function hasVoted(id){ id = String(id); for(var i=0;i<voted.length;i++){ if(String(voted[i]) === id) return true; } return false; }
function render(){
var searchEl = document.getElementById("searchInput");
var filterEl = document.getElementById("filterDate");
var grid = document.getElementById("cardsGrid");
if(!grid) return;
var q = searchEl ? (searchEl.value || "").trim() : "";
var f = filterEl ? filterEl.value : "";
grid.innerHTML = "";
var filtered = namesData.filter(function(x){
var okQ = true;
if(q){ okQ = (x.name && x.name.indexOf(q) !== -1) || (x.desc && x.desc.indexOf(q) !== -1) || (x.place && x.place.indexOf(q) !== -1); }
var okF = !f || x.date === f;
return okQ && okF;
});
var emptyMsg = document.getElementById("emptyMsg");
if(emptyMsg) emptyMsg.style.display = filtered.length ? "none" : "block";
filtered.forEach(function(x, i){
var div = document.createElement("div");
div.className = "card";
div.style.animationDelay = (i * 0.05) + "s";
var safeImage = safeImg(x.image);
var imgHtml = safeImage ? '<img src="' + safeImage + '" alt="' + escapeHtml(x.name) + '" loading="lazy">' : '<div class="avatar">' + escapeHtml((x.name || "•").trim().charAt(0) || "•") + '</div>';
var v = hasVoted(x.id);
var btnText = v ? "🕯️ روشن کردی ✓ " + faNum(x.candles || 0) : "🕯️ " + faNum(x.candles || 0) + " شمع";
var btnClass = v ? "candle-btn voted" : "candle-btn";
div.innerHTML = '<div class="card-img">' + imgHtml + '</div>'
+ '<div class="card-body"><h3>' + escapeHtml(x.name) + '</h3>'
+ '<div class="card-meta">' + escapeHtml(x.date || "") + ' ۱۴۰۴ • ' + escapeHtml(x.place || "میناب") + (x.age ? " • " + escapeHtml(x.age) + " ساله" : "") + '</div>'
+ '<div class="card-desc">' + escapeHtml(x.desc || "") + '</div>'
+ '<div class="card-foot"><button class="' + btnClass + '">' + btnText + '</button><span style="font-size:12px;color:#6f7a90">جزئیات ←</span></div></div>';
var btn = div.querySelector("button");
if(btn){ btn.addEventListener("click", function(ev){ ev.stopPropagation(); lightCandle(x.id); }); }
div.addEventListener("click", function(){ openDetail(x.id); });
grid.appendChild(div);
});
var sc = document.getElementById("statCount");
if(sc) sc.textContent = faNum(namesData.length);
var total = namesData.reduce(function(s, x){ return s + (Number(x.candles) || 0); }, 0);
var tc = document.getElementById("statCandles");
if(tc) tc.textContent = faNum(total);
renderAdminList();
}
function openDetail(id){
var x = findById(id);
if(!x) return;
var safeImage = safeImg(x.image);
var imgHtml = safeImage ? '<img src="' + safeImage + '" class="detail-img" alt="' + escapeHtml(x.name) + '">' : '<div style="font-size:80px;text-align:center">🕯️</div>';
var v = hasVoted(x.id);
var btnLabel = v ? "🕯️ تو برایش شمع روشن کردی ✓ (" + faNum(x.candles || 0) + ")" : "🕯️ روشن کردن شمع به یادش (" + faNum(x.candles || 0) + ")";
var box = document.getElementById("detailContent");
box.innerHTML = '<div class="detail-box">' + imgHtml + '<h2>' + escapeHtml(x.name) + '</h2>'
+ '<p style="color:#e8b64c">' + (x.age ? escapeHtml(x.age) + " ساله • " : "") + escapeHtml(x.date || "") + ' ۱۴۰۴ • ' + escapeHtml(x.place || "میناب") + '</p>'
+ '<p style="color:#c2cadb;margin:12px 0;line-height:2.2">' + escapeHtml(x.desc || "") + '</p>'
+ '<button class="btn-gold" id="detailCandleBtn">' + btnLabel + '</button>'
+ (v ? '<p class="muted" style="margin-top:8px">هر نفر فقط یک شمع می‌تواند روشن کند.</p>' : '') + '</div>';
var b = document.getElementById("detailCandleBtn");
if(b){ b.addEventListener("click", function(){ lightCandle(x.id, true); }); }
openModal("detailModal");
}
function lightCandle(id, fromDetail){
var x = findById(id);
if(!x) return;
if(hasVoted(id)){
alert("تو قبلاً برای این عزیز شمع روشن کردی 🕯️");
if(fromDetail) openDetail(id);
return;
}
x.candles = (Number(x.candles) || 0) + 1;
voted.push(x.id);
saveLocal();
saveVoted();
render();
if(fromDetail) openDetail(id);
}
function openModal(id){ var m = document.getElementById(id); if(m) m.classList.add("show"); }
function closeModal(id){ var m = document.getElementById(id); if(m) m.classList.remove("show"); }
function openAdminLogin(){
if(isAdmin){ openModal("adminModal"); renderAdminList(); }
else openModal("loginModal");
}
function doLogin(){
var el = document.getElementById("adminPass");
var v = el ? el.value : "";
if(v === ADMIN_PASSWORD){ isAdmin = true; closeModal("loginModal"); openModal("adminModal"); renderAdminList(); if(el) el.value = ""; }
else alert("رمز اشتباه است");
}
function doLogout(){ isAdmin = false; closeModal("adminModal"); }
function showAddForm(){
editId = null; tempImage = "";
var t = document.getElementById("formTitle");
if(t) t.textContent = "افزودن جاویدنام جدید";
["f_name","f_age","f_place","f_desc"].forEach(function(id){ var e = document.getElementById(id); if(e) e.value = ""; });
var d = document.getElementById("f_date"); if(d) d.value = "18 دی";
var p = document.getElementById("f_preview"); if(p) p.style.display = "none";
var fi = document.getElementById("f_image"); if(fi) fi.value = "";
var f = document.getElementById("addForm"); if(f) f.style.display = "block";
}
function hideAddForm(){ var f = document.getElementById("addForm"); if(f) f.style.display = "none"; }
function editItem(id){
var x = findById(id);
if(!x) return;
editId = x.id;
tempImage = x.image || "";
var t = document.getElementById("formTitle");
if(t) t.textContent = "ویرایش: " + x.name;
document.getElementById("f_name").value = x.name || "";
document.getElementById("f_age").value = x.age || "";
document.getElementById("f_date").value = x.date || "18 دی";
document.getElementById("f_place").value = x.place || "";
document.getElementById("f_desc").value = x.desc || "";
var p = document.getElementById("f_preview");
if(tempImage && safeImg(tempImage)){ p.src = safeImg(tempImage); p.style.display = "block"; } else p.style.display = "none";
document.getElementById("addForm").style.display = "block";
window.scrollTo({ top: document.getElementById("addForm").offsetTop - 80, behavior: "smooth" });
}
function deleteItem(id){
if(!confirm("حذف شود؟ بعدش باید خروجی JSON بگیری و در گیت‌هاب جایگزین کنی تا برای همه حذف شود.")) return;
id = String(id);
namesData = namesData.filter(function(a){ return String(a.id) !== id; });
saveLocal();
render();
}
function previewImage(input){
var f = input.files && input.files[0];
if(!f) return;
if(!f.type.startsWith("image/")){ alert("فقط فایل عکس انتخاب کن"); return; }
var reader = new FileReader();
reader.onload = function(e){
var img = new Image();
img.onload = function(){
try{
var MAX = 800;
var w = img.width, h = img.height;
var scale = Math.min(1, MAX / Math.max(w, h));
w = Math.round(w * scale); h = Math.round(h * scale);
var c = document.createElement("canvas");
c.width = w; c.height = h;
c.getContext("2d").drawImage(img, 0, 0, w, h);
tempImage = c.toDataURL("image/jpeg", 0.72);
}catch(err){ tempImage = e.target.result; }
var p = document.getElementById("f_preview");
p.src = tempImage; p.style.display = "block";
};
img.src = e.target.result;
};
reader.readAsDataURL(f);
}
function saveForm(){
var nameEl = document.getElementById("f_name");
var name = nameEl ? nameEl.value.trim() : "";
if(!name){ alert("اسم را بنویس"); return; }
var obj = {
name: name,
age: document.getElementById("f_age").value.trim(),
date: document.getElementById("f_date").value,
place: document.getElementById("f_place").value.trim() || "میناب",
desc: document.getElementById("f_desc").value.trim(),
image: tempImage || ""
};
if(editId !== null && editId !== undefined){
var x = findById(editId);
if(x){ Object.assign(x, obj); }
editId = null;
} else {
obj.id = Date.now();
obj.candles = 0;
namesData.unshift(normalizeItem(obj, 0));
}
saveLocal();
render();
hideAddForm();
alert("ذخیره شد ✅ حالا برای اینکه برای همه ثبت شود، «خروجی JSON» را بزن و در گیت‌هاب جایگزین کن.");
}
function renderAdminList(){
var box = document.getElementById("adminList");
if(!box) return;
if(!namesData.length){ box.innerHTML = "<p class='muted'>هنوز اسمی ثبت نشده.</p>"; return; }
box.innerHTML = "";
namesData.forEach(function(x){
var row = document.createElement("div");
row.className = "admin-item";
var safeImage = safeImg(x.image);
var thumb = safeImage ? '<img src="' + safeImage + '" alt="">' : '<div class="avatar" style="width:56px;height:56px;font-size:24px;flex-shrink:0">' + escapeHtml((x.name || "•").charAt(0)) + '</div>';
row.innerHTML = thumb + '<div class="a-info"><b>' + escapeHtml(x.name) + '</b><br><small>' + escapeHtml(x.date) + ' • ' + escapeHtml(x.place) + ' • 🕯️ ' + faNum(x.candles || 0) + '</small></div>';
var eb = document.createElement("button");
eb.className = "btn-small"; eb.textContent = "ویرایش";
eb.addEventListener("click", function(){ editItem(x.id); });
var db = document.createElement("button");
db.className = "btn-small danger"; db.textContent = "حذف";
db.addEventListener("click", function(){ deleteItem(x.id); });
row.appendChild(eb); row.appendChild(db);
box.appendChild(row);
});
}
function exportJSON(){
var blob = new Blob([JSON.stringify(namesData, null, 2)], { type: "application/json" });
var a = document.createElement("a");
a.href = URL.createObjectURL(blob);
a.download = "names.json";
document.body.appendChild(a);
a.click();
setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function importJSON(input){
var f = input.files && input.files[0];
if(!f) return;
var r = new FileReader();
r.onload = function(e){
try{
var d = JSON.parse(e.target.result);
if(d && !Array.isArray(d)){
if(Array.isArray(d.names)) d = d.names;
else if(Array.isArray(d.data)) d = d.data;
else d = Object.values(d);
}
if(Array.isArray(d)){ namesData = normalizeList(d); saveLocal(); render(); alert("JSON وارد شد ✅"); }
else alert("فایل معتبر نیست");
}catch(err){ alert("خطا در فایل"); }
input.value = "";
};
r.readAsText(f);
}
function resetData(){
if(!confirm("حافظه محلی پاک و نسخه تازه گیت‌هاب خوانده شود؟")) return;
try { localStorage.removeItem(STORAGE_KEY); } catch(e){}
loadData();
alert("در حال خواندن دوباره از گیت‌هاب... اگر باز قدیمی دیدی ۱ تا ۲ دقیقه صبر کن و با Ctrl+F5 رفرش کن.");
}
document.addEventListener("DOMContentLoaded", function(){
loadData();
document.querySelectorAll(".modal").forEach(function(m){
m.addEventListener("click", function(e){ if(e.target === m) m.classList.remove("show"); });
});
document.addEventListener("keydown", function(e){
if(e.key === "Escape") document.querySelectorAll(".modal.show").forEach(function(m){ m.classList.remove("show"); });
});
var pass = document.getElementById("adminPass");
if(pass) pass.addEventListener("keydown", function(e){ if(e.key === "Enter") doLogin(); });
});