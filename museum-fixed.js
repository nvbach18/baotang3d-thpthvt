(async()=>{
'use strict';
let STATIC_DATA=null,DATA_LOAD_ERROR=null,DATA_FILE_HANDLE=null;
const seedElement=document.querySelector('#seed');
if(seedElement&&seedElement.textContent.trim()!=='null'){
  try{STATIC_DATA=JSON.parse(seedElement.textContent)}
  catch(error){DATA_LOAD_ERROR=error;console.error('Không đọc được dữ liệu nhúng trong trang HTML.',error)}
}else if(location.protocol==='http:'||location.protocol==='https:'){
  try{
    const response=await fetch(new URL('museum-data.json',location.href),{cache:'no-store'});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    STATIC_DATA=await response.json();
    if(!STATIC_DATA||!Array.isArray(STATIC_DATA.items))throw new Error('File JSON không có danh sách items hợp lệ.');
    if(seedElement)seedElement.textContent=JSON.stringify(STATIC_DATA).replace(/</g,'\\u003c');
  }catch(error){DATA_LOAD_ERROR=error;console.error('Không tải được museum-data.json.',error)}
}
const SRC='<!DOCTYPE html>\n'+document.documentElement.outerHTML; // bản gốc để xuất file HTML chia sẻ
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lines=s=>String(s||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
const uid=()=>'i'+Math.random().toString(36).slice(2,9);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clone=o=>JSON.parse(JSON.stringify(o));
const USER_PREFS_KEY='museum-display-preferences';
const USER_PREFS_DEFAULTS={language:'vi',graphics:'balanced',volume:.8,narration:null};
const GRAPHICS_PIXEL_RATIOS={balanced:1.25,high:1.5,ultra:2,device:3};
function loadUserPrefs(){
  try{
    const stored=JSON.parse(localStorage.getItem(USER_PREFS_KEY)||'null');
    if(!stored||typeof stored!=='object')return Object.assign({},USER_PREFS_DEFAULTS);
    return {
      language:stored.language==='en'?'en':'vi',
      graphics:Object.hasOwn(GRAPHICS_PIXEL_RATIOS,stored.graphics)?stored.graphics:'balanced',
      volume:Number.isFinite(+stored.volume)?Math.min(1,Math.max(0,+stored.volume)):.8,
      narration:typeof stored.narration==='boolean'?stored.narration:null
    };
  }catch(error){
    console.error('Không thể đọc tùy chọn hiển thị đã lưu.',error);
    return Object.assign({},USER_PREFS_DEFAULTS);
  }
}
const USER_PREFS=loadUserPrefs();
let walkLibrariesPromise=null;
function ensureWalkLibraries(){
  if(window.THREE?.GLTFLoader)return Promise.resolve(window.THREE);
  if(!walkLibrariesPromise){
    walkLibrariesPromise=Promise.all([
      import('three'),
      import('https://cdn.jsdelivr.net/npm/three@0.159.0/examples/jsm/loaders/GLTFLoader.js')
    ]).then(([THREE,{GLTFLoader}])=>{
      window.THREE=Object.assign({},THREE,{GLTFLoader});
      return window.THREE;
    }).catch(error=>{
      walkLibrariesPromise=null;
      throw error;
    });
  }
  return walkLibrariesPromise;
}
function projectAssetPath(value,folder){
  let path=String(value||'').trim().replace(/\\/g,'/').replace(/^(?:\.\/)+/,'');
  if(!path)return '';
  if(/^(?:[a-z][a-z0-9+.-]*:|\/|\\\\)/i.test(path)||/[?#]/.test(path)||path.split('/').some(part=>!part||part==='.'||part==='..'))throw new Error('Hãy nhập đường dẫn tương đối nằm trong thư mục dự án.');
  if(!path.startsWith(`${folder}/`))path=`${folder}/${path}`;
  return path;
}
function assetHref(path){
  if(/^data:/i.test(String(path||'')))return path;
  return String(path||'').split('/').map(encodeURIComponent).join('/');
}

const TYPES={
  tranh:{label:'Tranh',wing:'Phòng tranh',icon:'🖼'},
  sahinh:{label:'Sa hình',wing:'Phòng sa hình',icon:'🗺'},
  daocu:{label:'Đạo cụ',wing:'Phòng đạo cụ',icon:'🎖'},
  anh:{label:'Ảnh',wing:'Phòng ảnh tư liệu',icon:'📷'},
  tailieu:{label:'Tư liệu',wing:'Phòng tư liệu',icon:'📜'},
  dohoa:{label:'Đồ họa phân tích',wing:'Phòng phân tích',icon:'📊'},
  phim:{label:'Phim sa hình',wing:'Phòng chiếu phim',icon:'🎬'}
};
const ORDER=['tranh','tailieu','anh','dohoa','sahinh','phim','daocu'];
const FX=[['curtain','Màn nhung'],['iris','Mở vòng tròn'],['fade','Mờ dần'],['wipe','Lật trang'],['random','Ngẫu nhiên']];
const MAX_GALLERY_IMAGES=8;
const GALLERY_SLOTS=[
  {id:'xiem-1',wall:'xiem',label:'Tường phía Xiêm · vị trí 1',position:[-18,2.5,-5.72],yaw:0},
  {id:'xiem-2',wall:'xiem',label:'Tường phía Xiêm · vị trí 2',position:[-14,2.5,-5.72],yaw:0},
  {id:'xiem-3',wall:'xiem',label:'Tường phía Xiêm · vị trí 3',position:[-10,2.5,-5.72],yaw:0},
  {id:'xiem-4',wall:'xiem',label:'Tường đối diện lối vào · phía Xiêm',position:[-19.65,2.5,-1.8],yaw:Math.PI/2},
  {id:'thanh-1',wall:'thanh',label:'Tường phía Thanh · vị trí 1',position:[-18,2.5,5.72],yaw:Math.PI},
  {id:'thanh-2',wall:'thanh',label:'Tường phía Thanh · vị trí 2',position:[-14,2.5,5.72],yaw:Math.PI},
  {id:'thanh-3',wall:'thanh',label:'Tường phía Thanh · vị trí 3',position:[-10,2.5,5.72],yaw:Math.PI},
  {id:'thanh-4',wall:'thanh',label:'Tường đối diện lối vào · phía Thanh',position:[-19.65,2.5,1.8],yaw:Math.PI/2}
];
const isGalleryImage=item=>['tranh','anh','dohoa'].includes(item?.type);
function firstAvailableGallerySlot(items,preferredWall='xiem'){
  const occupied=new Set(items.filter(isGalleryImage).map(item=>item.gallerySlot).filter(Boolean));
  return GALLERY_SLOTS.find(slot=>slot.wall===preferredWall&&!occupied.has(slot.id))
    ||GALLERY_SLOTS.find(slot=>!occupied.has(slot.id))
    ||null;
}

/* =====================================================================
   HÌNH MINH HOẠ MẪU (vẽ bằng SVG). Khi giáo viên tải ảnh thật lên,
   ảnh thật sẽ thay thế các hình này.
   ===================================================================== */
const P=(x,y,s=1,lean=0,c='#120b07')=>`<g transform="translate(${x} ${y}) rotate(${lean}) scale(${s})" fill="${c}"><circle cy="-31" r="5"/><path d="M-6.5 -33a6.5 6.5 0 0 1 13 0z"/><path d="M-5 -25h10l3 16h-16z"/><path d="M-5 -9l-3 9h4l4-8 4 8h4l-3-9z"/></g>`;
const PA=(x,y,s=1,c='#120b07')=>P(x,y,s,0,c)+`<path d="M${x-4*s} ${y-24*s} l${-9*s} ${-15*s} M${x+4*s} ${y-24*s} l${9*s} ${-15*s}" stroke="${c}" stroke-width="${3*s}" stroke-linecap="round"/>`;
const hill=(x,y,r)=>`<ellipse cx="${x}" cy="${y}" rx="${r*1.5}" ry="${r}" fill="#a98a5a"/><ellipse cx="${x}" cy="${y}" rx="${r*1.1}" ry="${r*.72}" fill="#bf9f6a"/><ellipse cx="${x}" cy="${y}" rx="${r*.7}" ry="${r*.44}" fill="#d2b57f"/><ellipse cx="${x}" cy="${y}" rx="${r*.3}" ry="${r*.2}" fill="#e4cc99"/>`;
const SV=(vb,inner)=>`<svg viewBox="${vb}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img">${inner}</svg>`;
const ART={
'keo-phao':()=>{let g='',pts=['176,226'];
  for(let i=0;i<3;i++){const x=92+i*16;g+=P(x,285-.2*x,1.05,-14)}
  for(let i=0;i<8;i++){const x=205+i*22,y=285-.2*x;g+=P(x,y,1.05,-18);pts.push(`${x-2},${y-22}`)}
  return SV('0 0 400 300',`<defs><linearGradient id="kp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9b873"/><stop offset="1" stop-color="#b8643a"/></linearGradient></defs>
  <rect width="400" height="300" fill="url(#kp)"/><circle cx="310" cy="64" r="30" fill="#fff0c4" opacity=".9"/>
  <polygon points="0,170 70,96 130,150 190,84 260,160 330,104 400,150 400,300 0,300" fill="#8a5a3c" opacity=".7"/>
  <polygon points="0,225 90,155 170,215 250,146 340,204 400,176 400,300 0,300" fill="#4a3022"/>
  <polygon points="0,285 400,205 400,300 0,300" fill="#241810"/>
  <polyline points="${pts.join(' ')}" fill="none" stroke="#2a1a10" stroke-width="1.6"/>
  <line x1="148" y1="238" x2="196" y2="217" stroke="#2f2f2f" stroke-width="7" stroke-linecap="round"/>
  <line x1="150" y1="244" x2="118" y2="254" stroke="#2f2f2f" stroke-width="4"/>
  <rect x="150" y="226" width="6" height="22" fill="#2f2f2f"/>
  <circle cx="150" cy="243" r="12" fill="#1b1b1b"/><circle cx="150" cy="243" r="4" fill="#5a5a5a"/>${g}`)},
'tong-cong-kich':()=>{let g='';
  [[60,218],[95,209],[130,199],[170,182],[205,168],[240,152],[275,137]].forEach(([x,y],i)=>{g+=P(x,y,1,12+i)});
  return SV('0 0 400 300',`<defs><linearGradient id="tc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a1f1f"/><stop offset=".6" stop-color="#e0773c"/><stop offset="1" stop-color="#f3c36e"/></linearGradient></defs>
  <rect width="400" height="300" fill="url(#tc)"/>
  <circle cx="90" cy="90" r="46" fill="#4a3a38" opacity=".55"/><circle cx="150" cy="70" r="38" fill="#4a3a38" opacity=".45"/><circle cx="230" cy="48" r="30" fill="#4a3a38" opacity=".4"/>
  <polygon points="0,300 0,230 120,200 240,150 330,110 400,100 400,300" fill="#2e2118"/>
  ${g}<line x1="330" y1="110" x2="330" y2="44" stroke="#1a110b" stroke-width="3"/>
  <path d="M330 46q22-9 46 0v30q-22-9-46 0z" fill="#d12a2a"/><polygon points="353,52 355.6,59 363,59 357,63.5 359.3,70.5 353,66.3 346.7,70.5 349,63.5 343,59 350.4,59" fill="#ffd93b"/>`)},
'sa-ban':()=>SV('0 0 400 300',`<rect width="400" height="300" fill="#2c4a37"/>
  <g stroke="#3d6048" stroke-width="1" opacity=".6"><path d="M0 50H400M0 100H400M0 150H400M0 200H400M0 250H400M50 0V300M100 0V300M150 0V300M200 0V300M250 0V300M300 0V300M350 0V300"/></g>
  <ellipse cx="190" cy="165" rx="160" ry="124" fill="#4d6c41"/><ellipse cx="186" cy="160" rx="116" ry="98" fill="#7d9b5d"/>
  <path d="M245 0C240 60 225 100 212 150S190 240 200 300" fill="none" stroke="#5aa0c8" stroke-width="7" stroke-linecap="round"/>
  <rect x="168" y="128" width="13" height="62" rx="2" fill="#d6d1ba"/>
  <g fill="#8a7a62"><rect x="190" y="150" width="9" height="7"/><rect x="203" y="160" width="9" height="7"/><rect x="187" y="168" width="9" height="7"/><rect x="150" y="150" width="9" height="7"/></g>
  ${hill(112,78,26)}${hill(200,36,22)}${hill(272,81,26)}${hill(290,130,15)}${hill(312,152,15)}${hill(298,178,15)}${hill(324,172,12)}${hill(176,252,26)}
  <g transform="translate(34 40)"><circle r="16" fill="none" stroke="#e6c47a" stroke-width="1.5"/><path d="M0-14L4 4H-4Z" fill="#e6c47a"/><text y="-19" text-anchor="middle" font-size="10" fill="#e6c47a" font-family="Be Vietnam Pro, system-ui, sans-serif">B</text></g>`),
'xe-tho':()=>SV('0 0 300 300',`<g fill="none" stroke="#1b1b1b" stroke-linecap="round">
  <circle cx="82" cy="218" r="44" stroke-width="5"/><circle cx="218" cy="218" r="44" stroke-width="5"/>
  <g stroke-width="1" stroke="#555"><path d="M82 174V262M38 218H126M51 187L113 249M113 187L51 249M218 174V262M174 218H262M187 187L249 249M249 187L187 249"/></g>
  <path d="M82 218L132 160H208L218 218M132 160L152 218H218M152 218H82" stroke-width="6" stroke="#2d2d2d"/>
  <path d="M96 150L88 190" stroke-width="5"/>
  <path d="M96 150L262 84" stroke="#8a5a2c" stroke-width="7"/></g>
  <rect x="178" y="146" width="40" height="9" rx="3" fill="#222"/>
  <rect x="120" y="100" width="108" height="52" rx="14" fill="#c9a96a" stroke="#6b5230" stroke-width="3"/>
  <rect x="150" y="76" width="70" height="42" rx="12" fill="#b99a5c" stroke="#6b5230" stroke-width="3"/>
  <path d="M120 126H228M174 100V152" stroke="#6b5230" stroke-width="3"/>
  <g fill="#4f7a3a"><ellipse cx="136" cy="108" rx="14" ry="5" transform="rotate(-30 136 108)"/><ellipse cx="206" cy="84" rx="14" ry="5" transform="rotate(25 206 84)"/><ellipse cx="190" cy="108" rx="12" ry="4" transform="rotate(-20 190 108)"/></g>`),
'bep-hoang-cam':()=>SV('0 0 300 300',`<rect x="0" y="168" width="300" height="132" fill="#6b4a2f"/><rect x="0" y="160" width="300" height="10" fill="#4f7a3a"/>
  <rect x="119" y="184" width="150" height="14" fill="#1a0f08"/>
  <g stroke="#1a0f08" stroke-width="3"><path d="M150 184V168M180 184V168M210 184V168M240 184V168"/></g>
  <ellipse cx="91" cy="188" rx="30" ry="20" fill="#1a0f08"/>
  <path d="M80 200q4-22 11-30 2 12 12 14-3 10-8 16z" fill="#ff8a2a"/><path d="M86 200q3-12 7-17 1 7 7 9-2 6-5 8z" fill="#ffd45a"/>
  <path d="M60 168L68 118H114L122 168Z" fill="#3c3c3c"/><ellipse cx="91" cy="118" rx="25" ry="6" fill="#555"/><ellipse cx="91" cy="115" rx="14" ry="4" fill="#777"/>
  <g fill="none" stroke="#f1ece0" stroke-width="3" stroke-linecap="round" opacity=".75"><path d="M82 100q-8-12 0-24t0-22"/><path d="M98 98q8-12 0-24t0-20"/></g>
  <g fill="none" stroke="#e9e3d2" stroke-width="2" opacity=".45"><path d="M150 164q-4-10 0-18"/><path d="M180 164q-4-10 0-18"/><path d="M210 164q-4-10 0-18"/><path d="M240 164q-4-10 0-18"/></g>`),
'co-chien-thang':()=>{let g='';[[60,262],[96,268],[140,266],[300,262],[336,268],[368,262]].forEach(([x,y])=>{g+=PA(x,y,1.15,'#120b07')});
  return SV('0 0 400 300',`<defs><linearGradient id="cc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8aa0b4"/><stop offset="1" stop-color="#e4d2b0"/></linearGradient></defs>
  <rect width="400" height="300" fill="url(#cc)"/><polygon points="0,200 80,150 160,190 250,130 330,180 400,150 400,300 0,300" fill="#6f7a6a" opacity=".7"/>
  <rect y="238" width="400" height="62" fill="#2b241c"/>
  <rect x="120" y="170" width="170" height="70" fill="#6a665b"/><rect x="112" y="162" width="186" height="14" fill="#55524a"/>
  <g fill="#8d8268"><rect x="124" y="226" width="30" height="14" rx="6"/><rect x="156" y="226" width="30" height="14" rx="6"/><rect x="188" y="226" width="30" height="14" rx="6"/><rect x="220" y="226" width="30" height="14" rx="6"/><rect x="252" y="226" width="30" height="14" rx="6"/></g>
  <line x1="204" y1="164" x2="204" y2="48" stroke="#1a110b" stroke-width="4"/>
  <path d="M204 50c28-12 50 12 80 0v52c-30 12-52-12-80 0z" fill="#d12a2a"/>
  <polygon points="244,64 248,76 261,76 250.5,83.5 254.5,95.5 244,88 233.5,95.5 237.5,83.5 227,76 240,76" fill="#ffd93b"/>${g}`)},
'dan-cong':()=>{let b='';
  for(let i=0;i<7;i++){const x=40+i*52,y=262-i*5;b+=P(x,y,1.1,0)+`<path d="M${x-22} ${y-33}L${x+22} ${y-26}M${x-22} ${y-33}v13M${x+22} ${y-26}v13" stroke="#120b07" stroke-width="2.4" fill="none"/><ellipse cx="${x-22}" cy="${y-17}" rx="9" ry="6" fill="#120b07"/><ellipse cx="${x+22}" cy="${y-10}" rx="9" ry="6" fill="#120b07"/>`}
  return SV('0 0 400 300',`<defs><linearGradient id="dc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6c7f93"/><stop offset="1" stop-color="#e9c99a"/></linearGradient></defs>
  <rect width="400" height="300" fill="url(#dc)"/><polygon points="0,190 70,120 140,170 220,100 300,160 400,110 400,300 0,300" fill="#586a63" opacity=".75"/>
  <polygon points="0,236 400,200 400,300 0,300" fill="#3a2d22"/>
  <g stroke="#2d3a2c" stroke-width="2.5"><path d="M18 250V120M370 240V90"/></g>
  <g fill="#3f5a3a"><ellipse cx="18" cy="124" rx="20" ry="6" transform="rotate(-25 18 124)"/><ellipse cx="18" cy="140" rx="20" ry="6" transform="rotate(20 18 140)"/><ellipse cx="370" cy="94" rx="20" ry="6" transform="rotate(-25 370 94)"/><ellipse cx="370" cy="110" rx="20" ry="6" transform="rotate(20 370 110)"/></g>${b}`)}
};

/* ---------- Đồ họa phân tích và phim sa hình ---------- */
const SVM=(vb,inner)=>`<svg viewBox="${vb}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" role="img" font-family="Be Vietnam Pro,system-ui,sans-serif">${inner}</svg>`;
const ease=x=>x<=0?0:x>=1?1:x*x*(3-2*x);
const seg=(t,a,b)=>ease((t-a)/(b-a));
const mix=(a,b,p)=>a+(b-a)*p;
const XI={h:'#a3262e',s:'#f0d58a'}, TS={h:'#2257b8',s:'#f4f1e6'};
function boat(x,y,col,o){o=o||{};
  const s=o.s||1,f=o.flip||1,burn=o.burn||0,sink=o.sink||0,fl=o.fl||0;
  const hull=burn>.5?'#3b2a22':col.h,sail=burn>.5?'#5a4a40':col.s;
  let g=`<g transform="translate(${x.toFixed(1)} ${(y+sink*6).toFixed(1)}) scale(${(f*s).toFixed(2)} ${s})" opacity="${(1-.78*sink).toFixed(2)}"><path d="M-13 0H13L9 6H-9Z" fill="${hull}"/><path d="M0 0V-13" stroke="#2b1d12" stroke-width="1.3"/><path d="M.8-12L9-3H.8Z" fill="${sail}"/>`;
  if(burn>0){const h=burn*(9+fl*3);g+=`<path d="M-8 0Q-6 ${-h} -3 ${-h*.4}Q0 ${-h*1.3} 3 ${-h*.5}Q6 ${-h} 8 0Z" fill="#ff7a1a"/><path d="M-4 0Q-2 ${-h*.7} 0 ${-h*.3}Q2 ${-h*.8} 4 0Z" fill="#ffd54a"/>`}
  return g+'</g>';
}
const stx=(x,y,s,size,fill,anchor)=>`<text x="${x}" y="${y}" text-anchor="${anchor||'middle'}" font-size="${size||14}" fill="${fill||'#ffe9a8'}" paint-order="stroke" stroke="#0a0605" stroke-width="3.5" stroke-linejoin="round">${s}</text>`;

const FILM_N=6;
const FILM_SCENES=[
 {t:'Bối cảnh và tương quan lực lượng',n:'Quân Xiêm đông gấp khoảng 2,5 lần. Đánh giáp mặt ở nơi rộng thì Tây Sơn khó thắng, nên Nguyễn Huệ chọn cách dùng địa hình để biến số đông của địch thành điểm yếu.'},
 {t:'Nhử địch',n:'Thuyền nhỏ ra khiêu chiến rồi giả thua rút lui. Quân Xiêm chủ quan, ỷ đông nên đuổi theo vào khúc sông đã chọn.'},
 {t:'Mai phục, chặn đầu và khóa đuôi',n:'Thủy binh từ Xoài Mút chặn đầu, từ Rạch Gầm khóa đuôi; quân từ hai bờ và cù lao lao ra chia cắt đội hình địch.'},
 {t:'Pháo bắn và hỏa công',n:'Pháo từ bờ, cù lao và thuyền chiến kết hợp hỏa công. Thuyền địch đi sát nhau trong sông hẹp nên cháy lan và rối loạn.'},
 {t:'Đội hình tan vỡ',n:'Bị chia cắt, các thuyền Xiêm không thể cứu viện nhau; nhiều thuyền bị cháy hoặc đắm.'},
 {t:'Kết quả',n:'Chỉ trong chưa đầy một ngày, phần lớn quân Xiêm bị tiêu diệt, số còn lại chạy theo đường Chân Lạp. Nguyễn Ánh phải chạy sang Xiêm.'}
];
const FILM_BG=(()=>{
  let g='<defs><linearGradient id="fw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b88a3"/><stop offset="1" stop-color="#245a70"/></linearGradient></defs>';
  g+='<rect width="800" height="450" fill="#2f5d34"/><rect y="112" width="800" height="226" fill="url(#fw)"/>';
  for(let i=0;i<46;i++){const x=(i*53)%800,y=18+((i*37)%72);g+=`<circle cx="${x}" cy="${y}" r="${10+(i%4)*2}" fill="${i%2?'#2a5a2c':'#356b33'}"/>`}
  for(let i=0;i<46;i++){const x=(i*61)%800,y=368+((i*29)%70);g+=`<circle cx="${x}" cy="${y}" r="${10+(i%4)*2}" fill="${i%2?'#2a5a2c':'#356b33'}"/>`}
  g+='<rect y="104" width="800" height="10" fill="#4a7a3c"/><rect y="336" width="800" height="10" fill="#4a7a3c"/>';
  [118,330,440,560,690].forEach(x=>{g+=`<rect x="${x}" y="82" width="22" height="34" fill="#2c7089"/>`});
  [370,480,600].forEach(x=>{g+=`<rect x="${x}" y="332" width="22" height="30" fill="#2c7089"/>`});
  g+='<ellipse cx="470" cy="232" rx="98" ry="25" fill="#3f7a3c"/><ellipse cx="470" cy="230" rx="78" ry="17" fill="#4d8c46"/>';
  g+='<g stroke="#7fb6c8" stroke-width="1" opacity=".35" fill="none"><path d="M20 135q20-5 40 0t40 0M600 300q20-5 40 0t40 0M120 316q20-5 40 0t40 0M690 140q20-5 40 0"/></g>';
  g+=stx(129,70,'Rạch Gầm',14)+stx(701,70,'Xoài Mút',14)+stx(470,236,'Cù lao Thới Sơn',12,'#fff')+stx(250,326,'Sông Tiền',13,'#cfe9f2');
  return g;
})();
function filmFrame(t){
  t=Math.max(0,Math.min(FILM_N,t));
  const sc=Math.min(FILM_N-1,Math.floor(t));
  let o=`<svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" font-family="Be Vietnam Pro,system-ui,sans-serif">`+FILM_BG;
  const x0=t<1?mix(20,70,seg(t,0,1)):t<2?mix(70,250,seg(t,1,2)):t<3?mix(250,296,seg(t,2,3)):296+Math.min(1,t-3)*8;
  for(let k=0;k<24;k++){
    const col=k%8,row=(k/8)|0;
    const x=x0+col*26+Math.sin(t*2.3+k)*1.3,y=150+row*17+Math.cos(t*1.9+k)*1;
    const st=3+.9*((k*7)%24)/24,burn=seg(t,st,st+.35);
    const s0=4+.7*((k*5)%24)/24,sk=t>4?seg(t,s0,s0+.3):0;
    o+=boat(x,y,XI,{s:1,flip:1,burn,sink:sk,fl:Math.sin(t*18+k)});
  }
  const pos=[];
  const dop=seg(t,.95,1.2)*(1-seg(t,2.1,2.4));
  if(dop>.01)for(let i=0;i<4;i++){o+=`<g opacity="${dop.toFixed(2)}">${boat(mix(540+i*22,640+i*22,seg(t,1,2)),160+(i%2)*26,TS,{s:.8})}</g>`}
  if(t>2.05){
    const ap=seg(t,2.1,2.8),sq=seg(t,3,4);
    [330,440,560].forEach(ix=>[-9,9].forEach((d,b)=>{const x=ix+d,y=mix(96,124+b*8+sq*8,ap);o+=boat(x,y,TS,{s:.85});pos.push([x,y+6,0,1])}));
    [450,490,530].forEach(ix=>{const y=mix(240,204,ap);o+=boat(ix,y,TS,{s:.85});pos.push([ix,y-2,0,-1])});
    [370,480,600].forEach(ix=>{const y=mix(352,298,ap);o+=boat(ix+11,y,TS,{s:.85});pos.push([ix+11,y-2,0,-1])});
    for(let i=0;i<5;i++){const x=mix(830,mix(585,545,sq),ap),y=134+i*16;o+=boat(x,y,TS,{s:.9,flip:-1});pos.push([x-10,y-4,-1,0])}
    for(let i=0;i<5;i++){const x=mix(129,mix(235,272,sq),ap),y=mix(100,134+i*16,ap);o+=boat(x,y,TS,{s:.9});pos.push([x+10,y-4,1,0])}
  }
  if(t>3&&t<5.3){const pa=1-seg(t,4.8,5.3);pos.forEach((p,m)=>{const ph=(t*2.2+m*.37)%1;o+=`<circle cx="${(p[0]+p[2]*(6+ph*16)).toFixed(1)}" cy="${(p[1]+p[3]*(6+ph*16)).toFixed(1)}" r="${(2+ph*8).toFixed(1)}" fill="#e8e2d6" opacity="${((1-ph)*.55*pa).toFixed(2)}"/>`})}
  o+=`<rect x="470" y="366" width="322" height="68" rx="10" fill="rgba(10,6,5,.68)"/><rect x="484" y="379" width="14" height="14" fill="${XI.h}"/><text x="508" y="391" font-size="13" fill="#f2e9d4">Quân Xiêm: ≈ 5 vạn quân, ≈ 300 thuyền</text><rect x="484" y="406" width="14" height="14" fill="${TS.h}"/><text x="508" y="418" font-size="13" fill="#f2e9d4">Tây Sơn: ≈ 2 vạn quân</text><text x="792" y="446" font-size="10" text-anchor="end" fill="#cfe9f2">Sơ đồ minh họa, không theo tỉ lệ</text>`;
  o+=`<rect x="170" y="10" width="460" height="30" rx="15" fill="rgba(10,6,5,.68)"/><text x="400" y="30" text-anchor="middle" font-size="15" fill="#f2e9d4">Cảnh ${sc+1}/${FILM_N}: ${FILM_SCENES[sc].t}</text>`;
  if(t<1.4)o+=`<g opacity="${(1-seg(t,1,1.4)).toFixed(2)}">${stx(400,96,'Quân Xiêm đông gấp ≈ 2,5 lần',16)}</g>`;
  const c2=seg(t,2.3,2.7)*(1-seg(t,3.3,3.6));
  if(c2>.01)o+=`<g opacity="${c2.toFixed(2)}">${stx(170,222,'Khóa đuôi (từ Rạch Gầm)',13)}${stx(660,222,'Chặn đầu (từ Xoài Mút)',13)}${stx(440,60,'Mai phục hai bờ và cù lao',13)}</g>`;
  const c3=seg(t,3,3.3)*(1-seg(t,4.1,4.4));
  if(c3>.01)o+=`<g opacity="${c3.toFixed(2)}">${stx(400,60,'Pháo bắn và hỏa công dồn dập',14)}</g>`;
  const rp=seg(t,5.1,5.5);
  if(rp>.01)o+=`<g opacity="${rp.toFixed(2)}"><path d="M440 396H70" stroke="#f4d27a" stroke-width="3" stroke-dasharray="9 7" fill="none"/><path d="M60 396l14-8v16z" fill="#f4d27a"/>${stx(250,384,'Tàn quân chạy bộ qua Chân Lạp',13)}</g>`;
  const bp=seg(t,5.4,5.85);
  if(bp>.01)o+=`<g opacity="${bp.toFixed(2)}"><rect x="130" y="150" width="540" height="124" rx="14" fill="rgba(10,6,5,.86)" stroke="#e6c47a" stroke-width="2"/><text x="400" y="200" text-anchor="middle" font-size="26" font-family="Be Vietnam Pro, system-ui, sans-serif" fill="#f4d27a">Chiến thắng Rạch Gầm – Xoài Mút</text><text x="400" y="232" text-anchor="middle" font-size="14" fill="#f2e9d4">Quân Xiêm bị đánh tan trong chưa đầy một ngày</text><text x="400" y="256" text-anchor="middle" font-size="14" fill="#f2e9d4">Thế mạnh số đông trở thành điểm yếu trong sông hẹp</text></g>`;
  return o+'</svg>';
}
ART['rach-gam-phim']=()=>filmFrame(2.75);

ART['thuy-binh']=()=>{let b='',r='';
  for(let i=0;i<5;i++)b+=boat(70+i*70,208+(i%2)*6,TS,{s:1.5});
  for(let i=0;i<70;i++){const x=(i*37)%420-10,h=40+((i*53)%60);r+=`<path d="M${x} 305Q${x+((i%3)-1)*10} ${305-h/2} ${x+((i%5)-2)*6} ${305-h}" stroke="${i%2?'#27472a':'#355d34'}" stroke-width="2.2" fill="none"/>`}
  return SV('0 0 400 300',`<defs><linearGradient id="tb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6c9a0"/><stop offset=".55" stop-color="#f3e2c0"/><stop offset=".56" stop-color="#6fa0aa"/><stop offset="1" stop-color="#2f5f6c"/></linearGradient></defs><rect width="400" height="300" fill="url(#tb)"/><circle cx="300" cy="120" r="34" fill="#fff4cf"/><polygon points="0,166 60,140 120,160 190,132 260,158 330,138 400,160 400,168 0,168" fill="#587a52" opacity=".85"/><rect y="150" width="400" height="30" fill="#fff" opacity=".18"/>${b}<rect y="228" width="400" height="14" fill="#fff" opacity=".12"/>${r}`)};
ART['hoa-cong']=()=>{let b='',st='';
  [[60,206,1.5],[130,222,1.7],[215,204,1.4],[295,226,1.8],[350,208,1.4]].forEach(([x,y,s],i)=>{b+=boat(x,y,XI,{s,burn:1,fl:Math.sin(i*2)})+`<ellipse cx="${x}" cy="${y+18}" rx="${(22*s*.7).toFixed(1)}" ry="4" fill="#ff8a1f" opacity=".35"/>`});
  [[110,262],[250,270]].forEach(([x,y])=>{b+=boat(x,y,{h:'#0e1a2b',s:'#1d2c44'},{s:1.3})});
  for(let i=0;i<40;i++)st+=`<circle cx="${(i*97)%400}" cy="${(i*41)%110}" r="${(.6+(i%3)*.4).toFixed(1)}" fill="#fff" opacity=".7"/>`;
  return SV('0 0 400 300',`<defs><linearGradient id="hc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070d1c"/><stop offset=".5" stop-color="#3a1c1a"/><stop offset=".56" stop-color="#2a1210"/><stop offset="1" stop-color="#0b1420"/></linearGradient></defs><rect width="400" height="300" fill="url(#hc)"/>${st}<ellipse cx="200" cy="168" rx="260" ry="46" fill="#ff7a1a" opacity=".28"/>${b}`)};
ART['co-tay-son']=()=>SV('0 0 300 300',`<rect width="300" height="300" fill="#e1bb43"/><path d="M12 12h276v276H12z" fill="#fff2c6"/><path d="M26 26h248v248H26z" fill="#d71920" stroke="#f4cf57" stroke-width="8"/><circle cx="150" cy="150" r="45" fill="#f6cf4a"/><path d="M35 18v-8m34 8v-8m34 8v-8m34 8v-8m34 8v-8m34 8v-8m34 8v-8m34 8v-8M35 282v8m34-8v8m34-8v8m34-8v8m34-8v8m34-8v8m34-8v8m34-8v8" stroke="#fff2c6" stroke-width="7" stroke-linecap="round"/>`);
ART['dai-bac']=()=>SV('0 0 300 300',`<rect x="40" y="196" width="190" height="26" rx="6" fill="#6b4a2a"/><rect x="40" y="196" width="190" height="7" fill="#85603a"/><circle cx="76" cy="236" r="16" fill="#3b2a1a"/><circle cx="76" cy="236" r="6" fill="#8a6a40"/><circle cx="196" cy="236" r="16" fill="#3b2a1a"/><circle cx="196" cy="236" r="6" fill="#8a6a40"/>
<g transform="rotate(-9 140 176)"><rect x="52" y="152" width="190" height="42" rx="18" fill="#7a5c2e"/><rect x="52" y="152" width="190" height="12" rx="6" fill="#9b7a42" opacity=".7"/><rect x="214" y="146" width="30" height="54" rx="8" fill="#6a4e26"/><rect x="108" y="146" width="10" height="54" fill="#5a4220"/><rect x="156" y="146" width="10" height="54" fill="#5a4220"/><circle cx="68" cy="173" r="9" fill="#2a1d10"/><rect x="82" y="146" width="8" height="8" fill="#2a1d10"/></g>
<g fill="#2b2b2b"><circle cx="252" cy="262" r="10"/><circle cx="272" cy="262" r="10"/><circle cx="262" cy="246" r="10"/></g><path d="M40 205Q16 220 28 250" stroke="#b79a62" stroke-width="3" fill="none"/>`);
ART['sa-ban-rg']=()=>{let tr='';
  for(let i=0;i<40;i++){const x=(i*47)%400,y=(i%2)?6+((i*23)%46):250+((i*17)%44);tr+=`<circle cx="${x}" cy="${y}" r="${6+(i%3)*2}" fill="${i%2?'#2a5a2c':'#356b33'}"/>`}
  return SV('0 0 400 300',`<rect width="400" height="300" fill="#2f5d34"/><rect y="62" width="400" height="176" fill="#2e7a94"/>${tr}
  <rect x="49" y="34" width="22" height="30" fill="#2c7089"/><rect x="330" y="34" width="22" height="30" fill="#2c7089"/>
  <rect x="150" y="236" width="14" height="22" fill="#2c7089"/><rect x="230" y="236" width="14" height="22" fill="#2c7089"/><rect x="300" y="236" width="14" height="22" fill="#2c7089"/>
  <ellipse cx="200" cy="150" rx="54" ry="17" fill="#3f7a3c"/><ellipse cx="200" cy="148" rx="40" ry="11" fill="#4d8c46"/>
  <g fill="#c9b78a"><rect x="336" y="254" width="10" height="8"/><rect x="350" y="258" width="10" height="8"/><rect x="342" y="268" width="10" height="8"/><rect x="358" y="270" width="10" height="8"/></g>
  ${boat(34,112,XI,{s:.62,flip:-1})}${boat(62,105,XI,{s:.62,flip:-1})}${boat(90,111,XI,{s:.62,flip:-1})}
  <text x="66" y="92" text-anchor="middle" font-size="9" fill="#fff" font-family="Be Vietnam Pro, system-ui, sans-serif">Đoàn thuyền quân Xiêm</text>
  <text x="60" y="26" text-anchor="middle" font-size="10" fill="#fff" font-family="Be Vietnam Pro, system-ui, sans-serif">Rạch Gầm</text><text x="341" y="26" text-anchor="middle" font-size="10" fill="#fff" font-family="Be Vietnam Pro, system-ui, sans-serif">Xoài Mút</text>
  <text x="200" y="176" text-anchor="middle" font-size="9" fill="#fff" font-family="Be Vietnam Pro, system-ui, sans-serif">Cù lao Thới Sơn</text><text x="352" y="288" text-anchor="middle" font-size="9" fill="#fff" font-family="Be Vietnam Pro, system-ui, sans-serif">Mỹ Tho</text>
  <text x="200" y="226" text-anchor="middle" font-size="9" fill="#cfe9f2" font-family="Be Vietnam Pro, system-ui, sans-serif">Sông Tiền</text>`)};
ART['tuong-quan']=()=>{
  const pers=(x,y,c)=>`<g transform="translate(${x} ${y})" fill="${c}"><circle cy="-24" r="8"/><path d="M-11 -13H11L14 14H-14Z"/></g>`;
  let xi='',tsr='',bo='';
  for(let i=0;i<10;i++)xi+=pers(222+i*36,190,'#e4606a');
  for(let i=0;i<4;i++)tsr+=pers(222+i*36,268,'#6f9bff');
  for(let i=0;i<10;i++)bo+=boat(226+i*36,394,XI,{s:1.1});
  return SVM('0 0 800 600',`<rect width="800" height="600" fill="#0f2a2c"/>
  <text x="400" y="42" text-anchor="middle" font-size="23" fill="#f2e9d4" font-family="Playfair Display,Georgia,serif">Tương quan lực lượng trước trận Rạch Gầm – Xoài Mút (1785)</text>
  <text x="400" y="66" text-anchor="middle" font-size="12" fill="#9fc7c4">Mỗi hình người ≈ 5.000 quân. Số liệu làm tròn theo sách giáo khoa Lịch sử 8; các tài liệu khác có thể ghi khác.</text>
  <text x="30" y="118" font-size="15" fill="#e6c47a">Quân số</text><line x1="30" y1="126" x2="770" y2="126" stroke="#2f5d5a"/>
  <text x="30" y="188" font-size="17" font-weight="700" fill="#ff8c94">Quân Xiêm</text>${xi}<text x="610" y="196" font-size="30" font-weight="700" fill="#ff8c94">≈ 50.000</text>
  <text x="30" y="266" font-size="17" font-weight="700" fill="#8ab4ff">Tây Sơn</text>${tsr}<text x="610" y="274" font-size="30" font-weight="700" fill="#8ab4ff">≈ 20.000</text>
  <rect x="270" y="288" width="260" height="34" rx="17" fill="#e6c47a"/><text x="400" y="310" text-anchor="middle" font-size="15" font-weight="700" fill="#2a1a08">Xiêm đông gấp ≈ 2,5 lần</text>
  <text x="30" y="352" font-size="15" fill="#e6c47a">Thuyền chiến</text><line x1="30" y1="360" x2="770" y2="360" stroke="#2f5d5a"/>
  <text x="30" y="398" font-size="17" font-weight="700" fill="#ff8c94">Quân Xiêm</text>${bo}<text x="610" y="400" font-size="22" font-weight="700" fill="#ff8c94">≈ 300 thuyền</text>
  <text x="30" y="432" font-size="14" fill="#8ab4ff">Tây Sơn: các nguồn ghi số thuyền khác nhau, chưa thống nhất</text>
  <rect x="30" y="450" width="360" height="110" rx="10" fill="rgba(163,38,46,.18)" stroke="#a3262e" stroke-width="2"/>
  <text x="46" y="476" font-size="15" font-weight="700" fill="#ff8c94">Quân Xiêm: đông nhưng bất lợi</text>
  <text x="46" y="502" font-size="13" fill="#f2e9d4">• Xa lạ với địa hình sông nước</text><text x="46" y="524" font-size="13" fill="#f2e9d4">• Chủ quan, ỷ vào quân đông</text><text x="46" y="546" font-size="13" fill="#f2e9d4">• Đội hình đông đặc trong sông hẹp</text>
  <rect x="410" y="450" width="360" height="110" rx="10" fill="rgba(34,87,184,.2)" stroke="#2257b8" stroke-width="2"/>
  <text x="426" y="476" font-size="15" font-weight="700" fill="#8ab4ff">Tây Sơn: ít hơn nhưng chủ động</text>
  <text x="426" y="502" font-size="13" fill="#f2e9d4">• Chọn trận địa có cù lao, kênh rạch</text><text x="426" y="524" font-size="13" fill="#f2e9d4">• Pháo binh mạnh trên thuyền và trên bờ</text><text x="426" y="546" font-size="13" fill="#f2e9d4">• Được nhân dân giúp chuẩn bị trận địa</text>
  <text x="400" y="586" text-anchor="middle" font-size="11" fill="#7fa9a6">Nguồn: SGK Lịch sử 8; báo Giáo dục Việt Nam; báo Đại biểu Nhân dân (số liệu làm tròn)</text>`)};
ART['chien-luoc']=()=>{
  const card=(x,y,n,t,l1,l2)=>`<rect x="${x}" y="${y}" width="360" height="132" rx="12" fill="#143a3d" stroke="#4fa3a0" stroke-width="2"/><circle cx="${x+30}" cy="${y+32}" r="16" fill="#e6c47a"/><text x="${x+30}" y="${y+38}" text-anchor="middle" font-size="17" font-weight="700" fill="#2a1a08">${n}</text><text x="${x+58}" y="${y+38}" font-size="17" font-weight="700" fill="#f2e9d4">${t}</text><text x="${x+20}" y="${y+80}" font-size="13" fill="#cfe3e1">${l1}</text><text x="${x+20}" y="${y+102}" font-size="13" fill="#cfe3e1">${l2}</text>`;
  const arr=(x,y)=>`<path d="M${x} ${y}h30m-9-8l9 8l-9 8" stroke="#e6c47a" stroke-width="3" fill="none"/>`;
  return SVM('0 0 800 600',`<rect width="800" height="600" fill="#0f2a2c"/>
  <text x="400" y="44" text-anchor="middle" font-size="25" fill="#f2e9d4" font-family="Playfair Display,Georgia,serif">Từ thế yếu đến thế thắng</text>
  <rect x="30" y="68" width="740" height="52" rx="12" fill="rgba(163,38,46,.22)" stroke="#a3262e" stroke-width="2"/>
  <text x="400" y="101" text-anchor="middle" font-size="17" fill="#ffb3b9">Thế yếu: ≈ 2 vạn quân phải đối đầu ≈ 5 vạn quân Xiêm</text>
  ${card(30,146,1,'Chọn trận địa','Khúc sông Tiền dài ≈ 7 km, giữa có cù lao','Thới Sơn, hai bờ nhiều kênh rạch, cây rậm')}
  ${card(410,146,2,'Nhử địch','Thuyền nhỏ ra khiêu chiến rồi giả thua,','dẫn quân Xiêm vào khúc sông đã bố trí')}
  ${card(30,296,3,'Chặn đầu, khóa đuôi','Thủy binh từ Xoài Mút và Rạch Gầm lao ra,','quân hai bờ và cù lao chia cắt đội hình')}
  ${card(410,296,4,'Hỏa lực và hỏa công','Pháo từ bờ, cù lao, thuyền chiến; đốt cháy','thuyền địch, đánh nhanh dứt điểm')}
  ${arr(374,212)}${arr(374,362)}
  <rect x="30" y="450" width="740" height="92" rx="14" fill="rgba(34,87,184,.22)" stroke="#2257b8" stroke-width="2"/>
  <text x="400" y="488" text-anchor="middle" font-size="19" font-weight="700" fill="#a9c6ff">Thế thắng</text>
  <text x="400" y="518" text-anchor="middle" font-size="15" fill="#f2e9d4">Số đông của địch trở thành gánh nặng trong khúc sông hẹp</text>
  <text x="400" y="578" text-anchor="middle" font-size="11" fill="#7fa9a6">Tổng hợp theo sách giáo khoa Lịch sử 8 và các bài nghiên cứu về trận Rạch Gầm – Xoài Mút</text>`)};

/* =====================================================================
   DỮ LIỆU MẪU: Chiến dịch Điện Biên Phủ 1954 (giáo viên có thể sửa/xoá tất cả)
   Quy ước kịch bản: mỗi dòng là một đoạn thuyết minh. Với sa hình, dòng bắt đầu
   bằng [n] sẽ làm nổi bật điểm chú thích số n.
   ===================================================================== */
const DEFAULT_DBP={
meta:{
  title:'Bảo tàng ảo',
  war:'Chiến dịch Điện Biên Phủ 1954',
  subtitle:'Bước vào các phòng trưng bày để tìm hiểu chiến dịch qua tranh, sa hình, đạo cụ, ảnh và tư liệu.',
  welcome:`Chào mừng các em đến với bảo tàng ảo về chiến dịch Điện Biên Phủ năm 1954.
Chúng ta sẽ lần lượt đi qua các phòng trưng bày. Hãy quan sát thật kỹ từng hiện vật và ghi lại điều em thấy thú vị nhé.`,
  outro:`Buổi tham quan đến đây là kết thúc.
Hãy cùng thảo luận: theo các em, yếu tố nào đã làm nên thắng lợi của chiến dịch?`
},
settings:{transition:'curtain',voice:false,rate:1},
items:[
{id:'keo-phao',type:'tranh',art:'keo-phao',title:'Kéo pháo vào trận địa',date:'Tranh minh hoạ, đầu năm 1954',origin:'Hình minh hoạ mẫu, có thể thay bằng tranh thật',
 detail:`Đầu năm 1954, những khẩu pháo lớn được đưa lên các sườn núi quanh lòng chảo Điện Biên Phủ hoàn toàn bằng sức người, qua những con đường rừng dốc hẹp do bộ đội và dân công mở.
Khi tình hình thay đổi, Bộ chỉ huy chiến dịch quyết định chuyển từ phương châm "đánh nhanh, thắng nhanh" sang "đánh chắc, tiến chắc". Pháo phải được kéo ra khỏi trận địa rồi lại kéo vào vị trí mới, đòi hỏi quyết tâm và kỷ luật rất cao.`,
 script:`Bức tranh này tái hiện cảnh bộ đội và dân công kéo pháo lên các sườn núi quanh Điện Biên Phủ.
Những khẩu pháo nặng được kéo bằng sức người, qua đèo cao và vực sâu, trong điều kiện mưa rừng và thiếu thốn.
Hãy nhìn dáng người của họ: cả thân mình nghiêng về phía trước, dồn toàn bộ sức lực vào sợi dây.
Sự chuẩn bị gian khổ ấy đã tạo nên thế trận bất ngờ đối với quân đội Pháp.`,
 question:'Vì sao việc đưa pháo lên trận địa bằng sức người lại có ý nghĩa quan trọng đối với chiến dịch?',img:'',text:'',phases:'',hotspots:'',inTour:true},
{id:'sa-ban',type:'sahinh',art:'sa-ban',title:'Sa hình tập đoàn cứ điểm Điện Biên Phủ',date:'Sơ đồ minh hoạ, không theo tỉ lệ',origin:'Hình minh hoạ mẫu',
 detail:`Sa hình thể hiện lòng chảo Mường Thanh, nơi quân Pháp xây dựng tập đoàn cứ điểm gồm ba phân khu: Bắc, Trung tâm và Nam.
Hãy bấm vào các điểm đánh số để xem diễn biến, hoặc chọn từng đợt tấn công ở phía trên sa hình.`,
 script:`Đây là sa hình thung lũng Mường Thanh. Quân Pháp bố trí một tập đoàn cứ điểm mạnh, chia thành ba phân khu: Bắc, Trung tâm và Nam.
[1] Ngày 13 tháng 3 năm 1954, chiến dịch mở màn bằng trận đánh vào cứ điểm Him Lam ở phía Bắc.
[2] Tiếp đó là cứ điểm Độc Lập.
[3] Rồi đến Bản Kéo. Đến ngày 17 tháng 3, phân khu Bắc bị tiêu diệt, kết thúc đợt tấn công thứ nhất.
[4] Đợt hai là những trận giằng co ác liệt trên các quả đồi phía Đông, nhất là đồi A1, nơi quân ta đào hầm ngầm đặt khối bộc phá.
[5] Đợt ba, ngày 7 tháng 5, quân ta tiến vào trung tâm Mường Thanh và bắt sống Bộ chỉ huy của tập đoàn cứ điểm.
[6] Cụm cứ điểm Hồng Cúm ở phía Nam bị cô lập và sau đó chấm dứt kháng cự.`,
 question:'Hãy sắp xếp ba đợt tấn công theo thứ tự thời gian và giải thích vì sao trận đánh đầu tiên diễn ra ở phân khu phía Bắc.',img:'',text:'',
 phases:`Đợt 1 (13 đến 17/3/1954)
Đợt 2 (30/3 đến 30/4/1954)
Đợt 3 (1 đến 7/5/1954)`,
 hotspots:`28 | 26 | 1 | Him Lam | Cứ điểm phía Bắc, nơi nổ súng mở màn chiến dịch vào chiều 13/3/1954. Tại đây, chiến sĩ Phan Đình Giót đã lấy thân mình lấp lỗ châu mai.
50 | 12 | 1 | Độc Lập | Cứ điểm phía Bắc, bị tiến công trong đợt 1. Quân Pháp mất thêm một vị trí quan trọng ở vòng ngoài.
68 | 27 | 1 | Bản Kéo | Cụm cứ điểm phía Bắc cuối cùng bị tiêu diệt (17/3/1954). Sau đợt 1, phân khu Bắc không còn, sân bay Mường Thanh bị uy hiếp.
76 | 52 | 2 | Các đồi phía Đông (A1, C1, D1, E1) | Cửa ngõ bảo vệ trung tâm. Đợt 2 diễn ra giằng co ác liệt, nhất là ở đồi A1. Ngày 6/5, khối bộc phá đặt trong hầm ngầm dưới đồi A1 được kích nổ, mở đường cho đợt tổng công kích cuối cùng.
44 | 52 | 3 | Trung tâm Mường Thanh | Nơi có sở chỉ huy và sân bay. Chiều 7/5/1954, quân ta tiến vào hầm chỉ huy, bắt sống tướng Đờ Cát-tơ-ri cùng Bộ chỉ huy.
44 | 84 | 3 | Hồng Cúm | Cụm cứ điểm phía Nam, bị cô lập khi trung tâm thất thủ; lực lượng tại đây chấm dứt kháng cự sau ngày 7/5.`,inTour:true},
{id:'tong-cong-kich',type:'tranh',art:'tong-cong-kich',title:'Tổng công kích ngày 7/5/1954',date:'Tranh minh hoạ, 7/5/1954',origin:'Hình minh hoạ mẫu, có thể thay bằng tranh thật',
 detail:`Chiều ngày 7/5/1954, sau 56 ngày đêm chiến đấu, quân ta tiến vào sở chỉ huy của tập đoàn cứ điểm, bắt sống tướng Đờ Cát-tơ-ri (Christian de Castries) cùng toàn bộ Bộ chỉ huy.
Chiến dịch kết thúc thắng lợi, tạo bước ngoặt cho cuộc kháng chiến chống thực dân Pháp.`,
 script:`Bức tranh tái hiện khoảnh khắc quyết định của chiến dịch.
Ngày 7 tháng 5 năm 1954, bộ đội ta tiến công trên toàn mặt trận. Chiều hôm đó, quân ta tiến vào hầm sở chỉ huy và bắt sống tướng Đờ Cát-tơ-ri cùng toàn bộ Bộ chỉ huy.
Chiến dịch kết thúc thắng lợi sau năm mươi sáu ngày đêm.`,
 question:'Thắng lợi ở Điện Biên Phủ tác động như thế nào đến Hội nghị Giơ-ne-vơ?',img:'',text:'',phases:'',hotspots:'',inTour:true},
{id:'xe-tho',type:'daocu',art:'xe-tho',title:'Chiếc xe đạp thồ',date:'Phương tiện vận tải, 1953 đến 1954',origin:'Hình minh hoạ mẫu',
 detail:`Xe đạp thồ được gia cố khung và gắn thêm đòn tay dài để dắt, giữ thăng bằng, nhờ vậy có thể chở hàng trăm ki-lô-gam lương thực, đạn dược qua đường rừng.
Cùng với gánh gồng, xe cút kít, ngựa thồ và hàng trăm nghìn dân công hoả tuyến, xe thồ là mạch máu hậu cần của chiến dịch.`,
 script:`Đây là chiếc xe đạp thồ, một phương tiện giản dị nhưng có sức mạnh lớn trong chiến dịch.
Khung xe được gia cố, thêm một thanh gỗ hoặc tre dài để dắt và giữ thăng bằng, nhờ vậy mỗi chiếc xe có thể chở hàng trăm ki-lô-gam lương thực và đạn dược.
Cùng với hàng trăm nghìn dân công hoả tuyến, những chiếc xe thồ đã nối liền hậu phương với mặt trận.`,
 question:'Vì sao có thể nói hậu cần là yếu tố quyết định của chiến dịch này?',img:'',text:'',phases:'',hotspots:'',inTour:true},
{id:'bep-hoang-cam',type:'daocu',art:'bep-hoang-cam',title:'Bếp Hoàng Cầm',date:'Dụng cụ cấp dưỡng, kháng chiến chống Pháp',origin:'Hình minh hoạ mẫu',
 detail:`Bếp được đào sâu dưới đất, dẫn khói qua một rãnh dài rồi toả ra nhiều lỗ nhỏ trên mặt đất, nên khói loãng đi và khó bị máy bay địch phát hiện.
Bếp mang tên anh nuôi Hoàng Cầm, người sáng tạo ra loại bếp này.`,
 script:`Bếp Hoàng Cầm là một sáng kiến nhỏ nhưng rất thông minh của bộ đội ta.
Bếp được đào dưới đất, khói đi qua một đường rãnh dài rồi tản ra nhiều lỗ nhỏ, nên khói loãng đi và khó bị máy bay địch phát hiện.
Nhờ vậy, bộ đội vẫn có cơm nóng ngay cả khi đóng quân gần trận địa.`,
 question:'Em hãy nêu thêm một sáng kiến khác của bộ đội và nhân dân ta nhằm khắc phục khó khăn trong chiến tranh.',img:'',text:'',phases:'',hotspots:'',inTour:true},
{id:'co-chien-thang',type:'anh',art:'co-chien-thang',title:'Lá cờ trên nóc hầm chỉ huy',date:'Ảnh minh hoạ, chiều 7/5/1954',origin:'Hình minh hoạ mẫu, nên thay bằng ảnh tư liệu gốc',
 detail:`Chiều 7/5/1954, lá cờ "Quyết chiến Quyết thắng" được cắm trên nóc hầm sở chỉ huy của tập đoàn cứ điểm.
Đây là hình ảnh biểu tượng cho thắng lợi của chiến dịch Điện Biên Phủ.`,
 script:`Đây là hình ảnh biểu tượng của chiến thắng: lá cờ Quyết chiến Quyết thắng tung bay trên nóc hầm sở chỉ huy.
Chiều ngày 7 tháng 5 năm 1954, sau năm mươi sáu ngày đêm chiến đấu, tập đoàn cứ điểm Điện Biên Phủ đã bị tiêu diệt.
Em hãy nhìn bố cục bức ảnh: ánh mắt của chúng ta bị thu hút về đâu?`,
 question:'Vì sao hình ảnh lá cờ trên nóc hầm chỉ huy trở thành biểu tượng của chiến thắng?',img:'',text:'',phases:'',hotspots:'',inTour:true},
{id:'dan-cong',type:'anh',art:'dan-cong',title:'Dân công hoả tuyến',date:'Ảnh minh hoạ, năm 1954',origin:'Hình minh hoạ mẫu, nên thay bằng ảnh tư liệu gốc',
 detail:`Hàng trăm nghìn dân công từ nhiều vùng đã gánh gạo, đẩy xe, thồ hàng, đi đêm qua rừng núi dưới sự đe doạ của máy bay địch để đưa lương thực, đạn dược ra mặt trận.`,
 script:`Phía sau mỗi trận đánh là những con đường dài của dân công hoả tuyến.
Họ gánh gạo, đẩy xe, thồ hàng, đi đêm qua rừng núi, dưới sự đe doạ của máy bay địch.
Không có họ thì pháo không thể tới nơi, bộ đội không đủ lương thực để chiến đấu lâu dài.`,
 question:'Theo em, vai trò của hậu phương trong chiến dịch được thể hiện như thế nào qua bức ảnh này?',img:'',text:'',phases:'',hotspots:'',inTour:true},
{id:'quyet-dinh',type:'tailieu',art:'',title:'Quyết định chuyển phương châm tác chiến',date:'Tóm lược tư liệu, cuối tháng 1/1954',origin:'Nội dung mẫu, nên thay bằng văn bản gốc',
 detail:`Đây là tư liệu về một quyết định quan trọng trước khi chiến dịch bước vào giai đoạn quyết định.`,
 text:`Tóm lược tư liệu (nội dung mẫu, thay bằng văn bản gốc)
Cuối tháng 1 năm 1954, Đảng uỷ và Bộ chỉ huy chiến dịch nhận định rằng phương châm "đánh nhanh, thắng nhanh" có nguy cơ thất bại, vì quân địch đã tăng cường lực lượng và xây dựng công sự vững chắc.
Quyết định: chuyển sang phương châm "đánh chắc, tiến chắc", hoãn cuộc tấn công, kéo pháo ra khỏi vị trí, tổ chức lại hậu cần và chuẩn bị chiến trường kỹ hơn.
Ý nghĩa: đây được xem là một trong những quyết định quan trọng góp phần tạo nên thắng lợi của chiến dịch.`,
 script:`Đây là tư liệu về quyết định quan trọng vào cuối tháng 1 năm 1954.
Ban đầu, phương án là đánh nhanh, thắng nhanh. Nhưng khi quân địch tăng cường và xây dựng công sự vững chắc, Bộ chỉ huy đã quyết định chuyển sang đánh chắc, tiến chắc.
Quyết định ấy cho thấy sự cân nhắc thận trọng và dám thay đổi khi tình hình thay đổi.`,
 question:'Em đánh giá thế nào về việc dám thay đổi phương châm khi tình hình thay đổi?',img:'',phases:'',hotspots:'',inTour:true},
{id:'gio-ne-vo',type:'tailieu',art:'',title:'Hiệp định Giơ-ne-vơ (21/7/1954)',date:'Tóm lược tư liệu, 21/7/1954',origin:'Nội dung mẫu, nên thay bằng văn bản gốc',
 detail:`Hiệp định ghi nhận kết quả của cuộc kháng chiến chống thực dân Pháp và tạo cơ sở pháp lý quốc tế cho độc lập, chủ quyền của các nước Đông Dương.`,
 text:`Tóm lược tư liệu (nội dung mẫu, thay bằng văn bản gốc)
Hiệp định về chấm dứt chiến sự ở Việt Nam được ký tại Giơ-ne-vơ ngày 21 tháng 7 năm 1954.
Các nước tham dự cam kết tôn trọng độc lập, chủ quyền, thống nhất và toàn vẹn lãnh thổ của Việt Nam, Lào và Cam-pu-chia.
Vĩ tuyến 17 được chọn làm giới tuyến quân sự tạm thời để tập kết, chuyển quân; dự kiến tổ chức tổng tuyển cử để thống nhất đất nước.`,
 script:`Sau chiến thắng Điện Biên Phủ, Hội nghị Giơ-ne-vơ đi đến ký kết hiệp định vào ngày 21 tháng 7 năm 1954.
Hiệp định công nhận độc lập, chủ quyền, thống nhất và toàn vẹn lãnh thổ của Việt Nam, Lào và Cam-pu-chia.
Vĩ tuyến 17 được dùng làm giới tuyến quân sự tạm thời, chờ ngày thống nhất đất nước.`,
 question:'Vì sao có thể nói thắng lợi quân sự ở Điện Biên Phủ đã tạo thế mạnh trên bàn đàm phán?',img:'',phases:'',hotspots:'',inTour:true}
]};

/* =====================================================================
   CHỦ ĐỀ MẪU: Kháng chiến chống quân Xiêm (1784 – 1785)
   Số liệu theo sách giáo khoa Lịch sử 8; các tài liệu có thể ghi khác.
   ===================================================================== */
const XIEM={
meta:{
  title:'Bảo tàng ảo',
  war:'Kháng chiến chống quân Xiêm (1784 – 1785)',
  subtitle:'Nguyễn Huệ, người sau này là vua Quang Trung, và trận Rạch Gầm – Xoài Mút: vì sao quân ít hơn lại đánh thắng quân đông.',
  welcome:`Chào mừng các em đến với bảo tàng ảo về cuộc kháng chiến chống quân Xiêm xâm lược của Nguyễn Huệ, người sau này là vua Quang Trung.
Chúng ta sẽ cùng tìm hiểu vì sao quân ít hơn lại có thể đánh thắng quân đông.`,
  outro:`Buổi tham quan đến đây là kết thúc.
Hãy cùng thảo luận: vì sao Nguyễn Huệ chọn đánh ở khúc sông này, và điều đó cho thấy gì về nghệ thuật quân sự của ông?`
},
settings:{transition:'curtain',voice:true,rate:1,voiceName:'',tourMinutes:4},
items:[
{id:'boi-canh',type:'tailieu',art:'',title:'Bối cảnh: quân Xiêm kéo vào Gia Định',date:'Tóm lược tư liệu, năm 1784',origin:'Tổng hợp từ sách giáo khoa Lịch sử 8, nên thay bằng văn bản gốc',
 detail:`Đây là tư liệu về bối cảnh dẫn đến trận Rạch Gầm – Xoài Mút.
Lưu ý: năm 1785 Nguyễn Huệ chưa lên ngôi. Ông lên ngôi hoàng đế, lấy niên hiệu Quang Trung, vào năm 1788.`,
 text:`Tóm lược tư liệu (tổng hợp từ sách giáo khoa Lịch sử 8, nên thay bằng văn bản gốc)
Sau khi chính quyền chúa Nguyễn ở Đàng Trong bị lật đổ, Nguyễn Ánh nhiều lần bị Tây Sơn đánh bại nên sang Xiêm cầu viện.
Cuối tháng 7 năm 1784, quân Xiêm kéo vào Gia Định và nhanh chóng chiếm phần lớn miền tây Gia Định.
Cuối năm 1784, Nguyễn Nhạc cử Nguyễn Huệ đem thủy quân vào Nam để phản công. Nguyễn Huệ đặt đại bản doanh ở Mỹ Tho.`,
 script:`Năm 1784, Nguyễn Ánh nhiều lần thất bại trước Tây Sơn nên sang Xiêm cầu viện.
Cuối tháng bảy, quân Xiêm kéo vào Gia Định và chiếm phần lớn miền tây Gia Định.
Cuối năm ấy, Nguyễn Nhạc cử Nguyễn Huệ đem thủy quân vào Nam để phản công.`,
 question:'Việc Nguyễn Ánh cầu viện quân Xiêm đã đẩy tình hình đất nước vào nguy cơ gì?',img:'',phases:'',hotspots:'',inTour:true},
{id:'tuong-quan',type:'dohoa',art:'tuong-quan',title:'Tương quan lực lượng giữa hai bên',date:'Đồ họa phân tích, năm 1785',origin:'Đồ họa do tác giả dựng từ số liệu sách giáo khoa; các tài liệu khác có thể ghi khác',
 detail:`Đồ họa so sánh quân số và thuyền chiến của hai bên. Con số khoảng 5 vạn và khoảng 2 vạn là số liệu làm tròn thường dùng trong sách giáo khoa.
Điều quan trọng không chỉ là con số mà còn là thế trận: bên đông hơn chưa chắc đã mạnh hơn nếu bất lợi về địa hình và chủ quan.`,
 script:`Hãy nhìn đồ họa này. Quân Xiêm khoảng năm vạn người, cùng chừng ba trăm chiến thuyền. Quân Tây Sơn khoảng hai vạn người, chưa bằng một nửa.
Tính ra, quân Xiêm đông gấp hai phẩy năm lần.
Nhưng đông chưa chắc đã mạnh: quân Xiêm xa lạ với sông nước vùng này, còn Tây Sơn có pháo binh mạnh và được nhân dân giúp chuẩn bị trận địa.`,
 question:'Nếu hai bên đánh giáp mặt ở nơi trống trải thì kết quả có thể ra sao? Vì sao Nguyễn Huệ không chọn cách đó?',img:'',text:'',phases:'',hotspots:'',inTour:true},
{id:'thuy-binh',type:'tranh',art:'thuy-binh',title:'Rạng sáng trên sông Tiền',date:'Tranh minh họa, đầu năm 1785',origin:'Hình minh họa mẫu, có thể thay bằng tranh thật',
 detail:`Thủy binh Tây Sơn ém quân trong các rạch nhỏ và sau những cù lao, ẩn dưới tán cây rậm hai bờ sông. Mặt sông yên ắng, nhưng một trận địa phục kích đã sẵn sàng.
Nhân dân Tiền Giang đóng góp rất nhiều để giúp quân Tây Sơn chuẩn bị trận địa.`,
 script:`Rạng sáng trên sông Tiền, thủy binh Tây Sơn ém quân trong các rạch nhỏ và sau cù lao.
Mặt sông phẳng lặng, nhưng dưới tán cây hai bờ là cả một trận địa đã sẵn sàng.`,
 question:'Vì sao yếu tố bí mật và sự giúp đỡ của nhân dân lại đặc biệt quan trọng với một trận phục kích?',img:'',text:'',phases:'',hotspots:'',inTour:true},
{id:'tran-dia',type:'sahinh',art:'sa-ban-rg',title:'Sa hình trận địa Rạch Gầm – Xoài Mút',date:'Sơ đồ minh họa, không theo tỉ lệ',origin:'Hình minh họa mẫu',
 detail:`Sa hình thể hiện khúc sông Tiền từ Rạch Gầm đến Xoài Mút, dài chừng 7 km, rộng khoảng 1 km. Giữa sông có cù lao Thới Sơn, hai bên bờ cây cối rậm rạp và nhiều kênh rạch nhỏ.
Hãy bấm vào các điểm đánh số để xem vai trò của từng vị trí.`,
 script:`Đây là sa hình khúc sông Tiền từ Rạch Gầm đến Xoài Mút, dài chừng bảy ki-lô-mét.
 [1] Nguyễn Huệ đặt đại bản doanh ở Mỹ Tho và trực tiếp khảo sát sông, chọn khúc có cù lao cùng nhiều kênh rạch làm trận địa.
 [2] Trong đêm trước trận đánh, quân Tây Sơn bí mật bố trí lực lượng ở hai bờ, cù lao và các nhánh sông.
 [3] Khi đội thuyền Xiêm tiến sâu vào khu vực đã chọn, quân Tây Sơn đồng loạt đánh từ nhiều hướng.
 [4] Thủy binh từ Rạch Gầm khóa đuôi, từ Xoài Mút chặn đầu đội hình địch.
 [5] Pháo binh phối hợp với hỏa công; đường rút bị cắt, đoàn thuyền Xiêm rối loạn.
Lưu ý: một số tài liệu ghi ngày trận đánh khác nhau.`,
 question:'Theo em, vì sao khúc sông này thuận lợi cho phục kích hơn một khúc sông rộng và thẳng?',img:'',text:'',
 phases:`Bố trí trận địa
Tổng công kích`,
 hotspots:`88 | 87 | 1 | Mỹ Tho (đại bản doanh) | Nơi Nguyễn Huệ đóng đại bản doanh, ở phía hạ lưu so với khúc sông quyết chiến.
50 | 50 | 1 | Cù lao Thới Sơn | Cù lao giữa sông, cùng các nhánh sông nhỏ quanh đó là nơi ém quân, giấu pháo và xuất phát của thuyền chiến Tây Sơn.
30 | 12 | 1 | Hai bờ cây rậm, nhiều kênh rạch | Địa hình rậm rạp, nhiều kênh rạch giúp che giấu lực lượng mai phục và cơ động nhanh.
15 | 15 | 2 | Rạch Gầm (khóa đuôi) | Thủy binh Tây Sơn từ đây lao ra khóa đuôi, chặn đường rút lui của đoàn thuyền Xiêm.
85 | 15 | 2 | Xoài Mút (chặn đầu) | Thủy binh Tây Sơn từ đây lao ra chặn đầu, không cho đoàn thuyền Xiêm tiến tiếp.`,inTour:true},
{id:'phim-rg',type:'phim',art:'rach-gam-phim',title:'Phim sa hình: trận Rạch Gầm – Xoài Mút',date:'Phim ngắn khoảng 1 phút, rạng sáng 19/1/1785',origin:'Sơ đồ động minh họa, không theo tỉ lệ; số liệu theo sách giáo khoa',
 detail:`Bấm "Phát phim" để xem diễn biến trận đánh qua sáu cảnh, hoặc kéo thanh tua để dừng ở từng cảnh. Phần ghi chú phân tích của mỗi cảnh hiện ngay dưới màn hình.
Lưu ý: một số tài liệu ghi trận đánh diễn ra ngày 20/1/1785.`,
 script:`Bắt đầu phim. Quân Xiêm đông gấp hơn hai lần, kéo cả đoàn thuyền vào sông Tiền. Nếu đánh giáp mặt ở chỗ rộng, Tây Sơn khó thắng.
Nguyễn Huệ cho vài thuyền nhỏ ra khiêu chiến rồi giả thua bỏ chạy. Quân Xiêm chủ quan, ỷ đông nên đuổi theo vào khúc sông đã chọn.
Khi cả đoàn thuyền đã lọt vào trận địa, thủy binh từ Rạch Gầm khóa đuôi, từ Xoài Mút chặn đầu, quân hai bờ và cù lao lao ra chia cắt đội hình địch.
Pháo bắn dồn dập từ bờ, cù lao và thuyền chiến, kết hợp hỏa công. Thuyền địch nối nhau bốc cháy; càng đông, họ càng chen chúc và rối loạn.
Bị chia cắt, các thuyền Xiêm không thể cứu viện nhau. Đội hình tan vỡ, nhiều thuyền cháy hoặc đắm.
Chỉ trong chưa đầy một ngày, phần lớn quân Xiêm bị tiêu diệt, số còn lại chạy bộ qua Chân Lạp. Lợi thế số đông của địch đã bị biến thành điểm yếu.`,
 question:'Hãy chỉ ra thời điểm quân Xiêm bắt đầu mất lợi thế số đông và giải thích vì sao.',img:'',text:'',phases:'',hotspots:'',inTour:true},
{id:'hoa-cong',type:'tranh',art:'hoa-cong',title:'Hỏa công trên sông Tiền',date:'Tranh minh họa, năm 1785',origin:'Hình minh họa mẫu, có thể thay bằng tranh thật',
 detail:`Lửa cháy sáng rực trên mặt sông. Hỏa công là cách đánh hiệu quả với những đoàn thuyền gỗ đi sát nhau trong khúc sông hẹp: một thuyền cháy có thể làm cháy lan sang nhiều thuyền khác.`,
 script:`Lửa sáng rực trên mặt sông Tiền. Hỏa công là cách đánh rất hiệu quả với những đoàn thuyền gỗ đi sát nhau.`,
 question:'Vì sao đội hình đông và dày đặc lại dễ bị thiệt hại nặng bởi hỏa công?',img:'',text:'',phases:'',hotspots:'',inTour:true},
{id:'la-co-tay-son',type:'daocu',art:'co-tay-son',title:'Lá cờ Tây Sơn',date:'Mô hình tái dựng theo hình ảnh tham khảo',origin:'Họa tiết dựa trên hình ảnh tham khảo; chưa xác minh đây là mẫu cờ thống nhất của quân Tây Sơn',
 detail:`Mô hình lá cờ sử dụng nền đỏ, viền vàng và hình tròn vàng ở giữa, dựa trên hình ảnh tham khảo được cung cấp. Đây là cách tái hiện trực quan cho không gian trưng bày, không khẳng định mọi đơn vị Tây Sơn đều dùng cùng một mẫu cờ.`,
 script:`Đây là mô hình lá cờ Tây Sơn được tái dựng theo hình ảnh tham khảo: nền đỏ, viền vàng và hình tròn vàng ở giữa. Màu sắc và biểu tượng giúp lá cờ nổi bật khi trưng bày, nhưng hiện vật này là mô phỏng minh họa, không phải khẳng định về một mẫu cờ thống nhất trong toàn quân Tây Sơn.`,
 question:'Một biểu tượng trên cờ có thể giúp tập hợp và nhận diện lực lượng như thế nào?',img:'',text:'',phases:'',hotspots:'',inTour:true},
{id:'chien-luoc',type:'dohoa',art:'chien-luoc',title:'Chiến lược: từ thế yếu đến thế thắng',date:'Đồ họa phân tích',origin:'Tổng hợp theo sách giáo khoa Lịch sử 8 và các bài nghiên cứu',
 detail:`Nguyễn Huệ không đối đầu trực diện mà lựa chọn địa hình, nhử địch vào trận địa, chặn đầu khóa đuôi để chia cắt, rồi dùng hỏa lực và hỏa công đánh nhanh dứt điểm.
Nhờ vậy, lợi thế số đông của địch bị biến thành bất lợi trong khúc sông hẹp.`,
 script:`Tổng hợp lại, Nguyễn Huệ làm bốn việc. Một, chọn khúc sông hẹp có cù lao và kênh rạch để mai phục. Hai, nhử địch bằng thuyền nhỏ. Ba, chặn đầu khóa đuôi, chia cắt đội hình. Bốn, dùng pháo và hỏa công đánh nhanh dứt điểm.
Nhờ vậy, thế yếu về quân số đã trở thành thế thắng.`,
 question:'Trong bốn bước trên, theo em bước nào quyết định nhất? Hãy giải thích.',img:'',text:'',phases:'',hotspots:'',inTour:true},
{id:'y-nghia',type:'tailieu',art:'',title:'Ý nghĩa của chiến thắng',date:'Tóm lược tư liệu',origin:'Tổng hợp từ sách giáo khoa và báo chí, nên thay bằng văn bản gốc',
 detail:`Chiến thắng Rạch Gầm – Xoài Mút đập tan cuộc xâm lược của quân Xiêm, thể hiện tài chỉ huy của Nguyễn Huệ và sức mạnh đoàn kết của nhân dân.`,
 text:`Tóm lược tư liệu (tổng hợp, nên thay bằng văn bản gốc)
Chiến thắng đập tan âm mưu xâm lược của quân Xiêm, chấm dứt mộng bành trướng của Xiêm La đối với Đại Việt.
Nguyễn Huệ chứng tỏ tài chỉ huy chiến lược và chiến thuật: biết tận dụng địa hình, thời cơ và sức mạnh đoàn kết của nhân dân.
Chiến thắng là biểu tượng của ý chí đoàn kết, dũng cảm, bất khuất và chống ngoại xâm.
Thắng lợi tạo điều kiện để phong trào Tây Sơn tiếp tục tiến ra Bắc, lật đổ chính quyền Lê – Trịnh và chấm dứt cục diện chia cắt đất nước.`,
 script:`Chiến thắng Rạch Gầm – Xoài Mút đã đập tan âm mưu xâm lược của quân Xiêm.
Nguyễn Huệ cho thấy tài chỉ huy khi tận dụng địa hình, thời cơ và sự giúp sức của nhân dân.
Thắng lợi còn tạo điều kiện để phong trào Tây Sơn tiến ra Bắc.`,
 question:'Chiến thắng này cho thấy những phẩm chất nào của người chỉ huy và nhân dân?',img:'',phases:'',hotspots:'',inTour:true},
{id:'ket-qua-xiem',type:'tailieu',art:'',title:'Kết quả trận Rạch Gầm – Xoài Mút',date:'Rạng sáng 19/1/1785 (một số nguồn ghi ngày khác)',origin:'Tham khảo tóm tắt EZ Sử do người dùng cung cấp; quân số và ngày trận có dị bản',
 detail:`Trong chưa đầy một ngày, quân Tây Sơn phá tan lực lượng thủy binh Xiêm và một bộ phận quân Nguyễn.`,
 text:`Tóm lược tư liệu
Trong chưa đầy một ngày, khoảng 300 thuyền và 2 vạn thủy binh Xiêm cùng một bộ phận quân của chúa Nguyễn bị quân Tây Sơn đánh tan.
Chiêu Tăng, Chiêu Sương cùng một số tàn quân chạy lên bờ bắc sông Mỹ Tho, mở đường qua Quang Hóa và Chân Lạp để về Xiêm.
Sau khi mất chỗ dựa quân sự, Nguyễn Ánh rời vùng Long Hồ – Mỹ Tho – Ba Lai, chạy về Hà Tiên rồi tiếp tục lánh sang Xiêm cầu viện.
Lưu ý: tài liệu có thể ghi khác nhau về quân số, số thuyền và ngày diễn ra trận đánh.`,
 script:`Trong chưa đầy một ngày, quân Tây Sơn phá tan thủy binh Xiêm ở Rạch Gầm – Xoài Mút.
Chiêu Tăng, Chiêu Sương cùng một số tàn quân chạy qua Chân Lạp về Xiêm. Nguyễn Ánh mất chỗ dựa quân sự và phải tiếp tục lẩn trốn, cầu viện.`,
 question:'Vì sao thất bại ở Rạch Gầm – Xoài Mút khiến Nguyễn Ánh mất chỗ dựa quân sự?',img:'',phases:'',hotspots:'',inTour:true}
]};

const THANH={
meta:{title:'Bảo tàng ảo',war:'Kháng chiến chống quân Thanh (1788 – 1789)',subtitle:'Nguyễn Huệ lên ngôi Hoàng đế, lấy niên hiệu Quang Trung, rồi chỉ huy chiến dịch giải phóng Thăng Long.',welcome:'Cùng tìm hiểu chiến dịch chống quân Thanh và chiến thắng Ngọc Hồi – Đống Đa dưới sự chỉ huy của Hoàng đế Quang Trung.',outro:'Hãy cùng thảo luận: địa hình, thời cơ và cách tổ chức tiến công đã góp phần làm nên chiến thắng như thế nào?'},
settings:{transition:'curtain',voice:true,rate:1,voiceName:'',tourMinutes:4},
items:[
{id:'thanh-hanh-quan',campaign:'thanh',type:'dohoa',title:'Hành quân thần tốc ra Bắc',date:'Cuối năm 1788 – đầu năm 1789',origin:'Sơ đồ khái quát, không theo tỉ lệ',detail:'Quang Trung lên ngôi Hoàng đế tại Phú Xuân, rồi tổ chức hành quân ra Bắc. Đạo quân tiến qua Tam Điệp và chia hướng đánh vào các đồn lũy bảo vệ Thăng Long.',text:'Phú Xuân → Tam Điệp → Thăng Long. Các mũi tiến công được phối hợp để đánh vào hệ thống phòng thủ của quân Thanh trong dịp Tết Kỷ Dậu.',script:'Quang Trung lên ngôi Hoàng đế ở Phú Xuân rồi tiến quân ra Bắc. Từ Tam Điệp, quân Tây Sơn chia hướng, phối hợp tiến công các đồn lũy của quân Thanh.',question:'Việc chọn thời điểm Tết có ý nghĩa gì đối với yếu tố bất ngờ?',img:'',art:'',phases:'',hotspots:'',inTour:true},
{id:'thanh-tran-dia',campaign:'thanh',type:'sahinh',title:'Sa hình chiến dịch Ngọc Hồi – Đống Đa',date:'Tết Kỷ Dậu, 1789',origin:'Mô hình khái quát, không theo tỉ lệ',detail:'Sa hình thể hiện các hướng tiến công của quân Tây Sơn từ Tam Điệp vào các đồn lũy phía nam Thăng Long và trận Đống Đa.',text:'Từ căn cứ Tam Điệp, quân Tây Sơn tiến công dồn dập. Đồn Ngọc Hồi bị đánh ở cửa ngõ phía nam; đạo quân của Đô đốc Long tiến vào Đống Đa. Quân Thanh rút chạy khỏi Thăng Long.',script:'Đêm mồng bốn Tết Kỷ Dậu, quân Tây Sơn tiến công các đồn tiền tiêu. Rạng sáng mồng năm, trận Ngọc Hồi và mũi tiến công vào Đống Đa làm tan vỡ hệ thống phòng thủ phía nam Thăng Long. Quân Thanh tháo chạy, Quang Trung tiến vào Thăng Long.',question:'Vì sao cần phối hợp nhiều mũi tiến công thay vì chỉ đánh một cửa?',img:'',art:'',phases:'Đêm mồng bốn Tết: tiến công đồn tiền tiêu\nRạng sáng mồng năm: đánh Ngọc Hồi và Đống Đa\nQuân Thanh rút khỏi Thăng Long',hotspots:'24 | 72 | 1 | Tam Điệp | Căn cứ tập kết và xuất phát của quân Tây Sơn trước cuộc tiến công ra Bắc.\n70 | 74 | 1 | Đồn Ngọc Hồi | Cửa ngõ phía nam Thăng Long, nơi diễn ra trận đánh lớn trong ngày mồng năm Tết Kỷ Dậu.\n78 | 51 | 2 | Đống Đa | Hướng tiến công của đạo quân Đô đốc Long, đánh vào lực lượng quân Thanh ở phía tây nam thành.\n52 | 24 | 2 | Thăng Long | Quang Trung tiến vào kinh thành sau khi quân Thanh rút chạy.',inTour:true},
{id:'thanh-quang-trung',campaign:'thanh',type:'tailieu',title:'Nguyễn Huệ – Hoàng đế Quang Trung',date:'1753 – 1792',origin:'Tư liệu khái quát; nên đối chiếu với nguồn lịch sử',detail:'Nguyễn Huệ là một trong những thủ lĩnh của phong trào Tây Sơn. Trước khi lên ngôi, ông thường được gọi là Bắc Bình Vương. Cuối năm 1788, ông lên ngôi Hoàng đế, lấy niên hiệu Quang Trung, trực tiếp chỉ huy cuộc tiến quân ra Bắc chống quân Thanh.',text:'Nguyễn Huệ, thường được gọi là Bắc Bình Vương trước khi lên ngôi, là nhà lãnh đạo chính trị và quân sự của phong trào Tây Sơn. Cuối năm 1788, ông lên ngôi Hoàng đế, lấy niên hiệu Quang Trung.\nCùng Nguyễn Nhạc và Nguyễn Lữ, ông là một trong những lãnh đạo tiêu biểu của phong trào Tây Sơn. Chiến dịch chống quân Thanh năm 1788–1789 thể hiện năng lực tổ chức và chỉ huy của ông.',script:'Nguyễn Huệ, thường được gọi là Bắc Bình Vương trước khi lên ngôi, là một lãnh đạo của phong trào Tây Sơn. Cuối năm 1788, ông lên ngôi Hoàng đế, lấy niên hiệu Quang Trung, rồi trực tiếp chỉ huy chiến dịch chống quân Thanh.',question:'Những quyết định nào cho thấy năng lực tổ chức và chỉ huy của Quang Trung?',img:'',art:'',phases:'',hotspots:'',inTour:true},
{id:'thanh-ket-qua',campaign:'thanh',type:'tailieu',title:'Kết quả và ý nghĩa chiến thắng',date:'Tết Kỷ Dậu, 1789',origin:'Tư liệu khái quát; nên đối chiếu với nguồn lịch sử',detail:'Chiến thắng Ngọc Hồi – Đống Đa đánh bại cuộc tiến công của quân Thanh và đưa Quang Trung tiến vào Thăng Long.',text:'Quân Tây Sơn đánh tan hệ thống đồn lũy của quân Thanh ở phía nam Thăng Long; quân Thanh rút chạy và Quang Trung tiến vào kinh thành.\nChiến thắng bảo vệ nền độc lập, thể hiện khả năng tổ chức hành quân và tiến công táo bạo, đồng thời trở thành dấu mốc tiêu biểu trong lịch sử chống ngoại xâm.',script:'Chiến thắng Ngọc Hồi – Đống Đa làm tan vỡ hệ thống phòng thủ của quân Thanh ở phía nam Thăng Long. Quân Thanh rút chạy, Quang Trung tiến vào kinh thành. Thắng lợi bảo vệ nền độc lập và trở thành dấu mốc tiêu biểu trong lịch sử dân tộc.',question:'Địa hình và thời cơ đã được tận dụng ra sao trong chiến dịch?',img:'',art:'',phases:'',hotspots:'',inTour:true},
{id:'thanh-bai-hoc',campaign:'thanh',type:'tailieu',title:'Bài học về chiến lược và thời cơ',date:'Liên hệ lịch sử',origin:'Tư liệu người dùng cung cấp; các số liệu Tết Mậu Thân cần đối chiếu nguồn',detail:'Nghệ thuật tổ chức lực lượng, tạo bất ngờ và phối hợp nhiều mũi tiến công thường được nhắc đến khi nghiên cứu các chiến dịch lịch sử.',text:'Bài học về xây dựng chiến lược, nắm thời cơ và phối hợp lực lượng được vận dụng, phát triển trong những bối cảnh lịch sử khác nhau.\nMột liên hệ là Tổng tiến công và nổi dậy Tết Mậu Thân 1968. Tư liệu bạn cung cấp nêu đợt tiến công đồng loạt bắt đầu đêm 30 rạng sáng 31/1, diễn ra từ vĩ tuyến 17 đến Cà Mau, với mục tiêu tại 6 thành phố, 44 thị xã và hàng trăm quận lỵ. Tài liệu đó cũng nêu bối cảnh Hoa Kỳ đưa hơn 50 vạn quân vào miền Nam; cần kiểm tra mốc và cách tính quân số trước khi trích dẫn.\nĐây là cuộc chiến khác về thời đại, lực lượng và mục tiêu, không nên xem là cùng một trận đánh hay cùng điều kiện với Ngọc Hồi – Đống Đa.',script:'Lịch sử cho thấy việc chuẩn bị chiến lược, nắm thời cơ và phối hợp lực lượng luôn quan trọng. Có thể liên hệ đến Tết Mậu Thân năm 1968, nhưng cần đặt mỗi sự kiện trong hoàn cảnh riêng, không đồng nhất hai cuộc chiến.',question:'Khi rút ra bài học lịch sử, vì sao cần phân biệt bối cảnh của từng cuộc chiến và kiểm tra số liệu?',img:'',art:'',phases:'',hotspots:'',inTour:true},
{id:'thanh-tuong-quang-trung',campaign:'thanh',type:'daocu',title:'Tượng Quang Trung',date:'Mô hình minh họa',origin:'Mô phỏng hình khối, không phải hiện vật gốc',detail:'Mô hình tượng trưng cho người chỉ huy chiến dịch Ngọc Hồi – Đống Đa.',text:'',script:'',question:'Những phẩm chất nào của người chỉ huy được thể hiện qua chiến dịch?',img:'',art:'',phases:'',hotspots:'',inTour:true}
]};

const XIEM_IDS=new Set(XIEM.items.map(item=>item.id));
const CAMPAIGN_VERSION=1;
const DEFAULT={
meta:Object.assign({},XIEM.meta,{war:'Kháng chiến chống quân Xiêm và quân Thanh',subtitle:'Hai chiến thắng của Nguyễn Huệ – Quang Trung: Rạch Gầm – Xoài Mút và Ngọc Hồi – Đống Đa.',welcome:'Khám phá hai chiến dịch chống ngoại xâm của Nguyễn Huệ – Quang Trung: kháng chiến chống quân Xiêm và chiến thắng quân Thanh.',outro:'Hãy so sánh cách Nguyễn Huệ – Quang Trung lựa chọn địa hình, thời cơ và cách phối hợp lực lượng trong hai chiến dịch.'}),
settings:clone(XIEM.settings),campaignVersion:CAMPAIGN_VERSION,
items:[...XIEM.items.map(item=>Object.assign({},item,{campaign:'xiem'})),...THANH.items]
};
const THEMES=[
 {id:'xiem',name:'Kháng chiến chống quân Xiêm (1784 – 1785)',data:XIEM},
 {id:'thanh',name:'Kháng chiến chống quân Thanh (1788 – 1789)',data:THANH},
 {id:'dbp',name:'Chiến dịch Điện Biên Phủ (1954)',data:DEFAULT_DBP}
];

/* ====================== LƯU TRỮ ====================== */
let SEED=STATIC_DATA;
function norm(d){
  const base=clone(DEFAULT);
  d.meta=Object.assign({},base.meta,d.meta||{});
  d.settings=Object.assign({},base.settings,d.settings||{});
  d.resources=Array.isArray(d.resources)?d.resources:[];
  d.videos=Array.isArray(d.videos)?d.videos:[];
  d.items=(d.items||[]).map(it=>Object.assign({id:uid(),type:'tranh',title:'',date:'',origin:'',detail:'',script:'',question:'',img:'',art:'',text:'',phases:'',hotspots:'',inTour:true,gallerySlot:''},it));
  const usedSlots=new Set();
  d.items.filter(isGalleryImage).forEach(item=>{
    const assigned=GALLERY_SLOTS.find(slot=>slot.id===item.gallerySlot&&!usedSlots.has(slot.id))
      ||GALLERY_SLOTS.find(slot=>slot.wall===(item.campaign==='thanh'?'thanh':'xiem')&&!usedSlots.has(slot.id))
      ||GALLERY_SLOTS.find(slot=>!usedSlots.has(slot.id));
    item.gallerySlot=assigned?.id||'';
    if(assigned)usedSlots.add(assigned.id);
  });
  return d;
}
function load(){
  const d=clone(SEED||DEFAULT);
  if(d.campaignVersion!==CAMPAIGN_VERSION&&d.items.some(item=>XIEM_IDS.has(item.id))){
    d.items=d.items.map(item=>Object.assign({campaign:'xiem'},item));
    const existing=new Set(d.items.map(item=>item.id));
    d.items.push(...THANH.items.filter(item=>!existing.has(item.id)));
    d.meta=Object.assign({},d.meta,{war:DEFAULT.meta.war,subtitle:DEFAULT.meta.subtitle,welcome:DEFAULT.meta.welcome,outro:DEFAULT.meta.outro});
  }
  d.campaignVersion=CAMPAIGN_VERSION;
  return norm(d);
}
let S=load(), saveT=null,saveChain=Promise.resolve();
if(USER_PREFS.narration!==null)S.settings.voice=USER_PREFS.narration;
let dataDirty=false;
function markDataDirty(){
  dataDirty=true;
  const status=$('#saveStatus');if(status)status.textContent='Thay đổi chưa lưu';
}
async function writeDataFile(handle,requestPermission=false){
  let permission=await handle.queryPermission({mode:'readwrite'});
  if(permission!=='granted'&&requestPermission)permission=await handle.requestPermission({mode:'readwrite'});
  if(permission!=='granted')throw new Error('Trình duyệt chưa cấp quyền ghi file museum-data.json.');
  const serialized=JSON.stringify(S,null,2);
  const writable=await handle.createWritable();
  try{await writable.write(serialized);await writable.close()}
  catch(error){await writable.abort();throw error}
  dataDirty=false;
  const status=$('#saveStatus');if(status)status.textContent='Đã lưu vào museum-data.json';
}
function save(){
  markDataDirty();
  if(!DATA_FILE_HANDLE)return;
  clearTimeout(saveT);
  saveT=setTimeout(()=>{
    const handle=DATA_FILE_HANDLE;
    saveChain=saveChain.catch(()=>{}).then(()=>writeDataFile(handle)).catch(error=>{
      console.error('Không thể tự lưu museum-data.json.',error);
      toast(`Không tự lưu được JSON: ${error.message} Hãy bấm “Lưu ngay”.`);
    });
  },500);
}
async function saveNow(){
  clearTimeout(saveT);
  const button=$('#saveNow');if(button){button.disabled=true;button.textContent='Đang lưu…'}
  try{
    if(DATA_FILE_HANDLE){
      const handle=DATA_FILE_HANDLE;
      saveChain=saveChain.catch(()=>{}).then(()=>writeDataFile(handle,true));
      await saveChain;
      toast('Đã lưu thành công vào museum-data.json.');
    }else if(window.showSaveFilePicker){
      DATA_FILE_HANDLE=await window.showSaveFilePicker({suggestedName:'museum-data.json',types:[{description:'JSON',accept:{'application/json':['.json']}}]});
      await writeDataFile(DATA_FILE_HANDLE,true);
      toast('Đã lưu thành công vào museum-data.json. Các lần sửa sau sẽ tự lưu vào file này.');
    }else{
      download('museum-data.json',JSON.stringify(S,null,2),'application/json');
      dataDirty=false;const status=$('#saveStatus');if(status)status.textContent='Đã tải museum-data.json';
      toast('Đã tải museum-data.json. Hãy thay file cũ trong thư mục dự án bằng file vừa tải.');
    }
    return true;
  }catch(error){
    if(error.name!=='AbortError'){console.error('Không lưu được museum-data.json.',error);toast(`Lưu JSON thất bại: ${error.message}`)}
    return false;
  }
  finally{if(button){button.disabled=false;button.textContent='💾 Lưu ngay'}}
}
function queueSave(){clearTimeout(saveT);saveT=setTimeout(save,350)}

/* ====================== TIỆN ÍCH GIAO DIỆN ====================== */
let toastT;
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),4200)}
let UQ=0;
const uniq=svg=>{const n=++UQ;return svg.replace(/id="([\w-]+)"/g,'id="$1_'+n+'"').replace(/url\(#([\w-]+)\)/g,'url(#$1_'+n+')')};
const artHTML=it=>{
  if(it.img)return `<img src="${esc(assetHref(it.img))}" alt="${esc(it.title)}" draggable="false" loading="lazy" decoding="async">`;
  if(it.art&&ART[it.art])return uniq(ART[it.art]());
  return `<div class="noart">${TYPES[it.type]?TYPES[it.type].icon:'🏛'}</div>`;
};
const thumb=it=>{
  if(it.type==='tailieu'&&!it.img&&!it.art){
    const body=lines(it.text).slice(0,3).join(' ').slice(0,180);
    return `<div class="paper-thumb"><b>${esc(it.title)}</b>${esc(body)}…</div>`;
  }
  return `<div class="art">${artHTML(it)}</div>`;
};
function parseHot(s){
  return lines(s).map(l=>{const p=l.split('|').map(x=>x.trim());return{x:parseFloat(p[0]),y:parseFloat(p[1]),phase:parseInt(p[2],10)||0,name:p[3]||'',desc:p.slice(4).join(' | ')}}).filter(h=>!isNaN(h.x)&&!isNaN(h.y));
}
function applyMeta(){
  const m=S.meta;
  document.title=`${m.title} - ${m.war}`;
  $('#brandTxt').textContent=m.title;
  $('#entryEye').textContent=m.title;$('#entryTitle').textContent=m.war;$('#entrySub').textContent=m.subtitle;
  $('#hallEye').textContent=m.title;$('#hallWar').textContent=m.war;$('#hallSub').textContent=m.subtitle;
  $('#fxSel').value=S.settings.transition;
  $('#voiceBtn').textContent=S.settings.voice?'🔊 Giọng đọc: Bật':'🔇 Giọng đọc: Tắt';
}
function applySettingsLanguage(){
  const english=USER_PREFS.language==='en';
  $('#settings').lang=english?'en':'vi';
  $('#settingsTitle').textContent=english?'Settings':'Cài đặt';
  $('#settingsClose').textContent=english?'Close':'Đóng';
  $('#settingsLanguageLabel').textContent=english?'Settings language':'Ngôn ngữ';
  $('#settingsGraphicsLabel').textContent=english?'3D render resolution':'Độ phân giải đồ họa 3D';
  $('#settingsGraphicsHint').textContent=english
    ?'Anti-aliasing and shadows always stay enabled. Higher resolution may affect performance on slower devices.'
    :'Khử răng cưa và bóng đổ luôn bật. Độ phân giải cao hơn có thể ảnh hưởng tốc độ trên thiết bị yếu.';
  $('#settingsVolumeLabel').firstChild.textContent=english?'Volume ':'Âm lượng ';
  $('#settingsNarration').parentElement.lastChild.textContent=english?' Enable spoken narration':' Bật thuyết minh bằng giọng nói';
  $('#settingsLanguageHint').textContent=english
    ?'Settings and a few controls change language. Exhibit names, descriptions and narration remain in their original language.'
    :'Ngôn ngữ áp dụng cho bảng cài đặt và một số nút; tên, mô tả, thuyết minh hiện vật giữ nguyên ngôn ngữ gốc.';
  $('#settingsShortcut').textContent=english?'Press Esc to open or close settings.':'Nhấn Esc để mở hoặc đóng bảng cài đặt.';
  $('#settingsGraphics').options[0].text=english?'Balanced · up to 1.25×':'Cân bằng · tối đa 1,25×';
  $('#settingsGraphics').options[1].text=english?'High · up to 1.5×':'Cao · tối đa 1,5×';
  $('#settingsGraphics').options[2].text=english?'Ultra · up to 2×':'Siêu nét · tối đa 2×';
  $('#settingsGraphics').options[3].text=english?'Native display resolution':'Theo màn hình · độ phân giải gốc';
  $('#settingsBtn').textContent=english?'⚙ Settings':'⚙ Cài đặt';
  $('#entrySettings').textContent=english?'⚙ Settings':'⚙ Cài đặt';
  const walkButton=$('#walkSettingsBtn');
  if(walkButton)walkButton.textContent=english?'⚙ Settings':'⚙ Cài đặt';
}
function persistUserPrefs(){
  try{localStorage.setItem(USER_PREFS_KEY,JSON.stringify(USER_PREFS))}
  catch(error){console.error('Không thể lưu tùy chọn hiển thị.',error);toast('Không lưu được tùy chọn vào trình duyệt.')}
}
function applyRenderQuality(){
  if(!W.renderer)return;
  const ratio=Math.min(window.devicePixelRatio||1,GRAPHICS_PIXEL_RATIOS[USER_PREFS.graphics]);
  W.renderer.setPixelRatio(ratio);
  W.renderer.setSize(window.innerWidth,window.innerHeight,false);
}
function updateSettingsControls(){
  $('#settingsLanguage').value=USER_PREFS.language;
  $('#settingsGraphics').value=USER_PREFS.graphics;
  $('#settingsVolume').value=Math.round(USER_PREFS.volume*100);
  $('#settingsVolumeValue').textContent=`${Math.round(USER_PREFS.volume*100)}%`;
  $('#settingsNarration').checked=!!S.settings.voice;
}
let resumeBattleAfterSettings=false;
function openSettings(){
  if(!$('#editor').hidden)return;
  updateSettingsControls();
  applySettingsLanguage();
  $('#settings').hidden=false;
  if(W.active){
    W.keys={};W.velocity.x=0;W.velocity.z=0;
    if(document.pointerLockElement===$('#walkCanvas'))document.exitPointerLock?.();
    resumeBattleAfterSettings=W.battleRunning&&!W.battlePaused;
    if(resumeBattleAfterSettings)walkToggleBattlePause();
  }
  $('#settingsClose').focus();
}
function closeSettings(){
  $('#settings').hidden=true;
  if(resumeBattleAfterSettings&&W.active&&W.battleRunning&&W.battlePaused)walkToggleBattlePause();
  resumeBattleAfterSettings=false;
}
$('#settingsBtn').onclick=openSettings;
$('#entrySettings').onclick=openSettings;
$('#settingsClose').onclick=closeSettings;
$('#settings').addEventListener('click',event=>{if(event.target.closest('[data-settings-close]'))closeSettings()});
$('#settingsLanguage').addEventListener('change',event=>{
  USER_PREFS.language=event.target.value==='en'?'en':'vi';
  persistUserPrefs();applySettingsLanguage();
});
$('#settingsGraphics').addEventListener('change',event=>{
  USER_PREFS.graphics=Object.hasOwn(GRAPHICS_PIXEL_RATIOS,event.target.value)?event.target.value:'balanced';
  persistUserPrefs();applyRenderQuality();
});
$('#settingsVolume').addEventListener('input',event=>{
  USER_PREFS.volume=Math.min(1,Math.max(0,Number(event.target.value)/100));
  $('#settingsVolumeValue').textContent=`${Math.round(USER_PREFS.volume*100)}%`;
  document.querySelectorAll('video').forEach(video=>{if(!video.muted)video.volume=USER_PREFS.volume});
});
$('#settingsVolume').addEventListener('change',persistUserPrefs);
$('#settingsNarration').addEventListener('change',event=>{
  S.settings.voice=event.target.checked;USER_PREFS.narration=S.settings.voice;persistUserPrefs();save();applyMeta();
  if(!S.settings.voice)stopNarration();
});

/* ====================== CHUYỂN CẢNH ====================== */
async function transition(cb,origin){
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let type=S.settings.transition||'curtain';
  if(type==='random')type=['curtain','iris','fade','wipe'][Math.floor(Math.random()*4)];
  if(reduce)type='fade';
  const fx=$('#fx');fx.hidden=false;
  const D=reduce?200:720, ease='cubic-bezier(.76,0,.24,1)';
  const anim=(el,kf,d=D)=>el.animate(kf,{duration:d,easing:ease,fill:'forwards'}).finished;
  if(type==='curtain'){
    fx.innerHTML='<div class="curtain l"></div><div class="curtain r"></div>';
    const [l,r]=fx.children;
    await Promise.all([anim(l,[{transform:'translateX(-101%)'},{transform:'translateX(0)'}]),anim(r,[{transform:'translateX(101%)'},{transform:'translateX(0)'}])]);
    await cb();await sleep(160);
    await Promise.all([anim(l,[{transform:'translateX(0)'},{transform:'translateX(-101%)'}]),anim(r,[{transform:'translateX(0)'},{transform:'translateX(101%)'}])]);
  }else if(type==='iris'){
    fx.innerHTML='<div class="iris"></div>';const el=fx.firstChild;
    const ox=origin&&origin.x!=null?origin.x:innerWidth/2, oy=origin&&origin.y!=null?origin.y:innerHeight/2, R=Math.hypot(innerWidth,innerHeight);
    await anim(el,[{clipPath:`circle(0px at ${ox}px ${oy}px)`},{clipPath:`circle(${R}px at ${ox}px ${oy}px)`}],D*1.1);
    await cb();await sleep(120);
    await anim(el,[{opacity:1},{opacity:0}],D*.8);
  }else if(type==='wipe'){
    fx.innerHTML='<div class="wipe"></div>';const el=fx.firstChild;
    await anim(el,[{transform:'translateX(-101%)'},{transform:'translateX(0)'}]);
    await cb();await sleep(120);
    await anim(el,[{transform:'translateX(0)'},{transform:'translateX(101%)'}]);
  }else{
    fx.innerHTML='<div class="fadeb"></div>';const el=fx.firstChild;
    await anim(el,[{opacity:0},{opacity:1}],D*.7);
    await cb();await sleep(100);
    await anim(el,[{opacity:1},{opacity:0}],D*.8);
  }
  fx.hidden=true;fx.innerHTML='';
}

/* ====================== ĐIỀU HƯỚNG ====================== */
let cur={view:'entry',id:null}, busy=false, hallFilter='all';
function setView(view,id){
  filmStop();
  cur={view,id:id||null};
  document.body.dataset.view=view;
  $$('.view').forEach(v=>v.classList.toggle('active',v.id===view));
  if(view==='hall')renderHall();
  if(view==='room'){const it=S.items.find(i=>i.id===id);if(it)renderRoom(it);else{setView('hall');return}}
  $('#'+cur.view).scrollTop=0;
}
async function nav(view,id,origin){
  if(busy)return false;
  busy=true;
  try{await transition(()=>setView(view,id),origin)}finally{busy=false}
  return true;
}
function userNav(view,id,origin){
  if(busy)return;
  if(T.on)endTour();else stopNarration();
  return nav(view,id,origin);
}
function stepRoom(d){
  if(T.on){tourGo(T.idx+d);return}
  const i=S.items.findIndex(x=>x.id===cur.id);if(i<0||!S.items.length)return;
  userNav('room',S.items[(i+d+S.items.length)%S.items.length].id);
}

/* ====================== SẢNH CHÍNH ====================== */
const exhibitHTML=it=>`<button class="exhibit t-${it.type}" data-id="${esc(it.id)}" aria-label="Xem ${esc(it.title)}"><div class="piece">${thumb(it)}</div><div class="plaque"><b>${esc(it.title)}</b>${it.date?`<span>${esc(it.date)}</span>`:''}</div></button>`;
function renderHall(){
  const present=ORDER.filter(t=>S.items.some(i=>i.type===t));
  if(hallFilter!=='all'&&!present.includes(hallFilter))hallFilter='all';
  $('#chips').innerHTML=present.length>1?`<button class="chip ${hallFilter==='all'?'on':''}" data-f="all">Tất cả (${S.items.length})</button>`+present.map(t=>`<button class="chip ${hallFilter===t?'on':''}" data-f="${t}">${TYPES[t].icon} ${TYPES[t].label}</button>`).join(''):'';
  const html=ORDER.filter(t=>hallFilter==='all'||hallFilter===t).map(t=>{
    const arr=S.items.filter(i=>i.type===t);if(!arr.length)return'';
    return `<section class="wing"><h2><span>${TYPES[t].icon}</span>${TYPES[t].wing}</h2><div class="row">${arr.map(exhibitHTML).join('')}</div></section>`;
  }).join('');
  $('#hallBody').innerHTML=html||'<p class="empty">Bảo tàng chưa có hiện vật nào. Bấm "Quản lý" để thêm tranh, sa hình, đạo cụ, ảnh hoặc tư liệu.</p>';
}

/* ====================== PHÒNG TRƯNG BÀY ====================== */
function stageHTML(it){
  switch(it.type){
    case 'tranh':return `<div class="bigframe" id="zoomable" title="Nhấn để phóng to"><div class="art">${artHTML(it)}</div></div><p class="hint">Nhấn vào tranh để phóng to</p>`;
    case 'dohoa':return `<div class="dgframe" id="zoomable" title="Nhấn để phóng to"><div class="art">${artHTML(it)}</div></div><p class="hint">Nhấn vào đồ họa để phóng to</p>`;
    case 'anh':return `<figure class="photo" id="photo"><div class="art">${artHTML(it)}</div><figcaption>${esc(it.title)}</figcaption></figure><button class="chip" id="toneBtn">Xem ảnh màu gốc</button>`;
    case 'tailieu':{
      let body=lines(it.text);if(!body.length&&!it.img)body=lines(it.detail);
      const files=(S.resources||[]).map((file,index)=>`<div class="resource-file"><span class="resource-file-type">📄</span><span class="resource-file-name">${esc(file.name)}<small>${esc(file.type||'Tài liệu')}</small></span><button type="button" class="btn resource-download-btn" data-resource-index="${index}">⬇ Tải xuống</button></div>`).join('');
      return `<article class="paper"><span class="stamp">Tư liệu</span><h3>${esc(it.title)}</h3>${it.img?`<div class="art">${artHTML(it)}</div>`:''}${body.map((p,i)=>`<p style="animation-delay:${(.3+i*.4).toFixed(2)}s">${esc(p)}</p>`).join('')}<section class="resource-wall"><strong>TÀI LIỆU CÓ THỂ TẢI</strong><div id="resource-file-list" class="resource-file-list">${files||'<p class="resource-empty">Chưa có tài liệu trong kho.</p>'}</div></section></article>`;
    }
    case 'daocu':return `<div class="obj" id="obj"><div class="art">${artHTML(it)}</div></div><p class="hint">Di chuyển chuột (hoặc chạm) trên màn hình để xoay nhẹ hiện vật</p>`;
    case 'phim':return `<div class="film"><div class="screen" id="screen"></div><div class="filmbar"><button class="btn primary" id="fPlay">▶ Phát phim</button><input type="range" id="fSeek" min="0" max="${FILM_N*1000-1}" value="0" aria-label="Tua phim"><span class="small" id="fTime"></span></div><div class="scenecap" id="sceneCap"></div></div>`;
    case 'sahinh':{
      const ph=lines(it.phases),hs=parseHot(it.hotspots);
      return `<div class="mapwrap">${ph.length?`<div class="phases"><button class="chip on" data-ph="0">Toàn cảnh</button>${ph.map((p,i)=>`<button class="chip" data-ph="${i+1}">${esc(p)}</button>`).join('')}</div>`:''}<div class="mapbox"><div class="art">${artHTML(it)}</div>${hs.map((h,i)=>`<button class="hs" data-i="${i}" data-ph="${h.phase}" style="left:${h.x}%;top:${h.y}%" aria-label="${esc(h.name)}">${i+1}</button>`).join('')}</div><div class="note" id="note">${NOTE_HINT}</div></div>`;
    }
  }
  return '';
}
const NOTE_HINT='<p class="small">Bấm vào một điểm đánh số trên sa hình để xem chi tiết.</p>';
function renderRoom(it){
  filmStop();
  const r=$('#room');r.dataset.type=it.type;
  const det=lines(it.detail).map(p=>`<p>${esc(p)}</p>`).join('');
  r.innerHTML=`<div class="room-grid"><div class="stage" id="stage">${stageHTML(it)}</div>
  <aside class="info"><span class="badge">${TYPES[it.type].icon} ${TYPES[it.type].label}</span><h2>${esc(it.title)}</h2>
  <p class="meta">${esc([it.date,it.origin].filter(Boolean).join(' - '))}</p><div class="detail">${det}</div>
  ${it.question?`<div class="think"><b>Câu hỏi suy ngẫm</b><p>${esc(it.question)}</p></div>`:''}
  <div class="actions"><button class="btn primary" id="speakBtn">🔊 Nghe thuyết minh</button><button class="btn" id="prevBtn">‹ Hiện vật trước</button><button class="btn" id="nextBtn">Hiện vật sau ›</button><button class="btn" id="backBtn">Về sảnh chính</button></div></aside></div>`;
  if(it.type==='tailieu') bindResourceDownloads(r);
  if(it.type==='phim'){F.t=0;F.shown=-1;F.mode='idle';filmDraw()}
  updateSpeakBtn(false);
}
function bindResourceDownloads(room){
  const list=room.querySelector('#resource-file-list');
  if(!list)return;
  list.addEventListener('click',e=>{
    const btn=e.target.closest('[data-resource-index]');if(!btn)return;
    downloadSavedResource((S.resources||[])[Number(btn.dataset.resourceIndex)]);
  });
}
function setPhase(p){
  $$('.phases .chip').forEach(c=>c.classList.toggle('on',+c.dataset.ph===p));
  $$('.hs').forEach(b=>{const bp=+b.dataset.ph;b.classList.toggle('dim',p!==0&&bp!==0&&bp!==p)});
}
function activateHot(i){
  const it=S.items.find(x=>x.id===cur.id);if(!it)return;
  const h=parseHot(it.hotspots)[i],note=$('#note');if(!note)return;
  $$('.hs').forEach(b=>b.classList.toggle('on',+b.dataset.i===i));
  if(!h){note.innerHTML=NOTE_HINT;return}
  if(h.phase)setPhase(h.phase);
  note.innerHTML=`<b>${i+1}. ${esc(h.name)}</b><p>${esc(h.desc)}</p>`;
}
function openLightbox(it){
  const lb=$('#lightbox');lb.innerHTML=`<div class="lb-art">${artHTML(it)}</div>`;lb.hidden=false;
}

/* ====================== THUYẾT MINH TỰ ĐỘNG ====================== */
const T={on:false,paused:false,idx:-1,list:[],run:0,timer:null,t0:0,target:240,remChars:0,remLines:0,remItems:0,cps1:13};
const N={tok:0,t:null,speaking:false,warned:false};
const F={active:false,raf:0,t:0,si:0,s0:0,dur:1,mode:'idle',last:0,shown:-1};
const strip=s=>String(s).replace(/^\[\d+\]\s*/,'');
const narrLines=it=>{let ls=lines(it.script);if(!ls.length)ls=lines(it.detail).slice(0,2);return ls};
const hasSpeech=()=>'speechSynthesis' in window;
function showCaption(t){
  const c=$('#caption');$('#capText').textContent=t;c.classList.add('show');document.body.classList.add('cap-on');
  requestAnimationFrame(()=>document.documentElement.style.setProperty('--cap-h',c.offsetHeight+'px'));
}
function hideCaption(){
  $('#caption').classList.remove('show');document.body.classList.remove('cap-on');
  document.documentElement.style.setProperty('--cap-h','0px');
}
function viVoices(){try{return speechSynthesis.getVoices().filter(v=>/^vi/i.test(v.lang))}catch(e){return[]}}
function pickVoice(){
  const vs=viVoices();if(!vs.length)return null;
  if(S.settings.voiceName){const m=vs.find(v=>v.name===S.settings.voiceName);if(m)return m}
  const male=/nam\s?minh|\bmale\b|\bnam\b/i,fem=/hoai\s?my|hoài\s?my|linh|female|nữ|\bmai\b|\blan\b/i;
  return vs.find(v=>fem.test(v.name)&&!male.test(v.name))||vs.find(v=>!male.test(v.name))||vs[0];
}
function canVoice(){
  if(!S.settings.voice||!hasSpeech())return false;
  const all=speechSynthesis.getVoices();
  return all.length===0||viVoices().length>0;
}
function curRate(){
  if(!T.on||!T.target)return +S.settings.rate||1;
  const el=(performance.now()-T.t0)/1000;
  const rem=T.target-el-T.remItems*3.2-2-T.remLines*.45;
  const need=T.remChars/Math.max(25,rem)/T.cps1;
  return Math.min(1.45,Math.max(.85,need));
}
function updateSpeakBtn(on){
  N.speaking=on;
  const film=($('#room').dataset.type==='phim');
  const lab=film?(on?'⏹ Dừng phim':'▶ Phát phim'):(on?'⏹ Dừng thuyết minh':'🔊 Nghe thuyết minh');
  const b=$('#speakBtn'),f=$('#fPlay');
  if(b){b.hidden=T.on||film;b.textContent=lab}
  if(f){f.hidden=T.on;f.textContent=lab}
}
function stopNarration(keepCap){
  N.tok++;clearTimeout(N.t);clearTimeout(T.timer);
  try{if(hasSpeech())speechSynthesis.cancel()}catch(e){}
  if(!keepCap)hideCaption();
  updateSpeakBtn(false);
}
function narrate(ls,{onLine,onDone}={}){
  stopNarration(true);
  const my=N.tok;let i=0;updateSpeakBtn(true);
  if(S.settings.voice&&hasSpeech()&&!N.warned){
    const all=speechSynthesis.getVoices();
    if(all.length&&!all.some(v=>/^vi/i.test(v.lang))){N.warned=true;toast('Máy chưa có giọng tiếng Việt nên phần thuyết minh chỉ hiện phụ đề. Hãy dùng trình duyệt Microsoft Edge (giọng Hoài My) hoặc cài giọng vi-VN trong hệ điều hành.')}
  }
  const step=()=>{
    if(my!==N.tok)return;
    if(i>=ls.length){
      updateSpeakBtn(false);
      if(!T.on)setTimeout(()=>{if(N.tok===my)hideCaption()},2200);
      if(onDone)onDone();
      return;
    }
    const raw=ls[i],text=strip(raw),rate=curRate();
    const est=Math.max(1800,text.length/(T.cps1*rate)*1000);
    if(T.on){T.remChars=Math.max(0,T.remChars-text.length);T.remLines=Math.max(0,T.remLines-1)}
    const idx=i;i++;
    if(onLine)onLine(idx,raw,est);
    showCaption(text);
    let fired=false;
    const adv=d=>{if(fired||my!==N.tok)return;fired=true;clearTimeout(N.t);N.t=setTimeout(step,d)};
    if(canVoice()){
      try{
        const u=new SpeechSynthesisUtterance(text);u.lang='vi-VN';u.rate=rate;
        u.volume=USER_PREFS.volume;
        const v=pickVoice();if(v){u.voice=v;u.lang=v.lang}else u.pitch=1.1;
        const t0=performance.now();
        u.onend=()=>{const dt=(performance.now()-t0)/1000;if(dt>1.2)T.cps1=.6*T.cps1+.4*Math.min(30,Math.max(6,text.length/dt*rate));adv(450)};
        u.onerror=()=>adv(est);
        speechSynthesis.speak(u);
        clearTimeout(N.t);N.t=setTimeout(()=>adv(0),est*2.2+6000);
      }catch(e){adv(est)}
    }else adv(est);
  };
  step();
}
function narrateItem(it,onDone,from){
  from=from||0;
  const ls=narrLines(it).slice(from);
  const film=it.type==='phim';
  if(!ls.length){N.t=setTimeout(()=>onDone&&onDone(),2500);return}
  narrate(ls,{
    onLine:(i,raw,ms)=>{const m=raw.match(/^\[(\d+)\]/);if(m)activateHot(+m[1]-1);if(film)filmScene(from+i,ms)},
    onDone:()=>{if(film)filmEnd();if(onDone)onDone()}
  });
}
function togglePlay(it){
  if(N.speaking){stopNarration();if(it.type==='phim')filmStop();return}
  if(it.type==='phim'){const from=F.t>=FILM_N-.02?0:Math.floor(F.t);narrateItem(it,()=>{},from)}
  else narrateItem(it,()=>{});
}

/* ---------- Phim sa hình ---------- */
function updateSceneCap(){
  const sc=Math.min(FILM_N-1,Math.floor(F.t)),el=$('#sceneCap');if(!el)return;
  if(F.shown!==sc){F.shown=sc;const s=FILM_SCENES[sc];el.innerHTML=`<b>Cảnh ${sc+1}/${FILM_N}: ${esc(s.t)}</b><p>${esc(s.n)}</p>`}
  const tm=$('#fTime');if(tm)tm.textContent=`Cảnh ${sc+1}/${FILM_N}`;
}
function filmDraw(){
  const sc=$('#screen');if(!sc)return;
  sc.innerHTML=uniq(filmFrame(F.t));
  const sk=$('#fSeek');if(sk&&document.activeElement!==sk)sk.value=Math.round(F.t*1000);
  updateSceneCap();
}
function filmLoop(ts){
  if(!F.active)return;
  F.raf=requestAnimationFrame(filmLoop);
  if(ts-F.last<30)return;F.last=ts;
  if(F.mode==='play'){const p=Math.min(.995,(performance.now()-F.s0)/F.dur);F.t=F.si+p}
  filmDraw();
}
function filmStart(){F.active=true;cancelAnimationFrame(F.raf);F.raf=requestAnimationFrame(filmLoop)}
function filmStop(){F.active=false;cancelAnimationFrame(F.raf);F.mode='idle'}
function filmScene(i,ms){F.si=i;F.s0=performance.now();F.dur=ms;F.mode='play';if(!F.active)filmStart()}
function filmEnd(){F.mode='idle';F.t=FILM_N;filmDraw();filmStop()}

/* ====================== THAM QUAN TỰ ĐỘNG ====================== */
function tourTotals(from){
  let c=0,l=0;const add=a=>a.forEach(x=>{c+=strip(x).length;l++});
  if(from<0)add(lines(S.meta.welcome));
  T.list.slice(Math.max(0,from)).forEach(id=>{const it=S.items.find(i=>i.id===id);if(it)add(narrLines(it))});
  add(lines(S.meta.outro));T.remChars=c;T.remLines=l;
}
function setTourUI(){
  $('#tourIdle').hidden=T.on;$('#tourRun').hidden=!T.on;
  $('#tPause').textContent=T.paused?'▶ Tiếp tục':'⏸ Tạm dừng';
  $('#tProg').textContent=T.on&&T.idx>=0&&T.idx<T.list.length?`Hiện vật ${T.idx+1}/${T.list.length}`:'';
  updateSpeakBtn(N.speaking);
}
function endTour(){T.on=false;T.paused=false;T.run++;stopNarration();setTourUI()}
async function startTour(){
  if(T.on||busy)return;
  T.list=S.items.filter(i=>i.inTour!==false).map(i=>i.id);
  if(!T.list.length){toast('Chưa có hiện vật nào trong lộ trình tham quan. Hãy vào Quản lý để thêm hoặc đánh dấu hiện vật.');return}
  stopNarration();
  T.on=true;T.paused=false;T.idx=-1;T.cps1=13;
  T.target=Math.max(60,(+S.settings.tourMinutes||4)*60);T.t0=performance.now();
  tourTotals(-1);T.remItems=T.list.length;
  const my=++T.run;setTourUI();
  if(cur.view!=='hall'){const ok=await nav('hall');if(!ok){endTour();return}}
  if(!T.on||my!==T.run)return;
  const w=lines(S.meta.welcome);
  if(w.length)narrate(w,{onDone:()=>{if(T.on&&my===T.run&&!T.paused)T.timer=setTimeout(()=>tourGo(0),900)}});
  else tourGo(0);
}
async function tourGo(idx,resume){
  if(!T.on||busy)return;
  if(idx<0)idx=0;
  if(idx>=T.list.length){finishTour();return}
  stopNarration(true);T.paused=false;
  const my=++T.run;T.idx=idx;tourTotals(idx);T.remItems=T.list.length-idx;setTourUI();
  const it=S.items.find(i=>i.id===T.list[idx]);
  if(!it){tourGo(idx+1);return}
  if(!resume||cur.view!=='room'||cur.id!==it.id){const ok=await nav('room',it.id);if(!ok||!T.on||my!==T.run)return}
  T.remItems=T.list.length-idx-1;
  narrateItem(it,()=>{if(T.on&&my===T.run&&!T.paused)T.timer=setTimeout(()=>tourGo(idx+1),1000)});
}
async function finishTour(){
  const my=++T.run;stopNarration(true);T.idx=T.list.length;setTourUI();
  const o=lines(S.meta.outro);T.remChars=o.reduce((a,x)=>a+x.length,0);T.remLines=o.length;T.remItems=0;
  const ok=await nav('hall');if(!ok||!T.on||my!==T.run)return;
  if(o.length)narrate(o,{onDone:()=>{if(T.on&&my===T.run)setTimeout(()=>{if(T.on&&my===T.run)endTour()},2000)}});
  else{toast('Kết thúc buổi tham quan.');endTour()}
}
function tourPause(){
  if(!T.on)return;
  if(T.paused){T.paused=false;setTourUI();if(T.idx<0)tourGo(0);else tourGo(T.idx,true)}
  else{T.paused=true;T.run++;stopNarration();setTourUI()}
}

/* ====================== SỰ KIỆN CHÍNH ====================== */
$('#enterBtn').onclick=e=>userNav('hall',null,{x:e.clientX,y:e.clientY});
$('#entryTour').onclick=startTour;
$('#entryEd').onclick=openEditor;
$('#edBtn').onclick=openEditor;
$('#tourStart').onclick=startTour;
$('#tPause').onclick=tourPause;
$('#tNext').onclick=()=>tourGo(T.idx+1);
$('#tPrev').onclick=()=>tourGo(Math.max(0,T.idx-1));
$('#tStop').onclick=()=>{endTour();toast('Đã dừng tham quan tự động.')};
$('#brand').onclick=e=>{if(cur.view!=='hall')userNav('hall',null,{x:e.clientX,y:e.clientY})};
$('#fxSel').innerHTML=FX.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
$('#fxSel').onchange=e=>{S.settings.transition=e.target.value;save()};
$('#voiceBtn').onclick=()=>{
  S.settings.voice=!S.settings.voice;USER_PREFS.narration=S.settings.voice;persistUserPrefs();save();applyMeta();
  if(S.settings.voice){
    if(!('speechSynthesis' in window))toast('Trình duyệt này không hỗ trợ đọc giọng nói. Phần thuyết minh vẫn hiện dạng phụ đề.');
    else setTimeout(()=>{const vs=speechSynthesis.getVoices();if(vs.length&&!vs.some(v=>/^vi/i.test(v.lang)))toast('Máy chưa có giọng tiếng Việt. Hãy cài giọng vi-VN trong hệ điều hành hoặc tắt giọng đọc (chỉ dùng phụ đề).')},400);
  }else try{speechSynthesis.cancel()}catch(e){}
};
$('#chips').onclick=e=>{const b=e.target.closest('[data-f]');if(!b)return;hallFilter=b.dataset.f;renderHall()};
$('#hallBody').onclick=e=>{const b=e.target.closest('.exhibit');if(b)userNav('room',b.dataset.id,{x:e.clientX,y:e.clientY})};
$('#room').addEventListener('click',e=>{
  const it=S.items.find(x=>x.id===cur.id);if(!it)return;
  if(e.target.closest('#zoomable'))openLightbox(it);
  else if(e.target.closest('#toneBtn')){const p=$('#photo');p.classList.toggle('color');e.target.textContent=p.classList.contains('color')?'Xem ảnh tông cổ điển':'Xem ảnh màu gốc'}
  else if(e.target.closest('.hs'))activateHot(+e.target.closest('.hs').dataset.i);
  else if(e.target.closest('[data-ph]'))setPhase(+e.target.closest('[data-ph]').dataset.ph);
  else if(e.target.closest('#speakBtn')||e.target.closest('#fPlay'))togglePlay(it);
  else if(e.target.closest('#prevBtn'))stepRoom(-1);
  else if(e.target.closest('#nextBtn'))stepRoom(1);
  else if(e.target.closest('#backBtn'))userNav('hall',null,{x:e.clientX,y:e.clientY});
});
$('#room').addEventListener('input',e=>{
  if(e.target.id==='fSeek'){stopNarration();filmStop();F.mode='idle';F.t=e.target.value/1000;filmDraw()}
});
$('#room').addEventListener('pointermove',e=>{
  const o=$('#obj');if(!o)return;
  const b=$('#stage').getBoundingClientRect();
  o.style.setProperty('--ry',(((e.clientX-b.left)/b.width-.5)*34).toFixed(1)+'deg');
  o.style.setProperty('--rx',((.5-(e.clientY-b.top)/b.height)*16).toFixed(1)+'deg');
});
$('#lightbox').onclick=()=>{$('#lightbox').hidden=true};
document.addEventListener('keydown',e=>{
  if(!$('#editor').hidden){if(e.key==='Escape')closeEditor();return}
  if(!$('#lightbox').hidden){if(e.key==='Escape')$('#lightbox').hidden=true;return}
  if(e.key==='Escape'){
    if(!$('#settings').hidden){closeSettings();e.stopImmediatePropagation();return}
    if(W.active&&!$('#walkImageZoom').hidden){walkCloseGalleryImage();e.stopImmediatePropagation();return}
    if(W.active&&!$('#walkDetail').hidden){walkCloseDetail();e.stopImmediatePropagation();return}
    openSettings();
    e.stopImmediatePropagation();
    return;
  }
  if(cur.view==='room'){
    if(e.key==='ArrowRight')stepRoom(1);
    else if(e.key==='ArrowLeft')stepRoom(-1);
  }
});

/* ====================== TRÌNH QUẢN LÝ ====================== */
const ed={tab:'items',id:null};
function openEditor(){
  if(T.on&&!T.paused)tourPause();
  ed.tab='items';ed.id=S.items[0]?S.items[0].id:null;
  $('#editor').hidden=false;renderEd();
}
function closeEditor(){
  save();$('#editor').hidden=true;applyMeta();
  if(cur.view==='hall')renderHall();
  else if(cur.view==='room'){const it=S.items.find(i=>i.id===cur.id);if(it)renderRoom(it);else setView('hall')}
}
$('#edClose').onclick=closeEditor;
$('#saveNow').onclick=saveNow;
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();saveNow();}});
$$('.tabs button').forEach(b=>b.onclick=()=>{ed.tab=b.dataset.tab;renderEd()});

function renderEd(){
  $$('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===ed.tab));
  const b=$('#edBody'),old=$('.ed-form',b),st=old?old.scrollTop:0;
  b.innerHTML=ed.tab==='items'?edItems():ed.tab==='museum'?edMuseum():ed.tab==='resources'?edResources():edData();
  const f=$('.ed-form',b);if(f)f.scrollTop=st;
}
function edItems(){
  const it=S.items.find(i=>i.id===ed.id);
  const list=S.items.map(x=>`<li class="${x.id===ed.id?'on':''}" data-id="${esc(x.id)}"><span>${TYPES[x.type].icon}</span><span class="nm">${esc(x.title||'(chưa đặt tên)')}</span><span class="ctl"><button data-act="up" title="Lên trên">↑</button><button data-act="down" title="Xuống dưới">↓</button><button data-act="del" title="Xoá">🗑</button></span></li>`).join('');
  const galleryItems=S.items.filter(isGalleryImage),hungCount=galleryItems.filter(item=>GALLERY_SLOTS.some(slot=>slot.id===item.gallerySlot)).length,unhungCount=galleryItems.length-hungCount;
  const galleryStatus=`Ảnh đang treo: ${hungCount}/${MAX_GALLERY_IMAGES}${unhungCount?` · ${unhungCount} ảnh chưa treo`:''}. Tối đa ${MAX_GALLERY_IMAGES} vị trí treo.`;
  return `<div class="ed-split"><div class="ed-list"><button class="btn primary" id="addItem">+ Thêm hiện vật</button><p class="small" style="margin-top:10px">${galleryStatus}</p><p class="small">Thứ tự trong danh sách cũng là thứ tự khi tham quan tự động. Mọi chỉnh sửa được lưu ngay.</p><ul>${list||'<li class="small">Chưa có hiện vật.</li>'}</ul></div><div class="ed-form" id="edForm">${it?formHTML(it):'<p class="small">Chọn một hiện vật bên trái để sửa, hoặc bấm "Thêm hiện vật".</p>'}</div></div>`;
}
function formHTML(it){
  const isMap=it.type==='sahinh',isDoc=it.type==='tailieu',isGallery=isGalleryImage(it),hs=parseHot(it.hotspots);
  const galleryItems=S.items.filter(isGalleryImage),hungCount=galleryItems.filter(item=>GALLERY_SLOTS.some(slot=>slot.id===item.gallerySlot)).length;
  const takenSlots=new Set(S.items.filter(item=>item.id!==it.id&&isGalleryImage(item)).map(item=>item.gallerySlot).filter(Boolean));
  const galleryPosition=isGallery?`<div class="fld"><label>Vị trí treo trong phòng hình ảnh (${hungCount}/${MAX_GALLERY_IMAGES} vị trí đang dùng)</label><select data-k="gallerySlot"><option value="" ${it.gallerySlot?'':'selected'}>Chọn vị trí treo ảnh</option>${GALLERY_SLOTS.map(slot=>`<option value="${slot.id}" ${it.gallerySlot===slot.id?'selected':''} ${takenSlots.has(slot.id)?'disabled':''}>${esc(slot.label)}${takenSlots.has(slot.id)?' · đã có ảnh':''}</option>`).join('')}</select><p class="small">Mỗi vị trí chỉ treo một ảnh. Có tối đa ${MAX_GALLERY_IMAGES} vị trí, chia đều trên hai tường đối diện.${!it.gallerySlot?' Ảnh này chưa được treo; chọn một vị trí còn trống.':''}</p></div>`:'';
  const prev=isMap
    ?`<div class="hotpick" id="hotpick"><div class="art">${artHTML(it)}</div>${hs.map((h,i)=>`<span class="dot" style="left:${h.x}%;top:${h.y}%">${i+1}</span>`).join('')}</div><p class="small">Nhấn vào sa hình để thêm một điểm chú thích tại vị trí đó.</p>`
    :`<div class="imgprev">${thumb(it)}</div>`;
  return `
  <div class="row2">
    <div class="fld"><label>Loại hiện vật</label><select data-k="type">${ORDER.filter(t=>t!=='phim'||it.type==='phim').map(t=>`<option value="${t}" ${it.type===t?'selected':''}>${TYPES[t].icon} ${TYPES[t].label}</option>`).join('')}</select></div>
    <div class="fld"><label>Tên hiện vật</label><input type="text" data-k="title" value="${esc(it.title)}"></div>
  </div>
  <div class="row2">
    <div class="fld"><label>Niên đại hoặc thời gian</label><input type="text" data-k="date" value="${esc(it.date)}"></div>
    <div class="fld"><label>Xuất xứ hoặc nguồn tư liệu</label><input type="text" data-k="origin" value="${esc(it.origin)}"></div>
  </div>
  ${it.type==='phim'?'<div class="help">Phim sa hình dựng sẵn. Bạn có thể sửa tên, mô tả và kịch bản: mỗi dòng kịch bản ứng với một cảnh (6 cảnh).</div>':''}<div class="fld" ${it.type==='phim'?'hidden':''}><label>Hình ảnh của hiện vật</label>
    <div class="imgrow"><div>${prev}</div>
      <div><label for="imgPath">Tên file ảnh trong thư mục dự án</label><input type="text" id="imgPath" value="${esc(/^data:/i.test(it.img||'')?'':it.img)}" placeholder="images/ten-anh.jpg"><p class="small" style="margin:8px 0">Chép ảnh vào thư mục images rồi nhập đường dẫn tương đối, ví dụ images/rach-gam.jpg. Không tải ảnh lên trình duyệt.</p>${it.img?'<button class="btn sm danger" id="imgDel">Bỏ ảnh khỏi hiện vật</button>':''}</div>
    </div></div>
  ${galleryPosition}
  ${isDoc?`<div class="fld"><label>Nội dung tư liệu (mỗi dòng là một đoạn, hiện trên tờ giấy tư liệu)</label><textarea data-k="text" style="min-height:140px">${esc(it.text)}</textarea></div>`:''}
  <div class="fld"><label>Mô tả chi tiết (hiện ở khung thông tin bên phải, mỗi dòng là một đoạn)</label><textarea data-k="detail">${esc(it.detail)}</textarea></div>
  <div class="fld"><label>Kịch bản thuyết minh (mỗi dòng là một đoạn, hiện thành phụ đề và đọc to khi tham quan tự động)</label><textarea data-k="script" style="min-height:130px">${esc(it.script)}</textarea></div>
  <div class="fld"><label>Câu hỏi suy ngẫm cho học sinh (có thể để trống)</label><textarea data-k="question" style="min-height:60px">${esc(it.question)}</textarea></div>
  ${isMap?`<div class="fld"><label>Các đợt hoặc giai đoạn (mỗi dòng là một nút lọc trên sa hình, có thể để trống)</label><textarea data-k="phases" style="min-height:70px">${esc(it.phases)}</textarea></div>
  <div class="fld"><label>Điểm chú thích (mỗi dòng: x | y | số đợt | tên | mô tả)</label><textarea data-k="hotspots" style="min-height:150px">${esc(it.hotspots)}</textarea></div>
  <div class="help">x và y là vị trí theo phần trăm (0 đến 100). Cách nhanh nhất là nhấn trực tiếp lên sa hình ở trên để thêm dòng mới. Trong kịch bản thuyết minh, dòng bắt đầu bằng <b>[2]</b> sẽ làm nổi bật điểm chú thích số 2 khi dòng đó được đọc.</div>`:''}
  <div class="fld"><label><input type="checkbox" data-k="inTour" ${it.inTour!==false?'checked':''}> Đưa hiện vật này vào lộ trình tham quan tự động</label></div>`;
}
function viVoiceOptions(){
  const vs=viVoices();
  return `<option value="">Tự chọn giọng nữ tiếng Việt (khuyến nghị)</option>`+vs.map(v=>`<option value="${esc(v.name)}" ${S.settings.voiceName===v.name?'selected':''}>${esc(v.name)} (${esc(v.lang)})</option>`).join('');
}
function edMuseum(){
  const m=S.meta,s=S.settings,nv=viVoices().length;
  return `<div class="ed-pane" style="max-width:780px">
  <div class="fld"><label>Tên bảo tàng</label><input type="text" data-m="title" value="${esc(m.title)}"></div>
  <div class="fld"><label>Cuộc chiến tranh hoặc chủ đề (hiện làm tiêu đề lớn)</label><input type="text" data-m="war" value="${esc(m.war)}"></div>
  <div class="fld"><label>Dòng giới thiệu ngắn</label><input type="text" data-m="subtitle" value="${esc(m.subtitle)}"></div>
  <div class="fld"><label>Lời chào đầu buổi tham quan tự động (mỗi dòng là một đoạn)</label><textarea data-m="welcome">${esc(m.welcome)}</textarea></div>
  <div class="fld"><label>Lời kết cuối buổi tham quan (mỗi dòng là một đoạn)</label><textarea data-m="outro">${esc(m.outro)}</textarea></div>
  <div class="row2">
    <div class="fld"><label>Hiệu ứng chuyển cảnh</label><select data-s="transition">${FX.map(([v,l])=>`<option value="${v}" ${s.transition===v?'selected':''}>${l}</option>`).join('')}</select></div>
    <div class="fld"><label>Thời lượng tham quan tự động (phút)</label><input type="number" min="1" max="20" step="0.5" data-s="tourMinutes" value="${esc(s.tourMinutes)}"></div>
  </div>
  <div class="help">Khi tham quan tự động, phần mềm tự điều chỉnh tốc độ đọc để cả buổi dài xấp xỉ số phút bạn đặt (giới hạn tốc độ đọc từ chậm 0,85 đến nhanh 1,45 lần). Nếu nội dung quá dài so với thời lượng, buổi tham quan sẽ dài hơn một chút.</div>
  <div class="fld"><label><input type="checkbox" data-s="voice" ${s.voice?'checked':''}> Đọc to phần thuyết minh bằng giọng nói của trình duyệt</label></div>
  <div class="row2">
    <div class="fld"><label>Giọng đọc</label><select data-s="voiceName">${viVoiceOptions()}</select></div>
    <div class="fld"><label>Tốc độ đọc khi nghe riêng từng hiện vật: <span id="rateVal">${s.rate}</span></label><input type="range" min="0.7" max="1.3" step="0.1" data-s="rate" value="${s.rate}"></div>
  </div>
  <div class="fld"><button class="btn" id="voiceTest" style="justify-self:start">🔊 Nghe thử giọng</button></div>
  <div class="help">${nv?`Máy này có ${nv} giọng tiếng Việt. Phần mềm ưu tiên giọng nữ, giọng tiếng Việt chuẩn của hệ thống (thường là giọng Bắc). Nếu giọng chưa như ý, hãy chọn một giọng khác trong danh sách.`:'Chưa thấy giọng tiếng Việt nào trên máy này. Trên Microsoft Edge có giọng nữ "Microsoft HoaiMy" (vi-VN) rất tự nhiên; trên máy Mac và iPhone có giọng "Linh". Nếu chưa có giọng, phần thuyết minh vẫn hiện dạng phụ đề.'} Giọng đọc do trình duyệt và hệ điều hành cung cấp nên mỗi máy có thể khác nhau.</div>
  </div>`;
}
function edResources(){
  const files=S.resources||[];
  return `<div class="ed-pane" style="max-width:900px">
    <div class="card"><h3>Kho tài liệu tải xuống</h3>
      <p class="small">Chép tệp vào thư mục resources trong dự án, sau đó nhập đường dẫn. JSON chỉ lưu tên và đường dẫn tệp, không nhúng nội dung tệp.</p>
      <div class="row2"><div class="fld"><label for="resourcePath">Đường dẫn tệp</label><input type="text" id="resourcePath" placeholder="resources/tu-lieu.pdf"></div><div class="fld" style="align-self:end"><button class="btn primary" id="addResourcePath">＋ Thêm đường dẫn</button></div></div>
    </div>
    <div class="card"><h3>Danh sách tài liệu (${files.length})</h3>
      ${files.length?files.map((f,i)=>`<div class="resource-file"><span class="resource-file-type">📄</span><span class="resource-file-name" title="${esc(f.name)}">${esc(f.name)}<small>${esc(f.path||f.name)} · ${esc(f.type||'Tệp không xác định')}</small></span><button class="btn resource-download-btn" data-resource-admin-download="${i}">⬇ Tải thử</button><button class="btn danger" data-resource-admin-delete="${i}">🗑 Xoá</button></div>`).join(''):'<p class="resource-empty">Chưa có tài liệu. Chép tệp vào resources rồi thêm đường dẫn ở trên.</p>'}
    </div>
    <div class="card"><h3>Video cho phòng Sa hình</h3>
      <p class="small">Chép video vào thư mục videos. Không tải video lên trình duyệt hoặc nhúng vào JSON.</p>
      <div class="row2"><div class="fld"><label>Chiến dịch hiển thị</label><select id="museumVideoCampaign"><option value="xiem">Kháng chiến chống quân Xiêm · Rạch Gầm – Xoài Mút</option><option value="thanh">Kháng chiến chống quân Thanh · Ngọc Hồi – Đống Đa</option></select></div>
      <div class="fld"><label for="videoPath">Đường dẫn video</label><input id="videoPath" type="text" placeholder="videos/bo-sung.mp4"></div></div>
      <button class="btn primary" id="addVideoPath">＋ Thêm đường dẫn video</button>
      <div class="small">Video đã tải lên (${(S.videos||[]).length})</div>
      ${(S.videos||[]).length?(S.videos||[]).map((v,i)=>`<div class="resource-file"><span class="resource-file-type">🎬</span><span class="resource-file-name">${esc(v.name)}<small>${v.campaign==='thanh'?'Chiến dịch quân Thanh':'Chiến dịch quân Xiêm'} · ${esc(v.path||v.name)}</small></span><button class="btn danger" data-video-delete="${i}">🗑 Bỏ khỏi danh sách</button></div>`).join(''):'<p class="resource-empty">Chưa có video bổ sung. Hai video mặc định trong thư mục dự án luôn sẵn dùng.</p>'}
    </div>
  </div>`;
}
function downloadSavedResource(resource){
  if(!resource)return;
  const source=resource.dataURL||resource.url||(resource.path&&assetHref(resource.path));
  if(!source){toast('Tài liệu chưa có đường dẫn tệp hợp lệ.');return}
  const a=document.createElement('a');a.href=source;a.download=resource.name||String(resource.path||'tai-lieu').split('/').pop();a.style.display='none';document.body.appendChild(a);a.click();a.remove();
}
function edData(){
  return `<div class="ed-pane"><div class="datagrid">
  <div class="help">Không còn lưu dữ liệu trong bộ nhớ trình duyệt. Khi chạy trên web, museum-data.json được đọc cạnh file HTML. Khi mở trực tiếp bằng file://, hãy mở JSON bằng nút bên dưới. Dùng “Lưu ngay” để chọn hoặc cập nhật file JSON; nếu trình duyệt không hỗ trợ ghi file, nút sẽ tải JSON xuống để thay vào thư mục dự án.</div>
  <div class="card"><h3>Kết nối file dữ liệu</h3><p class="small">Chọn museum-data.json trên máy để nạp nội dung và cho phép lưu thay đổi trực tiếp vào file đó (trình duyệt Chromium mới).</p><button class="btn" id="openDataFile">📂 Mở museum-data.json để chỉnh sửa</button></div>
  <div class="card"><h3>Chủ đề mẫu</h3><p class="small">Nạp một chủ đề dựng sẵn. Nội dung hiện tại sẽ bị thay thế, hãy sao lưu trước nếu cần.</p><div style="display:flex;gap:8px;flex-wrap:wrap">${THEMES.map(th=>`<button class="btn" data-theme="${th.id}">${esc(th.name)}</button>`).join('')}</div></div>
  <div class="card"><h3>Chia sẻ cho học sinh</h3><p class="small">Chép cả thư mục dự án, gồm HTML, CSS, JavaScript, museum-data.json, images, resources và video. Để chạy online, triển khai toàn bộ thư mục này lên Vercel.</p><button class="btn primary" id="exportHtml">Tải file HTML kèm CSS/JS</button></div>
  <div class="card"><h3>Sao lưu dữ liệu</h3><p class="small">Xuất toàn bộ nội dung ra file .json để lưu hoặc chuyển sang máy khác. Khi nhập JSON, các đường dẫn media vẫn trỏ vào những file tương ứng trong thư mục dự án.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="exportJson">Xuất file sao lưu (.json)</button><label class="btn" style="cursor:pointer">Nhập file sao lưu<input type="file" id="importJson" accept=".json,application/json" hidden></label></div></div>
  <div class="card"><h3>Làm mới</h3><p class="small">Xoá sạch hiện vật để bắt đầu một bảo tàng trống cho chủ đề khác.</p><button class="btn danger" id="clearAll">Xoá hết hiện vật</button></div>
  </div></div>`;
}
function validMuseumData(data){
  if(!data||typeof data!=='object'||!Array.isArray(data.items))throw new Error('File JSON phải có thuộc tính items dạng danh sách.');
  return norm(data);
}
async function openDataFile(){
  if(!window.showOpenFilePicker){$('#importJson').click();toast('Trình duyệt chưa hỗ trợ kết nối file trực tiếp. Chọn JSON để nhập, rồi dùng Lưu ngay để tải file đã sửa.');return}
  try{
    const [handle]=await window.showOpenFilePicker({multiple:false,types:[{description:'Dữ liệu bảo tàng JSON',accept:{'application/json':['.json']}}]});
    const file=await handle.getFile(),data=validMuseumData(JSON.parse(await file.text()));
    if(!confirm('Mở file này sẽ thay toàn bộ nội dung hiện tại. Tiếp tục?'))return;
    S=data;DATA_FILE_HANDLE=handle;ed.id=S.items[0]?S.items[0].id:null;
    let permission=await handle.queryPermission({mode:'readwrite'});
    if(permission!=='granted')permission=await handle.requestPermission({mode:'readwrite'});
    if(permission!=='granted')DATA_FILE_HANDLE=null;
    dataDirty=false;
    applyMeta();renderEd();
    toast(permission==='granted'?'Đã mở file. Các thay đổi sẽ tự lưu vào museum-data.json.':'Đã nạp JSON ở chế độ chỉ đọc. Dùng Lưu ngay để cấp quyền ghi hoặc tải file mới.');
  }catch(error){
    if(error.name!=='AbortError'){console.error('Không thể mở museum-data.json.',error);toast(`Không mở được file JSON: ${error.message}`)}
  }
}
const slug=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()||'bao-tang-ao';
function download(name,text,type){
  const b=new Blob([text],{type}),a=document.createElement('a');
  a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},600);
}
function downloadAsset(url){
  const a=document.createElement('a');a.href=url;a.download=new URL(url).pathname.split('/').pop();
  document.body.appendChild(a);a.click();a.remove();
}
const edBody=$('#edBody');
edBody.addEventListener('input',e=>{
  const t=e.target,k=t.dataset.k,m=t.dataset.m,s=t.dataset.s;
  if(k){
    const it=S.items.find(i=>i.id===ed.id);if(!it)return;
    if(k==='type'&&isGalleryImage({type:t.value})&&!isGalleryImage(it)){
      if(S.items.filter(isGalleryImage).length>=MAX_GALLERY_IMAGES){
        t.value=it.type;toast(`Phòng hình ảnh đã đạt giới hạn ${MAX_GALLERY_IMAGES} ảnh.`);return;
      }
      const slot=firstAvailableGallerySlot(S.items.filter(item=>item.id!==it.id),it.campaign==='thanh'?'thanh':'xiem');
      if(!slot){t.value=it.type;toast('Không còn vị trí trống trong phòng hình ảnh.');return;}
      it.gallerySlot=slot.id;
    }
    if(k==='gallerySlot'){
      const taken=S.items.some(item=>item.id!==it.id&&isGalleryImage(item)&&item.gallerySlot===t.value);
      if(!GALLERY_SLOTS.some(slot=>slot.id===t.value)||taken){t.value=it.gallerySlot||'';toast('Vị trí treo này đã được sử dụng hoặc không hợp lệ.');return;}
    }
    it[k]=t.type==='checkbox'?t.checked:t.value;
    if(k==='title'){const nm=$(`.ed-list li[data-id="${CSS.escape(ed.id)}"] .nm`);if(nm)nm.textContent=t.value||'(chưa đặt tên)'}
    queueSave();
  }else if(m){S.meta[m]=t.value;queueSave()}
  else if(s){
    S.settings[s]=t.type==='checkbox'?t.checked:(t.type==='range'||t.type==='number')?parseFloat(t.value):t.value;
    if(s==='rate')$('#rateVal').textContent=S.settings.rate;
    if(s==='voice'){USER_PREFS.narration=!!S.settings.voice;persistUserPrefs();}
    applyMeta();queueSave();
  }
});
edBody.addEventListener('change',async e=>{
  const t=e.target;
  if(t.dataset.k==='type'||t.dataset.k==='gallerySlot'||t.dataset.k==='hotspots'||t.dataset.k==='phases'||t.dataset.k==='text'){renderEd()}
  if(t.id==='imgPath'){
    const it=S.items.find(i=>i.id===ed.id);if(!it)return;
    try{it.img=projectAssetPath(t.value,'images');save();renderEd();toast('Đã cập nhật đường dẫn ảnh.')}
    catch(error){toast(`Đường dẫn ảnh không hợp lệ: ${error.message}`)}
    return;
  }
  if(t.id==='importJson'&&t.files[0]){
    try{
      const d=validMuseumData(JSON.parse(await t.files[0].text()));
      if(!confirm('Nhập file này sẽ thay thế toàn bộ nội dung hiện tại. Tiếp tục?'))return;
      S=d;save();ed.id=S.items[0]?S.items[0].id:null;applyMeta();renderEd();toast('Đã nhập dữ liệu JSON.');
    }catch(error){console.error('Không thể nhập file JSON.',error);toast(`File JSON không hợp lệ: ${error.message}`)}
    finally{t.value=''}
  }
});
edBody.addEventListener('click',e=>{
  const t=e.target;
  if(t.closest('#openDataFile')){openDataFile();return}
  if(t.closest('#addResourcePath')){
    const input=$('#resourcePath'),value=input&&input.value;
    try{
      const path=projectAssetPath(value,'resources');
      if(!path)throw new Error('Nhập đường dẫn tệp trong thư mục resources.');
      S.resources=S.resources||[];
      if(S.resources.some(file=>file.path===path))throw new Error('Đường dẫn này đã được thêm.');
      const name=path.split('/').pop();
      S.resources.push({id:uid(),name,path,type:'application/octet-stream'});
      save();renderEd();toast('Đã thêm đường dẫn tài liệu.');return;
    }catch(error){toast(error.message);return}
  }
  if(t.closest('#addVideoPath')){
    const input=$('#videoPath'),campaign=$('#museumVideoCampaign')?.value||'xiem';
    try{
      const path=projectAssetPath(input&&input.value,'videos');
      if(!path)throw new Error('Nhập đường dẫn video trong thư mục videos.');
      if(!/\.(mp4|webm|ogv|ogg)$/i.test(path))throw new Error('Video cần có đuôi .mp4, .webm, .ogv hoặc .ogg.');
      S.videos=S.videos||[];
      if(S.videos.some(video=>video.path===path&&video.campaign===campaign))throw new Error('Video này đã có trong chiến dịch.');
      S.videos.push({id:uid(),name:path.split('/').pop(),path,campaign});
      save();renderEd();toast('Đã thêm đường dẫn video.');return;
    }catch(error){toast(error.message);return}
  }
  const adminDownload=t.closest('[data-resource-admin-download]');
  if(adminDownload){downloadSavedResource((S.resources||[])[Number(adminDownload.dataset.resourceAdminDownload)]);return;}
  const adminDelete=t.closest('[data-resource-admin-delete]');
  if(adminDelete){const i=Number(adminDelete.dataset.resourceAdminDelete);if(confirm(`Xoá tài liệu “${(S.resources||[])[i]?.name||''}” khỏi kho tải xuống?`)){S.resources.splice(i,1);save();renderEd();toast('Đã xoá tài liệu.');}return;}
  const videoDelete=t.closest('[data-video-delete]');
  if(videoDelete){const i=Number(videoDelete.dataset.videoDelete);if(confirm(`Xoá video “${(S.videos||[])[i]?.name||''}”?`)){S.videos.splice(i,1);save();renderEd();toast('Đã xoá video.');}return;}
  if(t.closest('#addItem')){
    const canAddImage=S.items.filter(isGalleryImage).length<MAX_GALLERY_IMAGES;
    const slot=canAddImage?firstAvailableGallerySlot(S.items):null;
    const it={id:uid(),type:canAddImage?'tranh':'tailieu',title:'Hiện vật mới',date:'',origin:'',detail:'',script:'',question:'',img:'',art:'',text:'',phases:'',hotspots:'',inTour:true,gallerySlot:slot?.id||''};
    S.items.push(it);ed.id=it.id;save();renderEd();
    if(!canAddImage)toast(`Đã đủ ${MAX_GALLERY_IMAGES} ảnh treo; hiện vật mới được tạo dạng tư liệu.`);
    return;
  }
  const act=t.closest('[data-act]');
  if(act){
    e.stopPropagation();
    const id=act.closest('li').dataset.id,i=S.items.findIndex(x=>x.id===id),a=act.dataset.act;
    if(a==='up'&&i>0)[S.items[i-1],S.items[i]]=[S.items[i],S.items[i-1]];
    if(a==='down'&&i<S.items.length-1)[S.items[i+1],S.items[i]]=[S.items[i],S.items[i+1]];
    if(a==='del'&&confirm(`Xoá hiện vật "${S.items[i].title}"?`)){S.items.splice(i,1);if(ed.id===id)ed.id=S.items[0]?S.items[0].id:null}
    save();renderEd();return;
  }
  const li=t.closest('.ed-list li[data-id]');
  if(li){ed.id=li.dataset.id;renderEd();return}
  if(t.closest('#imgDel')){const it=S.items.find(i=>i.id===ed.id);if(it){it.img='';save();renderEd()}return}
  const hp=t.closest('#hotpick');
  if(hp){
    const it=S.items.find(i=>i.id===ed.id);if(!it)return;
    const r=hp.getBoundingClientRect(),x=Math.round((e.clientX-r.left)/r.width*100),y=Math.round((e.clientY-r.top)/r.height*100);
    it.hotspots=(it.hotspots?it.hotspots.replace(/\s+$/,'')+'\n':'')+`${x} | ${y} | 0 | Tên điểm mới | Mô tả điểm này`;
    save();renderEd();return;
  }
  const thb=t.closest('[data-theme]');
  if(thb){
    const th=THEMES.find(x=>x.id===thb.dataset.theme);
    if(th&&confirm(`Nạp chủ đề "${th.name}"? Nội dung hiện tại sẽ bị thay thế.`)){
      const c=clone(th.data);S.meta=Object.assign({},S.meta,c.meta);S.items=norm({items:c.items}).items;
      save();ed.id=S.items[0]?S.items[0].id:null;applyMeta();renderEd();toast('Đã nạp chủ đề mẫu.');
    }
    return;
  }
  if(t.closest('#voiceTest')){
    try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance('Chào các em, đây là giọng đọc thuyết minh của bảo tàng ảo.');u.lang='vi-VN';u.rate=+S.settings.rate||1;u.volume=USER_PREFS.volume;const v=pickVoice();if(v){u.voice=v;u.lang=v.lang}else u.pitch=1.1;speechSynthesis.speak(u)}catch(err){toast('Trình duyệt này không hỗ trợ đọc giọng nói.')}
    return;
  }
  if(t.closest('#exportJson'))download(slug(S.meta.war)+'-sao-luu.json',JSON.stringify(S,null,2),'application/json');
  if(t.closest('#exportHtml')){
    const json=JSON.stringify(S).replace(/</g,'\\u003c');
    const re=/(<script id="seed" type="application\/json">)[\s\S]*?(<\/script>)/;
    download(slug(S.meta.war)+'.html',SRC.replace(re,(m,a,b)=>a+json+b),'text/html');
    document.querySelectorAll('link[href$="museum-fixed.css"],script[src$="museum-fixed.js"]').forEach(asset=>downloadAsset(asset.href));
    ['RGXM.mp4','NH-DD.mp4','phong-hien-vat-tay-son.png','phao.glb','sung.glb','tuong3d.glb'].forEach(name=>downloadAsset(new URL(name,location.href).href));
    toast('Đã xuất HTML, CSS, JS, video và ảnh nền. Hãy giữ các file cùng thư mục và sao chép thêm images, resources, videos cùng mọi ảnh đang dùng.');
  }
  if(t.closest('#resetSample')&&confirm('Khôi phục nội dung mẫu sẽ xoá toàn bộ nội dung hiện tại. Tiếp tục?')){S=norm(clone(DEFAULT));save();ed.id=S.items[0].id;applyMeta();renderEd();toast('Đã khôi phục nội dung mẫu.')}
  if(t.closest('#clearAll')&&confirm('Xoá toàn bộ hiện vật? Hãy chắc chắn bạn đã sao lưu.')){S.items=[];ed.id=null;save();renderEd();toast('Bảo tàng đã trống. Bấm "Thêm hiện vật" để bắt đầu.')}
});

