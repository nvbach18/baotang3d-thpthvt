(()=>{
'use strict';
const SRC='<!DOCTYPE html>\n'+document.documentElement.outerHTML; // bản gốc để xuất file HTML chia sẻ
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lines=s=>String(s||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
const uid=()=>'i'+Math.random().toString(36).slice(2,9);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clone=o=>JSON.parse(JSON.stringify(o));

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
  <g transform="translate(34 40)"><circle r="16" fill="none" stroke="#e6c47a" stroke-width="1.5"/><path d="M0-14L4 4H-4Z" fill="#e6c47a"/><text y="-19" text-anchor="middle" font-size="10" fill="#e6c47a" font-family="sans-serif">B</text></g>`),
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
  if(bp>.01)o+=`<g opacity="${bp.toFixed(2)}"><rect x="130" y="150" width="540" height="124" rx="14" fill="rgba(10,6,5,.86)" stroke="#e6c47a" stroke-width="2"/><text x="400" y="200" text-anchor="middle" font-size="26" font-family="Playfair Display,Georgia,serif" fill="#f4d27a">Chiến thắng Rạch Gầm – Xoài Mút</text><text x="400" y="232" text-anchor="middle" font-size="14" fill="#f2e9d4">Quân Xiêm bị đánh tan trong chưa đầy một ngày</text><text x="400" y="256" text-anchor="middle" font-size="14" fill="#f2e9d4">Thế mạnh số đông trở thành điểm yếu trong sông hẹp</text></g>`;
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
  <path d="M16 108H132" stroke="#ff8c94" stroke-width="3" fill="none"/><path d="M142 108l-12-7v14z" fill="#ff8c94"/>
  <text x="80" y="98" text-anchor="middle" font-size="9" fill="#fff" font-family="Be Vietnam Pro,sans-serif">Hướng tiến của quân Xiêm</text>
  <text x="60" y="26" text-anchor="middle" font-size="10" fill="#fff" font-family="Be Vietnam Pro,sans-serif">Rạch Gầm</text><text x="341" y="26" text-anchor="middle" font-size="10" fill="#fff" font-family="Be Vietnam Pro,sans-serif">Xoài Mút</text>
  <text x="200" y="176" text-anchor="middle" font-size="9" fill="#fff" font-family="Be Vietnam Pro,sans-serif">Cù lao Thới Sơn</text><text x="352" y="288" text-anchor="middle" font-size="9" fill="#fff" font-family="Be Vietnam Pro,sans-serif">Mỹ Tho</text>
  <text x="200" y="226" text-anchor="middle" font-size="9" fill="#cfe9f2" font-family="Be Vietnam Pro,sans-serif">Sông Tiền</text>`)};
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
{id:'dai-bac',type:'daocu',art:'dai-bac',title:'Đại bác trên thuyền chiến Tây Sơn',date:'Vũ khí, thế kỷ XVIII',origin:'Hình minh họa mẫu, nên thay bằng ảnh hiện vật thật',
 detail:`Đại bác là một sức mạnh quan trọng của thủy binh Tây Sơn. Theo một số bài nghiên cứu, riêng trận đánh ở Quảng Nam giữa năm 1774, quân Tây Sơn thu được 82 khẩu đại bác của Hà Lan và Anh, cùng nhiều đạn dược.
Trên thuyền chiến, quân Tây Sơn thường đặt nhiều đại bác.`,
 script:`Đại bác là sức mạnh quan trọng của thủy binh Tây Sơn. Riêng một trận ở Quảng Nam năm 1774, quân Tây Sơn thu được tám mươi hai khẩu đại bác, và thường đặt nhiều đại bác trên thuyền chiến.`,
 question:'Hỏa lực mạnh có ý nghĩa gì khi đánh vào một đoàn thuyền bị chặn đầu, khóa đuôi?',img:'',text:'',phases:'',hotspots:'',inTour:true},
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
const KEY='bao-tang-ao-v2';
let SEED=null; try{SEED=JSON.parse($('#seed').textContent)}catch(e){}
function norm(d){
  const base=clone(DEFAULT);
  d.meta=Object.assign({},base.meta,d.meta||{});
  d.settings=Object.assign({},base.settings,d.settings||{});
  d.resources=Array.isArray(d.resources)?d.resources:[];
  d.videos=Array.isArray(d.videos)?d.videos:[];
  d.items=(d.items||[]).map(it=>Object.assign({id:uid(),type:'tranh',title:'',date:'',origin:'',detail:'',script:'',question:'',img:'',art:'',text:'',phases:'',hotspots:'',inTour:true},it));
  return d;
}
function load(){
  try{const r=localStorage.getItem(KEY);if(r){const d=JSON.parse(r);if(d&&Array.isArray(d.items)){
    if(d.campaignVersion!==CAMPAIGN_VERSION&&d.items.some(item=>XIEM_IDS.has(item.id))){
      d.items=d.items.map(item=>Object.assign({campaign:'xiem'},item));
      const existing=new Set(d.items.map(item=>item.id));
      d.items.push(...THANH.items.filter(item=>!existing.has(item.id)));
      d.meta=Object.assign({},d.meta,{war:DEFAULT.meta.war,subtitle:DEFAULT.meta.subtitle,welcome:DEFAULT.meta.welcome,outro:DEFAULT.meta.outro});
    }
    d.campaignVersion=CAMPAIGN_VERSION;
    return norm(d);
  }}}catch(e){}
  return norm(clone(SEED||DEFAULT));
}
let S=load(), saveT=null;
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){toast('Không lưu được vào trình duyệt (có thể bộ nhớ đầy). Hãy vào Quản lý, mục "Lưu và chia sẻ" để xuất bản sao lưu.')}}
function queueSave(){clearTimeout(saveT);saveT=setTimeout(save,350)}