/* ====================== KHỞI ĐỘNG ====================== */
try{if('speechSynthesis' in window){speechSynthesis.getVoices();speechSynthesis.addEventListener('voiceschanged',()=>{if(!$('#editor').hidden&&ed.tab==='museum')renderEd()})}}catch(e){}
applyMeta();applySettingsLanguage();setTourUI();
if(DATA_LOAD_ERROR)toast(`Không tải được museum-data.json: ${DATA_LOAD_ERROR.message}. Hãy nhập JSON trong Quản lý → Lưu và chia sẻ.`);
else if(location.protocol==='file:'&&!STATIC_DATA)toast('Đang dùng nội dung mẫu. Mở Quản lý → Lưu và chia sẻ → Mở museum-data.json để nạp dữ liệu dự án.');
/* ====================== THAM QUAN 3D ĐI BỘ ====================== */
const WALK_TYPES={
  gallery:{label:'Phòng tư liệu hình ảnh',icon:'🖼',center:[-14,0],color:0x4a1718},
  artifacts:{label:'Phòng tư liệu hiện vật',icon:'🏺',center:[14,0],color:0x252a30},
  battle:{label:'Phòng sa hình',icon:'🗺',center:[0,-14],color:0x17332e},
  documents:{label:'Phòng tư liệu',icon:'📜',center:[0,14],color:0x39271a}
};
const W={active:false,ready:false,loopRunning:false,renderer:null,scene:null,camera:null,root:null,targets:[],solids:[],rooms:[],keys:{},joystick:{x:0,y:0},velocity:{x:0,z:0},yaw:0,pitch:0,last:0,ray:null,centerRay:null,current:null,activeCampaign:'xiem',promptAt:0,promptText:'',statusText:'',screenCanvas:null,screenTexture:null,screenLast:0,tvScreens:[],tvVideoElements:{},tvVideoTextures:{},tvPreviewsLoaded:new Set(),pendingGalleryImages:[],galleryImagesLoading:false,pendingArtifactImages:[],artifactImagesLoaded:false,pendingModels:[],modelLoadsStarted:new Set(),ships:[],battleFleet:[],battleArmy:[],battleShots:[],battleEffects:[],battleMuzzles:[],battleGroup:null,battleCampaignGroups:{},battleOriginalFov:null,battleElapsed:0,battlePaused:false,battleRunning:false,battleSiegeTriggered:false,battleStart:0,battlePhase:-1,wasLocked:false};
function walkUpdateJoystick(event){
  const rect=$('#walkJoystick').getBoundingClientRect();
  const maximum=Math.min(rect.width,rect.height)*.25,centerX=rect.left+rect.width/2,centerY=rect.top+rect.height/2;
  let x=event.clientX-centerX,y=event.clientY-centerY;
  const distance=Math.hypot(x,y);
  if(distance>maximum){x=x/distance*maximum;y=y/distance*maximum}
  W.joystick={x:x/maximum,y:y/maximum};
  $('#walkJoystickKnob').style.transform=`translate(${x}px,${y}px)`;
}
const WALK_BATTLE_SCENES=[
  {title:'Chọn khúc sông làm trận địa',caption:'Quân Xiêm có khoảng 5 vạn người và 300 thuyền; Tây Sơn khoảng 2 vạn. Nguyễn Huệ chọn đoạn sông Tiền từ Rạch Gầm đến Xoài Mút, nơi cù lao và hai bờ giúp che giấu quân mai phục.'},
  {title:'Nhử quân Xiêm tiến sâu',caption:'Một thuyền Tây Sơn ra khiêu chiến rồi giả thua rút lui. Đội thuyền Xiêm đuổi theo, tiến vào khúc sông đã được chuẩn bị.'},
  {title:'Khóa hai đầu, khép thế trận',caption:'Khi quân Xiêm lọt vào trận địa, thủy binh Tây Sơn từ Rạch Gầm và Xoài Mút đồng loạt xuất kích, chặn đường tiến và đường rút.'},
  {title:'Pháo lệnh và hỏa công',caption:'Pháo binh từ bờ phối hợp với thủy binh. Đạn pháo và hỏa công đánh vào đội thuyền đang đi sát nhau trên sông.'},
  {title:'Đội hình Xiêm rối loạn',caption:'Thuyền trúng đạn bốc cháy, một số bị đánh chìm; đội hình bị chia cắt và không thể hỗ trợ lẫn nhau.'},
  {title:'Chiến thắng Rạch Gầm – Xoài Mút',caption:'Trận đánh đầu năm 1785 kết thúc trong chưa đầy một ngày. Phần lớn quân Xiêm bị đánh tan, số còn lại tháo chạy.'}
];
const WALK_THANH_SCENES=[
  {title:'Tập kết và xuất quân từ Tam Điệp',caption:'Ngày 30 tháng Chạp năm Mậu Thân, đại quân Tây Sơn chia thành nhiều đạo, tiến công trên các hướng phối hợp.'},
  {title:'Tiến công đồn Ngọc Hồi',caption:'Đạo quân do Quang Trung trực tiếp chỉ huy áp sát đồn Ngọc Hồi, cửa ngõ phía nam Thăng Long.'},
  {title:'Khiên rơm mở đường xung phong',caption:'Quân Tây Sơn dùng khiên ghép bằng ván, phủ rơm thấm nước để chống hỏa lực rồi tiến sát lũy.'},
  {title:'Đô đốc Long tập kích Đống Đa',caption:'Cùng lúc, đạo quân của Đô đốc Long bất ngờ đánh đồn Đống Đa, phá vỡ tuyến phòng thủ phía tây nam.'},
  {title:'Quân Thanh tan rã, Tôn Sĩ Nghị bỏ chạy',caption:'Hai hướng tiến công phối hợp khiến hệ thống phòng thủ sụp đổ; quân Thanh rút chạy khỏi Thăng Long.'},
  {title:'Quang Trung tiến vào Thăng Long',caption:'Trưa mùng 5 Tết Kỷ Dậu, quân Tây Sơn giải phóng Thăng Long và giành thắng lợi quyết định.'}
];
function walkMakeUI(){
  const old=$('#walk3d');if(old)return;
  const root=document.createElement('div');root.id='walk3d';root.hidden=true;
  root.innerHTML=`
    <canvas id="walkCanvas" aria-label="Không gian bảo tàng ba chiều"></canvas>
    <div class="walk-top"><div class="walk-brand">🏛 ${esc(S.meta.war)}</div>
      <div class="walk-rooms"><button data-wroom="gallery">🖼 Phòng ảnh</button><button data-wroom="artifacts">🏺 Hiện vật</button><button data-wroom="battle">🗺 Sa hình</button><button data-wroom="documents">📜 Tư liệu</button></div>
      <div class="walk-tools"><button id="walkHome">← Sảnh chính</button><button id="walkIntroBtn">Hướng dẫn</button><button id="walkSettingsBtn">⚙ Cài đặt</button></div>
    </div>
    <div class="walk-cross" aria-hidden="true">+</div>
    <div id="walkPrompt" class="walk-prompt">Nhấn “Bắt đầu tham quan”, sau đó nhấp vào cảnh 3D để điều khiển góc nhìn.</div>
    <aside id="walkBattlePanel" class="walk-battle-panel" hidden aria-live="polite">
      <div class="walk-battle-heading"><span id="walkBattleCount">TRẬN RẠCH GẦM – XOÀI MÚT</span><button type="button" data-battle-control="close" aria-label="Đóng phần tái hiện">Đóng</button></div>
      <div class="walk-battle-track" id="walkBattleTrack"></div>
      <h2 id="walkBattleTitle"></h2><p id="walkBattleCaption"></p>
      <div class="walk-battle-actions"><button type="button" data-battle-control="previous">Cảnh trước</button><button type="button" data-battle-control="pause">Tạm dừng</button><button type="button" data-battle-control="next">Cảnh sau</button><button type="button" data-battle-control="replay">Xem lại</button></div>
    </aside>
    <div class="walk-help">Di chuyển: <b>W A S D</b> hoặc phím mũi tên · Nhìn quanh: <b>di chuyển chuột</b> · Tương tác: <b>E</b> hoặc nhấp chuột khi ngắm hiện vật · <b>Esc</b>: nhả chuột</div>
    <div class="walk-status" id="walkStatus">Đang ở sảnh trung tâm</div>
    <div class="walk-mobile"><div class="walk-joystick" id="walkJoystick" role="application" aria-label="Cần điều khiển di chuyển"><div class="walk-joystick-base"><div class="walk-joystick-knob" id="walkJoystickKnob"></div></div></div></div>
    <div class="walk-orientation" id="walkOrientation" role="status"><div class="walk-orientation-icon" aria-hidden="true">📱 ↻</div><h2>Xoay ngang điện thoại</h2><p>Không gian tham quan 3D cần màn hình ngang để hiển thị đầy đủ và điều khiển thuận tiện.</p></div>
    <button class="walk-interact" id="walkInteract">✦ Tương tác</button>
    <div class="walk-overlay" id="walkIntro"><div class="walk-card"><p class="eyebrow">Không gian trưng bày tương tác</p><h2>Khám phá bảo tàng bằng góc nhìn người tham quan</h2><p>Bước qua sảnh trung tâm để tự do đi vào bốn phòng. Tranh được treo trên tường; hiện vật đặt trên bệ trưng bày; sa hình có thể tái hiện diễn biến trận đánh; phòng tư liệu có các văn bản để đọc.</p><div><span class="walk-pill">WASD / phím mũi tên</span><span class="walk-pill">Chuột để nhìn quanh</span><span class="walk-pill">E để tương tác</span></div><p class="small">Mô hình hiện vật 3D hiện là mô phỏng minh họa bằng hình khối. Giáo viên có thể thay ảnh, mô tả và thuyết minh qua mục “Quản lý” ở giao diện bảo tàng thông thường.</p><div class="walk-buttons"><button class="primary" id="walkBegin">Bắt đầu tham quan 3D</button><button id="walkBack">Quay lại giao diện danh mục</button></div></div></div>
    <aside class="walk-detail" id="walkDetail" hidden><button class="close" id="walkDetailClose" aria-label="Đóng">×</button><div id="walkDetailContent"></div></aside>
    <div class="walk-image-zoom" id="walkImageZoom" hidden role="dialog" aria-modal="true" aria-label="Ảnh phóng to"><button class="walk-image-close" id="walkImageClose" aria-label="Đóng ảnh">×</button><div class="walk-image-content" id="walkImageContent"></div></div>
  `;
  document.body.appendChild(root);
  $('#walkBattleTrack').innerHTML=WALK_BATTLE_SCENES.map((scene,index)=>`<button type="button" data-battle-scene="${index}" aria-label="Cảnh ${index+1}: ${esc(scene.title)}" title="${esc(scene.title)}">${index+1}</button>`).join('');
  const btn=document.createElement('button');btn.id='enter3D';btn.className='btn primary';btn.textContent='🚶 Khám phá không gian 3D';
  const entryBtns=$('.entry-btns');if(entryBtns)entryBtns.insertBefore(btn,entryBtns.firstChild);
  if($('#enterBtn')){ $('#enterBtn').textContent='Xem theo danh mục';$('#enterBtn').classList.remove('primary'); }
  const topbtn=document.createElement('button');topbtn.id='top3D';topbtn.className='btn';topbtn.textContent='🚶 Không gian 3D';
  const topTour=$('#tourIdle');if(topTour)topTour.appendChild(topbtn);
  btn.onclick=walkOpen;topbtn.onclick=walkOpen;
  $('#walkHome').onclick=walkLeave;$('#walkBack').onclick=walkLeave;
  $('#walkIntroBtn').onclick=()=>{$('#walkIntro').hidden=false;if(document.pointerLockElement=== $('#walkCanvas'))document.exitPointerLock?.()};
  $('#walkSettingsBtn').onclick=openSettings;
  $('#walkBegin').onclick=async()=>{
    const button=$('#walkBegin'),label=button.textContent;
    button.disabled=true;button.textContent='Đang tải không gian 3D…';walkTextToast('Đang tải thư viện 3D cần thiết, vui lòng chờ.');
    try{
      await ensureWalkLibraries();
      if(!W.ready)walkInit();
      if(W.ready){$('#walkIntro').hidden=true;$('#walkDetail').hidden=true;walkStartLoop();if($('#settings').hidden)walkRequestLock();}
    }catch(error){
      console.error('Không tải được thư viện 3D hoặc GLTFLoader.',error);
      walkTextToast('Không tải được thư viện 3D. Hãy kiểm tra kết nối Internet rồi thử lại.');
      toast(`Không tải được thư viện 3D: ${error.message}`);
    }finally{button.disabled=false;button.textContent=label;}
  };
  $('#walkDetailClose').onclick=walkCloseDetail;
  $('#walkBattlePanel').addEventListener('click',e=>{
    const scene=e.target.closest('[data-battle-scene]');
    if(scene){walkSeekBattle(+scene.dataset.battleScene);return}
    const control=e.target.closest('[data-battle-control]')?.dataset.battleControl;
    if(control==='pause')walkToggleBattlePause();
    else if(control==='previous')walkSeekBattle(Math.max(0,W.battlePhase-1));
    else if(control==='next')walkSeekBattle(Math.min(5,W.battlePhase+1));
    else if(control==='replay')walkPlayBattle();
    else if(control==='close')walkStopBattle();
  });
  $('#walkInteract').onclick=walkInteract;
  $('#walkImageClose').onclick=walkCloseGalleryImage;
  $('#walkImageZoom').addEventListener('click',e=>{if(e.target.id==='walkImageZoom')walkCloseGalleryImage()});
  root.querySelectorAll('[data-wroom]').forEach(b=>b.addEventListener('click',()=>walkTeleport(b.dataset.wroom)));
  const joystick=$('#walkJoystick'),knob=$('#walkJoystickKnob');
  const releaseJoystick=e=>{
    if(e)e.preventDefault();
    W.joystick={x:0,y:0};
    knob.style.transform='translate(0,0)';
    if(joystick.hasPointerCapture?.(e?.pointerId))joystick.releasePointerCapture(e.pointerId);
  };
  joystick.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;
    e.preventDefault();joystick.setPointerCapture(e.pointerId);walkUpdateJoystick(e);
  });
  joystick.addEventListener('pointermove',e=>{if(joystick.hasPointerCapture(e.pointerId))walkUpdateJoystick(e)});
  joystick.addEventListener('pointerup',releaseJoystick);
  joystick.addEventListener('pointercancel',releaseJoystick);
  $('#walkCanvas').addEventListener('click',()=>{if(!W.active||!$('#walkIntro').hidden||!$('#walkDetail').hidden)return;if(document.pointerLockElement!==$('#walkCanvas'))walkRequestLock();else walkInteract()});
  $('#walkCanvas').addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){W.touchX=e.clientX;W.touchY=e.clientY;}});
  $('#walkCanvas').addEventListener('pointermove',e=>{
    if(e.pointerType==='touch'&&W.active&&$('#walkIntro').hidden&&$('#walkDetail').hidden){
      if(W.touchX!=null){W.yaw-= (e.clientX-W.touchX)*.006;W.pitch=Math.max(-1.1,Math.min(1.1,W.pitch-(e.clientY-W.touchY)*.004));walkApplyLook();}
      W.touchX=e.clientX;W.touchY=e.clientY;
    }
  });
  $('#walkCanvas').addEventListener('pointerup',()=>{W.touchX=null;W.touchY=null});
  $('#walkDetailContent').addEventListener('click',e=>{
    if(e.target.closest('#walkSpeak'))walkSpeak(W.current);
    if(e.target.closest('#walkReplay'))walkPlayBattle();
  });
  document.addEventListener('pointerlockchange',()=>{
    W.wasLocked=document.pointerLockElement===$('#walkCanvas');
    const s=$('#walkStatus');if(s&&W.active)s.textContent=(W.wasLocked?'Điều khiển chuột đang bật · ':'')+walkLocationLabel();
  });
  document.addEventListener('mousemove',e=>{
    if(!W.active||document.pointerLockElement!==$('#walkCanvas')||!$('#walkIntro').hidden||!$('#walkDetail').hidden)return;
    W.yaw-=e.movementX*.0022;W.pitch=Math.max(-1.12,Math.min(1.12,W.pitch-e.movementY*.002));walkApplyLook();
  });
  document.addEventListener('keydown',e=>{
    if(!$('#settings').hidden)return;
    if(!W.active)return;
    if(['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Shift'].includes(e.key)){
      W.keys[e.key.toLowerCase()]=true;
      if(e.key.startsWith('Arrow'))W.keys[({ArrowUp:'w',ArrowDown:'s',ArrowLeft:'a',ArrowRight:'d'})[e.key]]=true;
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();
    }
    if(e.key.toLowerCase()==='e'&&$('#walkIntro').hidden&&$('#walkDetail').hidden)walkInteract();
    if(e.key==='Escape'){
      if(!$('#walkImageZoom').hidden)walkCloseGalleryImage();
      else if(!$('#walkDetail').hidden)walkCloseDetail();
      else if(!$('#walkIntro').hidden)walkLeave();
    }
    if(e.key==='Tab'&&$('#walkIntro').hidden){e.preventDefault();$('#walkIntro').hidden=false;if(document.pointerLockElement===$('#walkCanvas'))document.exitPointerLock?.()}
  });
  document.addEventListener('keyup',e=>{
    W.keys[e.key.toLowerCase()]=false;
    if(e.key.startsWith('Arrow'))W.keys[({ArrowUp:'w',ArrowDown:'s',ArrowLeft:'a',ArrowRight:'d'})[e.key]]=false;
  });
  window.addEventListener('blur',()=>{W.keys={};W.joystick={x:0,y:0};W.velocity.x=0;W.velocity.z=0;$('#walkJoystickKnob').style.transform='translate(0,0)'});
}
function walkOpen(){
  if(T.on)endTour();stopNarration();
  W.active=true;$('#walk3d').hidden=false;$('#walkIntro').hidden=false;$('#walkDetail').hidden=true;
  document.body.dataset.view='walk3d';$('#caption').classList.remove('show');document.body.classList.remove('cap-on');
  walkRequestLandscape();
  if(W.ready){walkResize();walkStartLoop();}
}
function walkRequestLandscape(){
  if(!window.matchMedia('(max-width: 760px)').matches||!screen.orientation?.lock)return;
  screen.orientation.lock('landscape').catch(error=>{
    console.info('Landscape orientation could not be locked; the rotate-device overlay remains available.',error);
  });
}
function walkLeave(){
  if(!$('#walkBattlePanel').hidden)walkStopBattle();
  if(!$('#walkDetail').hidden)walkCloseDetail();
  if(!$('#walkImageZoom').hidden)walkCloseGalleryImage();
  if(document.pointerLockElement===$('#walkCanvas'))document.exitPointerLock?.();
  W.active=false;W.battleRunning=false;W.keys={};W.joystick={x:0,y:0};$('#walkJoystickKnob').style.transform='translate(0,0)';$('#walk3d').hidden=true;$('#walkIntro').hidden=true;$('#walkDetail').hidden=true;
  document.body.dataset.view=cur.view||'entry';
}
function walkRequestLock(){
  const c=$('#walkCanvas');if(c&&c.requestPointerLock){try{const p=c.requestPointerLock();if(p&&p.catch)p.catch(()=>{})}catch(e){}}
}
function walkInit(){
  if(W.ready)return;
  if(!window.THREE?.GLTFLoader){walkTextToast('Thư viện 3D chưa được tải. Hãy thử lại.');return}
  try{
    const T3=window.THREE,canvas=$('#walkCanvas');
    W.renderer=new T3.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
    applyRenderQuality();
    W.renderer.outputColorSpace=T3.SRGBColorSpace;W.renderer.toneMapping=T3.ACESFilmicToneMapping;W.renderer.toneMappingExposure=1.14;
    W.renderer.shadowMap.enabled=true;W.renderer.shadowMap.type=T3.PCFSoftShadowMap;W.renderer.shadowMap.autoUpdate=false;W.renderer.shadowMap.needsUpdate=true;
    W.scene=new T3.Scene();W.scene.background=new T3.Color(0x100b0a);W.scene.fog=new T3.FogExp2(0x100b0a,.0082);
    W.camera=new T3.PerspectiveCamera(72,window.innerWidth/window.innerHeight,.1,100);W.camera.position.set(0,1.8,2.5);W.yaw=0;W.pitch=0;W.camera.rotation.order='YXZ';
    W.scene.add(new T3.HemisphereLight(0xf9e8cf,0x241711,1.35));W.scene.add(new T3.AmbientLight(0xffe9c9,.28));
    const key=new T3.DirectionalLight(0xffd7a0,2.0);key.position.set(-5,12,7);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-25;key.shadow.camera.right=25;key.shadow.camera.top=25;key.shadow.camera.bottom=-25;W.scene.add(key);
    W.targets=[];W.solids=[];W.ships=[];W.rooms=[];
    walkBuildArchitecture();walkBuildGallery();walkBuildArtifacts();walkBuildTaySonDisplays();walkBuildBattle();walkBuildDocuments();walkBuildAtmosphere();
    W.ray=new T3.Raycaster();W.centerRay=new T3.Vector2(0,0);W.ready=true;W.last=performance.now();
    window.addEventListener('resize',walkResize);
  }catch(err){console.error(err);walkTextToast('Không khởi tạo được không gian 3D trên trình duyệt này. Hãy thử Chrome hoặc Edge mới nhất.');}
}
function walkTextToast(msg){const p=$('#walkPrompt');if(p)p.textContent=msg;}
function walkResize(){if(!W.renderer||!W.camera)return;const w=window.innerWidth,h=window.innerHeight;W.camera.aspect=w/h;W.camera.updateProjectionMatrix();applyRenderQuality();}
function walkApplyLook(){if(!W.camera)return;W.camera.rotation.order='YXZ';W.camera.rotation.set(W.pitch,W.yaw,0,'YXZ');}
function walkMaterial(color,roughness=.72,metalness=.02,extra={}){return new THREE.MeshStandardMaterial(Object.assign({color,roughness,metalness},extra));}
function walkBox(w,h,d,mat,x,y,z,opts={}){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.castShadow=opts.cast!==false;mesh.receiveShadow=true;(opts.parent||W.scene).add(mesh);
  if(opts.solid)W.solids.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});
  return mesh;
}
function walkCylinder(rt,rb,h,mat,x,y,z,opts={}){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,opts.seg||20),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;(opts.parent||W.scene).add(m);return m;
}
function walkSphere(r,mat,x,y,z,scale={x:1,y:1,z:1},parent=W.scene){const m=new THREE.Mesh(new THREE.SphereGeometry(r,18,12),mat);m.position.set(x,y,z);m.scale.set(scale.x,scale.y,scale.z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function walkFloorTexture(kind){
  const c=document.createElement('canvas');c.width=256;c.height=256;const x=c.getContext('2d');
  if(kind==='grass'){
    x.fillStyle='#304b32';x.fillRect(0,0,256,256);for(let i=0;i<360;i++){x.strokeStyle=i%3?'#476644':'#233f2d';x.lineWidth=1;x.beginPath();let px=(i*47)%256,py=(i*83)%256;x.moveTo(px,py);x.lineTo(px+5,py-3);x.stroke();}
  }else if(kind==='stone'){
    x.fillStyle='#352924';x.fillRect(0,0,256,256);for(let r=0;r<8;r++)for(let col=0;col<4;col++){const xx=col*66+(r%2)*32,yy=r*32;x.strokeStyle='#514039';x.lineWidth=2;x.strokeRect(xx+2,yy+2,62,28);x.fillStyle=(r+col)%2?'#3b2d27':'#40312a';x.fillRect(xx+3,yy+3,60,26);}
  }else if(kind==='marble'){
    x.fillStyle='#3e2e28';x.fillRect(0,0,256,256);for(let r=0;r<4;r++)for(let col=0;col<4;col++){x.fillStyle=(r+col)%2?'#514039':'#45342d';x.fillRect(col*64+2,r*64+2,60,60);x.strokeStyle='#765e42';x.lineWidth=1;x.strokeRect(col*64+2,r*64+2,60,60);}
  }else{
    x.fillStyle='#2c1715';x.fillRect(0,0,256,256);for(let r=0;r<8;r++){x.fillStyle=r%2?'#47251f':'#3b1c19';x.fillRect(0,r*32,256,30);x.strokeStyle='#5b3026';x.lineWidth=1;x.beginPath();x.moveTo(0,r*32+2);x.lineTo(256,r*32+2);x.stroke();for(let col=0;col<3;col++){x.beginPath();x.moveTo(col*90+(r%2)*20,r*32+5);x.lineTo(col*90+(r%2)*20,r*32+28);x.stroke();}}
  }
  const tex=new THREE.CanvasTexture(c);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(3,3);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
function walkFloor(w,d,x,z,kind){const mat=new THREE.MeshStandardMaterial({map:walkFloorTexture(kind),roughness:.86});const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat);m.rotation.x=-Math.PI/2;m.position.set(x,.015,z);m.receiveShadow=true;W.scene.add(m);return m;}
function walkWallH(z,x1,x2,mat,depth=.28,height=6.6){const w=x2-x1;if(w<=0)return;walkBox(w,height,depth,mat,(x1+x2)/2,height/2,z,{solid:true});}
function walkWallV(x,z1,z2,mat,depth=.28,height=6.6){const d=z2-z1;if(d<=0)return;walkBox(depth,height,d,mat,x,height/2,(z1+z2)/2,{solid:true});}
function walkPointLight(x,y,z,color=0xffc677,intensity=2.2,dist=9){const p=new THREE.PointLight(color,intensity,dist,2);p.position.set(x,y,z);p.castShadow=false;W.scene.add(p);return p;}
function walkLabelTexture(title,sub,bg='#321716'){
  const c=document.createElement('canvas');c.width=1024;c.height=256;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,1024,256);g.strokeStyle='#d7b56b';g.lineWidth=8;g.strokeRect(12,12,1000,232);g.strokeStyle='#735127';g.lineWidth=2;g.strokeRect(28,28,968,200);g.textAlign='center';g.fillStyle='#f2d890';g.font='bold 48px "Be Vietnam Pro", Arial, sans-serif';g.fillText(title,512,112,930);g.fillStyle='#e5d2ad';g.font='28px "Be Vietnam Pro", Arial, sans-serif';g.fillText(sub||'BẢO TÀNG TƯƠNG TÁC',512,170,940);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function walkSign(title,sub,x,y,z,yaw,bg,width=2.65,height=.66){
  const root=new THREE.Group();root.position.set(x,y,z);root.rotation.y=yaw;const mat=new THREE.MeshBasicMaterial({map:walkLabelTexture(title,sub,bg),side:THREE.DoubleSide});const m=new THREE.Mesh(new THREE.PlaneGeometry(width,height),mat);root.add(m);W.scene.add(root);return root;
}
function walkSconce(x,y,z,yaw){
  const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=yaw;
  const gold=walkMaterial(0xb78c47,.4,.45),warm=new THREE.MeshStandardMaterial({color:0xffc15d,emissive:0xff871e,emissiveIntensity:2.0,roughness:.35});
  const bar=walkBox(.16,.35,.13,gold,0,0,0,{parent:g,cast:false});bar.rotation.z=.2;
  walkSphere(.09,warm,0,-.24,.015,{x:1,y:1.4,z:1},g);W.scene.add(g);walkPointLight(x,y-.2,z,0xffb457,1.55,7);
}
function walkGateway(x,z,alongZ){
  const bronze=walkMaterial(0xb58a49,.35,.58),dark=walkMaterial(0x302017,.56,.3),stone=walkMaterial(0x6d5136,.62,.28);
  const post=alongZ?[.42,4.05,.5]:[.5,4.05,.42],header=alongZ?[.5,.38,4.45]:[4.45,.38,.5];
  const postOffset=2.03;
  for(const side of [-1,1]){
    const px=alongZ?x:x+side*postOffset,pz=alongZ?z+side*postOffset:z;
    walkBox(...post,stone,px,2.03,pz);walkBox(...(alongZ?[.56,.16,.62]:[.62,.16,.56]),bronze,px,3.96,pz);
    walkBox(...(alongZ?[.18,.08,.18]:[.18,.08,.18]),bronze,px,4.16,pz);
  }
  walkBox(...header,bronze,x,4.17,z);
  const crest=new THREE.Mesh(new THREE.OctahedronGeometry(.36,0),bronze);crest.position.set(x,4.55,z);crest.scale.set(alongZ?1:.8,.72,alongZ?.8:1);W.scene.add(crest);
  const medallion=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.08,16),dark);medallion.position.set(x,4.55,z);medallion.rotation.set(alongZ?0:Math.PI/2,0,alongZ?Math.PI/2:0);W.scene.add(medallion);
}
function walkPlanter(x,z){
  const ceramic=walkMaterial(0x793b2e,.34,.36),rim=walkMaterial(0xc19a59,.34,.54),soil=walkMaterial(0x211912,.96,.02),leaf=walkMaterial(0x315d3d,.78,.03);
  walkCylinder(.4,.28,.62,ceramic,x,.34,z,{seg:16});walkCylinder(.43,.4,.12,rim,x,.69,z,{seg:20});walkCylinder(.35,.35,.035,soil,x,.77,z,{seg:16});
  walkCylinder(.055,.07,.66,walkMaterial(0x59402b,.84,.02),x,.98,z,{seg:8});
  for(let i=0;i<9;i++){
    const angle=i*Math.PI*2/9,radius=i%2?.25:.16;
    const frond=walkSphere(.23,leaf,x+Math.cos(angle)*radius,1.28+(i%3)*.08,z+Math.sin(angle)*radius,{x:.62,y:1.55,z:.56});
    frond.rotation.z=Math.cos(angle)*-.52;frond.rotation.x=Math.sin(angle)*.45;
  }
  walkSphere(.25,leaf,x,1.55,z,{x:.8,y:1.45,z:.8});
}
function walkPillar(x,z,mat){walkBox(.5,6.45,.5,mat,x,3.225,z);walkBox(.72,.22,.72,mat,x,6.46,z);walkBox(.67,.18,.67,mat,x,.1,z);}
function walkTrimRoom(cx,cz,mat){
  const w=12.2,d=12.2;
  [.92,6.4].forEach(y=>{
    walkBox(w,.16,.14,mat,cx,y,cz-d/2+.12);walkBox(w,.16,.14,mat,cx,y,cz+d/2-.12);
    walkBox(.14,.16,d,mat,cx-w/2+.12,y,cz);walkBox(.14,.16,d,mat,cx+w/2-.12,y,cz);
  });
}
function walkChainBarrier(cx,cz,axis){
  const iron=walkMaterial(0x34383b,.32,.78),cap=walkMaterial(0xb8bec2,.24,.82);
  const span=11.2,segments=5;
  for(let i=0;i<=segments;i++){
    const offset=-span/2+span*i/segments;
    const x=cx+(axis==='x'?offset:0),z=cz+(axis==='z'?offset:0);
    walkCylinder(.105,.14,.78,iron,x,.39,z,{seg:18});
    walkCylinder(.16,.16,.09,cap,x,.79,z,{seg:20});
    walkCylinder(.19,.19,.09,iron,x,.09,z,{seg:20});
  }
  for(let i=0;i<segments;i++){
    const a=-span/2+span*i/segments,b=-span/2+span*(i+1)/segments;
    const x1=cx+(axis==='x'?a:0),z1=cz+(axis==='z'?a:0);
    const x2=cx+(axis==='x'?b:0),z2=cz+(axis==='z'?b:0);
    const points=[];
    for(let k=0;k<=16;k++){
      const t=k/16;
      const sag=.23*Math.sin(Math.PI*t);
      points.push(new THREE.Vector3(x1+(x2-x1)*t,.58-sag,z1+(z2-z1)*t));
    }
    const curve=new THREE.CatmullRomCurve3(points);
    const chain=new THREE.Mesh(new THREE.TubeGeometry(curve,24,.035,8,false),iron);
    chain.castShadow=true;W.scene.add(chain);
    // Small connecting rings make the barrier read as linked iron chain.
    for(let k=1;k<8;k++){
      const t=k/8, sag=.23*Math.sin(Math.PI*t);
      const ring=walkCylinder(.045,.045,.035,cap,x1+(x2-x1)*t,.58-sag,z1+(z2-z1)*t,{seg:10});
      ring.rotation.z=axis==='x'?Math.PI/2:0;
    }
  }
}
function walkBuildArchitecture(){
  const hallMat=walkMaterial(0xf5f4ef,.82,.01),roomMat=walkMaterial(0xf8f8f5,.86,.01),trim=walkMaterial(0xb18a4e,.38,.45),dark=walkMaterial(0x292724,.85,.04);
  walkFloor(14,14,0,0,'marble');
  walkFloor(12,12,-14,0,'wood');walkFloor(12,12,14,0,'stone');walkFloor(12,12,0,-14,'grass');walkFloor(12,12,0,14,'wood');
  // Four sides of the central hall, each with a generous open doorway.
  walkWallH(-7,-7,-1.85,hallMat);walkWallH(-7,1.85,7,hallMat);walkWallH(7,-7,-1.85,hallMat);walkWallH(7,1.85,7,hallMat);
  walkWallV(-7,-7,-1.85,hallMat);walkWallV(-7,1.85,7,hallMat);walkWallV(7,-7,-1.85,hallMat);walkWallV(7,1.85,7,hallMat);
  // Gallery walls: doorway faces east, toward the main hall.
  walkWallV(-20,-6,6,roomMat);walkWallH(-6,-20,-8,roomMat);walkWallH(6,-20,-8,roomMat);
  walkWallV(-8,-6,-1.85,roomMat);walkWallV(-8,1.85,6,roomMat);
  // Artifact room: doorway faces west.
  walkWallV(20,-6,6,roomMat);walkWallH(-6,8,20,roomMat);walkWallH(6,8,20,roomMat);
  walkWallV(8,-6,-1.85,roomMat);walkWallV(8,1.85,6,roomMat);
  // Battle room: doorway faces south.
  walkWallV(-6,-20,-8,roomMat);walkWallV(6,-20,-8,roomMat);walkWallH(-20,-6,6,roomMat);
  walkWallH(-8,-6,-1.85,roomMat);walkWallH(-8,1.85,6,roomMat);
  // Document room: doorway faces north.
  walkWallV(-6,8,20,roomMat);walkWallV(6,8,20,roomMat);walkWallH(20,-6,6,roomMat);
  walkWallH(8,-6,-1.85,roomMat);walkWallH(8,1.85,6,roomMat);
  // Architectural lintels over the entrances and gilded pillars.
  walkBox(.36,.32,4.2,trim,-8,5.52,0);walkBox(.36,.32,4.2,trim,8,5.52,0);
  walkBox(4.2,.32,.36,trim,0,5.52,-8);walkBox(4.2,.32,.36,trim,0,5.52,8);
  [[-7,-7],[-7,7],[7,-7],[7,7]].forEach(([x,z])=>walkPillar(x,z,trim));
  walkGateway(-8,0,true);walkGateway(8,0,true);walkGateway(0,-8,false);walkGateway(0,8,false);
  [[-5.35,-5.35],[-5.35,5.35],[5.35,-5.35],[5.35,5.35]].forEach(([x,z])=>walkPlanter(x,z));
  // Dải phân cách giữa hai khu: cột trụ kim loại và dây xích võng.
  walkChainBarrier(-14,0,'x');walkChainBarrier(14,0,'x');
  walkChainBarrier(0,-14,'z');walkChainBarrier(0,14,'z');
  walkSign('SẢNH TRUNG TÂM','RẠCH GẦM – XOÀI MÚT · 1785',0,3.1,-6.82,0,'#3a2119');
  walkSign('PHÒNG HÌNH ẢNH','TRANH · ẢNH · ĐỒ HỌA',-8.05,5.05,0,Math.PI/2,'#4b1719');
  walkSign('PHÒNG HIỆN VẬT','MÔ HÌNH 3D',8.05,5.05,0,-Math.PI/2,'#263039');
  walkSign('PHÒNG SA HÌNH','DIỄN BIẾN TRẬN ĐÁNH',0,5.05,-8.04,0,'#173d38');
  walkSign('PHÒNG TƯ LIỆU','VĂN BẢN · ĐÁNH GIÁ',0,5.05,8.04,Math.PI,'#422c1d');
  // Biển hộp tải tài liệu treo trực tiếp trên tường phía trong phòng tư liệu.
  walkSign('📥 KHO TÀI LIỆU','TẢI XUỐNG TƯ LIỆU THAM KHẢO',0,3.45,19.78,Math.PI,'#3d3326');
  // Invisible hit surface aligned with the wall sign, so E/click opens the resource cabinet.
  const cabinet={id:'museum-resource-cabinet',type:'tailieu',title:'📥 Tải tài liệu',date:'Kho tài liệu của bảo tàng',origin:'Chọn tệp để tải xuống',detail:'Kho tài liệu dùng chung cho khách tham quan.',text:'',isResourceCabinet:true};
  const cabinetHit=new THREE.Mesh(new THREE.PlaneGeometry(3.4,1.9),new THREE.MeshBasicMaterial({transparent:true,opacity:0.001,side:THREE.DoubleSide,depthWrite:false}));
  cabinetHit.position.set(0,3.45,19.69);cabinetHit.rotation.y=Math.PI;cabinetHit.userData.item=cabinet;W.scene.add(cabinetHit);W.targets.push(cabinetHit);
  walkTrimRoom(-14,0,trim);walkTrimRoom(14,0,trim);walkTrimRoom(0,-14,trim);walkTrimRoom(0,14,trim);
  // Low decorative panels, ceiling beams and wall sconces add a gallery-like scale.
  const panel=walkMaterial(0xe6e3db,.78,.01),panel2=walkMaterial(0xd5d1c7,.78,.01);
  [-14,14].forEach(cx=>{[-4.5,-1.5,1.5,4.5].forEach(z=>walkBox(.12,2.1,.92,panel,cx<0?-19.78:19.78,1.15,z));[-4,0,4].forEach(z=>walkSconce(cx<0?-19.72:19.72,4.45,z,cx<0?Math.PI/2:-Math.PI/2));});
  [-14,14].forEach(cz=>{[-4.5,-1.5,1.5,4.5].forEach(x=>walkBox(.92,2.1,.12,panel,x,1.15,cz<0?-19.78:19.78));[-4,0,4].forEach(x=>walkSconce(x,4.45,cz<0?-19.72:19.72,cz<0?0:Math.PI));});
  // Floor medallion in the hall.
  const med=walkCylinder(2.15,2.15,.06,trim,0,.08,0,{seg:48});med.rotation.x=0;
  const med2=walkCylinder(1.82,1.82,.065,dark,0,.115,0,{seg:48});
  const med3=walkCylinder(1.5,1.5,.07,walkMaterial(0x6c4426,.62,.2),0,.15,0,{seg:48});
  for(let i=0;i<8;i++){const a=i*Math.PI/4;walkSphere(.06,trim,Math.cos(a)*1.27,.2,Math.sin(a)*1.27,{x:1,y:.4,z:1});}
  walkPointLight(-3.5,3.5,-3.5,0xffcf84,2.0,12);walkPointLight(3.5,3.5,-3.5,0xffcf84,2.0,12);walkPointLight(-3.5,3.5,3.5,0xffcf84,2.0,12);walkPointLight(3.5,3.5,3.5,0xffcf84,2.0,12);
  // Trần nền trắng sáng, có các dải LED dài chạy dọc theo từng phòng.
  const ceiling=walkMaterial(0xfafaf7,.92,.0,{side:THREE.DoubleSide});
  [[0,0,14,14],[-14,0,12,12],[14,0,12,12],[0,-14,12,12],[0,14,12,12]].forEach(([x,z,w,d])=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),ceiling);m.rotation.x=Math.PI/2;m.position.set(x,6.45,z);W.scene.add(m);});
  const ledMat=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xdff3ff,emissiveIntensity:2.4,roughness:.25});
  [[0,0,10.5,.075],[0,0,.075,10.5],[-14,0,9.3,.075],[ -14,0,.075,9.3],[14,0,9.3,.075],[14,0,.075,9.3],[0,-14,9.3,.075],[0,-14,.075,9.3],[0,14,9.3,.075],[0,14,.075,9.3]].forEach(([x,z,w,d])=>walkBox(w,.035,d,ledMat,x,6.38,z,{cast:false}));
  [[-14,0],[14,0],[0,-14],[0,14],[0,0]].forEach(([x,z])=>{walkPointLight(x,5.9,z,0xe7f5ff,1.8,11)});
  W.rooms=[
    {id:'gallery',minX:-20,maxX:-7,minZ:-6,maxZ:6,label:WALK_TYPES.gallery.label},
    {id:'artifacts',minX:7,maxX:20,minZ:-6,maxZ:6,label:WALK_TYPES.artifacts.label},
    {id:'battle',minX:-6,maxX:6,minZ:-20,maxZ:-7,label:WALK_TYPES.battle.label},
    {id:'documents',minX:-6,maxX:6,minZ:7,maxZ:20,label:WALK_TYPES.documents.label},
    {id:'hall',minX:-7.4,maxX:7.4,minZ:-7.4,maxZ:7.4,label:'Sảnh trung tâm'}
  ];
}
function walkTextureForItem(it,deferImage=false){
  const c=document.createElement('canvas');c.width=1024;c.height=768;const g=c.getContext('2d');g.fillStyle='#e5d6b3';g.fillRect(0,0,c.width,c.height);
  g.fillStyle='#45291c';g.fillRect(18,18,988,732);g.fillStyle='#ead8a8';g.fillRect(34,34,956,700);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
  function drawImageFit(img){
    g.fillStyle='#e6d8bd';g.fillRect(48,48,928,672);
    const maxW=890,maxH=635,ar=img.width/img.height;let w=maxW,h=maxH;
    if(ar>maxW/maxH){h=maxW/ar}else{w=maxH*ar}g.drawImage(img,(1024-w)/2,(672-h)/2+48,w,h);tex.needsUpdate=true;
  }
  function drawMissingImage(){
    g.fillStyle='#382317';g.textAlign='center';g.font='bold 34px "Be Vietnam Pro",Arial,sans-serif';
    g.fillText(it.title||'Không tìm thấy ảnh',512,350,880);g.font='23px "Be Vietnam Pro",Arial,sans-serif';
    g.fillText('Kiểm tra tên file trong thư mục images',512,398,880);tex.needsUpdate=true;
  }
  if(it.img){
    const load=done=>{
      const img=new Image();
      img.onload=()=>{drawImageFit(img);done()};
      img.onerror=()=>{console.error(`Không tải được ảnh "${it.img}" của hiện vật "${it.title}".`);drawMissingImage();done()};
      img.src=assetHref(it.img);
    };
    if(deferImage)W.pendingGalleryImages.push(load);else load(()=>{});
  }else if(it.art&&ART[it.art]){
    const load=done=>{
      const svg=ART[it.art](),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'})),img=new Image();
      img.onload=()=>{drawImageFit(img);URL.revokeObjectURL(url);done()};
      img.onerror=()=>{URL.revokeObjectURL(url);done()};
      img.src=url;
    };
    if(deferImage)W.pendingGalleryImages.push(load);else load(()=>{});
  }else{
    g.fillStyle='#382317';g.font='bold 42px Arial, sans-serif';g.fillText(it.title||'TƯ LIỆU LỊCH SỬ',62,100,890);
    g.strokeStyle='#b89554';g.lineWidth=3;g.beginPath();g.moveTo(62,126);g.lineTo(962,126);g.stroke();
    const body=String(it.text||it.detail||'Tư liệu trưng bày trong bảo tàng ảo').replace(/\s+/g,' ');g.fillStyle='#4a3925';g.font='27px Arial, sans-serif';let y=178,line='',words=body.split(' ');for(const word of words){if(g.measureText(line+' '+word).width>875){if(line)g.fillText(line,62,y);y+=39;line=word;if(y>665)break}else line+=(line?' ':'')+word;}if(line&&y<=665)g.fillText(line,62,y);tex.needsUpdate=true;
  }
  return tex;
}
function walkPrimeGalleryImages(){
  if(W.galleryImagesLoading||!W.pendingGalleryImages.length)return;
  W.galleryImagesLoading=true;
  const next=()=>{
    const load=W.pendingGalleryImages.shift();
    if(!load){W.galleryImagesLoading=false;return}
    load(next);
  };
  next();
}
function walkCreatePicture(it,pos,yaw,w=2.5,h=1.85){
  const root=new THREE.Group();root.position.set(pos[0],pos[1],pos[2]);root.rotation.y=yaw;root.userData.item=it;
  const gold=walkMaterial(0xc5a05c,.36,.52),dark=walkMaterial(0x21150f,.58,.22);
  walkBox(w+.22,.13,.15,gold,0,h/2+.09,0,{parent:root});walkBox(w+.22,.13,.15,gold,0,-h/2-.09,0,{parent:root});
  walkBox(.13,h+.35,.15,gold,-w/2-.045,0,0,{parent:root});walkBox(.13,h+.35,.15,gold,w/2+.045,0,0,{parent:root});
  walkBox(w+.05,h+.13,.05,dark,0,0,-.045,{parent:root});
  const mat=new THREE.MeshBasicMaterial({map:walkTextureForItem(it,true),side:THREE.DoubleSide});const plane=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);plane.position.z=.035;plane.castShadow=false;root.add(plane);
  const label=new THREE.Mesh(new THREE.PlaneGeometry(w+.15,.42),new THREE.MeshBasicMaterial({map:walkLabelTexture(it.title,it.date||'TƯ LIỆU TRƯNG BÀY','#362018'),side:THREE.DoubleSide}));label.position.set(0,-h/2-.44,.04);root.add(label);
  W.scene.add(root);W.targets.push(root);return root;
}
function walkBuildGallery(){
  const items=S.items.filter(isGalleryImage),hungItems=items.filter(it=>GALLERY_SLOTS.some(slot=>slot.id===it.gallerySlot));
  if(!items.length)return;
  if(items.length>hungItems.length)console.warn(`${items.length-hungItems.length} ảnh không được treo vì đã đủ ${MAX_GALLERY_IMAGES} vị trí.`);
  hungItems.forEach(it=>{
    const slot=GALLERY_SLOTS.find(candidate=>candidate.id===it.gallerySlot);
    walkCreatePicture(it,slot.position,slot.yaw,2.25,1.68);
  });
  walkSign('KHÁNG CHIẾN CHỐNG XIÊM','RẠCH GẦM – XOÀI MÚT',-14,4.2,-5.8,2*Math.PI,'#4a1718');
  walkSign('KHÁNG CHIẾN CHỐNG THANH','NGỌC HỒI – ĐỐNG ĐA',-14,4.2,5.8,Math.PI,'#273c32');
}
function walkPedestal(x,z,label){
  const stone=walkMaterial(0xaaa18c,.5,.24),gold=walkMaterial(0xb88b43,.35,.5),black=walkMaterial(0x3b2921,.58,.22);
  walkCylinder(.95,.95,.18,black,x,.24,z,{seg:32});walkCylinder(.81,.9,.12,gold,x,.39,z,{seg:32});walkBox(1.36,.95,1.36,stone,x,.91,z);walkBox(1.48,.09,1.48,gold,x,1.43,z);walkBox(1.48,.14,1.48,black,x,1.54,z);
  const placard=new THREE.Mesh(new THREE.PlaneGeometry(1.35,.36),new THREE.MeshBasicMaterial({map:walkLabelTexture(label,'HIỆN VẬT MÔ PHỎNG','#2c2924'),side:THREE.DoubleSide}));placard.rotation.x=-.25;placard.position.set(x,1.65,z+.55);W.scene.add(placard);
}
function walkModelCannon(root){
  const rustCanvas=document.createElement('canvas');rustCanvas.width=512;rustCanvas.height=256;
  const ctx=rustCanvas.getContext('2d'),gradient=ctx.createLinearGradient(0,0,0,256);
  gradient.addColorStop(0,'#55473a');gradient.addColorStop(.34,'#806341');gradient.addColorStop(.62,'#493d33');gradient.addColorStop(1,'#735239');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,512,256);
  for(let i=0;i<900;i++){
    const x=(i*197)%512,y=(i*113)%256,r=2+(i*17)%13;
    ctx.fillStyle=i%3===0?'rgba(157,104,55,.42)':i%3===1?'rgba(35,39,37,.42)':'rgba(194,151,93,.28)';
    ctx.beginPath();ctx.ellipse(x,y,r,r*(.28+(i%5)*.12),(i%7)*.2,0,Math.PI*2);ctx.fill();
  }
  const rustTexture=new THREE.CanvasTexture(rustCanvas);rustTexture.colorSpace=THREE.SRGBColorSpace;
  rustTexture.wrapS=rustTexture.wrapT=THREE.RepeatWrapping;rustTexture.repeat.set(2.2,1);
  const iron=walkMaterial(0x8c795e,.94,.36,{map:rustTexture,bumpMap:rustTexture,bumpScale:.065});
  const darkIron=walkMaterial(0x423b32,.82,.48),wood=walkMaterial(0x38271d,.74,.08);
  const saddle=walkMaterial(0x514337,.88,.16),brass=walkMaterial(0x8a7047,.66,.42);
  // The heavy, corroded tube rests on fixed timber saddles rather than a modern wheeled carriage.
  walkBox(2.25,.16,.76,wood,0,.09,0,{parent:root});
  for(const x of [-.68,.68]){
    walkBox(.34,.38,.58,saddle,x,.34,0,{parent:root});
    walkBox(.38,.07,.62,brass,x,.55,0,{parent:root});
  }
  const profile=[[0,-1.28],[.11,-1.28],[.18,-1.2],[.205,-1.04],[.18,-.88],[.17,-.65],[.175,-.25],[.185,.3],[.205,.68],[.24,.83],[.245,.98],[.22,1.05],[.165,1.02],[.15,.94],[.145,.74],[.14,-.9],[0,-.92]];
  const barrel=new THREE.Mesh(new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),40),iron);
  barrel.position.set(.02,.78,0);barrel.rotation.z=-Math.PI/2;barrel.castShadow=true;barrel.receiveShadow=true;root.add(barrel);
  for(const x of [-.92,-.72,.56,.78]){
    const band=new THREE.Mesh(new THREE.TorusGeometry(x>.5?.205:.19,.035,10,36),darkIron);
    band.position.set(x,.78,0);band.rotation.y=Math.PI/2;band.castShadow=true;root.add(band);
  }
  const muzzle=new THREE.Mesh(new THREE.CircleGeometry(.145,32),darkIron);
  muzzle.position.set(1.025,.78,0);muzzle.rotation.y=Math.PI/2;root.add(muzzle);
  const bore=new THREE.Mesh(new THREE.CircleGeometry(.09,32),walkMaterial(0x111312,.98,.06));
  bore.position.set(1.027,.78,0);bore.rotation.y=Math.PI/2;root.add(bore);
  [-1,1].forEach(side=>{
    const trunnion=walkCylinder(.13,.13,.42,darkIron,0,.69,side*.24,{parent:root,seg:24});
    trunnion.rotation.x=Math.PI/2;
    const collar=walkCylinder(.17,.17,.055,brass,0,.69,side*.29,{parent:root,seg:24});
    collar.rotation.x=Math.PI/2;
  });
  const cascabel=walkSphere(.14,iron,-1.16,.78,0,{x:1.15,y:.9,z:.9},root);
  walkCylinder(.07,.07,.16,darkIron,-1.27,.78,0,{parent:root,seg:16}).rotation.z=Math.PI/2;
}
function walkModelBoat(root){
  const hull=walkMaterial(0x572a22,.4,.45),trim=walkMaterial(0xb48b4b,.38,.5),cloth=walkMaterial(0xf0dfb7,.88,.02,{side:THREE.DoubleSide});
  walkBox(2.15,.27,.7,hull,0,.15,0,{parent:root});walkBox(1.7,.18,.55,trim,0,.29,0,{parent:root});
  const mast=walkCylinder(.055,.07,1.45,trim,0,1.02,0,{parent:root});
  const sail=new THREE.Mesh(new THREE.PlaneGeometry(.72,.9),cloth);sail.position.set(.28,1.18,.03);root.add(sail);
  const flag=new THREE.Mesh(new THREE.PlaneGeometry(.42,.2,1,1),new THREE.MeshStandardMaterial({color:0xa3262e,side:THREE.DoubleSide}));flag.position.set(.22,1.66,0);root.add(flag);
  walkBox(.55,.14,.45,hull,0,.46,.18,{parent:root});
}
function walkModelStatue(root){
  const bronze=walkMaterial(0x946c40,.42,.42),bronzeLight=walkMaterial(0xb28750,.4,.42),
    gold=walkMaterial(0xc29a59,.34,.48),patina=walkMaterial(0x725335,.52,.3),
    face=walkMaterial(0x98724f,.46,.32),faceLight=walkMaterial(0xac8864,.44,.3),
    dark=walkMaterial(0x39291f,.58,.14),eye=walkMaterial(0xd0bd99,.44,.12);
  [bronze,bronzeLight,gold,patina,face,faceLight,dark,eye].forEach(material=>{material.side=THREE.DoubleSide;});
  const sphere=(material,x,y,z,sx,sy,sz)=>{
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,32,24),material);
    mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);return mesh;
  };
  const tube=(material,points,radius,segments=24)=>{
    const curve=new THREE.CatmullRomCurve3(points.map(point=>new THREE.Vector3(...point)));
    const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,segments,radius,8,false),material);
    mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);return mesh;
  };
  const bar=(material,a,b,radius)=>{
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),direction=end.clone().sub(start);
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,direction.length(),16),material);
    mesh.position.copy(start.add(end).multiplyScalar(.5));
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
    mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);return mesh;
  };
  const lathe=(material,profile,position)=>{
    const mesh=new THREE.Mesh(new THREE.LatheGeometry(profile.map(point=>new THREE.Vector2(point[0],point[1])),40),material);
    mesh.position.set(...position);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);return mesh;
  };
  const portraitHead=()=>{
    const geometry=new THREE.SphereGeometry(1,48,36),positions=geometry.attributes.position;
    for(let i=0;i<positions.count;i++){
      const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
      const jaw=Math.max(.76,Math.min(1,1+(y+.25)*.22));
      positions.setXYZ(i,x*.34*jaw,1.78+y*.34,z*.285+.02+Math.max(0,-y)*.055);
    }
    positions.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
    const mesh=new THREE.Mesh(geometry,face);
    mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);
  };

  // A tapered, sculpted cuirass replaces the earlier stacked-ball silhouette.
  const cuirass=lathe(patina,[[0,.35],[.42,.35],[.49,.46],[.64,.69],[.67,.81],[.61,.94],[.48,1.07],[.36,1.2],[.3,1.33],[0,1.34]],[0,0,0]);
  cuirass.scale.set(.94,1,.94);
  const mantle=sphere(bronze,0,.7,-.22,.72,.43,.34);mantle.rotation.z=Math.PI;
  for(const side of [-1,1]){
    const pauldron=sphere(bronzeLight,side*.51,.99,-.005,.3,.22,.37);pauldron.rotation.z=side*-.15;
    sphere(patina,side*.56,.91,.19,.22,.23,.22);
    for(let row=0;row<3;row++)for(let col=0;col<3;col++){
      const x=side*(.4+col*.075),y=.85+row*.09;
      sphere(gold,x,y,.385-Math.abs(x)*.16,.018,.018,.012);
    }
  }
  const breastShape=new THREE.Shape();
  breastShape.moveTo(-.34,1.04);
  breastShape.bezierCurveTo(-.25,1.13,-.12,1.17,0,1.15);
  breastShape.bezierCurveTo(.12,1.17,.25,1.13,.34,1.04);
  breastShape.bezierCurveTo(.32,.82,.18,.66,0,.61);
  breastShape.bezierCurveTo(-.18,.66,-.32,.82,-.34,1.04);
  const breastplate=new THREE.Mesh(new THREE.ExtrudeGeometry(breastShape,{depth:.065,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.045,bevelThickness:.035,curveSegments:12}),bronzeLight);
  breastplate.material.side=THREE.DoubleSide;breastplate.material.needsUpdate=true;
  breastplate.position.z=.59;breastplate.castShadow=true;breastplate.receiveShadow=true;root.add(breastplate);
  tube(gold,[[-.35,.65,.69],[-.23,.76,.745],[0,.59,.755],[.23,.76,.745],[.35,.65,.69]],.018,36);
  tube(patina,[[-.3,1.04,.72],[-.2,1.105,.76],[0,1.12,.77],[.2,1.105,.76],[.3,1.04,.72]],.012,28);
  tube(gold,[[0,.66,.755],[0,.78,.785],[0,.94,.785],[0,1.08,.75]],.012,24);
  sphere(gold,0,.72,.775,.045,.055,.023);
  for(let row=0;row<3;row++)for(let col=-2;col<=2;col++){
    const x=col*.105,y=.81+row*.105;
    sphere(gold,x,y,.755-Math.abs(x)*.12,.018,.018,.012);
  }
  // Neck rises naturally from a layered, flared collar.
  lathe(bronzeLight,[[.27,1.13],[.34,1.18],[.35,1.27],[.3,1.34],[.27,1.43],[0,1.43]],[0,0,0]);
  lathe(patina,[[.3,1.18],[.36,1.2],[.37,1.25],[.3,1.28],[0,1.28]],[0,0,0]);
  tube(gold,[[-.3,1.23,.08],[-.2,1.14,.31],[0,1.11,.38],[.2,1.14,.31],[.3,1.23,.08]],.027,32);

  // Bronze facial planes, cheekbones and chin give the portrait a distinct expression.
  portraitHead();
  for(const side of [-1,1]){
    sphere(faceLight,side*.35,1.78,.035,.07,.12,.075);
    sphere(bronzeLight,side*.35,1.78,.09,.018,.065,.016);
    sphere(faceLight,side*.15,1.91,.257,.09,.052,.043);
    sphere(dark,side*.15,1.93,.291,.07,.029,.02);
    sphere(eye,side*.15,1.93,.306,.05,.021,.014);
    sphere(dark,side*.15,1.93,.319,.018,.022,.011);
    sphere(gold,side*.155,1.938,.329,.006,.007,.005);
    tube(bronzeLight,[[side*.245,1.99,.266],[side*.18,2.02,.285],[side*.095,2.015,.299]],.017,14);
    sphere(faceLight,side*.22,1.74,.24,.095,.072,.05);
  }
  tube(faceLight,[[0,1.99,.285],[0,1.88,.322],[0,1.77,.36]],.037,20);
  sphere(faceLight,0,1.75,.37,.065,.045,.045);
  sphere(faceLight,-.045,1.738,.365,.04,.03,.032);sphere(faceLight,.045,1.738,.365,.04,.03,.032);
  sphere(dark,0,1.748,.394,.016,.011,.012);
  for(const side of [-1,1]){
    tube(dark,[[0,1.645,.345],[side*.09,1.68,.36],[side*.19,1.67,.33],[side*.255,1.635,.29]],.031,22);
    tube(bronzeLight,[[side*.035,1.565,.335],[side*.12,1.555,.35],[side*.19,1.575,.32]],.01,14);
  }
  tube(dark,[[-.105,1.575,.335],[0,1.56,.355],[.105,1.575,.335]],.01,18);
  sphere(face,0,1.49,.19,.13,.065,.1);

  // Domed ceremonial helmet with a fitted brow band, cheek plates and plume.
  const dome=new THREE.Mesh(new THREE.SphereGeometry(1,40,28,0,Math.PI*2,0,Math.PI/2),bronze);
  dome.position.set(0,2.08,-.005);dome.scale.set(.43,.43,.37);dome.castShadow=true;dome.receiveShadow=true;root.add(dome);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.405,.045,12,48),gold);
  rim.rotation.x=Math.PI/2;rim.position.set(0,2.085,.005);root.add(rim);
  tube(bronzeLight,[[-.36,2.12,.15],[-.25,2.17,.3],[0,2.19,.37],[.25,2.17,.3],[.36,2.12,.15]],.045,40);
  tube(gold,[[-.34,2.16,.17],[-.22,2.22,.3],[0,2.24,.35],[.22,2.22,.3],[.34,2.16,.17]],.014,36);
  for(let i=-2;i<=2;i++){
    const x=i*.135;
    walkBox(.085,.105,.045,gold,x,2.18,.335,{parent:root});
    walkBox(.052,.045,.018,patina,x,2.18,.363,{parent:root});
    sphere(gold,x,2.255,.27,.018,.018,.018);
  }
  for(const side of [-1,1]){
    const guard=sphere(bronze,side*.37,1.78,.015,.105,.29,.18);guard.rotation.z=side*.15;
    tube(gold,[[side*.39,1.99,.08],[side*.43,1.84,.19],[side*.42,1.65,.22],[side*.32,1.52,.25]],.024,28);
    sphere(gold,side*.42,2.03,.08,.035,.035,.035);
    for(let i=0;i<3;i++)sphere(gold,side*(.34+i*.035),1.72-i*.09,.175,.018,.018,.018);
  }
  const plume=new THREE.Mesh(new THREE.CylinderGeometry(.075,.13,.62,20,8),bronzeLight);
  plume.position.set(0,2.53,-.055);plume.rotation.z=-.06;plume.castShadow=true;root.add(plume);
  sphere(gold,0,2.25,-.025,.16,.055,.14);
  tube(gold,[[0,2.28,.085],[0,2.45,.06],[0,2.68,.035],[0,2.83,.015]],.014,28);
  walkCylinder(.16,.16,.045,gold,0,2.26,-.025,{parent:root,seg:24});
}
function walkModelBicycle(root){
  const iron=walkMaterial(0x383e3c,.38,.66),wood=walkMaterial(0x81522b,.7,.1);
  const wheel1=new THREE.Mesh(new THREE.TorusGeometry(.42,.035,8,28),iron);wheel1.position.set(-.72,.48,0);wheel1.rotation.y=Math.PI/2;root.add(wheel1);
  const wheel2=wheel1.clone();wheel2.position.x=.72;root.add(wheel2);
  const cyl=(a,b,r=.035)=>{const v=new THREE.Vector3().subVectors(new THREE.Vector3(...b),new THREE.Vector3(...a));const m=walkCylinder(r,r,v.length(),wood,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,{parent:root,seg:8});m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());};
  cyl([-.72,.48,0],[-.15,.88,0]);cyl([-.15,.88,0],[.1,.48,0]);cyl([.1,.48,0],[-.72,.48,0]);cyl([-.15,.88,0],[.72,.48,0]);cyl([.1,.48,0],[.72,.48,0]);cyl([-.22,.92,0],[.02,.92,0]);cyl([.7,.8,0],[.85,.83,0]);
  walkBox(.4,.12,.3,wood,-.18,1.05,0,{parent:root});
}
function walkModelGun(root){
  const wood=walkMaterial(0x684323,.68,.08),iron=walkMaterial(0x34383b,.32,.68);
  walkBox(1.15,.12,.16,wood,-.48,.19,0,{parent:root});
  walkBox(.42,.09,.13,wood,.18,.19,0,{parent:root});
  const barrel=walkCylinder(.028,.028,1.55,iron,.92,.21,0,{parent:root,seg:12});barrel.rotation.z=Math.PI/2;
  walkBox(.1,.16,.08,wood,-.04,.11,0,{parent:root});
  const trigger=new THREE.Mesh(new THREE.TorusGeometry(.09,.012,6,14,Math.PI),iron);
  trigger.position.set(-.12,.1,0);trigger.rotation.z=Math.PI;root.add(trigger);
}
function walkModelGeneric(root,it){
  const metal=walkMaterial(0x8c7958,.38,.55),dark=walkMaterial(0x3d2b1c,.6,.22);
  if(/thuyền|thuyen|tàu|tau|sông|song/i.test(it.title+' '+it.art))walkModelBoat(root);
  else if(/co-tay-son|la-co/i.test(it.art||'')||/lá cờ|la co/i.test(it.title||''))walkModelTaySonFlag(root);
  else if(/tượng|tuong|tướng|tuong-quan|quan/i.test(it.title+' '+it.art))walkModelStatue(root);
  else if(/xe|bicycle|thồ|tho/i.test(it.title+' '+it.art))walkModelBicycle(root);
  else if(/súng|sung|điểu thương|dieu thuong/i.test(it.title+' '+it.art))walkModelGun(root);
  else if(/bếp|bep/i.test(it.title+' '+it.art)){
    walkBox(1.35,.35,1.05,dark,0,.17,0,{parent:root});walkBox(1.1,.16,.82,metal,0,.42,0,{parent:root});
    const fire=new THREE.MeshStandardMaterial({color:0xff7a19,emissive:0xff4d00,emissiveIntensity:1.8});walkSphere(.19,fire,0,.65,0,{x:1.25,y:.75,z:1.25},root);
  }else if(/gươm|guom|kiếm|kiem/i.test(it.title+' '+it.art)){
    walkCylinder(.06,.08,1.8,metal,0,1,0,{parent:root});walkBox(.5,.08,.12,dark,0,.35,0,{parent:root});
  }else walkModelCannon(root);
}
function walkModelTaySonFlag(root){
  const pole=walkMaterial(0x49301d,.66,.16),brass=walkMaterial(0xb28a45,.42,.58);
  walkCylinder(.055,.075,3.05,pole,0,1.52,0,{parent:root,seg:20});
  walkCylinder(.09,.07,.12,brass,0,.13,0,{parent:root,seg:20});
  walkSphere(.105,brass,0,3.1,0,{x:1,y:1.2,z:1},root);
  for(const y of [.32,2.78])walkCylinder(.073,.073,.06,brass,0,y,0,{parent:root,seg:20});
  const flagCanvas=document.createElement('canvas');flagCanvas.width=512;flagCanvas.height=320;
  const g=flagCanvas.getContext('2d');g.fillStyle='#e1bb43';g.fillRect(0,0,512,320);
  g.fillStyle='#fff2c6';
  for(let x=8;x<504;x+=28){
    for(const y of [8,312]){g.beginPath();g.ellipse(x,y,12,10,0,0,Math.PI*2);g.fill();}
  }
  for(let y=20;y<300;y+=28){
    for(const x of [8,504]){g.beginPath();g.ellipse(x,y,10,12,0,0,Math.PI*2);g.fill();}
  }
  g.fillStyle='#d71920';g.fillRect(34,36,444,248);
  g.strokeStyle='#f4cf57';g.lineWidth=7;g.strokeRect(39,41,434,238);
  g.fillStyle='#f6cf4a';g.beginPath();g.arc(256,160,68,0,Math.PI*2);g.fill();
  const flagTexture=new THREE.CanvasTexture(flagCanvas);flagTexture.colorSpace=THREE.SRGBColorSpace;
  const geometry=new THREE.PlaneGeometry(1.82,1.14,20,12),positions=geometry.attributes.position;
  for(let i=0;i<positions.count;i++){
    const x=positions.getX(i),y=positions.getY(i),u=(x+0.91)/1.82,v=(y+0.57)/1.14;
    positions.setZ(i,.13*u*Math.sin(u*Math.PI*2+v*1.1));
  }
  positions.needsUpdate=true;geometry.computeVertexNormals();
  const cloth=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({map:flagTexture,roughness:.92,metalness:.01,side:THREE.DoubleSide}));
  cloth.position.set(.98,2.24,.015);cloth.castShadow=true;cloth.receiveShadow=true;root.add(cloth);
  const hem=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(.08,2.81,.02),new THREE.Vector3(.98,2.81,.02),new THREE.Vector3(1.88,2.81,.02)
  ]),24,.018,8,false),brass);root.add(hem);
  const lowerHem=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(.08,1.67,.02),new THREE.Vector3(.98,1.67,.02),new THREE.Vector3(1.88,1.67,.02)
  ]),24,.018,8,false),brass);root.add(lowerHem);
  for(let i=0;i<8;i++){
    const tassel=walkCylinder(.012,.012,.13,brass,.12+i*.25,1.59,.02,{parent:root,seg:8});
    tassel.rotation.z=.08;
  }
}
function walkBuildArtifacts(){
  const allItems=S.items.filter(i=>i.type==='daocu');
  const flagItem=allItems.find(it=>it.art==='co-tay-son'||/lá cờ|la co/i.test(it.title||''));
  const items=allItems.filter(it=>it!==flagItem&&!/tượng\s*quang trung/i.test(it.title||'')&&it.id!=='dai-bac');
  if(flagItem){
    const x=10.55,z=-3.55;
    walkPedestal(x,z,flagItem.title);
    const flag=new THREE.Group();flag.position.set(x,1.63,z);flag.userData.item=flagItem;walkModelGeneric(flag,flagItem);W.scene.add(flag);W.targets.push(flag);
    walkPointLight(x,4,z,0xffd18a,1.1,5);
  }
  const displaySlots=[{x:14,z:-3.55},{x:14,z:3.55}];
  if(items.length>displaySlots.length)console.warn(`Có ${items.length} hiện vật đạo cụ bổ sung nhưng chỉ còn ${displaySlots.length} bệ trống trong phòng.`);
  items.slice(0,displaySlots.length).forEach((it,i)=>{
    const {x,z}=displaySlots[i];
    walkPedestal(x,z,it.title);const model=new THREE.Group();model.position.set(x,1.63,z);model.userData.item=it;walkModelGeneric(model,it);W.scene.add(model);W.targets.push(model);
    walkPointLight(x,4,z,0xffd18a,1.1,5);
  });
  walkSign('HIỆN VẬT TÂY SƠN','CHIẾN THẮNG QUÂN XIÊM',19.65,5.05,-4,-Math.PI/2,'#4a1718');
  walkSign('HIỆN VẬT TÂY SƠN','CHIẾN THẮNG QUÂN THANH',19.65,5.05,4,-Math.PI/2,'#273c32');
}

function walkCannonCarriage(root){
  const wood=walkMaterial(0x684323,.68,.08),iron=walkMaterial(0x34383b,.32,.68);
  walkBox(.58,.12,1.22,wood,0,.12,0,{parent:root});
  [-.24,.24].forEach(x=>walkBox(.1,.2,1.15,wood,x,.28,0,{parent:root}));
  walkBox(.34,.14,.28,wood,0,.42,-.3,{parent:root});walkBox(.34,.14,.28,wood,0,.42,.3,{parent:root});
  const axle=walkCylinder(.055,.055,.86,iron,0,.29,0,{parent:root,seg:12});axle.rotation.z=Math.PI/2;
  [-.43,.43].forEach(x=>{
    const wheel=new THREE.Mesh(new THREE.TorusGeometry(.27,.045,8,24),wood);wheel.position.set(x,.29,0);wheel.rotation.y=Math.PI/2;wheel.castShadow=true;wheel.receiveShadow=true;root.add(wheel);
    const hub=walkCylinder(.075,.075,.12,iron,x,.29,0,{parent:root,seg:16});hub.rotation.z=Math.PI/2;
  });
}
function walkLoadGLB(path,target,height,color,metalness,roughness,fallback,options={}){
  if(!options.loadNow){
    if(!W.pendingModels.some(model=>model.path===path))W.pendingModels.push({path,target,height,color,metalness,roughness,fallback,options});
    return;
  }
  const loader=new THREE.GLTFLoader();
  loader.load(new URL(path,location.href).href,gltf=>{
    const model=gltf.scene,fitAxis=options.fitAxis||'y';
    model.rotation.x=options.rotationX||0;
    const sourceBox=new THREE.Box3().setFromObject(model),size=sourceBox.getSize(new THREE.Vector3()),axisSize=size[fitAxis];
    if(!Number.isFinite(axisSize)||axisSize<=0){
      const error=new Error(`Model ${path} không có kích thước hợp lệ.`);
      console.error(error);fallback();toast(error.message);return;
    }
    model.scale.setScalar(height/axisSize);
    const fittedBox=new THREE.Box3().setFromObject(model),center=fittedBox.getCenter(new THREE.Vector3());
    model.position.set(-center.x,-fittedBox.min.y+(options.baseOffset||0),-center.z);
    const material=options.preserveMaterials?null:options.carriage
      ?new THREE.MeshStandardMaterial({color:0x815840,emissive:0x1d1008,emissiveIntensity:.12,roughness:.92,metalness:.16})
      :walkMaterial(color,roughness,metalness);
    model.traverse(node=>{
      if(!node.isMesh)return;
      node.castShadow=true;node.receiveShadow=true;
      if(node.geometry&&!node.geometry.getAttribute('normal'))node.geometry.computeVertexNormals();
      if(material)node.material=material;
    });
    target.add(model);
    if(options.carriage)walkCannonCarriage(target);
  },undefined,error=>{
    console.error(`Không tải được model 3D ${path}.`,error);
    fallback();
    toast(`Không tải được ${path}; đang dùng mô hình dự phòng.`);
  });
}
function walkBuildTaySonDisplays(){
  // Không gian hiện vật lấy cảm hứng từ ảnh tham khảo: tường kem, viền đồng,
  // bệ gỗ nâu, mặt nhung đỏ và tủ kính trưng bày.
  const wood=walkMaterial(0x4a2c1b,.58,.12),woodTop=walkMaterial(0x6b4027,.48,.16),
    brass=walkMaterial(0xb88b48,.3,.68),velvet=walkMaterial(0x681f25,.88,.02),
    stone=walkMaterial(0xbdb4a4,.72,.03),iron=walkMaterial(0x4a4943,.35,.72);
  const glass=new THREE.MeshStandardMaterial({color:0xd9e8e9,roughness:.12,metalness:.08,transparent:true,opacity:.18,depthWrite:false});
  function caseBase(x,z,w,d){
    walkBox(w,.62,d,wood,x,.36,z);walkBox(w+.06,.08,d+.06,brass,x,.71,z);
    walkBox(w-.12,.045,d-.12,velvet,x,.775,z);
    // Four slender glass sides and a clear lid.
    walkBox(.035,.62,d-.08,glass,x-w/2+.035,1.08,z,{cast:false});
    walkBox(.035,.62,d-.08,glass,x+w/2-.035,1.08,z,{cast:false});
    walkBox(w-.08,.62,.035,glass,x,1.08,z-d/2+.035,{cast:false});
    walkBox(w-.08,.62,.035,glass,x,1.08,z+d/2-.035,{cast:false});
    walkBox(w-.04,.025,d-.04,glass,x,1.405,z,{cast:false});
  }
  function plaque(x,z,title,sub,w=1.8,y=1.04,yaw=0,tilt=0){
    const mat=new THREE.MeshBasicMaterial({map:walkLabelTexture(title,sub,'#382116'),side:THREE.DoubleSide});
    const p=new THREE.Mesh(new THREE.PlaneGeometry(w,.42),mat);p.position.set(x,y,z);p.rotation.set(tilt,yaw,0);W.scene.add(p);
  }
  // Paired displays flank the central aisle: flag/statue on one side, cannon/swords opposite.
  walkCylinder(1.12,1.12,.16,wood,17.1,.18,-3.55,{seg:32});
  walkCylinder(.94,1.02,.12,brass,17.1,.32,-3.55,{seg:32});
  walkBox(1.72,.5,1.42,woodTop,17.1,.64,-3.55);
  walkBox(1.78,.08,1.48,brass,17.1,.93,-3.55);
  const statue=new THREE.Group();statue.position.set(17.1,.97,-3.55);statue.rotation.y=0;W.scene.add(statue);
  walkLoadGLB('tuong3d.glb',statue,3,0x765333,.48,.62,()=>walkModelStatue(statue));
  const statueItem=S.items.find(i=>i.type==='daocu'&&/tượng\s*quang trung/i.test(i.title||''));
  if(statueItem){statue.userData.item=statueItem;W.targets.push(statue);}
  plaque(17.1,-2.55,'TƯỢNG QUANG TRUNG','THỜI KỲ TÂY SƠN',1.7,1.04,0);
  // Pair the cannon with the gun case on the visitor's right; the other two displays stay opposite.
  walkBox(2.72,.32,1.58,wood,10.55,.2,3.55);
  walkBox(2.78,.07,1.64,brass,10.55,.395,3.55);
  walkBox(2.64,.045,1.5,velvet,10.55,.45,3.55);
  const cannon=new THREE.Group();cannon.position.set(10.55,.49,3.55);cannon.rotation.y=-Math.PI/2;W.scene.add(cannon);
  walkLoadGLB('phao.glb',cannon,1.85,0x815840,.16,.92,()=>walkModelCannon(cannon),{fitAxis:'z',rotationX:.24,baseOffset:.12,carriage:true});
  plaque(10.55,2.55,'PHÁO THỜI TÂY SƠN','MÔ HÌNH TÁI DỰNG',1.8,1.04,Math.PI);
  // Helmet under glass.
  // caseBase(17.1,-3.65,2.35,1.35);
  // const helmetMetal=walkMaterial(0x75634b,.32,.72),helmetDark=walkMaterial(0x3e3024,.5,.42);
  // const dome=new THREE.Mesh(new THREE.SphereGeometry(.42,20,14,0,Math.PI*2,0,Math.PI*.58),helmetMetal);dome.position.set(17.1,1.12,-3.65);dome.scale.set(1,.8,1);W.scene.add(dome);
  // walkBox(.9,.07,.72,helmetDark,17.1,.91,-3.65);walkBox(.08,.34,.08,brass,17.1,1.42,-3.65);
  // plaque(17.1,.0,'MŨ TRẤN THỦ','TRANG BỊ QUÂN ĐỘI',1.7);
  // The matchlock rests horizontally on the same burgundy display case.
  caseBase(17.1,3.55,3.5,1.9);
  const gun=new THREE.Group();gun.position.set(17.1,.79,3.55);gun.rotation.y=Math.PI/2;W.scene.add(gun);
  walkLoadGLB('sung.glb',gun,0.3,0x684323,0,.86,()=>walkModelGun(gun),{fitAxis:'x',preserveMaterials:true});
  plaque(17.1,2.48,'SÚNG ĐIỂU THƯƠNG','VŨ KHÍ THỜI TÂY SƠN',2.1,.55,Math.PI);
  // Reference photo mounted as a framed image on the back wall.
  const frame=walkMaterial(0xb88b48,.3,.6);
  //walkBox(4.7,2.8,.14,frameDark,19.68,2.75,0);
  walkBox(.18,.12,4.82,frame,19.58,4.17,0);walkBox(.18,.12,4.82,frame,19.58,1.33,0);
  walkBox(.12,2.85,.18,frame,19.58,2.75,-2.35);walkBox(.12,2.85,.18,frame,19.58,2.75,2.35);
  const canvas=new THREE.Mesh(new THREE.PlaneGeometry(4.5,2.58),new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide}));
  canvas.position.set(19.57,2.75,0);canvas.rotation.y=-Math.PI/2;W.scene.add(canvas);
  W.pendingArtifactImages.push(()=>{
    const refImg=new Image();
    refImg.onload=()=>{const tex=new THREE.Texture(refImg);tex.colorSpace=THREE.SRGBColorSpace;tex.needsUpdate=true;canvas.material.map=tex;canvas.material.color.set(0xffffff);canvas.material.needsUpdate=true;};
    refImg.onerror=()=>console.error('Không tải được ảnh phòng hiện vật: phong-hien-vat-tay-son.png.');
    refImg.src='phong-hien-vat-tay-son.png';
  });
  // Warm spotlights and subtle brass posts evoke the museum reference.
  [[10.55,-4.25],[14,-4.25],[17.35,-4.25],[17.1,3.55]].forEach(([x,z])=>walkPointLight(x,4.7,z,0xffd39a,1.0,5.5));
  const postMat=walkMaterial(0xc49a51,.26,.7);
  [[9.3,-5.55],[12.3,-5.55],[15.8,-5.55],[18.6,-5.55],[9.3,5.55],[12.3,5.55],[15.8,5.55],[18.6,5.55]].forEach(([x,z])=>{
    walkCylinder(.055,.07,.68,postMat,x,.34,z,{seg:12});walkSphere(.12,postMat,x,.72,z,{x:1,y:1,z:1});
  });
}
function walkLoadNearbyModels(){
  if(!W.camera||!W.pendingModels.length)return;
  const remaining=[];
  W.pendingModels.forEach(model=>{
    const position=model.target.getWorldPosition(new THREE.Vector3());
    if(position.distanceTo(W.camera.position)<=6.5){
      const key=model.path;
      if(!W.modelLoadsStarted.has(key)){
        W.modelLoadsStarted.add(key);
        walkLoadGLB(model.path,model.target,model.height,model.color,model.metalness,model.roughness,model.fallback,Object.assign({},model.options,{loadNow:true}));
      }
    }else remaining.push(model);
  });
  W.pendingModels=remaining;
}
function walkLoadArtifactImages(){
  if(W.artifactImagesLoaded)return;
  W.artifactImagesLoaded=true;
  W.pendingArtifactImages.splice(0).forEach(load=>load());
}