/* ====================== TIỆN ÍCH GIAO DIỆN ====================== */
let toastT;
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),4200)}
let UQ=0;
const uniq=svg=>{const n=++UQ;return svg.replace(/id="([\w-]+)"/g,'id="$1_'+n+'"').replace(/url\(#([\w-]+)\)/g,'url(#$1_'+n+')')};
const artHTML=it=>{
  if(it.img)return `<img src="${esc(it.img)}" alt="${esc(it.title)}" draggable="false">`;
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
      return `<article class="paper"><span class="stamp">Tư liệu</span><h3>${esc(it.title)}</h3>${it.img?`<div class="art">${artHTML(it)}</div>`:''}${body.map((p,i)=>`<p style="animation-delay:${(.3+i*.4).toFixed(2)}s">${esc(p)}</p>`).join('')}</article>`;
    }
    case 'daocu':return `<div class="obj" id="obj"><div class="art">${artHTML(it)}</div></div><p class="hint">Di chuyển chuột (hoặc chạm) trên màn hình để xoay nhẹ hiện vật</p>`;
    case 'phim':return `<div class="film"><div class="screen" id="screen"></div><div class="filmbar"><button class="btn primary" id="fPlay">▶ Phát phim</button><input type="range" id="fSeek" min="0" max="${FILM_N*1000-1}" value="0" aria-label="Tua phim"><span class="small" id="fTime"></span></div><div class="scenecap" id="sceneCap"></div></div>`;
    case 'tailieu':return `<section class="resource-wall" aria-label="Hộp tải tài liệu trên tường">
      <div class="resource-wall-header"><span class="resource-wall-icon" aria-hidden="true">📥</span><div><strong>KHO TÀI LIỆU</strong><small>TẢI XUỐNG TƯ LIỆU THAM KHẢO</small></div></div>
      <p>Chọn tài liệu có sẵn trong danh sách hoặc thêm tệp từ thiết bị. Chấp nhận mọi định dạng tệp.</p>
      <label class="resource-upload">＋ Thêm tài liệu từ thiết bị<input id="resource-file-input" type="file" multiple></label>
      <div id="resource-file-list" class="resource-file-list"><p class="resource-empty">Chưa có tài liệu được thêm trong phiên này.</p></div>
    </section>`;
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
const RESOURCE_FILES=[];
function bindResourceDownloads(room){
  const input=room.querySelector('#resource-file-input');
  const list=room.querySelector('#resource-file-list');
  if(!input||!list)return;
  const draw=()=>{
    if(!RESOURCE_FILES.length){list.innerHTML='<p class="resource-empty">Chưa có tài liệu được thêm trong phiên này.</p>';return;}
    list.innerHTML=RESOURCE_FILES.map((f,i)=>`<div class="resource-file"><span class="resource-file-type">📄</span><span class="resource-file-name" title="${esc(f.name)}">${esc(f.name)}<small>${(f.size/1024).toFixed(1)} KB</small></span><button type="button" class="btn resource-download-btn" data-resource-index="${i}">⬇ Tải xuống</button></div>`).join('');
  };
  input.addEventListener('change',()=>{
    [...(input.files||[])].forEach(file=>RESOURCE_FILES.push({name:file.name,file,size:file.size}));
    draw(); input.value='';
  });
  list.addEventListener('click',e=>{
    const btn=e.target.closest('[data-resource-index]');if(!btn)return;
    const item=RESOURCE_FILES[Number(btn.dataset.resourceIndex)];if(!item)return;
    const url=URL.createObjectURL(item.file);const a=document.createElement('a');
    a.href=url;a.download=item.name;a.style.display='none';document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  });
  draw();
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
  S.settings.voice=!S.settings.voice;save();applyMeta();
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
  if(cur.view==='room'){
    if(e.key==='Escape')userNav('hall');
    else if(e.key==='ArrowRight')stepRoom(1);
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
  return `<div class="ed-split"><div class="ed-list"><button class="btn primary" id="addItem">+ Thêm hiện vật</button><p class="small" style="margin-top:10px">Thứ tự trong danh sách cũng là thứ tự khi tham quan tự động. Mọi chỉnh sửa được lưu ngay.</p><ul>${list||'<li class="small">Chưa có hiện vật.</li>'}</ul></div><div class="ed-form" id="edForm">${it?formHTML(it):'<p class="small">Chọn một hiện vật bên trái để sửa, hoặc bấm "Thêm hiện vật".</p>'}</div></div>`;
}
function formHTML(it){
  const isMap=it.type==='sahinh',isDoc=it.type==='tailieu',hs=parseHot(it.hotspots);
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
      <div><input type="file" id="imgFile" accept="image/*"><p class="small" style="margin:8px 0">${it.img?'Đang dùng ảnh bạn tải lên.':it.art?'Đang dùng hình minh hoạ mẫu. Tải ảnh thật lên để thay thế.':'Chưa có hình. Hãy tải ảnh lên.'}</p>${it.img?'<button class="btn sm danger" id="imgDel">Xoá ảnh đã tải</button>':''}</div>
    </div></div>
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
      <p class="small">Thêm tài liệu tại đây. Các tệp sẽ xuất hiện khi khách tham quan tương tác với biển “KHO TÀI LIỆU” trong phòng Tư liệu. Chấp nhận mọi định dạng tệp.</p>
      <label class="btn primary" style="display:inline-flex;cursor:pointer;align-items:center;gap:8px">＋ Chọn tài liệu để tải lên<input type="file" id="museumResourceUpload" multiple hidden></label>
      <p class="small">Tệp được lưu trong dữ liệu trình duyệt và nằm trong file sao lưu JSON. Nên dùng tệp dung lượng nhỏ để tránh giới hạn lưu trữ của trình duyệt.</p>
    </div>
    <div class="card"><h3>Danh sách tài liệu (${files.length})</h3>
      ${files.length?files.map((f,i)=>`<div class="resource-file"><span class="resource-file-type">📄</span><span class="resource-file-name" title="${esc(f.name)}">${esc(f.name)}<small>${(Number(f.size||0)/1024).toFixed(1)} KB · ${esc(f.type||'Tệp không xác định')}</small></span><button class="btn resource-download-btn" data-resource-admin-download="${i}">⬇ Tải thử</button><button class="btn danger" data-resource-admin-delete="${i}">🗑 Xoá</button></div>`).join(''):'<p class="resource-empty">Chưa có tài liệu. Hãy bấm “Chọn tài liệu để tải lên”.</p>'}
    </div>
    <div class="card"><h3>Video cho phòng Sa hình</h3>
      <p class="small">Tải video lên và chọn chiến dịch tương ứng. Khi tham quan 3D, khách có thể ngắm TV trên tường và nhấn E để mở video. Khuyến nghị MP4/WebM dung lượng nhỏ; video được lưu trong trình duyệt nên tệp lớn có thể vượt giới hạn lưu trữ.</p>
      <div class="row2"><div class="fld"><label>Chiến dịch hiển thị</label><select id="museumVideoCampaign"><option value="xiem">Kháng chiến chống quân Xiêm · Rạch Gầm – Xoài Mút</option><option value="thanh">Kháng chiến chống quân Thanh · Ngọc Hồi – Đống Đa</option></select></div>
      <div class="fld"><label>Chọn video</label><input id="museumVideoUpload" type="file" accept="video/*" multiple></div></div>
      <div class="small">Video đã tải lên (${(S.videos||[]).length})</div>
      ${(S.videos||[]).length?(S.videos||[]).map((v,i)=>`<div class="resource-file"><span class="resource-file-type">🎬</span><span class="resource-file-name">${esc(v.name)}<small>${v.campaign==='thanh'?'Chiến dịch quân Thanh':'Chiến dịch quân Xiêm'} · ${(Number(v.size||0)/1024/1024).toFixed(1)} MB</small></span><button class="btn danger" data-video-delete="${i}">🗑 Xoá</button></div>`).join(''):'<p class="resource-empty">Chưa có video. Chọn chiến dịch rồi chọn tệp video để thêm.</p>'}
    </div>
  </div>`;
}
function fileAsDataURL(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error||new Error('Không đọc được tệp'));reader.readAsDataURL(file);});}
function downloadSavedResource(resource){
  if(!resource||!resource.dataURL)return;
  const a=document.createElement('a');a.href=resource.dataURL;a.download=resource.name||'tai-lieu';a.style.display='none';document.body.appendChild(a);a.click();a.remove();
}
function edData(){
  const old=(()=>{try{return !!localStorage.getItem('bao-tang-ao-v1')}catch(e){return false}})();
  return `<div class="ed-pane"><div class="datagrid">
  <div class="help">Dữ liệu bảo tàng được lưu trong trình duyệt của máy đang dùng. Hãy sao lưu thường xuyên bằng các nút bên dưới.</div>
  <div class="card"><h3>Chủ đề mẫu</h3><p class="small">Nạp một chủ đề dựng sẵn. Nội dung hiện tại sẽ bị thay thế, hãy sao lưu trước nếu cần.</p><div style="display:flex;gap:8px;flex-wrap:wrap">${THEMES.map(th=>`<button class="btn" data-theme="${th.id}">${esc(th.name)}</button>`).join('')}</div></div>
  <div class="card"><h3>Chia sẻ cho học sinh</h3><p class="small">Tải bộ HTML, CSS và JavaScript. Giữ cả ba file trong cùng một thư mục khi gửi cho học sinh.</p><button class="btn primary" id="exportHtml">Tải bộ file để chia sẻ</button></div>
  <div class="card"><h3>Sao lưu dữ liệu</h3><p class="small">Xuất toàn bộ nội dung ra file .json để lưu hoặc chuyển sang máy khác, rồi nhập lại khi cần.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="exportJson">Xuất file sao lưu (.json)</button><label class="btn" style="cursor:pointer">Nhập file sao lưu<input type="file" id="importJson" accept=".json,application/json" hidden></label></div></div>
  ${old?`<div class="card"><h3>Dữ liệu của phiên bản trước</h3><p class="small">Trình duyệt này còn dữ liệu bảo tàng từ phiên bản cũ. Bạn có thể nạp lại nếu cần.</p><button class="btn" id="loadOld">Nạp dữ liệu phiên bản trước</button></div>`:''}
  <div class="card"><h3>Làm mới</h3><p class="small">Xoá sạch hiện vật để bắt đầu một bảo tàng trống cho chủ đề khác.</p><button class="btn danger" id="clearAll">Xoá hết hiện vật</button></div>
  </div></div>`;
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
function readImage(file,max=1400){
  return new Promise((res,rej)=>{
    const fr=new FileReader();
    fr.onload=()=>{const im=new Image();
      im.onload=()=>{
        const k=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');
        c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);
        c.getContext('2d').drawImage(im,0,0,c.width,c.height);
        const alpha=/png|webp|gif/.test(file.type);
        res(c.toDataURL(alpha?'image/webp':'image/jpeg',.85));
      };
      im.onerror=rej;im.src=fr.result};
    fr.onerror=rej;fr.readAsDataURL(file);
  });
}
const edBody=$('#edBody');
edBody.addEventListener('input',e=>{
  const t=e.target,k=t.dataset.k,m=t.dataset.m,s=t.dataset.s;
  if(k){
    const it=S.items.find(i=>i.id===ed.id);if(!it)return;
    it[k]=t.type==='checkbox'?t.checked:t.value;
    if(k==='title'){const nm=$(`.ed-list li[data-id="${CSS.escape(ed.id)}"] .nm`);if(nm)nm.textContent=t.value||'(chưa đặt tên)'}
    queueSave();
  }else if(m){S.meta[m]=t.value;queueSave()}
  else if(s){
    S.settings[s]=t.type==='checkbox'?t.checked:(t.type==='range'||t.type==='number')?parseFloat(t.value):t.value;
    if(s==='rate')$('#rateVal').textContent=S.settings.rate;
    applyMeta();queueSave();
  }
});
edBody.addEventListener('change',async e=>{
  const t=e.target;
  if(t.id==='museumResourceUpload'&&t.files&&t.files.length){
    const files=[...t.files];let added=0;
    try{
      for(const file of files){
        const dataURL=await fileAsDataURL(file);
        S.resources=S.resources||[];
        S.resources.push({id:uid(),name:file.name,type:file.type||'application/octet-stream',size:file.size,dataURL});added++;
      }
      save();renderEd();toast(`Đã thêm ${added} tài liệu vào kho tải xuống.`);
    }catch(err){save();renderEd();toast('Không thể lưu tệp. Tệp có thể quá lớn hoặc bộ nhớ trình duyệt đã đầy. Hãy thử tệp nhỏ hơn.');}
    return;
  }
  if(t.id==='museumVideoUpload'&&t.files&&t.files.length){
    const files=[...t.files].filter(file=>file.type.startsWith('video/'));
    const campaign=$('#museumVideoCampaign')?.value||'xiem';let added=0;
    try{
      S.videos=S.videos||[];
      for(const file of files){
        if(file.size>4*1024*1024)throw new Error('Video vượt 4 MB');
        const dataURL=await fileAsDataURL(file);
        S.videos.push({id:uid(),name:file.name,type:file.type,size:file.size,campaign,dataURL});added++;
      }
      save();renderEd();toast(`Đã thêm ${added} video cho phòng Sa hình.`);
    }catch(err){save();renderEd();toast('Không thể lưu video. Do video lưu trong trình duyệt, hãy dùng MP4/WebM dưới 4 MB mỗi tệp.');}
    return;
  }
  if(t.dataset.k==='type'||t.dataset.k==='hotspots'||t.dataset.k==='phases'||t.dataset.k==='text'){renderEd()}
  if(t.id==='imgFile'&&t.files[0]){
    const it=S.items.find(i=>i.id===ed.id);if(!it)return;
    try{it.img=await readImage(t.files[0]);save();renderEd();toast('Đã thêm ảnh vào hiện vật.')}catch(err){toast('Không đọc được ảnh này. Hãy thử file JPG hoặc PNG khác.')}
  }
  if(t.id==='importJson'&&t.files[0]){
    const fr=new FileReader();
    fr.onload=()=>{
      try{
        const d=JSON.parse(fr.result);
        if(!d||!Array.isArray(d.items))throw new Error('x');
        if(!confirm('Nhập file này sẽ thay thế toàn bộ nội dung hiện tại. Tiếp tục?'))return;
        S=norm(d);save();ed.id=S.items[0]?S.items[0].id:null;applyMeta();renderEd();toast('Đã nhập dữ liệu.');
      }catch(err){toast('File không đúng định dạng sao lưu của bảo tàng.')}
    };
    fr.readAsText(t.files[0]);
  }
});
edBody.addEventListener('click',e=>{
  const t=e.target;
  const adminDownload=t.closest('[data-resource-admin-download]');
  if(adminDownload){downloadSavedResource((S.resources||[])[Number(adminDownload.dataset.resourceAdminDownload)]);return;}
  const adminDelete=t.closest('[data-resource-admin-delete]');
  if(adminDelete){const i=Number(adminDelete.dataset.resourceAdminDelete);if(confirm(`Xoá tài liệu “${(S.resources||[])[i]?.name||''}” khỏi kho tải xuống?`)){S.resources.splice(i,1);save();renderEd();toast('Đã xoá tài liệu.');}return;}
  const videoDelete=t.closest('[data-video-delete]');
  if(videoDelete){const i=Number(videoDelete.dataset.videoDelete);if(confirm(`Xoá video “${(S.videos||[])[i]?.name||''}”?`)){S.videos.splice(i,1);save();renderEd();toast('Đã xoá video.');}return;}
  if(t.closest('#addItem')){
    const it={id:uid(),type:'tranh',title:'Hiện vật mới',date:'',origin:'',detail:'',script:'',question:'',img:'',art:'',text:'',phases:'',hotspots:'',inTour:true};
    S.items.push(it);ed.id=it.id;save();renderEd();return;
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
  if(t.closest('#loadOld')&&confirm('Nạp dữ liệu phiên bản trước sẽ thay thế nội dung hiện tại. Tiếp tục?')){
    try{const d=JSON.parse(localStorage.getItem('bao-tang-ao-v1'));S=norm(d);save();ed.id=S.items[0]?S.items[0].id:null;applyMeta();renderEd();toast('Đã nạp dữ liệu phiên bản trước.')}catch(err){toast('Không đọc được dữ liệu cũ.')}
    return;
  }
  if(t.closest('#voiceTest')){
    try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance('Chào các em, đây là giọng đọc thuyết minh của bảo tàng ảo.');u.lang='vi-VN';u.rate=+S.settings.rate||1;const v=pickVoice();if(v){u.voice=v;u.lang=v.lang}else u.pitch=1.1;speechSynthesis.speak(u)}catch(err){toast('Trình duyệt này không hỗ trợ đọc giọng nói.')}
    return;
  }
  if(t.closest('#exportJson'))download(slug(S.meta.war)+'-sao-luu.json',JSON.stringify(S),'application/json');
  if(t.closest('#exportHtml')){
    const json=JSON.stringify(S).replace(/</g,'\\u003c');
    const re=/(<script id="seed" type="application\/json">)[\s\S]*?(<\/script>)/;
    download(slug(S.meta.war)+'.html',SRC.replace(re,(m,a,b)=>a+json+b),'text/html');
    document.querySelectorAll('link[href$="bao-tang-ao-3d.css"],script[src$="bao-tang-ao-3d.js"]').forEach(asset=>downloadAsset(asset.href));
    toast('Đã tải bộ file chia sẻ. Hãy giữ HTML, CSS và JavaScript trong cùng một thư mục.');
  }
  if(t.closest('#resetSample')&&confirm('Khôi phục nội dung mẫu sẽ xoá toàn bộ nội dung hiện tại. Tiếp tục?')){S=norm(clone(DEFAULT));save();ed.id=S.items[0].id;applyMeta();renderEd();toast('Đã khôi phục nội dung mẫu.')}
  if(t.closest('#clearAll')&&confirm('Xoá toàn bộ hiện vật? Hãy chắc chắn bạn đã sao lưu.')){S.items=[];ed.id=null;save();renderEd();toast('Bảo tàng đã trống. Bấm "Thêm hiện vật" để bắt đầu.')}
});

/* ====================== KHỞI ĐỘNG ====================== */
try{if('speechSynthesis' in window){speechSynthesis.getVoices();speechSynthesis.addEventListener('voiceschanged',()=>{if(!$('#editor').hidden&&ed.tab==='museum')renderEd()})}}catch(e){}
applyMeta();setTourUI();
/* ====================== THAM QUAN 3D ĐI BỘ ====================== */
const WALK_TYPES={
  gallery:{label:'Phòng tư liệu hình ảnh',icon:'🖼',center:[-14,0],color:0x4a1718},
  artifacts:{label:'Phòng tư liệu hiện vật',icon:'🏺',center:[14,0],color:0x252a30},
  battle:{label:'Phòng sa hình',icon:'🗺',center:[0,-14],color:0x17332e},
  documents:{label:'Phòng tư liệu',icon:'📜',center:[0,14],color:0x39271a}
};
const W={active:false,ready:false,loopRunning:false,renderer:null,scene:null,camera:null,root:null,targets:[],solids:[],rooms:[],keys:{},yaw:0,pitch:0,last:0,ray:null,centerRay:null,current:null,activeCampaign:'xiem',promptAt:0,promptText:'',statusText:'',screenCanvas:null,screenTexture:null,screenLast:0,tvScreens:[],screenVideos:[],ships:[],battleRunning:false,battleStart:0,battlePhase:-1,wasLocked:false};
function walkMakeUI(){
  const old=$('#walk3d');if(old)return;
  const root=document.createElement('div');root.id='walk3d';root.hidden=true;
  root.innerHTML=`
    <canvas id="walkCanvas" aria-label="Không gian bảo tàng ba chiều"></canvas>
    <div class="walk-top"><div class="walk-brand">🏛 ${esc(S.meta.war)}</div>
      <div class="walk-rooms"><button data-wroom="gallery">🖼 Phòng ảnh</button><button data-wroom="artifacts">🏺 Hiện vật</button><button data-wroom="battle">🗺 Sa hình</button><button data-wroom="documents">📜 Tư liệu</button></div>
      <div class="walk-tools"><button id="walkHome">← Sảnh chính</button><button id="walkIntroBtn">Hướng dẫn</button></div>
    </div>
    <div class="walk-cross" aria-hidden="true">+</div>
    <div id="walkPrompt" class="walk-prompt">Nhấn “Bắt đầu tham quan”, sau đó nhấp vào cảnh 3D để điều khiển góc nhìn.</div>
    <div class="walk-help">Di chuyển: <b>W A S D</b> hoặc phím mũi tên · Nhìn quanh: <b>di chuyển chuột</b> · Tương tác: <b>E</b> hoặc nhấp chuột khi ngắm hiện vật · <b>Esc</b>: nhả chuột</div>
    <div class="walk-status" id="walkStatus">Đang ở sảnh trung tâm</div>
    <div class="walk-mobile"><div class="walk-pad"><button data-hold="w" aria-label="Tiến">▲</button><button data-hold="a" aria-label="Sang trái">◀</button><button data-hold="s" aria-label="Lùi">▼</button><button data-hold="d" aria-label="Sang phải">▶</button></div><div class="walk-turn"><button data-turn="-1" aria-label="Quay trái">↶</button><button data-turn="1" aria-label="Quay phải">↷</button></div></div>
    <button class="walk-interact" id="walkInteract">✦ Tương tác</button>
    <div class="walk-overlay" id="walkIntro"><div class="walk-card"><p class="eyebrow">Không gian trưng bày tương tác</p><h2>Khám phá bảo tàng bằng góc nhìn người tham quan</h2><p>Bước qua sảnh trung tâm để tự do đi vào bốn phòng. Tranh được treo trên tường; hiện vật đặt trên bệ trưng bày; sa hình có thể tái hiện diễn biến trận đánh; phòng tư liệu có các văn bản để đọc.</p><div><span class="walk-pill">WASD / phím mũi tên</span><span class="walk-pill">Chuột để nhìn quanh</span><span class="walk-pill">E để tương tác</span></div><p class="small">Mô hình hiện vật 3D hiện là mô phỏng minh họa bằng hình khối. Giáo viên có thể thay ảnh, mô tả và thuyết minh qua mục “Quản lý” ở giao diện bảo tàng thông thường.</p><div class="walk-buttons"><button class="primary" id="walkBegin">Bắt đầu tham quan 3D</button><button id="walkBack">Quay lại giao diện danh mục</button></div></div></div>
    <aside class="walk-detail" id="walkDetail" hidden><button class="close" id="walkDetailClose" aria-label="Đóng">×</button><div id="walkDetailContent"></div></aside>
  `;
  document.body.appendChild(root);
  const btn=document.createElement('button');btn.id='enter3D';btn.className='btn primary';btn.textContent='🚶 Khám phá không gian 3D';
  const entryBtns=$('.entry-btns');if(entryBtns)entryBtns.insertBefore(btn,entryBtns.firstChild);
  if($('#enterBtn')){ $('#enterBtn').textContent='Xem theo danh mục';$('#enterBtn').classList.remove('primary'); }
  const topbtn=document.createElement('button');topbtn.id='top3D';topbtn.className='btn';topbtn.textContent='🚶 Không gian 3D';
  const topTour=$('#tourIdle');if(topTour)topTour.appendChild(topbtn);
  btn.onclick=walkOpen;topbtn.onclick=walkOpen;
  $('#walkHome').onclick=walkLeave;$('#walkBack').onclick=walkLeave;
  $('#walkIntroBtn').onclick=()=>{$('#walkIntro').hidden=false;if(document.pointerLockElement=== $('#walkCanvas'))document.exitPointerLock?.()};
  $('#walkBegin').onclick=()=>{if(!W.ready){walkInit();}if(W.ready){$('#walkIntro').hidden=true;$('#walkDetail').hidden=true;walkRequestLock();}};
  $('#walkDetailClose').onclick=walkCloseDetail;
  $('#walkInteract').onclick=walkInteract;
  root.querySelectorAll('[data-wroom]').forEach(b=>b.addEventListener('click',()=>walkTeleport(b.dataset.wroom)));
  root.querySelectorAll('[data-hold]').forEach(b=>{
    const k=b.dataset.hold;const on=e=>{e.preventDefault();W.keys[k]=true};const off=e=>{e.preventDefault();W.keys[k]=false};
    b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off);
  });
  root.querySelectorAll('[data-turn]').forEach(b=>{
    let timer=null;const start=e=>{e.preventDefault();const s=+b.dataset.turn;W.keys[s<0?'turnL':'turnR']=true};const end=e=>{e.preventDefault();W.keys.turnL=false;W.keys.turnR=false};
    b.addEventListener('pointerdown',start);b.addEventListener('pointerup',end);b.addEventListener('pointercancel',end);b.addEventListener('pointerleave',end);
  });
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
    if(!W.active)return;
    if(['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Shift'].includes(e.key)){
      W.keys[e.key.toLowerCase()]=true;
      if(e.key.startsWith('Arrow'))W.keys[({ArrowUp:'w',ArrowDown:'s',ArrowLeft:'a',ArrowRight:'d'})[e.key]]=true;
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();
    }
    if(e.key.toLowerCase()==='e'&&$('#walkIntro').hidden&&$('#walkDetail').hidden)walkInteract();
    if(e.key==='Escape'){
      if(!$('#walkDetail').hidden)$('#walkDetail').hidden=true;
      else if(!$('#walkIntro').hidden)walkLeave();
    }
    if(e.key==='Tab'&&$('#walkIntro').hidden){e.preventDefault();$('#walkIntro').hidden=false;if(document.pointerLockElement===$('#walkCanvas'))document.exitPointerLock?.()}
  });
  document.addEventListener('keyup',e=>{
    W.keys[e.key.toLowerCase()]=false;
    if(e.key.startsWith('Arrow'))W.keys[({ArrowUp:'w',ArrowDown:'s',ArrowLeft:'a',ArrowRight:'d'})[e.key]]=false;
  });
}
function walkOpen(){
  if(T.on)endTour();stopNarration();
  if(!window.THREE){toast('Không tải được thư viện 3D. Hãy kiểm tra kết nối Internet rồi tải lại file HTML.');return}
  if(!W.ready)walkInit();
  if(!W.ready)return;
  W.active=true;$('#walk3d').hidden=false;$('#walkIntro').hidden=false;$('#walkDetail').hidden=true;
  W.screenVideos.forEach(video=>video.play().catch(()=>{}));
  document.body.dataset.view='walk3d';$('#caption').classList.remove('show');document.body.classList.remove('cap-on');
  walkResize();walkStartLoop();
}
function walkLeave(){
  if(document.pointerLockElement===$('#walkCanvas'))document.exitPointerLock?.();
  W.active=false;W.battleRunning=false;W.keys={};W.screenVideos.forEach(video=>video.pause());$('#walk3d').hidden=true;$('#walkIntro').hidden=true;$('#walkDetail').hidden=true;
  document.body.dataset.view=cur.view||'entry';
}
function walkPixelRatio(){
  const cores=navigator.hardwareConcurrency||8,memory=navigator.deviceMemory||8;
  return Math.min(window.devicePixelRatio||1,cores<=4||memory<=4?1:1.35);
}
function walkRequestLock(){
  const c=$('#walkCanvas');if(c&&c.requestPointerLock){try{const p=c.requestPointerLock();if(p&&p.catch)p.catch(()=>{})}catch(e){}}
}
function walkInit(){
  if(W.ready)return;
  if(!window.THREE){walkTextToast('Thư viện 3D chưa tải được. Cần có kết nối Internet để tải Three.js.');return}
  try{
    const T3=window.THREE,canvas=$('#walkCanvas');
    const lowPower=(navigator.hardwareConcurrency||8)<=4||(navigator.deviceMemory||8)<=4;
    W.renderer=new T3.WebGLRenderer({canvas,antialias:!lowPower,alpha:false,powerPreference:'low-power'});
    W.renderer.setPixelRatio(walkPixelRatio());W.renderer.setSize(window.innerWidth,window.innerHeight,false);
    W.renderer.outputColorSpace=T3.SRGBColorSpace;W.renderer.toneMapping=T3.ACESFilmicToneMapping;W.renderer.toneMappingExposure=1.14;
    W.renderer.shadowMap.enabled=true;W.renderer.shadowMap.type=T3.PCFSoftShadowMap;W.renderer.shadowMap.autoUpdate=false;W.renderer.shadowMap.needsUpdate=true;
    W.scene=new T3.Scene();W.scene.background=new T3.Color(0x100b0a);W.scene.fog=new T3.FogExp2(0x100b0a,.0082);
    W.camera=new T3.PerspectiveCamera(72,window.innerWidth/window.innerHeight,.1,100);W.camera.position.set(0,1.8,2.5);W.yaw=0;W.pitch=0;W.camera.rotation.order='YXZ';
    W.scene.add(new T3.HemisphereLight(0xf9e8cf,0x241711,1.35));W.scene.add(new T3.AmbientLight(0xffe9c9,.28));
    const key=new T3.DirectionalLight(0xffd7a0,2.0);key.position.set(-5,12,7);key.castShadow=true;key.shadow.mapSize.set(512,512);key.shadow.camera.left=-25;key.shadow.camera.right=25;key.shadow.camera.top=25;key.shadow.camera.bottom=-25;W.scene.add(key);
    W.targets=[];W.solids=[];W.ships=[];W.rooms=[];
    walkBuildArchitecture();walkBuildGallery();walkBuildArtifacts();walkBuildBattle();walkBuildDocuments();walkBuildAtmosphere();
    W.ray=new T3.Raycaster();W.centerRay=new T3.Vector2(0,0);W.ready=true;W.last=performance.now();
    window.addEventListener('resize',walkResize);
  }catch(err){console.error(err);walkTextToast('Không khởi tạo được không gian 3D trên trình duyệt này. Hãy thử Chrome hoặc Edge mới nhất.');}
}
function walkTextToast(msg){const p=$('#walkPrompt');if(p)p.textContent=msg;}
function walkResize(){if(!W.renderer||!W.camera)return;const w=window.innerWidth,h=window.innerHeight;W.camera.aspect=w/h;W.camera.updateProjectionMatrix();W.renderer.setPixelRatio(walkPixelRatio());W.renderer.setSize(w,h,false);}
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
  const c=document.createElement('canvas');c.width=1024;c.height=256;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,1024,256);g.strokeStyle='#d7b56b';g.lineWidth=8;g.strokeRect(12,12,1000,232);g.strokeStyle='#735127';g.lineWidth=2;g.strokeRect(28,28,968,200);g.textAlign='center';g.fillStyle='#f2d890';g.font='bold 48px Georgia';g.fillText(title,512,112,930);g.fillStyle='#e5d2ad';g.font='28px sans-serif';g.fillText(sub||'BẢO TÀNG TƯƠNG TÁC',512,170,940);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
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
function walkTextureForItem(it){
  const c=document.createElement('canvas');c.width=1024;c.height=768;const g=c.getContext('2d');g.fillStyle='#e5d6b3';g.fillRect(0,0,c.width,c.height);
  g.fillStyle='#45291c';g.fillRect(18,18,988,732);g.fillStyle='#ead8a8';g.fillRect(34,34,956,700);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
  function drawImageFit(img){
    g.fillStyle='#e6d8bd';g.fillRect(48,48,928,672);
    const maxW=890,maxH=635,ar=img.width/img.height;let w=maxW,h=maxH;
    if(ar>maxW/maxH){h=maxW/ar}else{w=maxH*ar}g.drawImage(img,(1024-w)/2,(672-h)/2+48,w,h);tex.needsUpdate=true;
  }
  if(it.img){const img=new Image();img.onload=()=>drawImageFit(img);img.src=it.img;}
  else if(it.art&&ART[it.art]){
    const svg=ART[it.art]();const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));const img=new Image();img.onload=()=>{drawImageFit(img);URL.revokeObjectURL(url)};img.onerror=()=>URL.revokeObjectURL(url);img.src=url;
  }else if(it.isEmptyGalleryFrame){
    g.fillStyle='#eeece5';g.fillRect(48,48,928,672);g.strokeStyle='#b89a5d';g.lineWidth=5;g.setLineDash([22,16]);g.strokeRect(82,82,860,604);g.setLineDash([]);
    g.strokeStyle='#9c8b69';g.lineWidth=12;g.strokeRect(420,250,184,150);g.beginPath();g.moveTo(432,382);g.lineTo(480,325);g.lineTo(516,360);g.lineTo(550,314);g.lineTo(592,382);g.stroke();
    g.textAlign='center';g.fillStyle='#5a4d3c';g.font='bold 40px Georgia';g.fillText('NHẤN ĐỂ THÊM ẢNH',512,480);tex.needsUpdate=true;
  }else{
    g.fillStyle='#382317';g.font='bold 42px Georgia';g.fillText(it.title||'TƯ LIỆU LỊCH SỬ',62,100,890);
    g.strokeStyle='#b89554';g.lineWidth=3;g.beginPath();g.moveTo(62,126);g.lineTo(962,126);g.stroke();
    const body=String(it.text||it.detail||'Tư liệu trưng bày trong bảo tàng ảo').replace(/\s+/g,' ');g.fillStyle='#4a3925';g.font='27px Georgia';let y=178,line='',words=body.split(' ');for(const word of words){if(g.measureText(line+' '+word).width>875){g.fillText(line,62,y);y+=39;line=word;if(y>665)break}else line+=(line?' ':'')+word;}if(line&&y<=665)g.fillText(line,62,y);tex.needsUpdate=true;
  }
  return tex;
}
function walkCreatePicture(it,pos,yaw,w=2.5,h=1.85){
  const root=new THREE.Group();root.position.set(pos[0],pos[1],pos[2]);root.rotation.y=yaw;root.userData.item=it;
  const gold=walkMaterial(0xc5a05c,.36,.52),dark=walkMaterial(0x21150f,.58,.22);
  walkBox(w+.22,.13,.15,gold,0,h/2+.09,0,{parent:root});walkBox(w+.22,.13,.15,gold,0,-h/2-.09,0,{parent:root});
  walkBox(.13,h+.35,.15,gold,-w/2-.045,0,0,{parent:root});walkBox(.13,h+.35,.15,gold,w/2+.045,0,0,{parent:root});
  walkBox(w+.05,h+.13,.05,dark,0,0,-.045,{parent:root});
  const mat=new THREE.MeshBasicMaterial({map:walkTextureForItem(it),side:THREE.DoubleSide});const plane=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);plane.position.z=.035;plane.castShadow=false;root.add(plane);
  const label=new THREE.Mesh(new THREE.PlaneGeometry(w+.15,.42),new THREE.MeshBasicMaterial({map:walkLabelTexture(it.title,it.date||'TƯ LIỆU TRƯNG BÀY','#362018'),side:THREE.DoubleSide}));label.position.set(0,-h/2-.44,.04);root.add(label);
  W.scene.add(root);W.targets.push(root);return root;
}
function walkBuildGallery(){
  const items=S.items.filter(i=>['tranh','anh','dohoa'].includes(i.type));
  const places={
    xiem:[[-17.8,2.5,-5.72,0],[-14,2.5,-5.72,0],[-10.2,2.5,-5.72,0],[-19.72,2.5,-3.2,Math.PI/2],[-19.72,2.5,-.7,Math.PI/2]],
    thanh:[[-17.8,2.5,5.72,Math.PI],[-14,2.5,5.72,Math.PI],[-10.2,2.5,5.72,Math.PI],[-19.72,2.5,3.2,Math.PI/2],[-19.72,2.5,.7,Math.PI/2]]
  };
  const byCampaign={xiem:[],thanh:[]};items.forEach(it=>byCampaign[it.campaign==='thanh'?'thanh':'xiem'].push(it));
  Object.entries(byCampaign).forEach(([campaign,group])=>{
    const occupied=new Map();
    group.forEach((it,index)=>{
      const slot=Number.isInteger(it.gallerySlot)?it.gallerySlot:index;
      if(slot>=0&&slot<places[campaign].length&&!occupied.has(slot))occupied.set(slot,it);
    });
    places[campaign].forEach((spot,index)=>{
      const item=occupied.get(index);
      if(index===4&&!item)return;
      const frameSpot=index===4?(campaign==='xiem'?[-8.22,2.5,-4,-Math.PI/2]:[-8.22,2.5,4,-Math.PI/2]):spot;
      const it=item||{id:`gallery-slot-${campaign}-${index}`,campaign,gallerySlot:index,type:'anh',title:'Khung ảnh trống',date:'',origin:'Nhấn để thêm ảnh',detail:'Khung ảnh đang trống. Chọn ảnh từ thiết bị để thêm vào phòng trưng bày.',img:'',isEmptyGalleryFrame:true};
      walkCreatePicture(it,frameSpot.slice(0,3),frameSpot[3],2.25,1.68);
    });
  });
  walkSign('KHÁNG CHIẾN CHỐNG XIÊM','RẠCH GẦM – XOÀI MÚT',-19.65,4.2,-2.8,Math.PI/2,'#4a1718');
  walkSign('KHÁNG CHIẾN CHỐNG THANH','NGỌC HỒI – ĐỐNG ĐA',-19.65,4.2,2.8,Math.PI/2,'#273c32');
}
function walkPedestal(x,z,label,showPlacard=true){
  const stone=walkMaterial(0xaaa18c,.5,.24),gold=walkMaterial(0xb88b43,.35,.5),black=walkMaterial(0x3b2921,.58,.22);
  walkCylinder(.95,.95,.18,black,x,.24,z,{seg:32});walkCylinder(.81,.9,.12,gold,x,.39,z,{seg:32});walkBox(1.36,.95,1.36,stone,x,.91,z);walkBox(1.48,.09,1.48,gold,x,1.43,z);walkBox(1.48,.14,1.48,black,x,1.54,z);
  if(showPlacard){const placard=new THREE.Mesh(new THREE.PlaneGeometry(1.35,.36),new THREE.MeshBasicMaterial({map:walkLabelTexture(label,'HIỆN VẬT MÔ PHỎNG','#2c2924'),side:THREE.DoubleSide}));placard.rotation.x=-.25;placard.position.set(x,1.65,z+.55);W.scene.add(placard);}
}
function walkModelCannon(root){
  const dark=walkMaterial(0x292b2a,.42,.6),wood=walkMaterial(0x6e4a2b,.72,.05),iron=walkMaterial(0x68645a,.32,.72);
  walkBox(1.65,.2,.65,wood,0,.1,0,{parent:root});
  [-.58,.58].forEach(x=>{const wheel=new THREE.Mesh(new THREE.TorusGeometry(.37,.065,8,24),iron);wheel.position.set(x,.34,.42);wheel.rotation.y=Math.PI/2;root.add(wheel);const hub=walkCylinder(.085,.085,.09,wood,x,.34,.42,{parent:root});hub.rotation.z=Math.PI/2;});
  const barrel=walkCylinder(.19,.28,1.35,dark,0,.68,-.17,{parent:root});barrel.rotation.x=Math.PI/2;barrel.position.z=-.35;
  walkCylinder(.22,.22,.15,iron,0,.69,-.98,{parent:root});
  walkCylinder(.24,.27,.13,iron,0,.69,.1,{parent:root});
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
function walkModelBoat(root){
  const hull=walkMaterial(0x572a22,.4,.45),trim=walkMaterial(0xb48b4b,.38,.5),cloth=walkMaterial(0xf0dfb7,.88,.02,{side:THREE.DoubleSide});
  walkBox(2.15,.27,.7,hull,0,.15,0,{parent:root});walkBox(1.7,.18,.55,trim,0,.29,0,{parent:root});
  const mast=walkCylinder(.055,.07,1.45,trim,0,1.02,0,{parent:root});
  const sail=new THREE.Mesh(new THREE.PlaneGeometry(.72,.9),cloth);sail.position.set(.28,1.18,.03);root.add(sail);
  const flag=new THREE.Mesh(new THREE.PlaneGeometry(.42,.2,1,1),new THREE.MeshStandardMaterial({color:0xa3262e,side:THREE.DoubleSide}));flag.position.set(.22,1.66,0);root.add(flag);
  walkBox(.55,.14,.45,hull,0,.46,.18,{parent:root});
}
function walkModelStatue(root){
  const bronze=walkMaterial(0x8d7148,.34,.65),dark=walkMaterial(0x302820,.66,.3);
  walkCylinder(.42,.48,.85,bronze,0,.95,0,{parent:root});walkSphere(.28,bronze,0,1.55,0,{x:1,y:1.15,z:1},root);
  const cape=new THREE.Mesh(new THREE.ConeGeometry(.48,.75,8),dark);cape.position.set(0,.86,-.12);root.add(cape);
  const arm1=walkBox(.18,.72,.18,bronze,-.48,1.05,0,{parent:root});arm1.rotation.z=-.35;const arm2=walkBox(.18,.72,.18,bronze,.48,1.05,0,{parent:root});arm2.rotation.z=.35;
  const sword=walkCylinder(.035,.05,.85,walkMaterial(0xb9b8ad,.25,.7),.62,1.42,.05,{parent:root});sword.rotation.z=-.45;
}
function walkModelBicycle(root){
  const iron=walkMaterial(0x383e3c,.38,.66),wood=walkMaterial(0x81522b,.7,.1);
  const wheel1=new THREE.Mesh(new THREE.TorusGeometry(.42,.035,8,28),iron);wheel1.position.set(-.72,.48,0);wheel1.rotation.y=Math.PI/2;root.add(wheel1);
  const wheel2=wheel1.clone();wheel2.position.x=.72;root.add(wheel2);
  const cyl=(a,b,r=.035)=>{const v=new THREE.Vector3().subVectors(new THREE.Vector3(...b),new THREE.Vector3(...a));const m=walkCylinder(r,r,v.length(),wood,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,{parent:root,seg:8});m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());};
  cyl([-.72,.48,0],[-.15,.88,0]);cyl([-.15,.88,0],[.1,.48,0]);cyl([.1,.48,0],[-.72,.48,0]);cyl([-.15,.88,0],[.72,.48,0]);cyl([.1,.48,0],[.72,.48,0]);cyl([-.22,.92,0],[.02,.92,0]);cyl([.7,.8,0],[.85,.83,0]);
  walkBox(.4,.12,.3,wood,-.18,1.05,0,{parent:root});
}
function walkModelGeneric(root,it){
  const metal=walkMaterial(0x8c7958,.38,.55),dark=walkMaterial(0x3d2b1c,.6,.22);
  if(it.art==='dai-bac'||/đại bác|dai bac|pháo|phao/i.test(it.title+' '+it.art))walkModelCannon(root);
  else if(/thuyền|thuyen|tàu|tau|sông|song/i.test(it.title+' '+it.art))walkModelBoat(root);
  else if(/tượng|tuong|tướng|tuong-quan|quan/i.test(it.title+' '+it.art))walkModelStatue(root);
  else if(/xe|bicycle|thồ|tho/i.test(it.title+' '+it.art))walkModelBicycle(root);
  else if(/bếp|bep/i.test(it.title+' '+it.art)){
    walkBox(1.35,.35,1.05,dark,0,.17,0,{parent:root});walkBox(1.1,.16,.82,metal,0,.42,0,{parent:root});
    const fire=new THREE.MeshStandardMaterial({color:0xff7a19,emissive:0xff4d00,emissiveIntensity:1.8});walkSphere(.19,fire,0,.65,0,{x:1.25,y:.75,z:1.25},root);
  }else if(/gươm|guom|kiếm|kiem/i.test(it.title+' '+it.art)){
    walkCylinder(.06,.08,1.8,metal,0,1,0,{parent:root});walkBox(.5,.08,.12,dark,0,.35,0,{parent:root});
  }else walkModelCannon(root);
}
function walkLoadGLBModel(target,filename,fitAxis='y',fitSize=1.85){
  import('https://esm.sh/three@0.159.0/examples/jsm/loaders/GLTFLoader.js').then(({GLTFLoader})=>{
    new GLTFLoader().load(new URL(filename,document.baseURI).href,gltf=>{
      const model=gltf.scene,box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
      if(!size.y)return;
      const cannon=filename==='phao.glb',scale=fitSize/(size[fitAxis]||size.y);model.scale.setScalar(scale);model.rotation.x=cannon?.34:0;
      const fittedBox=new THREE.Box3().setFromObject(model);model.position.set(-(fittedBox.min.x+fittedBox.max.x)/2,-fittedBox.min.y+(cannon?.12:0),-(fittedBox.min.z+fittedBox.max.z)/2);
      target.traverse(object=>{if(object.isMesh){object.geometry?.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(material=>material?.dispose());}});
      target.clear();target.add(model);model.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;}});
      if(cannon)walkCannonCarriage(target);
      if(W.renderer)W.renderer.shadowMap.needsUpdate=true;
    },undefined,error=>console.warn(`Không tải được ${filename}; đang dùng mô hình dự phòng.`,error));
  }).catch(error=>console.warn(`Không tải được GLTFLoader cho ${filename}; đang dùng mô hình dự phòng.`,error));
}
function walkBuildArtifacts(){
  const items=S.items.filter(i=>i.type==='daocu');if(!items.length){
    const dummy={id:'model-phao',type:'daocu',title:'Mô hình pháo Tây Sơn',date:'Mô hình minh họa',detail:'Mô hình pháo trưng bày trong phòng hiện vật.'};
    walkPedestal(14,0,dummy.title);const g=new THREE.Group();g.position.set(14,1.63,0);g.rotation.y=-Math.PI/2;walkModelCannon(g);g.userData.item=dummy;W.scene.add(g);W.targets.push(g);walkLoadGLBModel(g,'phao.glb','z',1.45);return;
  }
  const byCampaign={xiem:[],thanh:[]};items.forEach(it=>byCampaign[it.campaign==='thanh'?'thanh':'xiem'].push(it));
  Object.entries(byCampaign).forEach(([campaign,group])=>group.forEach((it,i)=>{
    const x=group.length===1?14:12.8+(i%2)*2.4,z=(campaign==='xiem'?-1:1)*(1.45+Math.floor(i/3)*1.5);
    const isCannon=it.art==='dai-bac'||/đại bác|dai bac|pháo|phao/i.test(it.title),isQuangTrung=campaign==='thanh'&&/tượng.*quang trung|quang trung.*tượng/i.test(it.title);
    walkPedestal(x,z,it.title,!isCannon&&!isQuangTrung);const model=new THREE.Group();model.position.set(x,1.63,z);model.rotation.y=-Math.PI/2;model.userData.item=it;walkModelGeneric(model,it);W.scene.add(model);W.targets.push(model);
    if(isCannon)walkLoadGLBModel(model,'phao.glb','z',1.45);
    else if(isQuangTrung)walkLoadGLBModel(model,'tuong3d.glb','y',1.85);
    walkPointLight(x,4,z,0xffd18a,1.1,5);
  }));
  const boardMaterial=walkMaterial(0x3b2921,.58,.2);
  const xiemBoard=walkSign('HIỆN VẬT TÂY SƠN','CHIẾN THẮNG QUÂN XIÊM',13.22,.92,-1.5,-Math.PI/2,'#4a1718',1.55,.48);
  const thanhBoard=walkSign('HIỆN VẬT TÂY SƠN','CHIẾN THẮNG QUÂN THANH',13.22,.92,1.5,-Math.PI/2,'#273c32',1.55,.48);
  walkBox(1.7,.58,.08,boardMaterial,0,0,-.05,{parent:xiemBoard,cast:false});walkBox(1.7,.58,.08,boardMaterial,0,0,-.05,{parent:thanhBoard,cast:false});
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
    const x=positions.getX(i),z=-positions.getY(i),edge=Math.min(1,Math.abs(z)/5.8);
    const ridgeA=Math.exp(-((x+1.25)**2/1.1+(z+1.5)**2/3.2)),ridgeB=Math.exp(-((x-1.15)**2/1.2+(z-.75)**2/3.8));
    const elevation=campaign==='thanh'?ridgeA*.62+ridgeB*.42:Math.max(0,Math.abs(z)-.8)*.085;
    const height=.02+edge*.08+elevation+Math.sin(x*2.1+z*.6)*.012+Math.cos(x*.9-z*1.4)*.01;
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
function walkBattleArrow(group,start,end,color,height=.34){
  const marker=new THREE.Group(),material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.88});
  const from=new THREE.Vector3(start[0],height,start[1]),to=new THREE.Vector3(end[0],height,end[1]),direction=new THREE.Vector3().subVectors(to,from).normalize();
  const lineGeometry=new THREE.BufferGeometry().setFromPoints([from,to]),shaft=new THREE.Line(lineGeometry,new THREE.LineBasicMaterial({color,transparent:true,opacity:.88}));marker.add(shaft);
  const head=new THREE.Mesh(new THREE.ConeGeometry(.06,.14,5),material);head.position.copy(to);head.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);head.castShadow=false;marker.add(head);group.add(marker);return marker;
}
function walkBattleBoat(group,x,z,color){
  const boat=new THREE.Group();boat.position.set(x,.14,z);boat.scale.set(1.8,1.35,1.55);
  const hullShape=new THREE.Shape();hullShape.moveTo(-.52,0);hullShape.quadraticCurveTo(-.42,-.17,-.2,-.18);hullShape.lineTo(.34,-.14);hullShape.quadraticCurveTo(.56,0,.34,.14);hullShape.lineTo(-.28,.16);hullShape.quadraticCurveTo(-.46,.13,-.52,0);
  const hullGeometry=new THREE.ExtrudeGeometry(hullShape,{depth:.14,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.025,bevelThickness:.02});hullGeometry.translate(0,0,-.07);hullGeometry.rotateX(-Math.PI/2);
  const hull=new THREE.Mesh(hullGeometry,walkMaterial(color,.66,.12));hull.position.y=.05;hull.castShadow=true;boat.add(hull);
  walkBox(.55,.07,.2,walkMaterial(0x725b42,.78,.06),0,.2,0,{parent:boat});
  walkCylinder(.025,.035,.46,walkMaterial(0x806847,.7,.12),-.05,.43,0,{parent:boat,seg:7});
  const sailShape=new THREE.Shape();sailShape.moveTo(0,0);sailShape.lineTo(.24,.35);sailShape.lineTo(.27,0);sailShape.closePath();
  const sail=new THREE.Mesh(new THREE.ShapeGeometry(sailShape),walkMaterial(0xd8d0bb,.9,.01,{side:THREE.DoubleSide}));sail.position.set(-.04,.24,.015);boat.add(sail);
  group.add(boat);return boat;
}
function walkRiverRelief(group){
  const water=new THREE.Shape();water.moveTo(-3.02,-.78);water.bezierCurveTo(-1.8,-1.02,-1.3,-.28,-.22,-.38);water.bezierCurveTo(.92,-.49,1.62,-.9,3.02,-.62);water.lineTo(3.02,.66);water.bezierCurveTo(1.8,.42,.93,.94,-.13,.82);water.bezierCurveTo(-1.32,.72,-1.82,.23,-3.02,.48);water.closePath();
  const riverGeometry=new THREE.ShapeGeometry(water,24);riverGeometry.rotateX(-Math.PI/2);
  const river=new THREE.Mesh(riverGeometry,new THREE.MeshPhysicalMaterial({color:0x557d83,roughness:.27,metalness:.12,clearcoat:.36,clearcoatRoughness:.3}));river.position.y=.12;river.receiveShadow=true;group.add(river);
  const shoal=new THREE.Shape();shoal.moveTo(-.9,-.1);shoal.quadraticCurveTo(-.6,-.34,-.1,-.3);shoal.quadraticCurveTo(.55,-.26,.95,-.02);shoal.quadraticCurveTo(.63,.28,.08,.3);shoal.quadraticCurveTo(-.58,.28,-.9,-.1);shoal.closePath();
  const islandGeometry=new THREE.ShapeGeometry(shoal,20);islandGeometry.rotateX(-Math.PI/2);
  const island=new THREE.Mesh(islandGeometry,walkMaterial(0x58634c,.98,.01));island.position.set(.55,.145,-.04);island.receiveShadow=true;group.add(island);
  [[-2.5,-1.32],[-1.55,-1.5],[1.55,-1.43],[2.5,-1.22],[-2.35,1.38],[1.9,1.42]].forEach(([x,z],i)=>walkBattleTree(group,x,z,.8+(i%2)*.1));
  const enemyRoute=walkBattleArrow(group,[2.8,.05],[.45,.12],0x496d82,.15);W.ships.push({mesh:enemyRoute,bx:0,bz:0,index:W.ships.length,campaign:'xiem'});
  walkBattleArrow(group,[-2.4,-1.35],[-.45,-.56],0x8f4938,.15);
  walkBattleArrow(group,[2.35,1.32],[.45,.55],0x8f4938,.15);
  walkBattleLabel(group,'RẠCH GẦM',-2.15,-.92,'#3a3026',1.45);
  walkBattleLabel(group,'XOÀI MÚT',2.12,.91,'#3a3026',1.45);
  walkBattleLabel(group,'CÙ LAO THỚI SƠN',.55,-.02,'#3d4638',1.8);
  walkBattleLabel(group,'KIM SƠN',-2.0,2.2,'#4b4437',1.15);
  walkBattleLabel(group,'BÌNH ĐỨC',1.9,-2.05,'#4b4437',1.25);
}
function walkThanhRelief(group){
  const fort=walkMaterial(0x58483a,.9,.02),brick=walkMaterial(0x625046,.88,.02);
  const rampart=new THREE.Mesh(new THREE.SphereGeometry(1,28,14),fort);rampart.position.set(0,.17,-4.05);rampart.scale.set(2.35,.19,.38);rampart.castShadow=true;group.add(rampart);
  for(let i=0;i<3;i++)walkBox(.42,.32,.34,brick,-1.45+i*1.45,.35,-4.05,{parent:group});
  [[-2.25,5.25,-1.25,-1.0],[0,5.45,.05,-.9],[2.25,5.15,1.15,1.05]].forEach(([sx,sz,ex,ez])=>{
    const route=walkBattleArrow(group,[sx,sz],[ex,ez],0x8f4938,.23);W.ships.push({mesh:route,bx:0,bz:0,index:W.ships.length,campaign:'thanh'});
  });
  walkBattleArrow(group,[1.45,-1.1],[2.15,-4.75],0x596a70,.23);
  walkBattleLabel(group,'TAM ĐIỆP',-2.05,4.85,'#433c33',1.45);
  walkBattleLabel(group,'NGỌC HỒI',-1.65,-1.9,'#493d31',1.55);
  walkBattleLabel(group,'ĐỐNG ĐA',1.35,1.25,'#493d31',1.35);
  walkBattleLabel(group,'THĂNG LONG',1.75,-5.25,'#3c3932',1.7);
}
function walkBuildBattle(){
  const campaigns=[
    {id:'xiem',x:-2.82,title:'RẠCH GẦM – XOÀI MÚT',subtitle:'CHIẾN DỊCH CHỐNG QUÂN XIÊM',color:'#4a1718',build:walkRiverRelief},
    {id:'thanh',x:2.82,title:'NGỌC HỒI – ĐỐNG ĐA',subtitle:'CHIẾN DỊCH CHỐNG QUÂN THANH',color:'#273c32',build:walkThanhRelief}
  ];
  campaigns.forEach(campaign=>{
    const item=S.items.find(it=>it.type==='sahinh'&&(it.campaign||'xiem')===campaign.id)||{id:'map-'+campaign.id,campaign:campaign.id,type:'sahinh',title:campaign.title,detail:campaign.subtitle};
    const group=new THREE.Group();group.position.set(campaign.x,0,-14);group.scale.set(.76,.76,.76);group.userData.item=item;W.scene.add(group);W.targets.push(group);
    walkBattleGround(group,campaign.id==='xiem'?0x535b4b:0x6b5d4c,campaign.id);campaign.build(group);
    walkSign(campaign.title,campaign.subtitle,campaign.x,2.55,-19.68,0,campaign.color);
    walkPointLight(campaign.x,3.8,-14,0xffd18a,.85,6);
  });
  // Bốn TV treo tường: hai bên trái cho chiến dịch quân Xiêm, hai bên phải cho quân Thanh.
  const tvFrame=walkMaterial(0x252a2e,.32,.58);W.tvScreens=[];
  [['xiem',-5.78,-17.2,Math.PI/2],['xiem',-5.78,-11.2,Math.PI/2],['thanh',5.78,-17.2,-Math.PI/2],['thanh',5.78,-11.2,-Math.PI/2]].forEach(([campaign,x,z,yaw],index)=>{
    const root=new THREE.Group();root.position.set(x,3.15,z);root.rotation.y=yaw;
    const frame=new THREE.Mesh(new THREE.BoxGeometry(2.0,1.25,.13),tvFrame);root.add(frame);
    const screenMat=new THREE.MeshBasicMaterial({map:walkTVTexture(campaign,index),side:THREE.DoubleSide});
    const screen=new THREE.Mesh(new THREE.PlaneGeometry(1.82,1.07),screenMat);screen.position.z=.071;root.add(screen);W.tvScreens.push({campaign,mesh:screen});
    const label=walkSign(campaign==='xiem'?'VIDEO SA HÌNH':'VIDEO SA HÌNH',campaign==='xiem'?'CHIẾN DỊCH QUÂN XIÊM':'CHIẾN DỊCH QUÂN THANH',x,1.85,z,yaw,campaign==='xiem'?'#4a1718':'#273c32');
    const hit=new THREE.Mesh(new THREE.PlaneGeometry(2.1,1.38),new THREE.MeshBasicMaterial({transparent:true,opacity:.001,side:THREE.DoubleSide,depthWrite:false}));hit.position.copy(root.position);hit.rotation.y=yaw;hit.userData.item={id:'tv-'+campaign+'-'+index,type:'video',title:campaign==='xiem'?'Video sa hình – Kháng chiến chống quân Xiêm':'Video sa hình – Kháng chiến chống quân Thanh',date:campaign==='xiem'?'Rạch Gầm – Xoài Mút, 1785':'Ngọc Hồi – Đống Đa, 1789',origin:'Video sa hình',detail:campaign==='xiem'?'Video tái hiện diễn biến chiến dịch Rạch Gầm – Xoài Mút.':'Video sa hình về chiến dịch Ngọc Hồi – Đống Đa.',campaign,isVideoScreen:true};W.scene.add(hit);W.targets.push(hit);W.scene.add(root);
  });
  const battleVideo=document.createElement('video');battleVideo.muted=true;battleVideo.loop=true;battleVideo.autoplay=true;battleVideo.playsInline=true;battleVideo.preload='auto';
  battleVideo.src=new URL('RGXM%201.mp4',document.baseURI).href;
  const battleTexture=new THREE.VideoTexture(battleVideo);battleTexture.colorSpace=THREE.SRGBColorSpace;
  W.tvScreens.filter(screen=>screen.campaign==='xiem').forEach(screen=>{screen.mesh.material.map?.dispose();screen.mesh.material.map=battleTexture;screen.mesh.material.needsUpdate=true;});
  W.screenVideos=[battleVideo];battleVideo.play().catch(error=>console.warn('Không thể tự phát RGXM 1.mp4.',error));
}
function walkTVTexture(campaign,index){
  const c=document.createElement('canvas');c.width=640;c.height=360;const g=c.getContext('2d');g.fillStyle='#101c25';g.fillRect(0,0,640,360);g.fillStyle=campaign==='xiem'?'#5a2825':'#294638';g.fillRect(0,0,640,12);g.fillStyle='#dbeaf0';g.textAlign='center';g.font='bold 32px sans-serif';g.fillText('VIDEO SA HÌNH',320,145);g.font='24px sans-serif';g.fillText(campaign==='xiem'?'CHIẾN DỊCH QUÂN XIÊM':'CHIẾN DỊCH QUÂN THANH',320,195);g.font='18px sans-serif';g.fillText('Ngắm TV và nhấn E để phát video',320,250);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;
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
  if(!W.camera)return;const p={gallery:{x:-10.3,z:0,yaw:Math.PI/2},artifacts:{x:10.3,z:0,yaw:-Math.PI/2},battle:{x:-1,z:-9.3,yaw:0,pitch:-.65},documents:{x:0,z:10.3,yaw:Math.PI},hall:{x:0,z:2.5,yaw:0}}[id]||{x:0,z:2.5,yaw:0};
  W.camera.position.set(p.x,1.8,p.z);W.yaw=p.yaw;W.pitch=p.pitch||0;walkApplyLook();W.current=null;$('#walkStatus').textContent=p.label||WALK_TYPES[id]?.label||'Sảnh trung tâm';$('#walkPrompt').textContent='Hãy quan sát xung quanh, hướng tâm ngắm vào một hiện vật rồi nhấn E.';
}
function walkInBounds(x,z){return W.rooms.some(r=>x>=r.minX&&x<=r.maxX&&z>=r.minZ&&z<=r.maxZ);}
function walkCollision(x,z){const r=.32;return W.solids.some(b=>x+r>b.minX&&x-r<b.maxX&&z+r>b.minZ&&z-r<b.maxZ);}
function walkMove(dt){
  if(!W.active||!W.camera||!$('#walkIntro').hidden||!$('#walkDetail').hidden)return;
  if(document.pointerLockElement!==$('#walkCanvas')&&(W.keys.turnL||W.keys.turnR)){W.yaw+=(W.keys.turnL?1:0)*dt*1.7-(W.keys.turnR?1:0)*dt*1.7;walkApplyLook();}
  let f=(W.keys.w||W.keys.arrowup?1:0)-(W.keys.s||W.keys.arrowdown?1:0),r=(W.keys.d||W.keys.arrowright?1:0)-(W.keys.a||W.keys.arrowleft?1:0);
  if(!f&&!r)return;const len=Math.hypot(f,r);f/=len;r/=len;const sp=(W.keys.shift?5.2:3.5)*dt;
  const dx=(-Math.sin(W.yaw)*f+Math.cos(W.yaw)*r)*sp,dz=(-Math.cos(W.yaw)*f-Math.sin(W.yaw)*r)*sp;
  let nx=W.camera.position.x+dx,nz=W.camera.position.z;if(walkInBounds(nx,nz)&&!walkCollision(nx,nz))W.camera.position.x=nx;
  nx=W.camera.position.x;nz=W.camera.position.z+dz;if(walkInBounds(nx,nz)&&!walkCollision(nx,nz))W.camera.position.z=nz;
}
function walkFindHit(){
  if(!W.camera||!W.ray)return null;W.ray.setFromCamera(W.centerRay,W.camera);const hits=W.ray.intersectObjects(W.targets,true);
  for(const h of hits){if(h.distance>7.5)continue;let o=h.object;while(o){if(o.userData&&o.userData.item)return{o,item:o.userData.item,distance:h.distance};o=o.parent;}}
  return null;
}
function walkUpdatePrompt(now){
  if(!W.active||!$('#walkIntro').hidden||!$('#walkDetail').hidden)return;
  if(W.battleRunning){const status=walkLocationLabel()+' · Đang tái hiện trận đánh';if(status!==W.statusText){$('#walkStatus').textContent=status;W.statusText=status;}return;}
  if(now-W.promptAt<50)return;W.promptAt=now;
  const hit=walkFindHit();W.current=hit?hit.item:null;
  const prompt=hit?'E / nhấp chuột  ·  '+hit.item.title+'  ·  Mở thuyết minh':document.pointerLockElement===$('#walkCanvas')?'Di chuyển bằng WASD · Ngắm vào vật thể để tương tác':'Nhấp vào cảnh 3D để bật điều khiển góc nhìn';
  if(prompt!==W.promptText){const p=$('#walkPrompt');p.textContent=prompt;p.style.borderColor=hit?'rgba(255,212,110,.9)':'rgba(230,196,122,.45)';W.promptText=prompt;}
  const status=walkLocationLabel()+(W.battleRunning?' · Đang tái hiện trận đánh':'');
  if(status!==W.statusText){$('#walkStatus').textContent=status;W.statusText=status;}
}
function walkInteract(){
  if(!W.active||!$('#walkIntro').hidden||!$('#walkDetail').hidden)return;
  const hit=walkFindHit();if(!hit){$('#walkPrompt').textContent='Hãy hướng tâm ngắm vào tranh, hiện vật, sa hình hoặc văn bản để mở nội dung.';return;}walkOpenItem(hit.item);
}
function walkCloseDetail(){
  const screenVideo=W.screenVideos[0];
  if(screenVideo?.parentElement===$('#walkVideoPlayer')){screenVideo.controls=false;screenVideo.classList.remove('walk-popup-video');screenVideo.remove();}
  $('#walkDetailContent').querySelectorAll('video').forEach(video=>{if(!W.screenVideos.includes(video))video.pause();});
  $('#walkDetail').hidden=true;
}
function walkOpenItem(it){
  if(!it)return;W.current=it;
  const type=TYPES[it.type]||{icon:'🏛',label:'Hiện vật'};
  const intro=it.type==='tailieu'?(it.text||it.detail):(it.detail||it.text||'Chưa có nội dung thuyết minh.');
  const paragraphs=String(intro||'').split(/\n+/).map(s=>s.trim()).filter(Boolean).map(s=>`<p>${esc(s)}</p>`).join('');
  const image=(it.art||it.img)?`<div class="mini-art">${thumb(it)}</div>`:'';
  const resourcePanel=it.isResourceCabinet?`<section class="walk-resource-list"><p>Chọn tài liệu bên dưới để tải về thiết bị.</p>${(S.resources||[]).length?(S.resources||[]).map((f,i)=>`<div class="resource-file"><span class="resource-file-type">📄</span><span class="resource-file-name">${esc(f.name)}<small>${(Number(f.size||0)/1024).toFixed(1)} KB</small></span><button class="primary" type="button" data-walk-resource-download="${i}">⬇ Tải xuống</button></div>`).join(''):'<p class="resource-empty">Hiện chưa có tài liệu. Ban quản lý có thể thêm tài liệu trong mục “Quản lý bảo tàng” → “Tải tài liệu”.</p>'}</section>`:'';
  const videos=it.isVideoScreen?(S.videos||[]).filter(v=>v.campaign===(it.campaign||'xiem')):[];
  const defaultVideo=it.isVideoScreen&&it.campaign==='xiem'?`<div class="resource-file"><span class="resource-file-type">🎬</span><span class="resource-file-name">RGXM 1.mp4<small>Tự phát · lặp lại</small></span></div>`:'';
  const videoPanel=it.isVideoScreen?`<section class="walk-video-list">${defaultVideo}${videos.length?'<p>Video đã tải lên cho chiến dịch này:</p>':''}${videos.map((v,i)=>`<div class="resource-file"><span class="resource-file-type">🎬</span><span class="resource-file-name">${esc(v.name)}<small>${(Number(v.size||0)/1024/1024).toFixed(1)} MB</small></span><button class="primary" type="button" data-play-video="${esc(v.id)}">▶ Phát video</button></div>`).join('')}${!videos.length&&it.campaign!=='xiem'?'<p class="resource-empty">Chưa có video cho chiến dịch này. Vào Quản lý bảo tàng → Tải tài liệu → Video cho phòng Sa hình để tải video lên.</p>':''}<div id="walkVideoPlayer"></div></section>`:'';
  $('#walkDetailContent').innerHTML=`<span class="badge">${it.isVideoScreen?'📺':type.icon} ${esc(it.isVideoScreen?'TV sa hình':type.label)}</span><h2>${esc(it.title)}</h2><p class="meta">${esc([it.date,it.origin].filter(Boolean).join(' · '))}</p>${image}<div class="body">${paragraphs|| (it.isResourceCabinet||it.isVideoScreen?'': '<p>Chưa có nội dung mô tả cho hiện vật này.</p>')}</div>${resourcePanel}${videoPanel}${it.question?`<div class="question"><b>Câu hỏi suy ngẫm</b><p>${esc(it.question)}</p></div>`:''}<div class="actions">${it.isEmptyGalleryFrame?'<label class="primary walk-frame-upload">＋ Chọn ảnh<input id="walkFrameUpload" type="file" accept="image/*"></label>':it.isResourceCabinet||it.isVideoScreen?'': '<button class="primary" id="walkSpeak">🔊 Nghe thuyết minh</button>'}${['sahinh','phim'].includes(it.type)?'<button class="primary" id="walkReplay">▶ Tái hiện trận đánh</button>':''}<button id="walkDetailClose2">Đóng thông tin</button></div>`;
  if(it.isVideoScreen&&it.campaign==='xiem'&&W.screenVideos[0]){const video=W.screenVideos[0];video.controls=true;video.classList.add('walk-popup-video');$('#walkVideoPlayer').appendChild(video);video.play().catch(()=>{});}
  $('#walkDetail').hidden=false;$('#walkDetailClose2').onclick=walkCloseDetail;
  const frameUpload=$('#walkFrameUpload');if(frameUpload)frameUpload.addEventListener('change',async event=>{
    const file=event.target.files&&event.target.files[0];if(!file)return;
    try{
      it.img=await readImage(file);it.title=(file.name.replace(/\.[^.]+$/,'').trim()||'Ảnh tư liệu').slice(0,90);it.date='Ảnh tư liệu';it.origin='Ảnh do người quản lý tải lên';it.detail='Ảnh tư liệu do người quản lý tải lên.';it.type='anh';delete it.isEmptyGalleryFrame;
      if(!S.items.some(item=>item.id===it.id))S.items.push(it);save();
      const frame=W.targets.find(target=>target.userData.item?.id===it.id),picture=frame?.children.find(child=>child.geometry?.type==='PlaneGeometry'&&Math.abs(child.position.z-.035)<.001),label=frame?.children.find(child=>child.geometry?.type==='PlaneGeometry'&&child.position.y<-.1);
      if(picture){picture.material.map?.dispose();picture.material.map=walkTextureForItem(it);picture.material.needsUpdate=true;}
      if(label){label.material.map?.dispose();label.material.map=walkLabelTexture(it.title,it.date,'#362018');label.material.needsUpdate=true;}
      if(frame)frame.userData.item=it;walkOpenItem(it);$('#walkPrompt').textContent='Đã thêm ảnh vào khung trưng bày.';
    }catch(error){toast('Không thể thêm ảnh. Hãy thử tệp JPG hoặc PNG nhỏ hơn.');}
  });
  $('#walkDetailContent').querySelectorAll('[data-walk-resource-download]').forEach(btn=>btn.addEventListener('click',()=>downloadSavedResource((S.resources||[])[Number(btn.dataset.walkResourceDownload)])));
  $('#walkDetailContent').querySelectorAll('[data-play-video]').forEach(btn=>btn.addEventListener('click',()=>{const v=(S.videos||[]).find(x=>x.id===btn.dataset.playVideo);if(!v)return;const host=$('#walkVideoPlayer');host.innerHTML=`<video controls autoplay playsinline style="width:100%;max-height:42vh;background:#000;border-radius:10px" src="${v.dataURL}"></video>`;const video=host.querySelector('video');const texture=new THREE.VideoTexture(video);texture.colorSpace=THREE.SRGBColorSpace;(W.tvScreens||[]).filter(screen=>screen.campaign===v.campaign).forEach(screen=>{screen.mesh.material.map=texture;screen.mesh.material.needsUpdate=true;});video.play().catch(()=>{});}));
  if(document.pointerLockElement===$('#walkCanvas'))document.exitPointerLock?.();
}
function walkSpeak(it){
  if(!it)return;const txt=it.script||it.detail||it.text||it.title;
  if(!('speechSynthesis'in window)){toast('Trình duyệt không hỗ trợ đọc thuyết minh tự động.');return}
  try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(txt);u.lang='vi-VN';u.rate=Number(S.settings.rate)||1;const v=typeof pickVoice==='function'?pickVoice():null;if(v){u.voice=v;u.lang=v.lang||'vi-VN'}speechSynthesis.speak(u);}catch(e){toast('Không thể phát giọng đọc trên trình duyệt này.');}
}
function walkPlayBattle(){
  $('#walkDetail').hidden=true;W.activeCampaign=W.current?.campaign||'xiem';W.battleRunning=true;W.battleStart=performance.now();W.battlePhase=-1;W.ships.forEach(s=>{s.mesh.visible=s.campaign===W.activeCampaign;if(s.mesh.visible){s.mesh.position.x=s.bx;s.mesh.position.z=s.bz}});
  $('#walkPrompt').textContent='Tái hiện trận đánh: nhử địch · mai phục · chặn đầu khóa đuôi · hỏa công.';
  if(!(W.camera.position.z < -7 && W.camera.position.z > -20 && Math.abs(W.camera.position.x) < 6))walkTeleport('battle');
}
function walkUpdateBattle(now){
  if(!W.battleRunning)return;W.renderer.shadowMap.needsUpdate=true;const t=(now-W.battleStart)/1000,ph=Math.min(5,Math.floor(t/1.2));
  if(ph!==W.battlePhase){W.battlePhase=ph;const names=W.activeCampaign==='thanh'?['Hành quân thần tốc ra Bắc','Tiến công các đồn tiền tiêu','Đánh Ngọc Hồi','Mũi tiến công Đống Đa','Quân Thanh rút khỏi Thăng Long','Kết quả']:['Tương quan lực lượng','Nhử địch vào khúc sông','Mai phục, chặn đầu và khóa đuôi','Pháo bắn và hỏa công','Đội hình tan vỡ','Kết quả'];$('#walkPrompt').textContent='Cảnh '+(ph+1)+'/6 · '+names[ph];}
  const p=Math.max(0,Math.min(1,t/7.2));W.ships.forEach((s,i)=>{if(s.campaign!==W.activeCampaign)return;const dir=i%2?1:-1,phase=Math.max(0,Math.min(1,(t-1.2)/4.6));s.mesh.position.x=s.bx+(dir*(phase-.5)*2.7)+(i%3-.9)*phase*.35;s.mesh.position.z=s.bz+(t>2.4?Math.sin(t*1.4+i*.6)*.24:0);});
  if(W.activeCampaign==='xiem'&&now-W.screenLast>260){walkUpdateScreen(Math.min(5.95,t/7.2*6));W.screenLast=now;}
  if(t>=7.2){W.battleRunning=false;W.ships.forEach(s=>{s.mesh.visible=true;s.mesh.position.x=s.bx;s.mesh.position.z=s.bz;});$('#walkPrompt').textContent='Kết thúc tái hiện. Hãy chọn sa hình hoặc bấm một hiện vật để xem nội dung chi tiết.';}
}
function walkStartLoop(){if(W.loopRunning||document.hidden)return;W.loopRunning=true;W.last=performance.now();requestAnimationFrame(walkLoop);}
function walkLoop(now){
  if(!W.ready||!W.active||document.hidden){W.loopRunning=false;W.keys={};return;}requestAnimationFrame(walkLoop);const dt=Math.min(.05,Math.max(0,(now-W.last)/1000));W.last=now;
  walkMove(dt);walkUpdatePrompt(now);walkUpdateBattle(now);
  W.renderer.render(W.scene,W.camera);
}
document.addEventListener('visibilitychange',()=>{if(document.hidden){W.keys={};}else if(W.active){W.last=performance.now();walkStartLoop();}});
walkMakeUI();

})();