function walkBattleGroundHeight(x,z,campaign){
  const edge=Math.min(1,Math.abs(z)/5.8);
  const ridgeA=Math.exp(-((x+1.25)**2/1.1+(z+1.5)**2/3.2)),ridgeB=Math.exp(-((x-1.15)**2/1.2+(z-.75)**2/3.8));
  const elevation=campaign==='thanh'?ridgeA*.62+ridgeB*.42:Math.max(0,Math.abs(z)-.8)*.085;
  return .02+edge*.08+elevation+Math.sin(x*2.1+z*.6)*.012+Math.cos(x*.9-z*1.4)*.01;
}
function walkBattleGround(group,groundColor,campaign){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const context=canvas.getContext('2d');
  context.fillStyle='#ffffff';context.fillRect(0,0,512,512);
  const flecks=['rgba(229,216,184,.07)','rgba(32,42,31,.09)','rgba(120,103,71,.09)','rgba(238,229,198,.05)'];
  for(let i=0;i<2800;i++){
    const x=(i*97)%512,y=(i*193)%512,size=1+(i%3);
    context.fillStyle=flecks[i%flecks.length];context.fillRect(x,y,size,size*.65);
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const geometry=new THREE.PlaneGeometry(5.92,11.82,36,64),positions=geometry.attributes.position,colors=[];
  const lowColor=new THREE.Color(groundColor),highColor=new THREE.Color(campaign==='thanh'?0x8d8165:0x7a8466);
  for(let i=0;i<positions.count;i++){
    const x=positions.getX(i),z=-positions.getY(i),height=walkBattleGroundHeight(x,z,campaign);
    const edge=Math.min(1,Math.abs(z)/5.8),ridgeA=Math.exp(-((x+1.25)**2/1.1+(z+1.5)**2/3.2)),ridgeB=Math.exp(-((x-1.15)**2/1.2+(z-.75)**2/3.8));
    const elevation=campaign==='thanh'?ridgeA*.62+ridgeB*.42:Math.max(0,Math.abs(z)-.8)*.085;
    positions.setZ(i,height);
    const tint=lowColor.clone().lerp(highColor,Math.min(1,elevation/.62+edge*.2));colors.push(tint.r,tint.g,tint.b);
  }
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
  const surface=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({map:texture,vertexColors:true,roughness:.98,side:THREE.DoubleSide}));
  surface.rotation.x=-Math.PI/2;surface.position.y=.02;surface.receiveShadow=true;group.add(surface);
}
function walkBattleTree(group,x,z,size=1){
  const bark=walkMaterial(0x554a38,.92,.01),canopy=walkMaterial(0x465440,.97,.01);
  walkCylinder(.035*size,.055*size,.34*size,bark,x,.17*size,z,{parent:group,seg:6});
  const crownGeometry=new THREE.IcosahedronGeometry(.24*size,1);
  const crown=new THREE.Mesh(crownGeometry,canopy);crown.position.set(x,.48*size,z);crown.scale.set(1.05,1.3,.92);crown.castShadow=true;group.add(crown);
  const crown2=new THREE.Mesh(crownGeometry,canopy);crown2.position.set(x+.13*size,.58*size,z-.05*size);crown2.scale.set(.78,1.05,.84);crown2.castShadow=true;group.add(crown2);
}
function walkBattleLabel(group,text,x,z,bg='#3a3026',width=1.05){
  const root=new THREE.Group();root.position.set(x,.46,z);
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const context=canvas.getContext('2d');
  context.fillStyle=bg;context.fillRect(0,0,1024,256);context.strokeStyle='#d7b56b';context.lineWidth=8;context.strokeRect(10,10,1004,236);
  context.fillStyle='#f5e4b3';context.font='bold 68px Georgia';context.textAlign='center';context.textBaseline='middle';context.fillText(text,512,128,950);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const plate=new THREE.Mesh(new THREE.PlaneGeometry(width,.42),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));
  plate.rotation.x=-Math.PI/2;root.add(plate);group.add(root);
}
function walkBattleBoat(group,x,z,color){
  const boat=new THREE.Group();boat.position.set(x,.14,z);boat.scale.set(.48,.48,.48);
  const team=color==='xiem'?'xiem':'tayson';
  const mats=group.userData.battleBoatMats||(group.userData.battleBoatMats={
    xiem:{hull:walkMaterial(0x7f302b,.58,.16),trim:walkMaterial(0xb99455,.45,.36),sail:walkMaterial(0xe8d6b5,.92,.02,{side:THREE.DoubleSide}),flag:walkMaterial(0xb3262e,.68,.08,{side:THREE.DoubleSide})},
    tayson:{hull:walkMaterial(0x244d62,.48,.28),trim:walkMaterial(0xc39b58,.42,.4),sail:walkMaterial(0xd5d9ca,.9,.02,{side:THREE.DoubleSide}),flag:walkMaterial(0xa3262e,.6,.12,{side:THREE.DoubleSide})}
  });
  const material=mats[team];
  const hullShape=new THREE.Shape();hullShape.moveTo(-.78,0);hullShape.quadraticCurveTo(-.65,-.22,-.3,-.2);hullShape.lineTo(.48,-.16);hullShape.quadraticCurveTo(.78,0,.48,.16);hullShape.lineTo(-.48,.18);hullShape.quadraticCurveTo(-.7,.14,-.78,0);
  const hullGeometry=new THREE.ExtrudeGeometry(hullShape,{depth:.2,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.035,bevelThickness:.025});hullGeometry.translate(0,0,-.1);hullGeometry.rotateX(-Math.PI/2);
  const hull=new THREE.Mesh(hullGeometry,material.hull);hull.position.y=.08;hull.castShadow=true;boat.add(hull);
  walkBox(1.02,.09,.34,material.trim,-.02,.22,0,{parent:boat});
  walkBox(.3,.2,.28,material.hull,-.3,.34,0,{parent:boat});
  walkCylinder(.035,.045,.72,material.trim,-.05,.62,0,{parent:boat,seg:8});
  const sailShape=new THREE.Shape();sailShape.moveTo(0,0);sailShape.lineTo(.34,.54);sailShape.lineTo(.36,0);sailShape.closePath();
  const sail=new THREE.Mesh(new THREE.ShapeGeometry(sailShape),material.sail);sail.position.set(-.08,.34,.025);boat.add(sail);
  const pennant=new THREE.Mesh(new THREE.PlaneGeometry(.25,.13),material.flag);pennant.position.set(.02,.93,.025);boat.add(pennant);
  const wake=new THREE.Mesh(new THREE.CircleGeometry(.44,20),new THREE.MeshBasicMaterial({color:0xc4e2df,transparent:true,opacity:.17,depthWrite:false}));wake.rotation.x=-Math.PI/2;wake.position.set(-.42,.025,0);wake.scale.set(1,.23,1);boat.add(wake);
  boat.userData.team=team;group.add(boat);return boat;
}
function walkRiverRelief(group){
  const water=new THREE.Shape();water.moveTo(-3.02,-.78);water.bezierCurveTo(-1.8,-1.02,-1.3,-.28,-.22,-.38);water.bezierCurveTo(.92,-.49,1.62,-.9,3.02,-.62);water.lineTo(3.02,.66);water.bezierCurveTo(1.8,.42,.93,.94,-.13,.82);water.bezierCurveTo(-1.32,.72,-1.82,.23,-3.02,.48);water.closePath();
  const riverGeometry=new THREE.ShapeGeometry(water,24);riverGeometry.rotateX(-Math.PI/2);
  const river=new THREE.Mesh(riverGeometry,new THREE.MeshPhysicalMaterial({color:0x557d83,roughness:.27,metalness:.12,clearcoat:.36,clearcoatRoughness:.3}));river.position.y=.12;river.receiveShadow=true;group.add(river);
  const shoal=new THREE.Shape();shoal.moveTo(-.9,-.1);shoal.quadraticCurveTo(-.6,-.34,-.1,-.3);shoal.quadraticCurveTo(.55,-.26,.95,-.02);shoal.quadraticCurveTo(.63,.28,.08,.3);shoal.quadraticCurveTo(-.58,.28,-.9,-.1);shoal.closePath();
  const islandGeometry=new THREE.ShapeGeometry(shoal,20);islandGeometry.rotateX(-Math.PI/2);
  const island=new THREE.Mesh(islandGeometry,walkMaterial(0x58634c,.98,.01));island.position.set(.55,.145,-.04);island.receiveShadow=true;group.add(island);
  [[-2.5,-1.32],[-1.55,-1.5],[1.55,-1.43],[2.5,-1.22],[-2.35,1.38],[1.9,1.42]].forEach(([x,z],i)=>walkBattleTree(group,x,z,.8+(i%2)*.1));
  walkBattleLabel(group,'RẠCH GẦM',-2.15,-.92,'#3a3026',1.45);
  walkBattleLabel(group,'XOÀI MÚT',2.12,.91,'#3a3026',1.45);
  walkBattleLabel(group,'CÙ LAO THỚI SƠN',.55,-.02,'#3d4638',1.8);
  walkBattleLabel(group,'KIM SƠN',-2.0,2.2,'#4b4437',1.15);
  walkBattleLabel(group,'BÌNH ĐỨC',1.9,-2.05,'#4b4437',1.25);
  W.battleGroup=group;W.battleFleet=[];W.battleShots=[];W.battleEffects=[];W.battleMuzzles=[];
  const addBoat=(x,z,team,role,index,heading)=>{
    const mesh=walkBattleBoat(group,x,z,team);mesh.rotation.y=heading;mesh.userData.role=role;mesh.userData.slot=index;
    W.battleFleet.push({mesh,team,role,index,startX:x,startZ:z});return mesh;
  };
  for(let i=0;i<8;i++)addBoat(1.12+(i%4)*.43,-.28+Math.floor(i/4)*.55,'xiem','fleet',i,Math.PI);
  addBoat(-2.35,.06,'tayson','decoy',0,0);
  for(let i=0;i<3;i++){
    const z=-.34+i*.34;
    const left=addBoat(-2.72,z,'tayson','ambush-left',i,0);left.visible=false;
    const right=addBoat(2.72,z,'tayson','ambush-right',i,Math.PI);right.visible=false;
  }
  [-1,1].forEach(side=>{
    const cannon=new THREE.Group();cannon.position.set(0,.19,side*1.33);cannon.rotation.y=side<0?Math.PI/2:-Math.PI/2;cannon.scale.setScalar(.34);walkModelCannon(cannon);group.add(cannon);
    const flash=new THREE.Mesh(new THREE.SphereGeometry(.16,12,10),new THREE.MeshBasicMaterial({color:0xffb33b,transparent:true,opacity:0,depthWrite:false}));
    flash.position.set(0,.55,side*.98);group.add(flash);W.battleMuzzles.push(flash);
  });
}
function walkBattleBurst(position,startAt=0){
  if(!W.battleGroup)return;
  const root=new THREE.Group();root.position.copy(position);root.position.y=Math.max(position.y,walkBattleGroundHeight(position.x,position.z,W.activeCampaign)+.14);W.battleGroup.add(root);
  const add=(color,size,x,y,z)=>{
    const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:0,depthWrite:false});
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(size,10,8),material);mesh.position.set(x,y,z);root.add(mesh);return mesh;
  };
  const fire=[add(0xff7a19,.12,-.06,.12,0),add(0xffc04a,.09,.04,.18,.03),add(0xe94b22,.1,.08,.1,-.04)];
  const smoke=[add(0x68635c,.1,-.08,.28,0),add(0x79736a,.12,.08,.37,.03),add(0x494945,.095,0,.48,-.02)];
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.12,.018,5,18),new THREE.MeshBasicMaterial({color:0xffc04a,transparent:true,opacity:0,depthWrite:false}));ring.rotation.x=Math.PI/2;root.add(ring);
  W.battleEffects.push({root,fire,smoke,ring,startAt,duration:2.5});
}
function walkBattleClearEffects(){
  W.battleEffects.forEach(effect=>{effect.root.parent?.remove(effect.root);effect.root.traverse(node=>{node.material?.dispose();node.geometry?.dispose();});});
  W.battleShots.forEach(shot=>{shot.mesh.parent?.remove(shot.mesh);shot.mesh.material?.dispose();shot.mesh.geometry?.dispose();});
  W.battleEffects=[];W.battleShots=[];W.battleMuzzles.forEach(muzzle=>{muzzle.material.opacity=0;muzzle.scale.setScalar(.01);});
}
function walkBattleBuildShots(){
  if(!W.battleGroup)return;walkBattleClearEffects();
  const targets=W.battleFleet.filter(unit=>unit.team==='xiem'&&unit.role==='fleet');
  targets.slice(0,6).forEach((unit,index)=>{
    const side=index%2?1:-1,mesh=new THREE.Mesh(new THREE.SphereGeometry(.065,10,8),new THREE.MeshBasicMaterial({color:0xffd875,transparent:true,opacity:0}));
    mesh.visible=false;W.battleGroup.add(mesh);
    W.battleShots.push({mesh,unit,side,startAt:13.1+index*.43,duration:.48,hit:false});
  });
}
function walkBattleResetFleet(){
  W.battleFleet.forEach(unit=>{unit.mesh.visible=unit.role!=='ambush-left'&&unit.role!=='ambush-right';unit.mesh.position.set(unit.startX,.14,unit.startZ);unit.mesh.rotation.z=0;unit.mesh.userData.battleHit=false;});
  walkBattleBuildShots();
}
function walkBattleResetArmy(){
  walkBattleClearEffects();W.battleSiegeTriggered=false;
  W.battleArmy.forEach(unit=>{unit.mesh.visible=true;unit.mesh.position.set(unit.startX,walkBattleGroundHeight(unit.startX,unit.startZ,'thanh')+.035,unit.startZ);unit.mesh.rotation.y=unit.team==='taySon'?Math.PI:0;});
}
function walkBattleUpdateEffects(t){
  W.battleEffects=W.battleEffects.filter(effect=>{
    const age=t-effect.startAt;if(age<0)return true;
    if(age>=effect.duration){effect.root.parent?.remove(effect.root);effect.root.traverse(node=>{node.material?.dispose();node.geometry?.dispose();});return false;}
    const life=age/effect.duration,fade=Math.min(1,age*7,Math.max(0,(1-life)*4));
    effect.fire.forEach((mesh,index)=>{mesh.material.opacity=.92*fade;mesh.position.y=.1+life*(.48+index*.06);mesh.scale.setScalar(1+life*.55);});
    effect.smoke.forEach((mesh,index)=>{mesh.material.opacity=.48*fade;mesh.position.y=.26+life*(.95+index*.12);mesh.scale.setScalar(.7+life*1.3);});
    effect.ring.material.opacity=.6*(1-life);effect.ring.scale.setScalar(.7+life*3.2);
    return true;
  });
  W.battleShots.forEach(shot=>{
    const age=t-shot.startAt;if(age<0||age>shot.duration){shot.mesh.visible=false;return;}
    shot.mesh.visible=true;const p=ease(age/shot.duration),origin=new THREE.Vector3(-.88,.38,shot.side*1.28),target=shot.unit.mesh.position.clone();target.y=.3;
    shot.mesh.position.lerpVectors(origin,target,p);shot.mesh.material.opacity=Math.sin(p*Math.PI);
    if(p>=1&&!shot.hit){shot.hit=true;shot.unit.mesh.userData.battleHit=true;walkBattleBurst(target,shot.startAt+shot.duration);}
  });
  const volley=t>=13.05&&t<16.2?Math.max(0,Math.sin((t-13.05)*Math.PI*2.4)):0;
  W.battleMuzzles.forEach((muzzle,index)=>{muzzle.material.opacity=volley*(index? .72:1);muzzle.scale.setScalar(.01+volley*.9);});
}
function walkBattleUpdateFleet(t){
  const decoy=ease((t-4)/1.5),retreat=ease((t-5.5)/1.1),block=ease((t-7.4)/1.8),retreatEnemy=ease((t-16)/2.2);
  W.battleFleet.forEach(unit=>{
    const {mesh,role,index}=unit;let x=unit.startX,z=unit.startZ;
    if(role==='decoy')x=mix(-2.35,mix(-.55,-2.72,retreat),decoy);
    if(role==='fleet'){
      const column=index%4,row=Math.floor(index/4),start=1.12+column*.43;
      x=mix(start,-.55+column*.3,ease((t-4.2)/4));z=-.28+row*.55+Math.sin(t*2+index)*.018;
      x=mix(x,2.9+column*.18,retreatEnemy);
      const sink=index<6?ease((t-(16.2+index*.25))/.85):0;
      mesh.position.y=.14-sink*.16;mesh.rotation.z=sink*.22+Math.sin(t*3+index)*.025;
      if(sink>.88&&t>15.6)mesh.visible=false;
    }else if(role==='ambush-left'||role==='ambush-right'){
      const side=role==='ambush-left'?-1:1;mesh.visible=t>=7.25;
      x=side*mix(2.72,.72,block);z=unit.startZ+Math.sin(t*2+index)*.025;
      mesh.position.y=.14+Math.sin(t*2.2+index)*.025;mesh.rotation.z=Math.sin(t*1.8+index)*.035;
    }
    if(role==='decoy')mesh.position.y=.14+Math.sin(t*2.1)*.03;
    mesh.position.x=x;mesh.position.z=z;
  });
  const targets=W.battleFleet.filter(unit=>unit.team==='xiem'&&unit.role==='fleet');
  W.battleShots.forEach(shot=>{if(shot.unit)shot.mesh.visible=t>=shot.startAt&&t<=shot.startAt+shot.duration;});
  targets.forEach((unit,index)=>{
    const hitAt=16.2+index*.25;
    if(t>=hitAt&&!unit.mesh.userData.battleHit){unit.mesh.userData.battleHit=true;walkBattleBurst(unit.mesh.position,hitAt);}
  });
}
function walkBattleUpdateThanh(t){
  if(t>=10.5&&!W.battleSiegeTriggered){
    W.battleSiegeTriggered=true;
    walkBattleBurst(new THREE.Vector3(-1.45,.2,-2.65),10.5);
    walkBattleBurst(new THREE.Vector3(1.35,.2,.35),10.9);
  }
  W.battleArmy.forEach((unit,index)=>{
    const {mesh,team,role,formation,startZ,startX}=unit;
    if(role==='attacker'){
      const ngoc=formation==='ngoc-hoi',approachStart=ngoc?1.2:5.6,approachEnd=ngoc?10.6:11.2;
      const assaultZ=ngoc?-2.75:.42,cityZ=-5.35;
      let z=mix(startZ,assaultZ,ease((t-approachStart)/(approachEnd-approachStart)));
      z=mix(z,cityZ,ease((t-11.5)/4.8));
      const x=startX+(ngoc?.45:.12)*ease((t-approachStart)/4);
      mesh.position.x=x;mesh.position.z=z;mesh.rotation.y=Math.PI+Math.sin(t*2+index)*.025;
      mesh.position.y=walkBattleGroundHeight(x,z,'thanh')+.035+Math.abs(Math.sin(t*7+index*.7))*.018;
    }else{
      const rout=ease((t-11.2)/3.1);
      const z=mix(startZ,-5.9,rout);
      mesh.position.z=z;mesh.rotation.y=Math.PI*rout;
      mesh.position.y=walkBattleGroundHeight(startX,z,'thanh')+.035+Math.abs(Math.sin(t*8+index))*.012;
      if(t>16.8)mesh.visible=false;
    }
  });
}
function walkBattleSoldier(group,x,z,team,heading,shield=false){
  const mats=group.userData.soldierMaterials||(group.userData.soldierMaterials={
    taySon:{cloth:walkMaterial(0x786238,.84,.04),armor:walkMaterial(0x4e6844,.72,.08),helmet:walkMaterial(0xb28a48,.48,.4),skin:walkMaterial(0x9b7150,.82,.02),wood:walkMaterial(0x63452a,.82,.04),shield:walkMaterial(0x987b49,.88,.02)},
    thanh:{cloth:walkMaterial(0x41494c,.86,.04),armor:walkMaterial(0x59636a,.68,.1),helmet:walkMaterial(0x51443a,.74,.12),skin:walkMaterial(0x89684e,.84,.02),wood:walkMaterial(0x57402c,.82,.02),shield:walkMaterial(0x786d58,.88,.02)}
  });
  const material=mats[team],soldier=new THREE.Group();soldier.position.set(x,walkBattleGroundHeight(x,z,'thanh')+.035,z);soldier.rotation.y=heading;
  walkBox(.18,.24,.15,material.armor,0,.29,0,{parent:soldier});
  walkSphere(.085,material.skin,0,.48,.015,{x:1,y:1.05,z:.9},soldier);
  const helmet=new THREE.Mesh(new THREE.SphereGeometry(.09,10,8,0,Math.PI*2,0,Math.PI*.62),material.helmet);helmet.position.set(0,.53,.01);soldier.add(helmet);
  for(const side of [-1,1]){
    const leg=walkCylinder(.035,.045,.19,material.cloth,side*.055,.105,0,{parent:soldier,seg:7});leg.rotation.z=side*.08;
    const arm=walkCylinder(.032,.038,.2,material.cloth,side*.13,.31,.015,{parent:soldier,seg:7});arm.rotation.z=side*.48;
  }
  const spear=walkCylinder(.012,.018,.67,material.wood,-.13,.49,-.015,{parent:soldier,seg:6});spear.rotation.z=-.08;
  const point=new THREE.Mesh(new THREE.ConeGeometry(.035,.11,5),material.helmet);point.position.set(-.16,.85,-.015);point.rotation.z=-.08;soldier.add(point);
  if(shield){
    walkBox(.24,.34,.07,material.shield,.14,.33,.16,{parent:soldier});
    walkBox(.16,.25,.018,mats.taySon.helmet,.14,.33,.2,{parent:soldier});
  }
  group.add(soldier);return soldier;
}
function walkBattleFort(group,x,z,name,width,defendedBy){
  const earth=walkMaterial(0x776648,.96,.01),stone=walkMaterial(0x665c4d,.9,.02),roof=walkMaterial(0x554338,.83,.04);
  const root=new THREE.Group();root.position.set(x,walkBattleGroundHeight(x,z,'thanh')+.025,z);group.add(root);
  walkBox(width,.12,.92,earth,0,.06,0,{parent:root});
  walkBox(width*.42,.42,.14,stone,-width*.29,.29,-.34,{parent:root});
  walkBox(width*.42,.42,.14,stone,width*.29,.29,-.34,{parent:root});
  walkBox(width*.36,.3,.14,roof,0,.23,-.34,{parent:root});
  walkBox(.16,.62,.34,stone,-width*.48,.37,-.38,{parent:root});
  walkBox(.16,.62,.34,stone,width*.48,.37,-.38,{parent:root});
  walkBox(.56,.06,.22,roof,0,.62,-.38,{parent:root});
  walkBox(.34,.38,.1,walkMaterial(0x30271f,.9,.01),0,.2,-.25,{parent:root});
  for(let index=0;index<5;index++)walkBox(.12,.16,.14,stone,-width*.42+index*width*.21,.62,-.37,{parent:root});
  walkBattleLabel(root,name,0,-.95,defendedBy,width*1.08);
}
function walkThanhRelief(group){
  const fort=walkMaterial(0x58483a,.9,.02),brick=walkMaterial(0x625046,.88,.02);
  const ridge=new THREE.Mesh(new THREE.SphereGeometry(1,24,12),walkMaterial(0x827456,.98,.01));ridge.position.set(-2.1,.19,4.8);ridge.scale.set(1.25,.22,.72);group.add(ridge);
  walkBattleFort(group,-1.45,-2.35,'NGỌC HỒI',1.45,'ĐỒN QUÂN THANH');
  walkBattleFort(group,1.35,.75,'ĐỐNG ĐA',1.1,'ĐỒN QUÂN THANH');
  const cityWallY=walkBattleGroundHeight(1.8,-4.95,'thanh');
  walkBox(2.4,.1,.18,brick,1.8,cityWallY+.05,-4.95,{parent:group});
  for(let i=0;i<4;i++)walkBox(.17,.32,.16,fort,.8+i*.55,cityWallY+.26,-4.95,{parent:group});
  walkBattleLabel(group,'CỬA THÀNH THĂNG LONG',1.65,-5.15,'#3c3932',2.1);
  walkBattleLabel(group,'TAM ĐIỆP',-2.05,4.85,'#433c33',1.45);
  walkBattleLabel(group,'HƯỚNG BẮC',-.05,5.3,'#435247',1.25);
  W.battleGroup=group;W.battleArmy=[];W.battleSiegeTriggered=false;
  const addSoldier=(x,z,team,role,heading,shield=false,formation='')=>{
    const mesh=walkBattleSoldier(group,x,z,team,heading,shield);
    W.battleArmy.push({mesh,team,role,formation,startX:x,startZ:z});return mesh;
  };
  for(let row=0;row<5;row++)for(let col=0;col<4;col++){
    const x=-2.55+col*.36,z=2.05+row*.39;
    addSoldier(x,z,'taySon','attacker',Math.PI,true,'ngoc-hoi');
  }
  for(let row=0;row<4;row++)for(let col=0;col<3;col++){
    const x=.8+col*.35,z=2.35+row*.4;
    addSoldier(x,z,'taySon','attacker',Math.PI,false,'dong-da');
  }
  for(let row=0;row<2;row++)for(let col=0;col<5;col++)addSoldier(-2.25+col*.36,-3.08+row*.3,'thanh','defender',0);
  for(let col=0;col<5;col++)addSoldier(.48+col*.34,.05,'thanh','defender',0);
  for(const x of [-2.1,1.45]){
    const z=x<0?-3.55:-.45,cannon=new THREE.Group();cannon.position.set(x,walkBattleGroundHeight(x,z,'thanh')+.04,z);cannon.rotation.y=x<0?0:Math.PI;cannon.scale.setScalar(.2);walkModelCannon(cannon);group.add(cannon);
  }
}
function walkBuildBattle(){
  const campaigns=[
    {id:'xiem',x:-2.82,title:'RẠCH GẦM – XOÀI MÚT',subtitle:'CHIẾN DỊCH CHỐNG QUÂN XIÊM',color:'#4a1718',build:walkRiverRelief},
    {id:'thanh',x:2.82,title:'NGỌC HỒI – ĐỐNG ĐA',subtitle:'CHIẾN DỊCH CHỐNG QUÂN THANH',color:'#273c32',build:walkThanhRelief}
  ];
  campaigns.forEach(campaign=>{
    const item=S.items.find(it=>it.type==='sahinh'&&(it.campaign||'xiem')===campaign.id)||{id:'map-'+campaign.id,campaign:campaign.id,type:'sahinh',title:campaign.title,detail:campaign.subtitle};
    const group=new THREE.Group();group.position.set(campaign.x,0,-14);group.scale.set(.76,.76,.76);group.userData.item=item;group.userData.campaign=campaign.id;W.battleCampaignGroups[campaign.id]=group;W.scene.add(group);W.targets.push(group);
    walkBattleGround(group,campaign.id==='xiem'?0x535b4b:0x6b5d4c,campaign.id);campaign.build(group);
    walkSign(campaign.title,campaign.subtitle,campaign.x,2.55,-19.68,0,campaign.color);
    walkPointLight(campaign.x,3.8,-14,0xffd18a,.85,6);
  });
  // Bốn TV treo tường: hai bên trái cho chiến dịch quân Xiêm, hai bên phải cho quân Thanh.
  const tvFrame=walkMaterial(0x252a2e,.32,.58);W.tvScreens=[];W.tvVideoElements={};W.tvVideoTextures={};W.tvPreviewsLoaded=new Set();
  [['xiem',-5.78,-17.2,Math.PI/2],['xiem',-5.78,-11.2,Math.PI/2],['thanh',5.78,-17.2,-Math.PI/2],['thanh',5.78,-11.2,-Math.PI/2]].forEach(([campaign,x,z,yaw],index)=>{
    const root=new THREE.Group();root.position.set(x,3.15,z);root.rotation.y=yaw;
    const frame=new THREE.Mesh(new THREE.BoxGeometry(2.9,1.72,.16),tvFrame);root.add(frame);
    const screenMat=new THREE.MeshBasicMaterial({map:walkTVTexture(campaign,index),side:THREE.DoubleSide});
    const screen=new THREE.Mesh(new THREE.PlaneGeometry(2.65,1.48),screenMat);screen.position.z=.086;root.add(screen);W.tvScreens.push({campaign,mesh:screen});
    walkSign('VIDEO SA HÌNH',campaign==='xiem'?'CHIẾN DỊCH QUÂN XIÊM':'CHIẾN DỊCH QUÂN THANH',x,2.12,z,yaw,campaign==='xiem'?'#4a1718':'#273c32',2.45,.44);
    const hit=new THREE.Mesh(new THREE.PlaneGeometry(2.8,1.65),new THREE.MeshBasicMaterial({transparent:true,opacity:.001,side:THREE.DoubleSide,depthWrite:false}));hit.position.copy(root.position);hit.rotation.y=yaw;hit.userData.item={id:'tv-'+campaign+'-'+index,type:'video',title:campaign==='xiem'?'Video sa hình – Kháng chiến chống quân Xiêm':'Video sa hình – Kháng chiến chống quân Thanh',campaign,isVideoScreen:true};W.scene.add(hit);W.targets.push(hit);W.scene.add(root);
  });
}
function walkTVTexture(campaign,index){
  // Load the first frame as a preview; E starts playback with audio.
  if(W.tvVideoTextures[campaign])return W.tvVideoTextures[campaign];
  const video=document.createElement('video');
  const file=campaign==='xiem'?'RGXM.mp4':'NH-DD.mp4';
  video.src=new URL(file,location.href).href;
  video.muted=true;video.defaultMuted=true;video.volume=0;video.loop=true;video.playsInline=true;video.preload='none';
  video.setAttribute('muted','');video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','');
  video.style.position='fixed';video.style.width='1px';video.style.height='1px';video.style.opacity='0';video.style.pointerEvents='none';video.style.left='-10px';video.style.top='-10px';
  document.body.appendChild(video);W.tvVideoElements[campaign]=video;
  const tex=new THREE.VideoTexture(video);tex.colorSpace=THREE.SRGBColorSpace;tex.minFilter=THREE.LinearFilter;tex.magFilter=THREE.LinearFilter;
  W.tvVideoTextures[campaign]=tex;
  video.addEventListener('loadeddata',()=>{tex.needsUpdate=true;},{once:true});
  video.addEventListener('error',()=>console.error(`Không tải được video ${file} cho TV sa hình.`,video.error),{once:true});
  return tex;
}
function walkPrimeVideoPreviews(campaign){
  if(!campaign||W.tvPreviewsLoaded.has(campaign))return;
  const video=W.tvVideoElements[campaign];
  if(!video)return;
  W.tvPreviewsLoaded.add(campaign);
  video.preload='metadata';video.load();
}
function walkUpdateScreen(t){
  if(!W.screenCanvas||typeof filmFrame!=='function')return;
  try{const svg=filmFrame(Math.max(0,Math.min(5.95,t)));const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));const im=new Image();im.onload=()=>{const ctx=W.screenCanvas.getContext('2d');ctx.clearRect(0,0,800,450);ctx.drawImage(im,0,0,800,450);W.screenTexture.needsUpdate=true;URL.revokeObjectURL(url)};im.onerror=()=>URL.revokeObjectURL(url);im.src=url;}catch(e){}
}
function walkBuildDocuments(){
  const items=S.items.filter(i=>i.type==='tailieu');
  const wood=walkMaterial(0x493323,.66,.12),dark=walkMaterial(0x231913,.62,.2),brass=walkMaterial(0xa98243,.38,.5);
  const byCampaign={xiem:[],thanh:[]};items.forEach(it=>byCampaign[it.campaign==='thanh'?'thanh':'xiem'].push(it));
  const displayItems={
    xiem:byCampaign.xiem.length?byCampaign.xiem:[{id:'document-xiem-placeholder',campaign:'xiem',type:'tailieu',title:'Tư liệu kháng chiến chống Xiêm',text:'Tài liệu về trận Rạch Gầm – Xoài Mút.'}],
    thanh:byCampaign.thanh.length?byCampaign.thanh:[{id:'document-thanh-placeholder',campaign:'thanh',type:'tailieu',title:'Tư liệu kháng chiến chống Thanh',text:'Tài liệu về chiến thắng Ngọc Hồi – Đống Đa.'}]
  };
  Object.entries(displayItems).forEach(([campaign,group])=>{
    const centerX=campaign==='xiem'?-3:3,ink=campaign==='xiem'?'#4a1718':'#273c32';
    walkBox(2.25,.18,5.25,dark,centerX,.59,14.5);
    walkBox(2.1,.12,5.1,wood,centerX,.74,14.5);
    walkBox(2.2,.055,5.2,brass,centerX,.84,14.5);
    [-.82,.82].forEach(dx=>[-1.95,1.95].forEach(dz=>walkBox(.16,.58,.16,dark,centerX+dx,.29,14.5+dz)));
    walkSign(campaign==='xiem'?'HỒ SƠ CHỐNG QUÂN XIÊM':'HỒ SƠ CHỐNG QUÂN THANH',campaign==='xiem'?'RẠCH GẦM – XOÀI MÚT':'NGỌC HỒI – ĐỐNG ĐA',centerX,3.8,19.66,Math.PI,ink);
    const columns=group.length>3?2:1,rows=Math.ceil(group.length/columns),pageW=columns===1?1.55:.86,pageD=rows>2?.9:1.15;
    group.forEach((it,index)=>{
      const col=index%columns,row=Math.floor(index/columns);
      const x=centerX+(col-(columns-1)/2)*1.02,z=14.5+(row-(rows-1)/2)*1.36;
      const root=new THREE.Group();root.position.set(x,.86,z);root.userData.item=it;
      for(let sheet=2;sheet>0;sheet--){
        const backing=new THREE.Mesh(new THREE.PlaneGeometry(pageW,pageD),new THREE.MeshBasicMaterial({color:sheet===2?0xc4b798:0xd5c8aa,side:THREE.DoubleSide}));
        backing.rotation.x=-Math.PI/2;backing.position.set(-sheet*.02,.006+sheet*.005,sheet*.018);root.add(backing);
      }
      const page=new THREE.Mesh(new THREE.PlaneGeometry(pageW,pageD),new THREE.MeshBasicMaterial({map:walkTextureForItem(it),side:THREE.DoubleSide}));
      page.rotation.x=-Math.PI/2;page.position.y=.022;root.add(page);W.scene.add(root);W.targets.push(root);
    });
    walkPointLight(centerX,3.8,14.5,0xffd18a,1.0,5.5);
  });
}
function walkBuildAtmosphere(){
  const trim=walkMaterial(0x8b6938,.55,.35),dark=walkMaterial(0x1d100c,.85,.02);
  // Low plinths and discreet wall-edge lighting help visitors read the space depth.
  [[-14,-6],[14,-6],[-14,6],[14,6],[-6,-14],[6,-14],[-6,14],[6,14]].forEach(([x,z])=>{
    walkBox(.23,.35,.23,trim,x,.18,z);walkSphere(.1,new THREE.MeshStandardMaterial({color:0xffcc73,emissive:0xff8a2b,emissiveIntensity:1.4}),x,.45,z,{x:1,y:1,z:1});
  });
  const dust=new Float32Array(260*3);for(let i=0;i<260;i++){dust[i*3]=(Math.random()-.5)*40;dust[i*3+1]=1+Math.random()*4;dust[i*3+2]=(Math.random()-.5)*40;}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(dust,3));const mat=new THREE.PointsMaterial({color:0xd9b66a,size:.035,transparent:true,opacity:.4,depthWrite:false});W.scene.add(new THREE.Points(geo,mat));
}
function walkLocationLabel(){
  if(!W.camera)return 'Sảnh trung tâm';const x=W.camera.position.x,z=W.camera.position.z;const r=W.rooms.find(a=>x>=a.minX&&x<=a.maxX&&z>=a.minZ&&z<=a.maxZ);return r?r.label:'Sảnh trung tâm';
}
function walkTeleport(id){
  if(!W.camera)return;const p={gallery:{x:-10.3,z:0,yaw:Math.PI/2},artifacts:{x:10.3,z:0,yaw:-Math.PI/2},battle:{x:0,z:-9.4,yaw:0,pitch:-.36},documents:{x:0,z:10.3,yaw:Math.PI},hall:{x:0,z:2.5,yaw:0}}[id]||{x:0,z:2.5,yaw:0};
  W.camera.position.set(p.x,1.8,p.z);W.velocity.x=0;W.velocity.z=0;W.yaw=p.yaw;W.pitch=p.pitch||0;walkApplyLook();W.current=null;$('#walkStatus').textContent=p.label||WALK_TYPES[id]?.label||'Sảnh trung tâm';$('#walkPrompt').textContent='Hãy quan sát xung quanh, hướng tâm ngắm vào một hiện vật rồi nhấn E.';
  if(id==='battle')walkPrimeVideoPreviews('xiem');
}
function walkInBounds(x,z){return W.rooms.some(r=>x>=r.minX&&x<=r.maxX&&z>=r.minZ&&z<=r.maxZ);}
function walkCollision(x,z){const r=.32;return W.solids.some(b=>x+r>b.minX&&x-r<b.maxX&&z+r>b.minZ&&z-r<b.maxZ);}
function walkMove(dt){
  if(!W.active||!W.camera||!$('#walkIntro').hidden||!$('#walkDetail').hidden||!$('#walkImageZoom').hidden){W.velocity.x=0;W.velocity.z=0;return;}
  if(document.pointerLockElement!==$('#walkCanvas')&&(W.keys.turnL||W.keys.turnR)){W.yaw+=(W.keys.turnL?1:0)*dt*1.7-(W.keys.turnR?1:0)*dt*1.7;walkApplyLook();}
  let f=(W.keys.w||W.keys.arrowup?1:0)-(W.keys.s||W.keys.arrowdown?1:0)-W.joystick.y,r=(W.keys.d||W.keys.arrowright?1:0)-(W.keys.a||W.keys.arrowleft?1:0)+W.joystick.x;
  const len=Math.hypot(f,r);if(len){f/=len;r/=len;}
  const speed=W.keys.shift?6:4.1;
  const targetX=len?(-Math.sin(W.yaw)*f+Math.cos(W.yaw)*r)*speed:0;
  const targetZ=len?(-Math.cos(W.yaw)*f-Math.sin(W.yaw)*r)*speed:0;
  const blend=1-Math.exp(-12*dt);
  W.velocity.x+=(targetX-W.velocity.x)*blend;W.velocity.z+=(targetZ-W.velocity.z)*blend;
  if(Math.abs(W.velocity.x)<.015)W.velocity.x=0;if(Math.abs(W.velocity.z)<.015)W.velocity.z=0;
  let nx=W.camera.position.x+W.velocity.x*dt,nz=W.camera.position.z;
  if(walkInBounds(nx,nz)&&!walkCollision(nx,nz))W.camera.position.x=nx;else W.velocity.x=0;
  nx=W.camera.position.x;nz=W.camera.position.z+W.velocity.z*dt;
  if(walkInBounds(nx,nz)&&!walkCollision(nx,nz))W.camera.position.z=nz;else W.velocity.z=0;
}
function walkFindHit(){
  if(!W.camera||!W.ray)return null;W.ray.setFromCamera(W.centerRay,W.camera);const hits=W.ray.intersectObjects(W.targets,true);
  for(const h of hits){if(h.distance>7.5)continue;let o=h.object;while(o){if(o.userData&&o.userData.item)return{o,item:o.userData.item,distance:h.distance};o=o.parent;}}
  return null;
}
function walkUpdatePrompt(now){
  if(!W.active||!$('#walkIntro').hidden||!$('#walkDetail').hidden)return;
  if(W.battleRunning){const status=walkLocationLabel()+' · Đang tái hiện trận đánh';if(status!==W.statusText){$('#walkStatus').textContent=status;W.statusText=status;}return;}
  const room=walkLocationLabel();
  if(room===WALK_TYPES.gallery.label)walkPrimeGalleryImages();
  if(room===WALK_TYPES.artifacts.label){walkLoadArtifactImages();walkLoadNearbyModels();}
  if(room===WALK_TYPES.battle.label)walkPrimeVideoPreviews(W.camera.position.x<0?'xiem':'thanh');
  if(now-W.promptAt<50)return;W.promptAt=now;
  const hit=walkFindHit();W.current=hit?hit.item:null;
  const prompt=hit?'E / nhấp chuột  ·  '+hit.item.title+'  ·  '+(hit.item.isVideoScreen?'Phát video':'Mở thuyết minh'):document.pointerLockElement===$('#walkCanvas')?'Di chuyển bằng WASD · Ngắm vào vật thể để tương tác':'Nhấp vào cảnh 3D để bật điều khiển góc nhìn';
  if(prompt!==W.promptText){const p=$('#walkPrompt');p.textContent=prompt;p.style.borderColor=hit?'rgba(255,212,110,.9)':'rgba(230,196,122,.45)';W.promptText=prompt;}
  const status=walkLocationLabel()+(W.battleRunning?' · Đang tái hiện trận đánh':'');
  if(status!==W.statusText){$('#walkStatus').textContent=status;W.statusText=status;}
}
function walkInteract(){
  if(!W.active||!$('#walkIntro').hidden||!$('#walkDetail').hidden||!$('#walkImageZoom').hidden)return;
  const hit=walkFindHit();if(!hit){$('#walkPrompt').textContent='Hãy hướng tâm ngắm vào tranh, hiện vật, sa hình hoặc văn bản để mở nội dung.';return;}
  if(['xiem-4','thanh-4'].includes(hit.item.gallerySlot)){walkShowGalleryImage(hit.item);return;}
  if(hit.item.isVideoScreen){walkPlayCampaignVideo(hit.item.campaign);return;}
  walkOpenItem(hit.item);
}
function walkShowGalleryImage(it){
  W.keys={};W.velocity.x=0;W.velocity.z=0;
  $('#walkImageContent').innerHTML=artHTML(it);
  const image=$('#walkImageContent img');if(image)image.alt=it.title||'Ảnh tư liệu';
  $('#walkImageZoom').hidden=false;
  if(document.pointerLockElement===$('#walkCanvas'))document.exitPointerLock?.();
}
function walkCloseGalleryImage(){
  $('#walkImageZoom').hidden=true;$('#walkImageContent').replaceChildren();
  W.velocity.x=0;W.velocity.z=0;
}
function walkPlayCampaignVideo(campaign){
  const video=W.tvVideoElements[campaign];
  if(!video){toast('Không tìm thấy video cho màn chiếu này.');return;}
  Object.entries(W.tvVideoElements).forEach(([id,other])=>{if(id!==campaign){other.pause();other.muted=true;}});
  video.muted=false;video.volume=USER_PREFS.volume;
  if(video.readyState>=1)video.currentTime=0;
  video.controls=true;video.preload='auto';video.loop=false;video.playsInline=true;
  video.style.position='relative';video.style.display='block';video.style.width='100%';video.style.height='auto';video.style.maxWidth='100%';video.style.maxHeight='52vh';
  video.style.opacity='1';video.style.pointerEvents='auto';video.style.left='auto';video.style.top='auto';video.style.background='#000';video.style.borderRadius='10px';
  const label=campaign==='xiem'?'chiến dịch quân Xiêm':'chiến dịch quân Thanh';
  const content=$('#walkDetailContent');
  content.innerHTML=`<span class="badge">📺 TV sa hình</span><h2>Video sa hình – Kháng chiến chống ${campaign==='xiem'?'quân Xiêm':'quân Thanh'}</h2><p class="meta">Video tư liệu cho ${label}</p><div class="walk-active-video" id="walkActiveVideo"></div><p class="walk-video-error" id="walkVideoError" role="status" hidden></p><div class="actions"><button class="primary" id="walkVideoPlay" type="button">▶ Phát video</button><button id="walkDetailClose2" type="button">Đóng video</button></div>`;
  content.querySelector('#walkActiveVideo').append(video);
  $('#walkDetail').hidden=false;
  video.addEventListener('error',()=>walkReportVideoError(video,campaign),{once:true});
  $('#walkDetailClose2').onclick=walkCloseDetail;
  $('#walkDetailClose').onclick=walkCloseDetail;
  $('#walkVideoPlay').onclick=()=>walkStartCampaignVideo(video,campaign);
  if(document.pointerLockElement===$('#walkCanvas'))document.exitPointerLock?.();
  walkStartCampaignVideo(video,campaign);
}
function walkStartCampaignVideo(video,campaign){
  video.preload='auto';
  video.volume=USER_PREFS.volume;
  const play=video.play();
  if(!play||!play.then)return;
  play.then(()=>{
    $('#walkVideoError').hidden=true;
    $('#walkVideoPlay').hidden=true;
    toast(`Đang phát video chiến dịch quân ${campaign==='xiem'?'Xiêm':'Thanh'}.`);
  }).catch(error=>{
    if(error.name==='AbortError'&&!video.paused)return;
    $('#walkVideoPlay').hidden=false;
    $('#walkVideoError').hidden=false;
    $('#walkVideoError').textContent=`Không tự phát được video. Nhấn “Phát video” để thử lại. ${error.message}`;
    console.error(`Không phát được video chiến dịch ${campaign}.`,error);
  });
}
function walkReportVideoError(video,campaign){
  const error=video.error;
  const reason=error?`mã ${error.code}`:'không rõ nguyên nhân';
  console.error(`Không tải được video chiến dịch ${campaign} (${video.currentSrc}), ${reason}.`,error);
  const message=`Không tải được video (${reason}). Kiểm tra tệp MP4 và kết nối máy chủ.`;
  const status=$('#walkVideoError');
  if(status){status.hidden=false;status.textContent=message}
  else toast(message);
}
function walkCloseDetail(){
  const activeVideo=$('#walkActiveVideo video');
  if(activeVideo){
    activeVideo.pause();activeVideo.controls=false;activeVideo.muted=true;
    activeVideo.loop=true;activeVideo.preload='metadata';activeVideo.style.position='fixed';activeVideo.style.display='';activeVideo.style.width='1px';activeVideo.style.height='1px';activeVideo.style.maxWidth='';activeVideo.style.maxHeight='';
    activeVideo.style.opacity='0';activeVideo.style.pointerEvents='none';activeVideo.style.left='-10px';activeVideo.style.top='-10px';activeVideo.style.background='';activeVideo.style.borderRadius='';
    document.body.append(activeVideo);
  }
  $('#walkDetailContent').querySelectorAll('video').forEach(video=>video.pause());
  $('#walkDetail').hidden=true;
}
function walkOpenItem(it){
  if(!it)return;W.current=it;
  const type=TYPES[it.type]||{icon:'🏛',label:'Hiện vật'};
  const intro=it.type==='tailieu'?(it.text||it.detail):(it.detail||it.text||'Chưa có nội dung thuyết minh.');
  const paragraphs=String(intro||'').split(/\n+/).map(s=>s.trim()).filter(Boolean).map(s=>`<p>${esc(s)}</p>`).join('');
  const image=(it.art||it.img)?`<div class="mini-art">${thumb(it)}</div>`:'';
  const resourcePanel=it.isResourceCabinet?`<section class="walk-resource-list"><p>Chọn tài liệu bên dưới để tải về thiết bị.</p>${(S.resources||[]).length?(S.resources||[]).map((f,i)=>`<div class="resource-file"><span class="resource-file-type">📄</span><span class="resource-file-name">${esc(f.name)}<small>${esc(f.path||f.name)}</small></span><button class="primary" type="button" data-walk-resource-download="${i}">⬇ Tải xuống</button></div>`).join(''):'<p class="resource-empty">Hiện chưa có tài liệu. Ban quản lý có thể thêm đường dẫn trong mục “Quản lý bảo tàng” → “Tải tài liệu”.</p>'}</section>`:'';
  const videos=it.isVideoScreen?(S.videos||[]).filter(v=>v.campaign===(it.campaign||'xiem')):[];
  const videoPanel=it.isVideoScreen?`<section class="walk-video-list"><p>Video cho chiến dịch này:</p>${videos.length?videos.map(v=>`<div class="resource-file"><span class="resource-file-type">🎬</span><span class="resource-file-name">${esc(v.name)}<small>${esc(v.path||v.name)}</small></span><button class="primary" type="button" data-play-video="${esc(v.id)}">▶ Phát video</button></div>`).join(''):'<p class="resource-empty">Chưa có video bổ sung. Có thể thêm đường dẫn tại Quản lý bảo tàng → Tải tài liệu.</p>'}<div id="walkVideoPlayer"></div></section>`:'';
  $('#walkDetailContent').innerHTML=`<span class="badge">${it.isVideoScreen?'📺':type.icon} ${esc(it.isVideoScreen?'TV sa hình':type.label)}</span><h2>${esc(it.title)}</h2><p class="meta">${esc([it.date,it.origin].filter(Boolean).join(' · '))}</p>${image}<div class="body">${paragraphs|| (it.isResourceCabinet||it.isVideoScreen?'': '<p>Chưa có nội dung mô tả cho hiện vật này.</p>')}</div>${resourcePanel}${videoPanel}${it.question?`<div class="question"><b>Câu hỏi suy ngẫm</b><p>${esc(it.question)}</p></div>`:''}<div class="actions">${it.isResourceCabinet||it.isVideoScreen?'': '<button class="primary" id="walkSpeak">🔊 Nghe thuyết minh</button>'}${['sahinh','phim'].includes(it.type)?'<button class="primary" id="walkReplay">▶ Tái hiện trận đánh</button>':''}<button id="walkDetailClose2">Đóng thông tin</button></div>`;
  $('#walkDetail').hidden=false;$('#walkDetailClose2').onclick=walkCloseDetail;
  $('#walkDetailContent').querySelectorAll('[data-walk-resource-download]').forEach(btn=>btn.addEventListener('click',()=>downloadSavedResource((S.resources||[])[Number(btn.dataset.walkResourceDownload)])));
  $('#walkDetailContent').querySelectorAll('[data-play-video]').forEach(btn=>btn.addEventListener('click',()=>{const v=(S.videos||[]).find(x=>x.id===btn.dataset.playVideo);if(!v)return;const src=v.path?assetHref(v.path):(v.url||v.dataURL);if(!src){toast('Video này chưa có đường dẫn tệp.');return}const host=$('#walkVideoPlayer');host.innerHTML=`<video controls autoplay playsinline style="width:100%;max-height:42vh;background:#000;border-radius:10px" src="${esc(src)}"></video>`;const video=host.querySelector('video');video.volume=USER_PREFS.volume;const texture=new THREE.VideoTexture(video);texture.colorSpace=THREE.SRGBColorSpace;(W.tvScreens||[]).filter(screen=>screen.campaign===v.campaign).forEach(screen=>{screen.mesh.material.map=texture;screen.mesh.material.needsUpdate=true;});video.play().catch(error=>toast(`Không phát được video: ${error.message}`));}));
  if(document.pointerLockElement===$('#walkCanvas'))document.exitPointerLock?.();
}
function walkSpeak(it){
  if(!it)return;const txt=it.script||it.detail||it.text||it.title;
  if(!('speechSynthesis'in window)){toast('Trình duyệt không hỗ trợ đọc thuyết minh tự động.');return}
  try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(txt);u.lang='vi-VN';u.rate=Number(S.settings.rate)||1;u.volume=USER_PREFS.volume;const v=typeof pickVoice==='function'?pickVoice():null;if(v){u.voice=v;u.lang=v.lang||'vi-VN'}speechSynthesis.speak(u);}catch(e){toast('Không thể phát giọng đọc trên trình duyệt này.');}
}
function walkBattleSetPhase(phase){
  phase=Math.max(0,Math.min(5,phase));W.battlePhase=phase;
  const scenes=W.activeCampaign==='thanh'?WALK_THANH_SCENES:WALK_BATTLE_SCENES;
  const scene=scenes[phase];$('#walkBattleCount').textContent=`${W.activeCampaign==='thanh'?'NGỌC HỒI – ĐỐNG ĐA':'RẠCH GẦM – XOÀI MÚT'} · CẢNH ${phase+1} / 6`;
  $('#walkBattleTitle').textContent=scene.title;$('#walkBattleCaption').textContent=scene.caption;
  $$('#walkBattleTrack [data-battle-scene]').forEach((button,index)=>{button.classList.toggle('on',index===phase);button.classList.toggle('done',index<phase);button.setAttribute('aria-label',`Cảnh ${index+1}: ${scenes[index].title}`);button.title=scenes[index].title;});
  const pause=$('#walkBattlePanel [data-battle-control="pause"]');if(pause)pause.textContent=W.battlePaused?'Tiếp tục':'Tạm dừng';
}
function walkSeekBattle(phase){
  const duration=W.activeCampaign==='thanh'?3:4;
  W.battleElapsed=Math.max(0,Math.min(5,phase))*duration;W.battlePaused=false;W.battleRunning=true;
  if(W.activeCampaign==='thanh')walkBattleResetArmy();else walkBattleResetFleet();
  walkBattleSetPhase(phase);
}
function walkToggleBattlePause(){
  if(!W.battleRunning)return;W.battlePaused=!W.battlePaused;
  const button=$('#walkBattlePanel [data-battle-control="pause"]');if(button)button.textContent=W.battlePaused?'Tiếp tục':'Tạm dừng';
}
function walkStopBattle(){
  W.battleRunning=false;W.battlePaused=false;W.battleElapsed=0;$('#walkBattlePanel').hidden=true;$('#walk3d').removeAttribute('data-battle-running');
  Object.values(W.battleCampaignGroups).forEach(group=>{group.visible=true;});
  if(W.camera&&W.battleOriginalFov!==null){W.camera.fov=W.battleOriginalFov;W.camera.updateProjectionMatrix();W.battleOriginalFov=null;}
  walkBattleClearEffects();W.battleFleet.forEach(unit=>{unit.mesh.visible=unit.role!=='ambush-left'&&unit.role!=='ambush-right';unit.mesh.position.set(unit.startX,.14,unit.startZ);unit.mesh.rotation.z=0;unit.mesh.userData.battleHit=false;});
  W.battleArmy.forEach(unit=>{unit.mesh.visible=true;unit.mesh.position.set(unit.startX,walkBattleGroundHeight(unit.startX,unit.startZ,'thanh')+.035,unit.startZ);unit.mesh.rotation.y=unit.team==='taySon'?Math.PI:0;});
  W.ships.forEach(ship=>{ship.mesh.visible=ship.campaign===W.activeCampaign;ship.mesh.position.x=ship.bx;ship.mesh.position.z=ship.bz;});
  $('#walkPrompt').textContent='Kết thúc tái hiện. Hãy quan sát sa hình hoặc mở một hiện vật để xem nội dung chi tiết.';
}
function walkPlayBattle(){
  $('#walkDetail').hidden=true;W.activeCampaign=W.current?.campaign||'xiem';W.battleRunning=true;W.battleStart=performance.now();W.battlePhase=-1;W.battlePaused=false;W.battleElapsed=0;
  W.battleGroup=W.battleCampaignGroups[W.activeCampaign]||W.battleGroup;
  W.ships.forEach(ship=>{ship.mesh.visible=ship.campaign===W.activeCampaign;if(ship.mesh.visible){ship.mesh.position.x=ship.bx;ship.mesh.position.z=ship.bz;}});
  Object.entries(W.battleCampaignGroups).forEach(([id,group])=>{group.visible=id===W.activeCampaign;});
  if(W.camera){
    if(W.battleOriginalFov===null)W.battleOriginalFov=W.camera.fov;
    W.camera.position.set(W.activeCampaign==='xiem'?-1.45:2.82,1.8,-10.8);W.yaw=W.activeCampaign==='xiem'?.22:0;W.pitch=-.38;
    W.camera.fov=window.innerWidth<760?88:58;W.camera.updateProjectionMatrix();walkApplyLook();
  }
  if(W.activeCampaign==='xiem'){
    $('#walkBattlePanel').hidden=false;$('#walk3d').dataset.battleRunning='true';
    walkBattleResetFleet();walkBattleSetPhase(0);$('#walkPrompt').textContent='Tái hiện trận Rạch Gầm – Xoài Mút · 24 giây';
  }else{
    $('#walkBattlePanel').hidden=false;$('#walk3d').dataset.battleRunning='true';
    walkBattleResetArmy();walkBattleSetPhase(0);$('#walkPrompt').textContent='Tái hiện chiến dịch Ngọc Hồi – Đống Đa · 18 giây';
  }
}
function walkUpdateBattle(now,dt){
  if(!W.battleRunning)return;W.renderer.shadowMap.needsUpdate=true;
  if(W.activeCampaign==='xiem'){
    if(!W.battlePaused)W.battleElapsed+=dt;
    const t=W.battleElapsed,phase=Math.min(5,Math.floor(t/4));
    if(phase!==W.battlePhase)walkBattleSetPhase(phase);
    walkBattleUpdateFleet(t);walkBattleUpdateEffects(t);
    if(t>=24){W.battleRunning=false;W.battlePaused=false;$('#walkBattlePanel [data-battle-control="pause"]').textContent='Tạm dừng';$('#walkBattleTitle').textContent='Chiến thắng Rạch Gầm – Xoài Mút';$('#walkBattleCaption').textContent='Phần lớn quân Xiêm bị đánh tan; số còn lại tháo chạy. Trận đánh kết thúc trong chưa đầy một ngày.';$('#walkPrompt').textContent='Tái hiện hoàn tất · Chọn “Xem lại” để phát lại.';}
    return;
  }
  if(!W.battlePaused)W.battleElapsed+=dt;
  const t=W.battleElapsed,phase=Math.min(5,Math.floor(t/3));
  if(phase!==W.battlePhase)walkBattleSetPhase(phase);
  walkBattleUpdateThanh(t);walkBattleUpdateEffects(t);
  if(t>=18){W.battleRunning=false;W.battlePaused=false;$('#walkBattleTitle').textContent='Chiến thắng Ngọc Hồi – Đống Đa';$('#walkBattleCaption').textContent='Trưa mùng 5 Tết Kỷ Dậu, quân Tây Sơn giải phóng Thăng Long; quân Thanh tan rã và Tôn Sĩ Nghị bỏ chạy.';$('#walkPrompt').textContent='Tái hiện hoàn tất · Chọn “Xem lại” để phát lại.';}
}
function walkStartLoop(){if(W.loopRunning)return;W.loopRunning=true;W.last=performance.now();requestAnimationFrame(walkLoop);}
function walkLoop(now){
  if(!W.ready||!W.active){W.loopRunning=false;return;}requestAnimationFrame(walkLoop);const dt=Math.min(.05,Math.max(0,(now-W.last)/1000));W.last=now;
  walkMove(dt);walkUpdatePrompt(now);walkUpdateBattle(now,dt);
  W.renderer.render(W.scene,W.camera);
}
walkMakeUI();
applySettingsLanguage();

})();
