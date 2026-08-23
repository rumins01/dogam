
const D = window.__DOGAM__ || JSON.parse(document.getElementById('payload').textContent);
/* ── 데이터 보정 ──
   1) 2026년 행정구역 통합으로 지역구가 '전남광주통합특별시'인 의원은
      지역 필터 라벨을 '전남광주'로 표기 (앞 2글자 절단으로 광주가 사라지던 문제)
   2) 의안 원문 링크 http→https 통일 */
(function(){
  (D.members||[]).forEach(m2=>{ if((m2.dist||'').startsWith('전남광주통합특별시')) m2.sido='전남광주'; });
  const fx=u=>typeof u==='string'? u.replace(/^http:\/\/likms\./,'https://likms.') : u;
  (D.members||[]).forEach(m2=>{ (m2.bills||[]).forEach(b=>{ if(b.link) b.link=fx(b.link); });
    (m2.votes||[]).forEach(v=>{ if(v.link) v.link=fx(v.link); }); });
  (D.bills||[]).forEach(b=>{ if(b.link) b.link=fx(b.link); });
})();
// 좁은 화면 짧은 플레이스홀더 — 검색 범위(이름·지역구·위원회)는 항상 보이게 유지
(function(){ const f=()=>{ const q0=document.getElementById('q');
  if(q0 && !q0.dataset.lock) q0.placeholder = innerWidth<480 ? '이름·지역구·위원회 검색' : '의원 이름·지역구·위원회 검색'; };
  addEventListener('resize',f); f(); })();
/* 다크모드 토글: 기본은 OS 설정, 누르면 수동 고정(localStorage 유지) */
(function(){
  const KEY='dogam.theme';
  const root=document.documentElement;
  const saved=(()=>{try{return localStorage.getItem(KEY);}catch(e){return null;}})();
  if(saved==='dark'||saved==='light') root.dataset.theme=saved;
  const isDark=()=> root.dataset.theme ? root.dataset.theme==='dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  const paint=()=>{ const b=document.getElementById('themeBtn'); if(!b) return;
    b.innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-'+(isDark()?'sun':'moon')+'"/></svg>';
    b.setAttribute('aria-label', isDark()?'밝은 화면으로':'어두운 화면으로'); };
  document.addEventListener('DOMContentLoaded',paint); paint();
  document.addEventListener('click',e=>{
    const b=e.target.closest('#themeBtn'); if(!b) return;
    const next=isDark()?'light':'dark';
    root.dataset.theme=next;
    try{ localStorage.setItem(KEY,next); }catch(e2){}
    paint();
    try{ if(typeof render==='function') render(); }catch(e3){}
  });
})();
const PC = {'더불어민주당':'#152484','국민의힘':'#E61E2B','조국혁신당':'#0073CF','개혁신당':'#FF7210',
  '진보당':'#D6001C','기본소득당':'#00D2C3','사회민주당':'#F58400','무소속':'#8b8d93'};
// 다크 배경에서 대비가 부족한 색은 밝은 변형을 쓴다 (어두운 남색·적색 계열)
const PC_DARK = {'더불어민주당':'#5B79E8','국민의힘':'#FF6470','조국혁신당':'#4DA6FF','개혁신당':'#FF9A4D',
  '진보당':'#FF5C6E','기본소득당':'#2FE3D6','사회민주당':'#FFA83D','무소속':'#A8ADB8'};
const isDarkNow = () => { const t=document.documentElement.dataset.theme;
  return t ? t==='dark' : matchMedia('(prefers-color-scheme: dark)').matches; };
// 막대·도형용(원색 유지) / 글자용(다크 대비 보정)
const pcFill = p => PC[p] || '#8b8d93';
const REELE_N={'초선':1,'재선':2,'3선':3,'4선':4,'5선':5,'6선':6,'7선':7,'8선':8,'9선':9};
function reeleNum(r){ return REELE_N[String(r||'').trim()] || 0; }
const pc = p => (isDarkNow() ? (PC_DARK[p]||'#A8ADB8') : (PC[p]||'#8b8d93'));
const esc = s => String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const nf = n => (n??0).toLocaleString('ko-KR');

// ── masthead stats
const m = D.meta;
var _st=document.getElementById('stats'); if(_st) _st.innerHTML = [
  [nf(m.nMember),'국회의원'],[nf(m.nBill),'의원발의 법률안'],[nf(m.nVoteBill),'기명표결 의안'],
  [nf(m.nVoteRec),'표결 기록'],[nf(m.nSum),'법안 제안이유'],[nf(m.nSpeech),'발언 구간']
].map(([b,i])=>`<div class="stat"><b>${b}</b><i>${i}</i></div>`).join('');
document.getElementById('gen').textContent = `데이터 수집일 ${m.gen} · 제${m.age}대 국회 기준`;

// ── party chips
const pcount = {};
D.members.forEach(x=>pcount[x.party]=(pcount[x.party]||0)+1);
let activeParty = null;
document.getElementById('parties').innerHTML = Object.entries(pcount).sort((a,b)=>b[1]-a[1])
  .map(([p,c])=>`<button class="chip" data-p="${esc(p)}" aria-pressed="false">
    <span class="dot" style="background:${pc(p)}"></span>${esc(p)}<em>${c}</em></button>`).join('');
document.getElementById('parties').addEventListener('click',e=>{
  const b = e.target.closest('.chip'); if(!b) return;
  const p = b.dataset.p;
  activeParty = activeParty===p ? null : p;
  [...document.querySelectorAll('.chip')].forEach(c=>c.setAttribute('aria-pressed', c.dataset.p===activeParty));
  render(); pushRouteSoon();
});

// ── render list
const q = document.getElementById('q'), sortSel = document.getElementById('sort'), sidoSel = document.getElementById('sido');
const SIDO_ORDER=['서울','경기','인천','부산','대구','광주','대전','울산','세종','강원','충북','충남','전북','전남','전남광주','경북','경남','제주','비례대표'];
const scount={}; D.members.forEach(x=>scount[x.sido]=(scount[x.sido]||0)+1);
sidoSel.innerHTML = '<option value="">전체 지역 (299)</option>' + SIDO_ORDER.filter(s=>scount[s])
  .map(s=>`<option value="${s}">${s} (${scount[s]})</option>`).join('');
q.addEventListener('input', ()=>{ render(); pushRouteSoon(); });
sortSel.addEventListener('change', ()=>{ render(); pushRouteSoon(); });
sidoSel.addEventListener('change', ()=>{ render(); pushRouteSoon(); });
/* 필터 상태를 URL에 조용히 반영(replaceState) — 공유 가능한 주소를 만든다 */
let _prT=null;
function pushRouteSoon(){ clearTimeout(_prT); _prT=setTimeout(()=>{ try{ pushRoute(true); }catch(e){} }, 300); }

function avatar(x, cls){
  return x.photo ? `<div class="${cls}"><img src="${x.photo}" alt="${esc(x.name)} 의원 사진" loading="lazy"></div>`
                 : `<div class="${cls} nb">${esc(x.name.slice(0,1))}</div>`;
}

/* 초성 추출 */
const CHO=['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const FOLD={'ㄲ':'ㄱ','ㄸ':'ㄷ','ㅃ':'ㅂ','ㅆ':'ㅅ','ㅉ':'ㅈ'};
const IDX_KEYS=['ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
function choOf(name){
  const c=(name||'').charCodeAt(0);
  if(c>=0xAC00 && c<=0xD7A3){ const k=CHO[Math.floor((c-0xAC00)/588)]; return FOLD[k]||k; }
  return '#';
}
/* 초성 문자열 — "ㅇㅊㅅ" 같은 초성 검색용 */
function choStr(s){ let o='';
  for(const ch of String(s||'')){ const c=ch.charCodeAt(0);
    o += (c>=0xAC00&&c<=0xD7A3)? CHO[Math.floor((c-0xAC00)/588)] : ch; }
  return o; }
const JAMO_RE=/^[ㄱ-ㅎ]+$/;
let viewMode='qt';   // 홈 = 발언 화면
document.getElementById('view').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b) return;
  viewMode=b.dataset.v;
  [...document.querySelectorAll('#view button')].forEach(z=>z.setAttribute('aria-pressed', z.dataset.v===viewMode));
  render();
});






/* ================= 내 의원 (2016 덱 슬라이드 10: 지역구·관심 의원 소식) ================= */
const STAR_KEY='dogam.star.v1';
let STAR = (()=>{ try{ return JSON.parse(localStorage.getItem(STAR_KEY))||[]; }catch(e){ return []; } })();
function saveStar(){ try{ localStorage.setItem(STAR_KEY, JSON.stringify(STAR)); }catch(e){} }
function isStar(cd){ return STAR.includes(cd); }
function toggleStar(cd){
  const i=STAR.indexOf(cd);
  if(i>=0) STAR.splice(i,1); else STAR.push(cd);
  saveStar();
  document.querySelectorAll(`.starbtn[data-cd="${cd}"]`).forEach(b=>b.classList.toggle('on', isStar(cd)));
  if(viewMode==='my') myRender();
}

function feedOf(cd){
  const m=D.members.find(x=>x.cd===cd); if(!m) return [];
  const out=[];
  (m.bills||[]).slice(0,6).forEach(b=>out.push({d:b.dt, k:'발의', t:b.name, s:`${b.cmt||''} · ${b.proc||'계류'}`, m, u:b.link}));
  (m.votes||[]).slice(0,8).forEach(v=>out.push({d:v.dt, k:'표결', t:v.name, s:`${v.r} · 본회의 찬성 ${nf(v.y)} 반대 ${nf(v.n)}`, m, u:v.link, vr:v.r}));
  (D.quotes||[]).filter(z=>z.c===cd).slice(0,6).forEach(z=>out.push({d:z.d, k:'발언', t:z.s, s:`${z.m}위원회`, m, tg:z.t, q:1}));
  ((D.sched||{})[cd]||[]).slice(0,6).forEach(x=>out.push({d:x.d, k:'일정', t:`${x.k} ${x.g}`, s:`${x.s||''} ${x.t||''}`.trim(), m}));
  return out;
}

function myRender(){
  const w=document.getElementById('mywrap');
  const dists=[...new Set(D.members.filter(x=>x.dist&&x.distType==='지역구').map(x=>x.dist))].sort((a,b)=>a.localeCompare(b,'ko'));
  const picked=STAR.map(cd=>D.members.find(m=>m.cd===cd)).filter(Boolean);
  let feed=[];
  picked.forEach(m=>feed.push(...feedOf(m.cd)));
  feed.sort((a,b)=>(b.d||'').localeCompare(a.d||''));
  feed=feed.slice(0,90);
  w.innerHTML=`
    <div class="myhead">
      <h3>내 의원 소식</h3>
      <p>발의·표결·발언·일정을 한 줄기로 모아요 · 이 브라우저에만 저장돼요</p>
      <div class="mypick">
        <select id="myDist"><option value="">내 지역구 선택…</option>
          ${dists.map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join('')}</select>
        ${STAR.length?`<button class="qtmore" style="width:auto;margin:0;padding:7px 14px" id="myClear">전체 해제</button>`:''}
      </div>
      ${picked.length? `<div class="mystar">${picked.map(m=>`
        <span class="sc2">${m.photo?`<img src="${m.photo}" alt="">`:''}<b>${esc(m.name)}</b>
          <span style="color:var(--ink3);font-size:0.6875rem">${esc(m.party)}</span>
          <button data-x="${m.cd}" title="해제">&times;</button></span>`).join('')}</div>`
        : `<div class="mystar"><span style="font-size:0.75rem;color:var(--ink3)">아직 등록한 의원이 없어요. 지역구를 고르거나 별표를 눌러 보세요</span></div>`}
    </div>
    ${picked.length? `<div class="feed">${feed.map(f=>`
      <div class="fi" style="--pc5:${pc(f.m.party)}">
        <div class="fk"><span class="kd">${f.k}</span><span>${esc(f.d||'')}</span></div>
        <div class="ft ${f.q?'q':''}">${f.q?'“'+esc(f.t)+'”':esc(f.t)}</div>
        <div class="fm">${f.vr?`<span class="tag ${VT[f.vr]||''}">${esc(f.vr)}</span>`:''}
          <span>${esc(f.s||'')}</span>
          ${f.tg?f.tg.map(t=>`<span class="tag">#${esc(t)}</span>`).join(''):''}
          ${f.u?`<a href="${esc(f.u)}" target="_blank" rel="noopener" class="tag">원문</a>`:''}</div>
        <div class="fw" data-cd="${f.m.cd}">${f.m.photo?`<img src="${f.m.photo}" alt="">`:''}
          <b>${esc(f.m.name)}</b><span style="font-size:0.6875rem;color:var(--ink3)">${esc(f.m.dist||'비례대표')}</span></div>
      </div>`).join('')}</div>` : ''}`;
  const sel=document.getElementById('myDist');
  if(sel) sel.onchange=()=>{ const m=D.members.find(x=>x.dist===sel.value); if(m&&!isStar(m.cd)) toggleStar(m.cd); else myRender(); };
  const cl=document.getElementById('myClear');
  if(cl) cl.onclick=()=>{ STAR=[]; saveStar(); myRender(); };
  w.querySelectorAll('.sc2 button').forEach(b=>b.onclick=()=>toggleStar(b.dataset.x));
  w.querySelectorAll('.fw').forEach(el=>el.onclick=()=>open(D.members.find(m=>m.cd===el.dataset.cd)));
}

/* ================= 발언 모음 ================= */

/* ── 주제별 언론 보도 (네이버 검색 API · 최근 1년) ──
   막대·매체 순위는 수집 전량 기준, 기사 목록은 수록분만 — 둘을 섞지 않고 구분해 표시한다 */
let qtNMon=null, qtNShown=12;
function nvURL(a){ return 'https://'+(D.nvn.dm[a[3]]||'')+(a[4]||''); }
/* 발언 1건에 붙는 관련 보도 — 네이버 수집분(q.nq)을 우선하고 없으면 기존 구글뷰스 데이터로 내려간다.
   반환 형식을 [날짜, 제목, 매체, 링크, 요약, 출처종류]로 통일해 호출부가 분기를 안 갖게 한다. */
function qNews(q){
  const NV=D.nvn;
  if(NV && Array.isArray(q.nq) && q.nq.length){
    return q.nq.map(i=>NV.a[i]).filter(Boolean)
      .map(a=>[a[0], a[1], NV.p[a[2]]||'', nvURL(a), a[5]||'', 'nv']);
  }
  const old=(q.qn!=null && D.qnews) ? (D.qnews[q.qn]||[]) : [];
  return old.map(a=>[a[0], a[1], a[2]||'', a[3], '', 'g']);
}
function qNewsHTML(items, head){
  if(!items.length) return '';
  const nv=items[0][5]==='nv';
  return '<div class="qxh" style="margin-top:12px">'+esc(head)
    + ' <em style="font-style:normal;font-weight:500;color:var(--ink3)">'
    + (nv? '네이버 검색 · 같은 주제 · 발언일 ±10일' : '발언 시기 기준')+'</em></div>'
    + items.map(a=>'<a class="qxart" href="'+esc(a[3])+'" target="_blank" rel="noopener">'
      + '<span class="qxt">'+esc(a[1])+'</span>'
      + '<span class="qxs">'+esc(a[2])+' · '+esc(a[0])+'</span></a>').join('');
}
function nvRow(a){
  const u=nvURL(a), ps=D.nvn.p[a[2]]||'';
  return '<a class="nrow nrw2" href="'+esc(u)+'" target="_blank" rel="noopener"'
    + ' data-tip="'+esc(ps)+' · '+esc(a[0])+' · 눌러서 원문 보기">'
    + '<span class="nd">'+esc(a[0])+'</span>'
    + '<span class="nt2">'+esc(a[1])+'</span>'
    + '<span class="nsrc">'+esc(ps)+'</span>'
    + (a[5]? '<span class="ndsc">'+esc(a[5])+'</span>' : '')
    + '</a>';
}
function tnewsHTML(tag, kwSel){
  const NV=D.nvn; if(!NV) return '';
  const ti=(D.tags||[]).indexOf(tag); if(ti<0) return '';
  const T=NV.t[ti]||NV.t[String(ti)]; if(!T) return '';
  let arts=(T.i||[]).map(i=>NV.a[i]).filter(Boolean);
  const mo=NV.mo||[];
  /* 키워드가 선택되면 수록분 안에서 제목·요약 포함으로 다시 좀힌다.
     이 때 월별 막대도 수록분 기준이 되므로 전량 기준과 섞지 않게 라벨을 바꿈 */
  const kwOn = !!(kwSel && arts.length);
  if(kwOn){ const k=kwSel.toLowerCase();
    arts = arts.filter(a=>((a[1]||'')+' '+(a[5]||'')).toLowerCase().includes(k)); }
  let mv, basis;
  if(kwOn){ const c=Object.fromEntries(mo.map(m=>[m,0]));
    arts.forEach(a=>{ const m=a[0].slice(0,7); if(m in c) c[m]++; });
    mv=mo.map(m=>c[m]); basis='수록분 · 「'+kwSel+'」 포함 기준';
  } else { mv=T.m||[]; basis='수집 전량 기준'; }
  const mx=Math.max(1,...mv);
  const peak=mv.indexOf(mx);
  const list=qtNMon? arts.filter(a=>a[0].slice(0,7)===qtNMon) : arts;
  const shown=list.slice(0,qtNShown);
  const monTot=qtNMon? (mv[mo.indexOf(qtNMon)]||0) : (kwOn? arts.length : T.n);
  if(!arts.length && kwOn) return '<div class="tnews"><div class="thd"><h4>#'+esc(tag)
    + ' · 최근 1년 언론 보도</h4></div><div class="note">수록된 기사 중에는 「'+esc(kwSel)
    + '」이 들어간 것이 없어요. 키워드를 다시 눌러 해제하면 이 주제 전체 보도를 볼 수 있어요.</div></div>';
  return '<div class="tnews">'
   + '<div class="thd"><h4>#'+esc(tag)+' · 최근 1년 언론 보도</h4>'
   +   '<span class="tq">'+esc(T.q||'')+'</span></div>'
   + '<div class="kpis" style="margin:0;grid-template-columns:repeat(3,1fr)">'
   +   '<div class="kpi" data-tip="네이버 검색 API로 모은 이 주제의 최근 1년 기사 수">'
   +     '<b>'+nf(kwOn? arts.length : T.n)+'</b><i>기사</i><small>'
   +     (kwOn? '「'+esc(kwSel)+'」 포함' : esc(T.f||'')+' ~ '+esc(T.l||''))+'</small></div>'
   +   '<div class="kpi" data-tip="이 주제를 다룬 서로 다른 매체 수">'
   +     '<b>'+nf(kwOn? new Set(arts.map(a=>a[2])).size : (T.pn||T.p.length))+'</b><i>매체</i><small>중복 제외</small></div>'
   +   '<div class="kpi" data-tip="보도가 가장 많았던 달">'
   +     '<b>'+(mo[peak]||'–').slice(2)+'</b><i>최다 보도</i><small>'+nf(mx)+'건</small></div>'
   + '</div>'
   + '<div class="tgrid">'
   +   '<div class="chart"><h5><svg class="ic" aria-hidden="true"><use href="#i-cal"/></svg>월별 보도량</h5>'
   +     '<div class="cs">막대를 누르면 그 달 기사만 봐요 · '+esc(basis)+'</div>'
   +     '<div class="ybar">'+mo.map((m,i)=>
           '<button class="yb'+(qtNMon===m?' on':'')+'" data-tnm="'+esc(m)+'"'
           + ' data-tip="'+esc(m)+' '+nf(mv[i]||0)+'건">'
           + '<i style="height:'+Math.max(4,(mv[i]||0)/mx*54).toFixed(0)+'px"></i>'
           + '<span>'+m.slice(5)+'</span><em>'+(mv[i]||0)+'</em></button>').join('')+'</div></div>'
   +   '<div class="chart"><h5><svg class="ic" aria-hidden="true"><use href="#i-home"/></svg>어느 매체가 많이 다뤘나</h5>'
   +     '<div class="cs">상위 8개 · '+esc(basis)+'</div>'
   +     hbar((kwOn
           ? Object.entries(arts.reduce((o,a)=>{o[a[2]]=(o[a[2]]||0)+1;return o;},{}))
               .sort((x,y)=>y[1]-x[1]).slice(0,8).map(x=>({k:NV.p[x[0]]||'', v:x[1]}))
           : (T.p||[]).slice(0,8).map(x=>({k:NV.p[x[0]]||'', v:x[1]}))), 'var(--accent)') + '</div>'
   + '</div>'
   + '<div class="chart"><h5><svg class="ic" aria-hidden="true"><use href="#i-news"/></svg>기사 '
   +   (qtNMon? esc(qtNMon)+' · ':'') + nf(shown.length)+'건 표시</h5>'
   +   '<div class="cs">'+(qtNMon
         ? (kwOn? '이 달 '+nf(monTot)+'건' : '이 달 전체 '+nf(monTot)+'건 중 수록분 '+nf(list.length)+'건')
           + ' · <a href="javascript:;" data-tnm="">전체 기간 보기</a>'
         : (kwOn? '「'+esc(kwSel)+'」이 들어간 기사 '+nf(arts.length)+'건'
                : '1년 전체 '+nf(T.n)+'건 중 수록분 '+nf(arts.length)+'건을 보여줘요'))+'</div>'
   +   '<div class="nlist">'+(shown.map(nvRow).join('') || '<div class="empty">이 조건의 기사가 없어요</div>')+'</div>'
   +   (list.length>qtNShown? '<button class="tmore" data-tnmore="1">'+nf(list.length-qtNShown)+'건 더 보기</button>':'')
   + '</div>'
   + '<div class="note">'+esc((NV.meta||{}).src||'')+'로 위 검색어를 그대로 써서 모은 것이에요.'
   +   ' 제목·매체·날짜·요약·링크만 저장했고 본문은 각 매체 저작물이라 눌러서 원문에서 보세요.'
   +   '<br>검색어가 닿은 기사라 주제와 어긋나는 것이 섞일 수 있고, 이 목록은 의원의 발언을 보도한 기사라는 뜻이 아니에요.</div>'
   + '</div>';
}

let qtTag=null, qtShown=60, qtQ='';
function qtRender(){
  const w=document.getElementById('qtwrap');
  const Q=D.quotes||[], TAGS=D.tags||[];
  const cnt={}; Q.forEach(q=>q.t.forEach(t=>cnt[t]=(cnt[t]||0)+1));
  const kw=qtQ.trim().toLowerCase();
  let list=Q.filter(q=>{
    if(qtTag && !q.t.includes(qtTag)) return false;
    if(!kw) return true;
    const m=D.members.find(x=>x.cd===q.c);
    return (q.s+' '+(m?m.name+' '+m.party:'')+' '+q.t.join(' ')).toLowerCase().includes(kw);
  });
  const show=list.slice(0, qtShown);
  w.innerHTML=`
    <div class="qthead">
      <h3>의원 발언 모음</h3>
      <p>${esc(D.meta.quoteSrc||'')}에서 발언자별로 분리한 <b>${nf(Q.length)}건</b>입니다.
         언론이 인용한 문장이 아니라 <b>속기록에 남은 발언 원문</b>이라 맥락이 잘리지 않아요.
         국회 회의록은 자유롭게 인용할 수 있어요.</p>
      <div class="tagbar" id="tagbar">
        <button data-t="" aria-pressed="${!qtTag}">전체<em>${nf(Q.length)}</em></button>
        ${TAGS.map(t=>`<button data-t="${esc(t)}" aria-pressed="${qtTag===t}">#${esc(t)}<em>${nf(cnt[t]||0)}</em></button>`).join('')}
      </div>
    </div>
    ${qtTag? tnewsHTML(qtTag) : ''}
    <div class="qtgrid">
      ${show.map(q=>{ const m=D.members.find(x=>x.cd===q.c); if(!m) return '';
        return `<div class="qtc" style="--pc4:${pc(m.party)}">
          <div class="qs2">${esc(q.s)}</div>
          <div class="qtg">${q.t.map(t=>`<span data-t="${esc(t)}">#${esc(t)}</span>`).join('')}</div>
          <div class="qw" data-cd="${m.cd}">${avatar(m,'ph')}
            <div><div class="qnm">${esc(m.name)}</div>
              <div class="qmt">${esc(m.party)} · ${esc(q.m)}위 · ${esc(q.d)}</div></div></div>
        </div>`;}).join('') || '<div class="empty">조건에 맞는 발언이 없어요</div>'}
    </div>
    ${list.length>qtShown? `<button class="qtmore" id="qtMore">${nf(list.length-qtShown)}건 더 보기</button>`:''}`;
  document.getElementById('tagbar').onclick=e=>{
    const b=e.target.closest('button'); if(!b) return;
    qtTag=b.dataset.t||null; qtShown=60; qtNMon=null; qtNShown=12; qtRender();
  };
  w.querySelectorAll('.qtg span').forEach(sp=>sp.onclick=()=>{ qtTag=sp.dataset.t; qtShown=60; qtNMon=null; qtNShown=12; qtRender();
    window.scrollTo({top:0,behavior:'smooth'}); });
  /* 주제별 보도 패널 — 월 선택 / 더보기 */
  w.querySelectorAll('[data-tnm]').forEach(el=>el.onclick=ev=>{ ev.preventDefault();
    const v=el.dataset.tnm; qtNMon = v || null; qtNShown=12; qtRender(); });
  const tmb=w.querySelector('[data-tnmore]');
  if(tmb) tmb.onclick=()=>{ qtNShown+=12; qtRender(); };
  w.querySelectorAll('.qwho').forEach(el=>el.onclick=e2=>{ e2.stopPropagation();
    const mm=D.members.find(m=>m.cd===el.dataset.cd); if(mm) open(mm); });
  const mb=document.getElementById('qtMore');
  if(mb) mb.onclick=()=>{ qtShown+=60; qtRender(); };
}

/* ================= 차트 헬퍼 (외부 라이브러리 없음) ================= */
function profileCharts(x){
  const V=x.vote||{}, C=x.cvote||{}, PD=x.propD||{res:{},cmt:{},yr:{}};
  const RA=x.rankAll||{}, RP=x.rankParty||{};
  const RES_C={'가결':'var(--pos)','대안반영':'#5b8fd6','계류':'var(--neu)','폐기·철회':'var(--neg)','기타':'var(--absent)'};
  const resItems=Object.entries(PD.res).sort((a,b)=>b[1]-a[1]).map(([k,v])=>({k,v,c:RES_C[k]||'var(--absent)'}));
  const cmtItems=Object.entries(PD.cmt).sort((a,b)=>b[1]-a[1]).slice(0,7).map(([k,v])=>({k:k.replace('위원회',''),v}));
  const yrs=[...new Set([...Object.keys(PD.yr),...Object.keys(x.spYr||{})])].sort();
  const totC=C.y+C.n+C.a+C.x;
  return `
  <div class="chartgrid">

    <div class="chart">
      <h5>본회의 표결 성향</h5>
      <div class="cs">기명표결 ${nf(V.tot||0)}건 전체</div>
      ${donut([{k:'찬성',v:V.yes||0,c:'var(--pos)'},{k:'반대',v:V.no||0,c:'var(--neg)'},
               {k:'기권',v:V.abs||0,c:'var(--neu)'},{k:'불참',v:V.absent||0,c:'var(--absent)'}])}
    </div>

    <div class="chart">
      <h5>쟁점 표결만</h5>
      <div class="cs">반대 10표 이상 갈린 ${nf(totC)}건. 전체의 6.8%만 실제로 의견이 나뉩니다.</div>
      ${totC? donut([{k:'찬성',v:C.y,c:'var(--pos)'},{k:'반대',v:C.n,c:'var(--neg)'},
               {k:'기권',v:C.a,c:'var(--neu)'},{k:'불참',v:C.x,c:'var(--absent)'}])
            : '<div class="empty">쟁점 표결 기록이 없어요</div>'}
    </div>

    <div class="chart wide">
      <h5>299명 중 위치</h5>
      <div class="cs">굵은 선이 본인, 흐린 선이 <b>${esc(x.party)}</b> 평균 위치예요 · 오른쪽일수록 상위</div>
      ${pctBar('표결 참여율', V.part??0, '%', RA.part??0, RP.part??0, x.party)}
      ${pctBar('대표발의', x.prop.n, '건', RA.prop??0, RP.prop??0, x.party)}
      ${pctBar('발의 성사율', x.prop.rate??0, '%', RA.rate??0, RP.rate??0, x.party)}
      ${pctBar('발언 구간', x.speech.n, '', RA.speech??0, RP.speech??0, x.party)}
      ${pctBar('당론 이탈', x.cdefect?.rate??0, '%', RA.cdef??0, RP.cdef??0, x.party)}
    </div>

    <div class="chart wide">
      <h5>회기별 표결 참여</h5>
      <div class="cs">아래 숫자는 회기, ★는 정기회예요 · 위에서부터 불참·기권·반대·찬성 순</div>
      ${sessBars(x.sessVote||{}, D.sessions||[])}
    </div>

    <div class="chart">
      <h5><svg class="ic" aria-hidden="true"><use href="#i-pen"/></svg>대표발의 법안 처리결과</h5>
      <div class="cs">${x.prop.n?`성사율 ${x.prop.rate??0}% · 성사 ${nf(x.prop.pass)}건`:'대표발의 없음'}</div>
      ${resItems.length? donut(resItems) : '<div class="empty">대표발의한 법안이 없어요</div>'}
    </div>

    <div class="chart">
      <h5>발의 법안 소관 위원회</h5>
      <div class="cs">상위 7개. 소속 위원회와 얼마나 겹치는지 보세요.</div>
      ${cmtItems.length? hbar(cmtItems, pc(x.party), 'cf') : '<div class="empty">자료 없음</div>'}
    </div>

    <div class="chart wide">
      <h5>연도별 활동</h5>
      <div class="cs">대표발의 건수와 발언 구간 수</div>
      ${yrs.length? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div>${hbar(yrs.map(y=>({k:y+'년 발의',v:PD.yr[y]||0})), pc(x.party))}</div>
        <div>${hbar(yrs.map(y=>({k:y+'년 발언',v:(x.spYr||{})[y]||0})), 'var(--ink3)')}</div>
      </div>` : '<div class="empty">자료 없음</div>'}
    </div>

  </div>`;
}

function donut(items, cx=52, vf){ /* vf: 클릭 속성명 e.g. 'vf','bf' */
  const tot=items.reduce((a,b)=>a+b.v,0)||1;
  const R=cx-9, C=2*Math.PI*R; let off=0;
  const segs=items.filter(x=>x.v>0).map(x=>{
    const pct=Math.round(x.v/tot*100);
    const len=x.v/tot*C, d=`<circle r="${R}" cx="${cx}" cy="${cx}" fill="none" stroke="${x.c}"
      stroke-width="15" stroke-dasharray="${len.toFixed(2)} ${(C-len).toFixed(2)}"
      stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 ${cx} ${cx})"
      data-tip="${esc(x.k)} ${nf(x.v)}건 · ${pct}%"
      ${vf?`data-${vf}="${esc(x.k)}" style="cursor:pointer"`:''}></circle>`;
    off+=len; return d; }).join('');
  return `<div class="donut">
    <svg width="${cx*2}" height="${cx*2}" viewBox="0 0 ${cx*2} ${cx*2}" role="img">
      <circle r="${R}" cx="${cx}" cy="${cx}" fill="none" stroke="var(--line2)" stroke-width="15"/>
      ${segs}
      <text x="${cx}" y="${cx-1}" text-anchor="middle" font-size="19" font-weight="700"
        fill="var(--ink)" style="font-family:var(--mono)">${nf(tot)}</text>
      <text x="${cx}" y="${cx+13}" text-anchor="middle" font-size="9" fill="var(--ink3)">건</text>
    </svg>
    <div class="dleg">${items.map(x=>{const pct=Math.round(x.v/tot*100);
      return `<div ${vf?`data-${vf}="${esc(x.k)}" style="cursor:pointer"`:''} data-tip="${esc(x.k)} ${nf(x.v)}건 · ${pct}%">
        <i style="background:${x.c}"></i>${esc(x.k)}<b>${nf(x.v)} <s style="text-decoration:none;color:var(--ink3);font-weight:500">${pct}%</s></b></div>`;}).join('')}</div>
  </div>`;
}
function hbar(items, color, attr, fmt, icon){
  const mx=Math.max(1,...items.map(x=>x.v));
  const tot=items.reduce((a,b)=>a+b.v,0)||1;
  return `<div class="hb${icon?' hasic':''}" style="--pc3:${color}">${items.map(x=>`
    <div class="r" ${attr?`data-${attr}="${esc(x.k)}" style="cursor:pointer"`:''}
      data-tip="${esc(x.k)} ${fmt?fmt(x.v):nf(x.v)+'건'} · ${Math.round(x.v/tot*100)}%"><span class="l">${icon?icon(x.k):''}${esc(x.k)}</span>
      <span class="t"><i style="width:${x.v/mx*100}%"></i></span>
      <span class="v">${fmt?fmt(x.v):(x.suffix?x.v+x.suffix:nf(x.v))}</span></div>`).join('')}</div>`;
}
/* 지표별 실제값 — 등수와 당 평균을 직접 계산해 보여주기 위함 */
const METRIC_VAL = {
  part:  m=>m.vote?.part ?? null,
  prop:  m=>m.prop?.n ?? null,
  speech:m=>m.speech?.n ?? null,
  defect:m=>m.cdefect?.rate ?? null
};
function rankOf(key, party){
  const f=METRIC_VAL[key]; if(!f) return null;
  const all=(D.members||[]).map(m=>({cd:m.cd, v:f(m)})).filter(x=>x.v!=null);
  all.sort((a,b)=>b.v-a.v);                       // 큰 값이 1위
  const pos={}; all.forEach((x,i)=>pos[x.cd]=i+1);
  // 비교 기준은 기록이 있는 의원 전체 평균
  const avg = all.length? all.reduce((a,b)=>a+b.v,0)/all.length : null;
  return {pos, n:all.length, allAvg:avg,
          avgPct: avg==null?null: all.filter(x=>x.v<avg).length/all.length*100};
}
function pctBar(label, val, unit, pAll, pParty, party, key){
  const R = key? rankOf(key, party) : null;
  const nAll = R? R.n : (D.members||[]).length;
  let rk = R && CURM ? R.pos[CURM.cd] : Math.max(1,Math.round(nAll*(100-pAll)/100));
  const noRank = (rk==null || !isFinite(rk));      // 표결·재산 기록이 아직 없는 의원
  const avg  = R? R.allAvg : null;
  const avgP = R? R.avgPct : null;
  const fmt  = v => (v==null?'–': (Math.round(v*10)/10)+(unit||''));
  const better = (avg!=null && METRIC_VAL[key] && CURM) ? (METRIC_VAL[key](CURM) >= avg) : null;
  return `<div class="pctrow2" style="--pc3:${pc(party)}"
    data-tip="${esc(label)} ${val}${unit||''} · ${noRank?'순위 없음(기록 미보유)':nf(nAll)+'명 중 '+rk+'위'}${avg!=null?' · 전체 평균 '+fmt(avg):''}">
    <div class="ph2">
      <span class="pl3">${esc(label)}</span>
      <b class="pv2">${val}${unit||''}</b>
      <span class="prk">${noRank?'<span class="pnr">기록 없음</span>':`<b>${rk}위</b><span class="pof">/ ${nf(nAll)}명</span>`}</span>
    </div>
    <div class="track2">
      <i class="fill" style="width:${Math.max(2,pAll)}%"></i>
      ${avgP!=null?`<i class="amk" style="left:${Math.min(98,Math.max(2,avgP))}%"></i>`:''}
    </div>
    <div class="pfoot">
      <span class="pend">낮음</span>
      ${avg!=null?`<span class="pavg">전체 평균 <b>${fmt(avg)}</b>${better!=null?` · 이 의원은 <b class="${better?'up':'dn'}">평균보다 ${better?'높아요':'낮아요'}</b>`:''}</span>`:'<span></span>'}
      <span class="pend">높음</span>
    </div>
  </div>`;
}
/* 회기별 참여율 — 4색 누적막대는 노이즈가 커서 '참여율 단일 막대'로 단순화 */
function sessBars(sv, sessions){
  const list=sessions.filter(s=>s.n>0);
  return `<div class="sbar">${list.map(s=>{
    const o=sv[s.sess]||{y:0,n:0,a:0,x:0}, t=o.y+o.n+o.a+o.x;
    const cast=o.y+o.n+o.a;
    const rate=t? cast/t*100 : null;
    const h=rate==null?0:Math.max(2,Math.round(rate/100*72));
    return `<div class="c" data-gsess="${s.sess}" style="cursor:pointer"
      data-tip="${s.sess} ${s.type} · 표결 ${nf(t)}건 중 ${nf(cast)}건 참여 (${rate==null?'기록 없음':Math.round(rate)+'%'}) · 찬성 ${o.y} 반대 ${o.n} 기권 ${o.a} 불참 ${o.x}">
      ${rate==null?'<span class="nod"></span>':`<span style="height:${h}px;background:${rate>=70?'var(--pos)':rate>=40?'var(--neu)':'var(--neg)'}"></span>`}
      <span class="lb">${s.sess.replace('제','').replace('회','')}</span></div>`;}).join('')}</div>`;
}
/* 회기 패턴 한 줄 해석 — 표를 읽지 않아도 알 수 있게 */
function sessInsight(sv, sessions, name){
  const list=sessions.filter(s=>s.n>0);
  const rows=list.map(s=>{ const o=sv[s.sess]||{}; const t=(o.y||0)+(o.n||0)+(o.a||0)+(o.x||0);
    return {s:s.sess, bg:s.bg, r: t? ((o.y||0)+(o.n||0)+(o.a||0))/t*100 : null}; }).filter(x=>x.r!=null);
  if(rows.length<3) return '';
  const vals=rows.map(x=>x.r);
  const mean=vals.reduce((a,b)=>a+b,0)/vals.length;
  const sd=Math.sqrt(vals.reduce((s2,v)=>s2+(v-mean)**2,0)/vals.length);
  // 최근 연속으로 0에 가까운 구간 찾기
  let zero=0; for(let i=rows.length-1;i>=0 && rows[i].r<5;i--) zero++;
  if(zero>=2){
    const from=rows[rows.length-zero];
    return `<div class="sins warn">${esc(from.bg.slice(0,7).replace('-','.'))}부터 표결 기록이 거의 없어요 · 최근 ${zero}개 회기 연속</div>`;
  }
  if(sd<10) return `<div class="sins">회기마다 비슷하게 참여했어요 · 평균 ${Math.round(mean)}%</div>`;
  const lo=rows.reduce((p,c)=>c.r<p.r?c:p), hi=rows.reduce((p,c)=>c.r>p.r?c:p);
  return `<div class="sins">회기마다 편차가 커요 · 가장 높은 ${esc(hi.s)} ${Math.round(hi.r)}% ↔ 가장 낮은 ${esc(lo.s)} ${Math.round(lo.r)}%</div>`;
}

/* ================= 회기별 의안 ================= */
const VNAME={'1':'찬성','2':'반대','3':'기권','0':'불참','-':'기록없음'};
const VICO ={'1':'','2':'','3':'','0':'','-':''};
const VMARK={'1':'✓','2':'✕','3':'−','0':'·','-':'?'};   // 색약·흑백에서도 구분되도록
const VCOL ={'1':'var(--pos)','2':'var(--neg)','3':'var(--neu)','0':'var(--absent)','-':'var(--line2)'};
let curSess=null, sesFilter='all';

function sessRender(){
  const SS=D.sessions||[];
  if(!curSess){ const withB=SS.filter(x=>x.n>0); curSess = withB.length? withB[withB.length-1].sess : SS[0]?.sess; }
  const max=Math.max(1,...SS.map(x=>x.n));
  document.getElementById('seslist').innerHTML = [...SS].reverse().map(x=>`
    <button class="sesitem" data-s="${x.sess}" aria-pressed="${x.sess===curSess}">
      <div class="st"><b>${esc(x.sess)}</b>
        <span class="tp ${x.type==='정기회'?'reg':''}">${x.type==='정기회'?'':''} ${x.type}</span></div>
      <div class="sd">${x.bg} ~ ${x.ed} · ${x.days}일</div>
      <div class="sb"><i style="width:${x.n/max*100}%"></i></div>
      <div class="sn">처리 ${nf(x.n)}건${x.c?` · <em data-hot="1" style="cursor:pointer" data-tip="쟁점 의안만 모아보기">쟁점 ${x.c}</em>`:''}</div>
    </button>`).join('');
  document.getElementById('seslist').onclick=e=>{
    const b=e.target.closest('.sesitem'); if(!b) return;
    curSess=b.dataset.s; sesFilter='all'; sessRender(); pushRoute();
  };
  sessMain();
}

var curTag=null;                                  // 선택된 태그 index (null=회기 모드)
var hotOnly=false;                                // 쟁점만 모아보기 모드
/* 표결 의안 + 의원 발의 법안 통합 검색 (제목 우선, 위원회는 보조) */
function searchBills(q){
  const out=[], seen=new Set();
  (D.bills||[]).forEach(b=>{
    const inName=(b.name||'').includes(q);
    if(inName || (b.cmt||'').includes(q)){ out.push(Object.assign({}, b, {_n:inName?0:1})); seen.add(b.no); }
  });
  (D.members||[]).forEach(m=>(m.bills||[]).forEach(b=>{
    if(seen.has(b.no)) return;
    const inName=(b.name||'').includes(q);
    if(!inName && !(b.cmt||'').includes(q)) return;
    seen.add(b.no);
    out.push({id:'', no:b.no, name:b.name, cmt:b.cmt, dt:b.dt, kind:'법률안',
      res:b.proc||'', prop:m.name, _n:inName?0:1});
  }));
  return out.sort((a,b)=>a._n-b._n || (b.dt||'').localeCompare(a.dt||''));
}
/* 이슈별 의원 기여도 랭킹 — 발의·발언을 합쳐 "누가 이 주제를 챙겼나" */
function tagLeaders(ti, limit){
  const tagName=(D.tags||[])[ti];
  const prop={}, spk={};
  // 발의: 그 주제 태그가 붙은 법안을 대표발의한 의원
  (D.members||[]).forEach(m=>(m.bills||[]).forEach(b=>{
    if(((D.btag||{})[b.no]||[]).includes(ti)) prop[m.cd]=(prop[m.cd]||0)+1;
  }));
  // 발언: 그 주제 태그가 붙은 국정감사 발언
  (D.quotes||[]).forEach(q=>{
    if((q.t||[]).includes(tagName)) spk[q.c]=(spk[q.c]||0)+1;
  });
  const cds=new Set([...Object.keys(prop), ...Object.keys(spk)]);
  const rows=[...cds].map(cd=>{
    const m=(D.members||[]).find(x=>x.cd===cd);
    const p=prop[cd]||0, s=spk[cd]||0;
    return m? {m, p, s, score:p*2+s} : null;      // 발의는 발언보다 무겁게
  }).filter(Boolean).sort((a,b)=>b.score-a.score || b.p-a.p);
  return rows.slice(0, limit||8);
}
function tagLeaderHTML(ti){
  const rows=tagLeaders(ti, 8);
  if(!rows.length) return '';
  const mx=Math.max(...rows.map(r=>r.score));
  return '<div class="chart" style="margin-bottom:14px"><h5><svg class="ic" aria-hidden="true"><use href="#i-medal"/></svg>이 주제를 가장 많이 챙긴 의원</h5>'
   + '<div class="cs">대표발의 1건을 발언 2건과 같게 봐서 매긴 순위예요 · 이름을 누르면 상세로 가요</div>'
   + '<div class="lead">'+rows.map((r,i)=>
      '<button class="lrow" data-cd="'+r.m.cd+'" data-tip="'+esc(r.m.name+' · 발의 '+r.p+'건 · 국정감사 발언 '+r.s+'건')+'">'
      + '<span class="lno">'+(i+1)+'</span>'
      + '<span class="lnm" style="color:'+pc(r.m.party)+'">'+esc(r.m.name)+'</span>'
      + '<span class="lpt">'+esc(r.m.party)+'</span>'
      + '<span class="lbar"><i style="width:'+(r.score/mx*100).toFixed(0)+'%"></i></span>'
      + '<span class="lval">'+r.p+' '+r.s+'</span></button>').join('')
   + '</div></div>';
}

/* 지표 정의 — 무엇을/어떻게 셌는지 항상 확인 가능하게 */
const METRIC_DOC = [
 ['표결 참여율','본회의 기명표결 1,656건 중 찬성·반대·기권 중 하나라도 던진 비율',
  '출석률이 아니에요. 국회는 본회의 출석률 API를 제공하지 않아요. 임기 중 재보궐로 늦게 온 의원도 분모는 같은 1,656건이라 낮게 보일 수 있어요.'],
 ['대표발의','의원이 대표로 낸 법안 수 (공동발의는 제외)','제22대 국회 임기 시작(2024-05-30) 이후 수집 시점까지.'],
 ['발의 성사율','대표발의 중 「원안가결·수정가결·대안반영」이 된 비율',
  '대안반영은 내 법안이 통째로 통과된 게 아니라 위원회 통합안에 내용이 들어간 경우예요. 성사로 넓게 잡은 값이에요.'],
 ['당론 이탈률','쟁점 의안에서 같은 당 다수와 다르게 투표한 비율',
  '공식 당론 자료가 아니라 이 대시보드가 계산한 값이에요. 분모는 전체 표결이 아니라 반대 10표 이상 나온 쟁점 의안이에요. 전체 기준으로 계산하면 반대표가 거의 없는 표결에 희석돼 변별력이 없어요.'],
 ['발언 구간','국정감사 회의록에서 집계한 발언 구간 수 (상한 없음)','발언 시간이 아니라 회의록의 발언 단위 수예요. 2024·2025년 국정감사만 대상이고 상임위 일반 회의는 빠져 있어요. 발언 탭에 실리는 발언문(의원당 최대 40건)과는 다른 숫자예요.'],
 ['신고 재산','본인·배우자·직계존비속 재산 합계에서 채무를 뺀 금액',
  '2026년 3월 공개, 2025-12-31 기준이에요. 장관 겸직 등 22명은 정부공직자윤리위원회가 따로 공개해 여기 없어요. 순위는 자료가 있는 277명 기준이에요.'],
 ['쟁점 의안','본회의 기명표결에서 반대가 10표 이상 나온 의안',
  '전체 1,656건 중 113건(6.8%)이에요. 나머지 중 1,098건은 반대표가 0표, 445건은 1~9표라 성향 비교에 쓰기 어려워요.'],
 ['뉴스','구글 뉴스에서 「의원명 의원」으로 검색한 최근 5년 기사',
  '구간당 상위 6건씩만 모아 최대 30건이에요. 동명이인이 섞일 수 있고, 보도량 비교는 상한 때문에 부정확해요.']
];
function metricDocHTML(){
  return '<div class="mdoc"><h5>'+'<svg class="ic" aria-hidden="true"><use href="#i-book"/></svg>'+'이 숫자들은 어떻게 셌나요</h5>'
   + METRIC_DOC.map(d=>'<details class="mrow"><summary><b>'+d[0]+'</b><span>'+esc(d[1])+'</span></summary>'
       + '<p>'+esc(d[2])+'</p></details>').join('')
   + '<div class="cs" style="margin-top:8px">모든 수치는 국회 공식 공개 자료를 그대로 집계한 값이에요. '
   + '공식 집계와 의원별 기록이 다른 경우가 있어 그때는 두 숫자를 모두 보여줘요.</div></div>';
}
/* 흥미로운 발견 — 데이터에서 자동으로 뽑는다 */
function insightCards(){
  const M=D.members||[], A=D.assets||{};
  const num=x=>x==null?0:x;
  const parts=M.map(m=>num(m.vote&&m.vote.part)).filter(x=>x>0).sort((a,b)=>a-b);
  const med=parts[Math.floor(parts.length/2)]||0;
  const low=M.filter(m=>num(m.vote&&m.vote.part)<50).length;
  const defTop=M.filter(m=>m.cdefect&&m.cdefect.n>=20).sort((a,b)=>b.cdefect.rate-a.cdefect.rate)[0];
  const gain=Object.entries(A).map(([cd,a])=>({cd,g:a.t-a.p})).sort((a,b)=>b.g-a.g)[0];
  const gainM=gain?M.find(m=>m.cd===gain.cd):null;
  // 표결 1,656건 중 찬반이 갈린 건 113건뿐 — 이 대시보드의 전제
  const allV=(D.bills||[]).length, cV=(D.bills||[]).filter(b=>b.c).length;
  const unan=allV?Math.round((allV-cV)/allV*100):0;
  const unanZero=(D.bills||[]).filter(b=>(b.n||0)===0).length;   // 반대 0표 = 진짜 만장일치
  // 대표발의 쏠림 — 상위 30명이 전체의 몇 %인가
  const props=M.map(m=>num(m.prop&&m.prop.n)).sort((a,b)=>b-a);
  const sumP=props.reduce((a,b)=>a+b,0);
  const top30=sumP?Math.round(props.slice(0,30).reduce((a,b)=>a+b,0)/sumP*100):0;
  // 재산 격차
  const av=Object.entries(A).map(([cd,a])=>({cd,t:a.t}));
  const hi=av.slice().sort((a,b)=>b.t-a.t)[0], lo=av.slice().sort((a,b)=>a.t-b.t)[0];
  const hiM=hi?M.find(m=>m.cd===hi.cd):null, loM=lo?M.find(m=>m.cd===lo.cd):null;
  const cards=[
   ['scale','찬반이 갈린 표결', nf(cV)+'건', allV?('전체 '+nf(allV)+'건의 '+(100-unan)+'%뿐 · 반대표 0표가 '+nf(unanZero)+'건'):'',"hot"],
   ['vote','표결 참여율 중앙값', med+'%', '절반은 이보다 낮아요 · 50%도 안 되는 의원 '+low+'명',"sort:part_a"],
   defTop? ['split','당론 최다 이탈', defTop.name, defTop.party+' · 쟁점 '+defTop.cdefect.n+'건 중 '+defTop.cdefect.rate+'%',"open:"+defTop.cd] : null,
   ['pen','대표발의 상위 30명', top30+'%', '299명이 낸 '+nf(sumP)+'건 중 30명 몫',"sort:prop"],
   (hiM&&loM)? ['up','재산 격차', AMAN(hi.t-lo.t), hiM.name+' '+AMAN(hi.t)+' ↔ '+loM.name+' '+AMAN(lo.t),"sort:asset"] : null,
   gainM? ['brief','1년 새 재산 최다 증가', gainM.name, '+'+AMAN(gain.g)+' · '+gainM.party,"open:"+gainM.cd] : null
  ].filter(Boolean);
  return '<div class="insight"><div class="ih">'
   + '<svg class="ic" aria-hidden="true"><use href="#i-eye"/></svg>데이터 인사이트'
   + '<button type="button" class="mhelp" id="mHelp" aria-label="이 숫자들은 어떻게 셌나요" title="이 숫자들은 어떻게 셌나요">?</button>'
   + '</div>'
   + '<div class="igrid">'+cards.map(c=>
      '<button class="icard" data-ins="'+esc(c[4])+'"><span class="ii"><svg class="ic" aria-hidden="true"><use href="#i-'+c[0]+'"/></svg></span>'
      + '<span class="it">'+esc(c[1])+'</span><b>'+esc(c[2])+'</b>'
      + '<span class="id2">'+esc(c[3])+'</span></button>').join('')
   + '</div></div>';
}

/* ── 정렬 커스텀 드롭다운 (option은 SVG를 못 담으므로 listbox로 구현) ── */
const SORT_ICON = {
  name:'list', reele:'medal', age:'clock', age_a:'clock',
  part:'vote', part_a:'vote', prop:'pen', rate:'check', speech:'quote', ptt:'inbox',
  defect:'split', defect_a:'split',
  asset:'money', asset_a:'money', again:'up', news:'news'
};
function buildSortUI(){
  const sel=document.getElementById('sort'), wrap=document.getElementById('sortWrap');
  if(!sel||!wrap||document.getElementById('sortBtn')) return;
  sel.style.display='none';
  sel.setAttribute('aria-hidden','true');
  sel.tabIndex=-1;

  const btn=document.createElement('button');
  btn.id='sortBtn'; btn.type='button';
  btn.setAttribute('aria-haspopup','listbox');
  btn.setAttribute('aria-expanded','false');
  const pop=document.createElement('div');
  pop.id='sortPop'; pop.setAttribute('role','listbox'); pop.hidden=true;
  pop.setAttribute('aria-label','정렬 기준');

  const ico=k=>'<svg class="ic-sm" aria-hidden="true"><use href="#i-'+(SORT_ICON[k]||'list')+'"/></svg>';
  const paint=()=>{
    const o=sel.options[sel.selectedIndex];
    btn.innerHTML = ico(sel.value)+'<span>'+esc(o?o.textContent:'')+'</span>'
      + '<svg class="ic-sm caret" aria-hidden="true"><use href="#i-down"/></svg>';
  };
  const build=()=>{
    let h='';
    [...sel.children].forEach(g=>{
      if(g.tagName==='OPTGROUP'){
        h+='<div class="sgh">'+esc(g.label)+'</div>';
        [...g.children].forEach(o=>{ h+=opt(o); });
      } else h+=opt(g);
    });
    pop.innerHTML=h;
  };
  const opt=o=>'<button type="button" role="option" class="sopt'+(o.value===sel.value?' on':'')+'"'
    + ' data-v="'+o.value+'" aria-selected="'+(o.value===sel.value)+'">'
    + ico(o.value)+'<span>'+esc(o.textContent)+'</span>'
    + '<svg class="ic-sm mk" aria-hidden="true"><use href="#i-check"/></svg></button>';

  const close=()=>{ pop.hidden=true; btn.setAttribute('aria-expanded','false'); };
  const open2=()=>{ build(); pop.hidden=false; btn.setAttribute('aria-expanded','true');
    const on=pop.querySelector('.sopt.on'); if(on) on.focus(); };

  btn.onclick=e=>{ e.stopPropagation(); pop.hidden? open2() : close(); };
  pop.onclick=e=>{ const b=e.target.closest('.sopt'); if(!b) return;
    sel.value=b.dataset.v; sel.dispatchEvent(new Event('change'));
    paint(); close(); btn.focus(); };
  pop.onkeydown=e=>{
    const items=[...pop.querySelectorAll('.sopt')];
    const i=items.indexOf(document.activeElement);
    if(e.key==='Escape'){ close(); btn.focus(); }
    else if(e.key==='ArrowDown'){ e.preventDefault(); (items[i+1]||items[0]).focus(); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); (items[i-1]||items[items.length-1]).focus(); }
  };
  document.addEventListener('click',e=>{ if(!wrap.contains(e.target)) close(); });

  wrap.appendChild(btn); wrap.appendChild(pop);
  paint();
  sel.addEventListener('change', paint);
}

function partyOpposed(billId, party){
  const str=(D.vfull||{})[billId]; if(!str) return false;
  const M=D.midx||[];
  for(let i=0;i<M.length;i++){
    if(str[i]!=='2') continue;                     // 반대표만
    const m=D.members.find(x=>x.cd===M[i]);
    if(m && m.party===party) return true;
  }
  return false;
}
function hotBills(){
  return (D.bills||[]).filter(b=>b.c)
    .map(b=>{ const t=(b.y||0)+(b.n||0)+(b.b||0);
      return {...b, _gap:Math.abs((b.y||0)-(b.n||0)), _tot:t,
        _split: t? Math.round(Math.min(b.y||0,b.n||0)/t*100):0}; })
    .sort((a,b)=>b._split-a._split || b.n-a.n);
}
function hotMain(el){
  let list=hotBills();
  if(activeParty) list=list.filter(b=>partyOpposed(b.id, activeParty));
  const hq=(document.getElementById('q')?.value||'').trim();
  if(hq) list=list.filter(b=>(b.name||'').includes(hq) || (b.cmt||'').includes(hq));
  const nOpp=list.reduce((s,b)=>s+(b.n||0),0);
  const avgSplit=list.length? Math.round(list.reduce((s,b)=>s+b._split,0)/list.length):0;
  el.innerHTML = `
    <div class="taghd"><h3 style="margin:0">쟁점 의안 모아보기</h3>
      <button class="clr" id="hotClr">회기별 보기로 돌아가기</button></div>
    <div class="shd">반대표가 10표 이상 나온 의안 ${nf(list.length)}건이에요 ·
      기명표결 ${nf((D.bills||[]).length)}건 중 ${(list.length/Math.max(1,(D.bills||[]).length)*100).toFixed(1)}%</div>
    <div class="kpis" style="margin:10px 0 14px">
      <div class="kpi" data-tip="전체 기명표결 중 반대 10표 이상이 나온 의안 수"><b>${nf(list.length)}</b><i>쟁점 의안</i>
        <small>전체 ${nf((D.bills||[]).length)}건 중</small></div>
      <div class="kpi" data-tip="쟁점 의안에서 나온 반대표 총합"><b>${nf(nOpp)}</b><i>누적 반대표</i>
        <small>의안당 평균 ${Math.round(nOpp/Math.max(1,list.length))}표</small></div>
      <div class="kpi" data-tip="찬반이 얼마나 팽팽했는지 · 50%에 가까울수록 반반"><b>${avgSplit}%</b><i>평균 대립도</i>
        <small>50%면 완전히 반반</small></div>
    </div>
    <div class="cs" style="margin-bottom:8px">대립이 팽팽했던 순서예요. 제목을 누르면 299명의 표가 보여요</div>
    ${list.map(b=>`
      <div class="brow">
        <div class="bt" data-b="${b.id}"><span class="hot">${b._split}%</span><span>${esc(b.name)}</span></div>
        <div class="bm"><span>${esc(b.dt)}</span><span>${esc(b.s||'')}</span><span>${esc(b.cmt||'')}</span>
          <span class="tag">${/가결|통과/.test(b.res)?'':/부결/.test(b.res)?'':''} ${esc(b.res)}</span>
          <span>${nf(b.y)} · ${nf(b.n)} · ${nf(b.b)}</span></div>
        ${tagChips(b)}
        <div class="vpanel" id="vp-${b.id}"></div>
      </div>`).join('')}`;
  el.querySelectorAll('.bt[data-b]').forEach(t=>t.onclick=()=>toggleVotes(t.dataset.b));
  const c=document.getElementById('hotClr');
  if(c) c.onclick=()=>{ hotOnly=false; sessRender(); pushRoute(); };
}
function tagMain(el){
  const name=(D.tags||[])[curTag]||'';
  let list=billsByTag(curTag);
  const tq=(document.getElementById('q')?.value||'').trim();
  if(tq) list=list.filter(b=>(b.name||'').includes(tq) || (b.cmt||'').includes(tq));
  const grp=Object.entries(D.tagGroups||{}).find(([,arr])=>arr.includes(name));
  el.innerHTML = `
    <div class="taghd"><h3 style="margin:0">#${esc(name)}</h3>
      <button class="clr" id="tagClr">회기별 보기로 돌아가기</button></div>
    <div class="shd">${grp?esc(grp[0])+' 분야 · ':''}이 주제로 분류된 의안 ${nf(list.length)}건이에요</div>
    ${tagBarHTML()}
    ${tagLeaderHTML(curTag)}
    ${list.length? list.map(b=>`
      <div class="brow">
        <div class="bt" ${b.id?`data-b="${b.id}"`:''} ${b.id?'':'style="cursor:default"'}>
          ${b.c?'<span class="hot">쟁점</span>':''}<span>${esc(b.name)}</span></div>
        <div class="bm"><span>${esc(b.dt||'')}</span><span>${esc(b.kind||'')}</span>
          <span>${esc(b.cmt||'')}</span>
          ${b.res?`<span class="tag">${/가결|통과/.test(b.res)?"":/부결/.test(b.res)?"":/폐기|철회/.test(b.res)?"":""} ${esc(b.res)}</span>`:''}
          ${b.id?`<span>찬성 ${nf(b.y)} · 반대 ${nf(b.n)} · 기권 ${nf(b.b)}</span>`
                :`<span>${esc(b.prop||'')} 발의</span>`}</div>
        ${tagChips(b)}
        ${b.id?`<div class="vpanel" id="vp-${b.id}"></div>`:''}
      </div>`).join('') : '<div class="empty">해당하는 의안이 없어요.</div>'}`;
  el.querySelectorAll('.bt[data-b]').forEach(t=>t.onclick=()=>toggleVotes(t.dataset.b));
  const c=document.getElementById('tagClr');
  if(c) c.onclick=()=>{ curTag=null; sessRender(); pushRoute(); };
  bindTagBar(el);
}
function tagCounts(){
  // 목록(billsByTag)과 동일한 중복 제거 규칙을 써야 숫자가 일치한다
  const c={}, seen={};
  (D.bills||[]).forEach(b=>((D.vtag||{})[b.id]||[]).forEach(t=>{
    c[t]=(c[t]||0)+1; (seen[t]=seen[t]||new Set()).add(b.no); }));
  (D.members||[]).forEach(m=>(m.bills||[]).forEach(b=>((D.btag||{})[b.no]||[]).forEach(t=>{
    const st=(seen[t]=seen[t]||new Set());
    if(st.has(b.no)) return; st.add(b.no); c[t]=(c[t]||0)+1; })));
  return c;
}
function tagBarHTML(){
  const c=tagCounts();
  const top=Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,18);
  return `<div class="tagbar" id="tagbar">${top.map(([i,n])=>
    `<button data-tb="${i}" aria-pressed="${+i===curTag}">#${esc((D.tags||[])[i])}<em>${nf(n)}</em></button>`).join('')}</div>`;
}
function bindTagBar(scope){
  (scope||document).querySelectorAll('#tagbar button').forEach(b=>b.onclick=()=>{
    const ti=+b.dataset.tb; curTag = (curTag===ti? null : ti); sessRender(); pushRoute();
  });
}
function sessMain(){
  const el=document.getElementById('sesmain');
  if(hotOnly){ return hotMain(el); }                // 쟁점 전용 모드
  if(curTag!=null){ return tagMain(el); }          // 태그 필터 모드
  const S=(D.sessions||[]).find(x=>x.sess===curSess);
  if(!S){ el.innerHTML='<div class="empty">회기를 선택하세요.</div>'; return; }
  const bq=(document.getElementById('q')?.value||'').trim();
  // 검색어가 있으면 회기를 넘어 전체 의안에서 찾는다
  let list = bq ? searchBills(bq) : (D.bills||[]).filter(b=>b.s===curSess);
  if(activeParty) list=list.filter(b=>partyOpposed(b.id, activeParty));
  const kinds=[...new Set(list.map(b=>b.kind))];
  if(sesFilter==='hot') list=list.filter(b=>b.c);
  else if(sesFilter!=='all') list=list.filter(b=>b.kind===sesFilter);
  list=[...list].sort((a,b)=>(b.dt||'').localeCompare(a.dt||'') || b.n-a.n);
  el.innerHTML = `
    ${bq? `<h3><svg class="ic" aria-hidden="true"><use href="#i-search"/></svg>"${esc(bq)}" 검색 결과</h3>
      <div class="shd">전체 회기에서 ${nf(list.length)}건을 찾았어요 ·
        <a href="javascript:;" id="bqClear">검색 지우고 회기별로 보기</a></div>`
      : `<h3>${esc(S.sess)}<span class="tp ${S.type==='정기회'?'reg':''}">${S.type==='정기회'?'':''} ${S.type}</span></h3>
      <div class="shd">${S.bg} ~ ${S.ed} (${S.days}일) · 본회의 기명표결 ${nf(S.n)}건 · 쟁점 ${nf(S.c)}건</div>`}
    <div class="sesf" id="sesf">
      <button data-f="all" aria-pressed="${sesFilter==='all'}">전체 ${S.n}</button>
      <button data-f="hot" aria-pressed="${sesFilter==='hot'}">쟁점만 ${S.c}</button>
      ${kinds.map(k=>`<button data-f="${esc(k)}" aria-pressed="${sesFilter===k}">${esc(k)}</button>`).join('')}
    </div>
    <div class="sesf" style="margin-bottom:8px">
      <button id="hotAll" style="background:var(--neg);color:#fff;border-color:var(--neg)">쟁점만 모아보기</button>
    </div>
    <div class="cs" style="margin:-4px 0 6px">주제를 누르면 회기와 상관없이 그 주제의 의안만 모아 봐요</div>
    ${tagBarHTML()}
    ${list.length? list.map((b,i)=>`
      <div class="brow">
        <div class="bt" ${b.id?`data-b="${b.id}"`:'style="cursor:default"'}>${b.c?'<span class="hot">쟁점</span>':''}<span>${esc(b.name)}</span></div>
        <div class="bm"><span>${esc(b.dt||'')}</span><span>${esc(b.kind||'')}</span><span>${esc(b.cmt||'')}</span>
          ${b.res?`<span class="tag">${/가결|통과/.test(b.res)?'':/부결/.test(b.res)?'':/폐기|철회/.test(b.res)?'':''} ${esc(b.res)}</span>`:'<span class="tag">계류</span>'}
          ${b.id?`<span>${nf(b.y)} · ${nf(b.n)} · ${nf(b.b)}</span>`
                :`<span>${esc(b.prop||'')} 발의 · 표결 기록 없음</span>`}</div>
        ${tagChips(b)}
        ${b.id?`<div class="vpanel" id="vp-${b.id}"></div>`:''}
      </div>`).join('') : '<div class="empty">조건에 맞는 의안이 없어요</div>'}`;
  document.getElementById('sesf').onclick=e=>{
    const b=e.target.closest('button'); if(!b) return; sesFilter=b.dataset.f; sessMain();
  };
  el.querySelectorAll('.bt[data-b]').forEach(t=>t.onclick=()=>toggleVotes(t.dataset.b));
  bindTagBar(el);
  const bqc=document.getElementById('bqClear');
  if(bqc) bqc.onclick=()=>{ const qi=document.getElementById('q'); if(qi){ qi.value=''; qi.dispatchEvent(new Event('input')); } };
  const hb=document.getElementById('hotAll');
  if(hb) hb.onclick=()=>{ hotOnly=true; curTag=null; sessRender(); pushRoute();
    setTimeout(()=>{ const m=document.getElementById('sesmain'); m&&m.scrollIntoView({behavior:'smooth',block:'start'}); },80); };
}

function toggleVotes(billId){
  const box=document.getElementById('vp-'+billId);
  if(!box) return;
  if(box.classList.contains('on')){ box.classList.remove('on'); return; }
  const str=(D.vfull||{})[billId]||'';
  const M=D.midx||[];
  const byP={}, all={'1':0,'2':0,'3':0,'0':0,'-':0};
  const rows=[];
  for(let i=0;i<M.length;i++){
    const v=str[i]||'-'; all[v]=(all[v]||0)+1;
    const m=D.members.find(x=>x.cd===M[i]); if(!m) continue;
    (byP[m.party]=byP[m.party]||{'1':0,'2':0,'3':0,'0':0,'-':0})[v]++;
    rows.push({m,v});
  }
  const order=['1','2','3','0','-'];
  const bSum=(D.vsums||{})[billId];
  const bMeta=(D.bills||[]).find(x=>x.id===billId)||null;
  const bHtml=bulletize(bSum, bMeta);
  box.innerHTML = `
    ${bHtml?`<div style="margin-bottom:11px">${bHtml}</div>`:''}
    <div class="vsum">
      ${order.map(k=>`<div><b style="color:${VCOL[k]}">${nf(all[k]||0)}</b><i>${VICO[k]} ${VNAME[k]}</i></div>`).join('')}
    </div>
    ${(()=>{ if(!bMeta) return '';
      const dy=(bMeta.y??0)-(all['1']||0), dn=(bMeta.n??0)-(all['2']||0), da=(bMeta.b??0)-(all['3']||0);
      const gap=dy+dn+da;
      if(gap<=0) return '';
      return `<div class="vnote">국회 공식 집계는 찬성 ${nf(bMeta.y??0)} · 반대 ${nf(bMeta.n??0)} · 기권 ${nf(bMeta.b??0)}이에요.
        위 숫자는 <b>의원별 표결 기록</b>을 직접 센 값이라 ${nf(gap)}명이 적어요.
        국회가 공개하는 두 자료의 숫자가 서로 달라서 생기는 차이예요.</div>`;
    })()}
    <div class="vparty">
      ${Object.entries(byP).sort((a,b)=>Object.values(b[1]).reduce((x,y)=>x+y,0)-Object.values(a[1]).reduce((x,y)=>x+y,0))
        .map(([p,c])=>{ const t=Object.values(c).reduce((x,y)=>x+y,0)||1;
        return `<div class="vp"><span class="pn" data-gparty="${esc(p)}" style="color:${pc(p)};cursor:pointer" title="${esc(p)} 의원만 모아 보기">${esc(p)}</span>
          <span class="vb">${order.map(k=>c[k]?`<button type="button" class="vseg" data-vp="${esc(p)}" data-vk="${k}"
              style="background:${VCOL[k]};width:${c[k]/t*100}%"
              aria-label="${esc(p)} ${VNAME[k]} ${c[k]}명 보기"
              data-tip="${esc(p)} ${VNAME[k]} ${c[k]}명 · ${Math.round(c[k]/t*100)}% · 눌러서 이 의원들만 보기"></button>`:'').join('')}</span>
          <span class="vn">찬 ${c['1']} · 반 ${c['2']} · 불참 ${c['0']}</span></div>`; }).join('')}
    </div>
    <div class="vlegend">막대를 누르면 그 정당·그 선택의 의원만 아래에 나와요</div>
    <div class="vfilter" hidden></div>
    <div class="vtools">
      <input class="vfind" type="search" placeholder="이름으로 찾기" aria-label="표결한 의원 이름 검색">
      <button class="vcopy" data-vb="${billId}">명단 복사</button>
      <button class="vcopy vcsv" data-vb="${billId}">CSV 저장</button>
    </div>
    <div class="vchips" role="list">
      ${rows.sort((a,b)=>a.v.localeCompare(b.v)||a.m.name.localeCompare(b.m.name,'ko'))
        .map(r=>`<button data-cd="${r.m.cd}" data-vv="${r.v}" data-vparty="${esc(r.m.party)}" data-mark="${VMARK[r.v]}"
          aria-label="${esc(r.m.name)} ${esc(r.m.party)} ${VNAME[r.v]}"
          title="${esc(r.m.party)} · ${VNAME[r.v]}"
          style="background:${VCOL[r.v]}">${esc(r.m.name)}</button>`).join('')}
    </div>`;
  box.classList.add('on');
  box.querySelectorAll('.vchips button').forEach(b=>b.onclick=()=>open(D.members.find(m=>m.cd===b.dataset.cd)));
  // 당별 막대 구간 → 아래 명단 필터
  const vfil=box.querySelector('.vfilter');
  const applyVF=(party,vk)=>{
    const chips=[...box.querySelectorAll('.vchips button')];
    let shown=0;
    chips.forEach(b=>{
      const ok = (!party || b.dataset.vparty===party) && (!vk || b.dataset.vv===vk);
      b.style.display = ok? '' : 'none'; if(ok) shown++;
    });
    box.querySelectorAll('.vseg').forEach(sg=>sg.classList.toggle('on',
      party && sg.dataset.vp===party && sg.dataset.vk===vk));
    if(vfil){
      if(party){ vfil.hidden=false;
        vfil.innerHTML='<span class="vfl">'+esc(party)+' · '+VNAME[vk]+' <b>'+nf(shown)+'명</b></span>'
          +'<button type="button" class="vfx">전체 보기</button>';
        vfil.querySelector('.vfx').onclick=()=>applyVF(null,null);
      } else { vfil.hidden=true; vfil.innerHTML=''; }
    }
    const fi=box.querySelector('.vfind'); if(fi) fi.value='';
  };
  box.querySelectorAll('.vseg').forEach(sg=>sg.onclick=()=>{
    const on=sg.classList.contains('on');
    applyVF(on?null:sg.dataset.vp, on?null:sg.dataset.vk);
    box.querySelector('.vchips')?.scrollIntoView({behavior:'smooth',block:'nearest'});
  });
  const vf=box.querySelector('.vfind');
  if(vf) vf.oninput=()=>{ const k=vf.value.trim();
    box.querySelectorAll('.vchips button').forEach(b=>{
      b.style.display = (!k || b.textContent.includes(k)) ? '' : 'none'; }); };
  const vc=box.querySelector('.vcopy');
  if(vc) vc.onclick=async()=>{
    const g={'1':[],'2':[],'3':[]};
    box.querySelectorAll('.vchips button').forEach(b=>{ const m=D.members.find(x=>x.cd===b.dataset.cd);
      if(m) g[b.dataset.vv]?.push(m.name+'('+m.party+')'); });
    const txt=['찬성 '+g['1'].length+'명',g['1'].join(', '),'',
               '반대 '+g['2'].length+'명',g['2'].join(', '),'',
               '기권 '+g['3'].length+'명',g['3'].join(', ')].join('\n');
    try{ await navigator.clipboard.writeText(txt); vc.textContent='복사됨'; }
    catch(e){ vc.textContent='복사 실패'; }
    setTimeout(()=>vc.textContent='명단 복사',1800); };
  const vcs=box.querySelector('.vcsv');
  if(vcs) vcs.onclick=()=>{
    const bm=(D.bills||[]).find(x=>x.id===billId)||{};
    const rows2=[['의안명','의원','정당','지역구','표결']];
    const str2=(D.vfull||{})[billId]||'', M2=D.midx||[];
    for(let i=0;i<M2.length;i++){ const m2=D.members.find(x=>x.cd===M2[i]); if(!m2) continue;
      rows2.push([bm.name||billId, m2.name, m2.party, m2.dist||'비례대표', VNAME[str2[i]]||'기록없음']); }
    dlCSV('표결_'+(bm.name||billId).slice(0,30)+'.csv', rows2);
  };
}

/* ================= 쟁점 표결 매칭 ================= */
const ANS = {};                     // billId -> 'y'|'n'|'s'
/* 매칭 화면 공통 스크롤 — 항상 진행 바(.q2top)가 내비 바로 아래 최상단에 오게.
   전환마다 top:0으로 튀던 것을 이 함수 하나로 통일한다. */
function quizScroll(){
  const p=document.querySelector('.q2top')||document.querySelector('.q2wrap');
  if(!p){ scrollTo({top:0}); return; }
  const nav=document.querySelector('.navbar');
  const off=(nav?nav.getBoundingClientRect().height:0)+8;
  scrollTo({top:Math.max(0, p.getBoundingClientRect().top+scrollY-off)});
}
function quizRender(){
  const w=document.getElementById('quizwrap');
  const Q=D.quiz||[];
  const done=Q.filter(q=>ANS[q.id]).length;
  const cards = Q.map((q,i)=>`
    <div class="qcard">
      <div class="qn">문항 ${i+1} / ${Q.length}</div>
      <h4>${esc(q.name)}</h4>
      <div class="qm"><span>${esc(q.dt)}</span><span>${esc(q.cmt||'')}</span>
        <span>본회의 찬성 ${nf(q.yes)} · 반대 ${nf(q.nay)}</span>
        <a class="qlk" href="${esc(q.link)}" target="_blank" rel="noopener">의안 원문</a></div>
      ${(q.easy&&q.easy.length)?`<div class="qs"><ul>${q.easy.map(b=>
          `<li>${b.replace(/\*\*(.+?)\*\*/g,(m,t)=>'<b>'+esc(t)+'</b>').replace(/(^|>)([^<]+)/g,(m,a,t)=>a+esc(t))}</li>`).join('')}</ul></div>`:''}
      <div class="qask">내가 만일 국회의원이라면 이 법안, 찬성했을까? 반대했을까? 아니면…?</div>
      <div class="qhint">답하지 않고 넘어가도 돼요 · 3문항이면 결과가 나와요${q.blank?` · 실제 이 표결에서 기권한 의원은 ${nf(q.blank)}명이에요`:' · 이 표결에는 기권한 의원이 없었어요'}</div>
      <div class="qa" data-q="${q.id}">
        <button data-a="y" aria-pressed="${ANS[q.id]==='y'}"><i></i>찬성</button>
        <button data-a="n" aria-pressed="${ANS[q.id]==='n'}"><i></i>반대</button>
        <button data-a="a" aria-pressed="${ANS[q.id]==='a'}"><i></i>기권</button>
      </div>
    </div>`).join('');
  w.innerHTML = `
    <div class="qintro">
      <h3>나와 가장 가까운 국회의원 찾기</h3>
      <p>실제 본회의에서 <b>의견이 갈렸던 법안</b>입니다. 어려운 법조문 대신 <b>핵심만 3~5줄</b>로 정리했습니다.
         내가 국회의원이었다면 어떻게 했을지 골라 보세요. 답한 문항만으로 299명 전원과의 일치율을 계산합니다.</p>
      <div class="why">제22대 기명표결 ${nf(D.meta.nVoteBill)}건 중 반대가 10표 이상 나온 <b>쟁점은 ${nf((D.contested||[]).length)}건, 6.8%</b>뿐입니다.
        나머지는 반대표가 거의 없어요. 아래 ${Q.length}문항은 그 쟁점에서 골고루 뽑았어요.</div>
      <div class="qbar"><i style="width:${Q.length?done/Q.length*100:0}%"></i></div>
    </div>
    <div id="qresult"></div>
    ${cards}`;
  w.querySelectorAll('.qa').forEach(g=>g.onclick=e=>{
    const b=e.target.closest('button'); if(!b) return;
    const id=g.dataset.q;
    ANS[id] = ANS[id]===b.dataset.a ? undefined : b.dataset.a;
    [...g.children].forEach(z=>z.setAttribute('aria-pressed', ANS[id]===z.dataset.a));
    const dn=(D.quiz||[]).filter(q=>ANS[q.id]).length;
    w.querySelector('.qbar i').style.width=(D.quiz.length?dn/D.quiz.length*100:0)+'%';
    quizScore();
  });
  quizScore();
}

function quizScore(){
  const box=document.getElementById('qresult'); if(!box) return;
  qzInit();
  const answered=QZ.filter(q=>ANS[q.id]==='y'||ANS[q.id]==='n'||ANS[q.id]==='a');
  if(answered.length<3){
    box.innerHTML = `<div class="qres"><h3>3문항 이상 답하면 결과가 나와요</h3>
      <div class="sub2">지금까지 ${answered.length}문항 답했어요</div></div>`;
    return;
  }
  const VF=D.vfull||{}, MI=D.midx||[];
  const pos={}; MI.forEach((c,i)=>pos[c]=i);
  const rows=[];
  D.members.forEach(m=>{
    let hit=0, tot=0;
    answered.forEach(q=>{
      const str=VF[q.id]; if(!str) return;
      const v=str[pos[m.cd]];
      if(v!=='1' && v!=='2' && v!=='3') return;   // 불참·기록없음만 제외
      tot++;
      const want = {y:'1', n:'2', a:'3'}[ANS[q.id]];
      if(v===want) hit++;
    });
    if(tot>=Math.max(2,Math.ceil(answered.length*0.5))) rows.push({m, hit, tot, r:hit/tot});
  });
  rows.sort((a,b)=>b.r-a.r || b.tot-a.tot);
  const pAgg={};
  rows.forEach(x=>{ (pAgg[x.m.party]=pAgg[x.m.party]||[]).push(x.r); });
  const pRank=Object.entries(pAgg).map(([p,a])=>[p, a.reduce((x,y)=>x+y,0)/a.length, a.length])
    .sort((a,b)=>b[1]-a[1]);
  const top=rows.slice(0,12), bottom=rows.slice(-5).reverse();
  const row=(x,i,rank)=>`
    <div class="qrow" data-cd="${x.m.cd}" style="--pc2:${pc(x.m.party)}">
      <span class="rk">${rank}</span>${avatar(x.m,'ph')}
      <div><div class="nm3">${esc(x.m.name)}</div>
        <div class="pt3">${esc(x.m.party)} · ${esc(x.m.dist||'비례대표')}</div></div>
      <div class="qmeter" data-tip="일치 ${x.hit}/${x.tot}문항 · ${(x.r*100).toFixed(0)}%"><i style="width:${(x.r*100).toFixed(0)}%"></i></div>
      <div class="sc"><b>${(x.r*100).toFixed(0)}%</b><s>${x.hit}/${x.tot}문항${x.tot<5?' · 표본 적음':''}</s></div>
    </div>`;
  box.innerHTML = `
    <div class="qres">
      ${(()=>{ const t0=rows[0]?.r??0;
        const tied=rows.filter(x=>Math.abs(x.r-t0)<1e-9);
        if(tied.length>8 && QZ.length<25) return `
          <div class="narrow">
            <div class="nh">아직 <b>${nf(tied.length)}명</b>이 공동 1위예요 <span>일치율 ${(t0*100).toFixed(0)}%</span></div>
            <div class="nb">국회는 당론 투표가 많아서, 큰 법안만으로는 같은 당 의원들이 전부 같은 답이 돼요.
              이 ${nf(tied.length)}명 사이에서 <b>실제로 표가 갈렸던 법안</b>으로 5문항 더 물어볼게요.</div>
            <button class="pri" id="qMore">5문항 더 답하고 좁히기</button>
          </div>`;
        if(QZ.length>=25) return `<div class="narrow done">
            <div class="nh">25문항을 모두 채웠어요</div>
            <div class="nb">더 물어볼 수 있는 문항이 없어요. 아래가 최종 결과예요.</div></div>`;
        return `<div class="narrow done">
            <div class="nh">충분히 좁혀졌어요</div>
            <div class="nb">공동 1위가 ${nf(tied.length)}명이라 더 묻지 않아도 돼요.</div></div>`; })()}
      <h3><svg class="ic" aria-hidden="true"><use href="#i-target"/></svg>나와 가까운 순서예요</h3>
      <div class="sub2">실제로 표를 던진 문항만 비교했어요 · 대상 ${nf(rows.length)}명 · ${nf(QZ.filter(q=>ANS[q.id]).length)}문항 답변<br>
      의원마다 비교된 문항 수(분모)가 달라서, 3문항 100%보다 5문항 80%가 더 강한 신호일 수 있어요 · 결과는 이 브라우저에 저장돼요</div>
      <div class="qparty">${pRank.map(([p,v,n])=>
        `<div data-gparty="${esc(p)}" style="cursor:pointer" data-tip="${esc(p)} 평균 일치율 ${(v*100).toFixed(0)}% · ${n}명 · 눌러서 모아 보기">
          <b style="color:${pc(p)}">${(v*100).toFixed(0)}%</b><i>${esc(p)} 평균 (${n}명)</i></div>`).join('')}</div>
      <h3 style="margin-top:18px;font-size:0.875rem">가장 가까운 의원</h3>
      ${top.map((x,i)=>row(x,i,i+1)).join('')}
      <h3 style="margin-top:20px;font-size:0.875rem">가장 먼 의원</h3>
      ${bottom.map((x,i)=>row(x,i,rows.length-i)).join('')}
      <div class="qbtns" style="margin-top:20px"><button id="qReset">처음부터 다시 하기</button></div>
    </div>`;
  box.querySelectorAll('.qrow').forEach(r=>r.onclick=()=>open(D.members.find(m=>m.cd===r.dataset.cd)));
  const rb=document.getElementById('qReset');
  if(rb) rb.onclick=()=>{ Object.keys(ANS).forEach(k=>delete ANS[k]); QZ=[...(D.quiz||[])]; qIdx=0; try{localStorage.removeItem('dogam.quiz.v1');}catch(e2){} quizRender(); quizScroll(); };
}

/* ================= 지도 ================= */
const byCode = {}; D.members.forEach(x=>{ if(x.sgg) byCode[x.sgg]=x; });
const MID = Math.cos(35.9*Math.PI/180);
let mapBuilt=false, mapVB=null, curVB=null, selCode=null, setVB=()=>{};
let mapNavKey='', mapNavIdx=0, mapZoomToCode=()=>{}, mapZoomReset=()=>{}, mapSelectCode=()=>{};

function proj(c){ return [c[0]*MID, -c[1]]; }
function pathOf(geom){
  const rings = geom.type==='Polygon' ? [geom.coordinates] : geom.coordinates;
  let d='';
  for(const poly of rings) for(const ring of poly){
    for(let i=0;i<ring.length;i++){ const p=proj(ring[i]); d += (i?'L':'M') + p[0].toFixed(4) + ' ' + p[1].toFixed(4); }
    d+='Z';
  }
  return d;
}

function buildMap(){
  if(mapBuilt || !D.geo) return;
  const svg=document.getElementById('map');
  let minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;
  const paths = D.geo.features.map(f=>{
    const d=pathOf(f.geometry);
    d.replace(/[ML]([-\d.]+) ([-\d.]+)/g,(_,a,b)=>{ a=+a;b=+b;
      if(a<minX)minX=a; if(a>maxX)maxX=a; if(b<minY)minY=b; if(b>maxY)maxY=b; return ''; });
    const m=byCode[f.properties.c];
    return `<path d="${d}" data-c="${f.properties.c}" data-n="${esc(f.properties.n)}"
      fill="${m?pcFill(m.party):'var(--absent)'}" ${m?'':'opacity=".38"'}
      data-tip="${esc(f.properties.n)}${m?' · '+esc(m.name)+' · '+esc(m.party)+' · 참여 '+(m.vote&&m.vote.part!=null?m.vote.part:'–')+'%':' · 공석'}"></path>`;
  }).join('');
  const w=maxX-minX, h=maxY-minY, pad=Math.max(w,h)*0.03;
  mapVB=[minX-pad, minY-pad, w+pad*2, h+pad*2];
  curVB=[...mapVB];
  svg.setAttribute('viewBox', mapVB.join(' '));
  svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  const O=D.geo.outlines||{}, L=D.geo.labels||{sido:[],dist:[]};
  const outl = Object.entries(O).map(([s2,lines])=>lines.map(l=>
      `<path class="sido-line" d="${l.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join('')}"/>`).join('')).join('');
  const lblS = (L.sido||[]).map(o=>
    `<text class="lbl-sido" x="${o.p[0]}" y="${o.p[1]}" text-anchor="middle">${esc(o.s)}</text>`).join('');
  const lblD = (L.dist||[]).map(o=>
    `<text class="lbl-dist" x="${o.p[0]}" y="${o.p[1]}" text-anchor="middle" data-c="${o.c}">${esc(o.n.split(' ').pop())}</text>`).join('');
  svg.innerHTML = `<g id="mZoom"><g id="mFill">${paths}</g><g id="mLine">${outl}</g><g id="mLbl"><g id="gSido">${lblS}</g><g id="gDist">${lblD}</g></g></g>`;
  mapBuilt=true;

  const tip=document.getElementById('maptip');
  svg.addEventListener('mousemove',e=>{
    const p=e.target.closest('path');
    if(!p){ tip.classList.remove('on'); return; }
    const m=byCode[p.dataset.c];
    tip.innerHTML = m
      ? `<b>${esc(m.name)}</b> <s>${esc(m.party)} · ${esc(p.dataset.n)}</s>`
      : `<b>공석</b> <s>${esc(p.dataset.n)}</s>`;
    const r=svg.getBoundingClientRect();
    let x=e.clientX-r.left+14, y=e.clientY-r.top+14;
    if(x+tip.offsetWidth>r.width) x=e.clientX-r.left-tip.offsetWidth-10;
    if(y+tip.offsetHeight>r.height) y=e.clientY-r.top-tip.offsetHeight-10;
    tip.style.left=x+'px'; tip.style.top=y+'px'; tip.classList.add('on');
  });
  svg.addEventListener('mouseleave',()=>tip.classList.remove('on'));
  function selectPath(p){
    if(!p) return;
    selCode=p.dataset.c;
    svg.querySelectorAll('#mFill path.sel').forEach(z=>z.classList.remove('sel'));
    p.classList.add('sel');
    showMapInfo(byCode[selCode], p.dataset.n);
  }
  svg.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' ') selectPath(e.target.closest('path')); });

  // 줄/팬
  // 지역구별 화면상 크기(LOD 판단용)
  const distW={};
  svg.querySelectorAll('#mFill path').forEach(pp=>{ try{ distW[pp.dataset.c]=pp.getBBox().width; }catch(e){} });
  const distLbl=[...svg.querySelectorAll('.lbl-dist')];
  const gSido=svg.querySelector('#gSido'), gDist=svg.querySelector('#gDist');
  const sidoLbl=[...svg.querySelectorAll('.lbl-sido')];
  let lastK=-1, lastW=-1;
  const zg = svg.querySelector('#mZoom');
  svg.setAttribute('viewBox', mapVB.join(' '));     // viewBox는 고정
  setVB=()=>{
    // ⚡ viewBox 변경은 481KB짜리 path 254개를 매번 재래스터화한다(측정 13.2ms).
    //    그룹 transform은 합성만 하면 되므로 0.38ms — 35배 빠르다.
    const sc = mapVB[2]/curVB[2];
    zg.setAttribute('transform',
      'translate('+(mapVB[0]-curVB[0]*sc).toFixed(4)+' '+(mapVB[1]-curVB[1]*sc).toFixed(4)+') scale('+sc.toFixed(6)+')');
    const k = curVB[2]/mapVB[2];                    // 1=전국, 작을수록 확대
    const w = svg.clientWidth || svg.getBoundingClientRect().width || 1;
    const u = curVB[2] / w;                          // 1px = u 사용자단위
    // ⚡ 라벨 254개 스타일 쓰기는 비싸다. 배율이 유의하게 변했을 때만 갱신한다.
    //    (viewBox 자체는 매 프레임 갱신되므로 이동·확대는 그대로 부드럽다)
    if(lastK>0 && w===lastW && Math.abs(Math.log(k/lastK))<0.025) return;
    lastK=k; lastW=w;
    // 확대 배율에 따라 글자도 함께 커진다(감쇠 지수 0.38, 0.85~2.6배로 제한)
    //  k=1 전국 → 1배 / k=0.25(4배 확대) → 1.7배 / k=0.05(20배) → 2.6배 상한
    const zf = Math.min(2.6, Math.max(0.85, Math.pow(1/Math.max(k,0.02), 0.38)));
    // ⚡ font-size는 그룹에 한 번만 쓴다(254회 → 2회). 개별 요소는 display만 토글.
    const sOp = k>0.55 ? 1 : k>0.22 ? (k-0.22)/(0.55-0.22)*0.8+0.2 : 0;
    if(gSido){ gSido.style.fontSize=(15*zf*u).toFixed(5);
      gSido.style.opacity=sOp.toFixed(2);
      gSido.style.display = sOp<0.05?'none':''; }
    if(gDist) gDist.style.fontSize=(11.5*zf*u).toFixed(5);
    // 지역구 이름: 화면에서 충분히 커진 지역구만 (면적 LOD). 바뀐 것만 건드린다.
    const need = 46*zf;
    for(let i=0;i<distLbl.length;i++){
      const t=distLbl[i];
      const vis=(distW[t.dataset.c]||0)/u >= need;
      if(t.__v !== vis){ t.__v=vis; t.style.display = vis?'block':'none'; }
    }
  };
  // 부드러운 글라이드 (easeOutCubic)
  let glideId=null;
  const glideVB=(target,dur=320)=>{
    if(glideId) cancelAnimationFrame(glideId);
    const from=[...curVB], t0=performance.now();
    const step=now=>{
      const p=Math.min(1,(now-t0)/dur), e2=1-Math.pow(1-p,3);
      curVB=from.map((v,i)=>v+(target[i]-v)*e2);
      setVB();
      if(p<1) glideId=requestAnimationFrame(step); else glideId=null;
    };
    glideId=requestAnimationFrame(step);
  };
  const zoom=(k,cx,cy)=>{
    if(followId){ cancelAnimationFrame(followId); followId=null; } tgtVB=null;
    const [x,y,w2,h2]=curVB;
    cx = cx??(x+w2/2); cy = cy??(y+h2/2);
    const nw=w2*k, nh=h2*k;
    if(nw>mapVB[2]*1.6 || nw<mapVB[2]*0.02) return;
    glideVB([cx-(cx-x)*k, cy-(cy-y)*k, nw, nh], 200);
  };
  // 검색 → 지역구 확대 (render의 지도 분기에서 호출)
  mapZoomToCode=code=>{
    const p=svg.querySelector('#mFill path[data-c="'+code+'"]'); if(!p) return;
    const bb=p.getBBox(), pad=Math.max(bb.width,bb.height)*0.9;
    glideVB([bb.x-pad, bb.y-pad, bb.width+pad*2, bb.height+pad*2], 380);
  };
  mapZoomReset=()=>glideVB([...mapVB], 380);
  /* 검색·목록에서 지역구를 바로 선택(확대+상세 패널)하는 공개 함수 */
  mapSelectCode=code=>{
    const p=svg.querySelector('#mFill path[data-c="'+code+'"]'); if(!p) return;
    selCode=code;
    svg.querySelectorAll('#mFill path.sel').forEach(z=>z.classList.remove('sel'));
    p.classList.add('sel');
    showMapInfo(byCode[code], p.dataset.n);
    mapZoomToCode(code);
  };
  /* 키보드·스크린리더용 지역구 목록 선택 — 지도 클릭의 대체 경로 */
  (function(){
    const sel=document.getElementById('mapSel'); if(!sel || sel.options.length>1) return;
    const opts=[...svg.querySelectorAll('#mFill path')].map(p2=>({c:p2.dataset.c, n:p2.dataset.n}))
      .sort((a,b)=>a.n.localeCompare(b.n,'ko'));
    sel.innerHTML='<option value="">지역구 목록에서 선택…</option>'+opts.map(o=>{
      const m2=byCode[o.c];
      return '<option value="'+o.c+'">'+esc(o.n)+(m2?' · '+esc(m2.name):' · 공석')+'</option>'; }).join('');
    sel.onchange=()=>{ if(sel.value) mapSelectCode(sel.value); };
  })();
  // 광역시 바로 확대 — 조밀한 도시 지역구를 누르기 쉽게
  const JUMP=['서울','경기','인천','강원','충북','충남','대전','세종','전북','전남','광주','경북','대구','경남','부산','울산','제주'];
  document.getElementById('mapjump').innerHTML =
    `<button data-j="__all">전국</button>` + JUMP.map(j=>`<button data-j="${j}">${j}</button>`).join('');
  document.getElementById('mapjump').onclick=e=>{
    const b=e.target.closest('button'); if(!b) return;
    if(b.dataset.j==='__all'){ glideVB([...mapVB], 380); return; }
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9, n=0;
    svg.querySelectorAll('#mFill path').forEach(p=>{
      if(!p.dataset.n || !p.dataset.n.startsWith(b.dataset.j+' ')) return;
      const bb=p.getBBox(); n++;
      x0=Math.min(x0,bb.x); y0=Math.min(y0,bb.y);
      x1=Math.max(x1,bb.x+bb.width); y1=Math.max(y1,bb.y+bb.height);
    });
    if(!n) return;
    const pad=Math.max(x1-x0,y1-y0)*0.12;
    glideVB([x0-pad, y0-pad, (x1-x0)+pad*2, (y1-y0)+pad*2], 380);
  };
  document.getElementById('mzIn').onclick=()=>zoom(0.6);
  document.getElementById('mzOut').onclick=()=>zoom(1/0.6);
  document.getElementById('mzRst').onclick=()=>glideVB([...mapVB], 380);
  // 휠 확대: 글라이드 없이 즉시 반영해야 1:1로 따라온다.
  // (매 이벤트마다 glide를 새로 걸면 직전 애니메이션이 취소되어 오히려 느려짐)
  /* ── 감쇠 추종(damped follow) 확대 ──
     휠은 '목표 viewBox'만 갱신하고, 별도의 rAF 루프가 현재값을 목표로 매끄럽게 수렴시킨다.
     즉시 반영(계단현상)도, 매번 애니메이션 재시작(끊김)도 피할 수 있다. */
  let tgtVB=null, followId=null;
  const clampVB=(vb)=>{
    const maxW=mapVB[2]*1.6, minW=mapVB[2]*0.02;
    let [x,y,w2,h2]=vb;
    if(w2>maxW){ const r2=maxW/w2; const cx=x+w2/2, cy=y+h2/2; w2=maxW; h2*=r2; x=cx-w2/2; y=cy-h2/2; }
    if(w2<minW){ const r2=minW/w2; const cx=x+w2/2, cy=y+h2/2; w2=minW; h2*=r2; x=cx-w2/2; y=cy-h2/2; }
    return [x,y,w2,h2];
  };
  const follow=()=>{
    if(!tgtVB){ followId=null; return; }
    const S2=0.28;                                   // 수렴 계수(클수록 빠르고 딱딱함)
    let done=true;
    curVB=curVB.map((v,i)=>{
      const d2=tgtVB[i]-v;
      if(Math.abs(d2) > Math.abs(tgtVB[2])*1e-4){ done=false; return v+d2*S2; }
      return tgtVB[i];
    });
    setVB();
    if(done){ tgtVB=null; followId=null; return; }
    followId=requestAnimationFrame(follow);
  };
  const zoomTo=(k,cx,cy)=>{
    if(glideId){ cancelAnimationFrame(glideId); glideId=null; }
    const base = tgtVB || curVB;                     // 연속 입력은 목표 기준으로 누적
    const [x,y,w2,h2]=base;
    tgtVB = clampVB([cx-(cx-x)*k, cy-(cy-y)*k, w2*k, h2*k]);
    if(!followId) followId=requestAnimationFrame(follow);
  };
  svg.addEventListener('wheel',e=>{ e.preventDefault();
    const r=svg.getBoundingClientRect();
    const base = tgtVB || curVB;
    const cx=base[0]+ (e.clientX-r.left)/r.width*base[2];
    const cy=base[1]+ (e.clientY-r.top)/r.height*base[3];
    // deltaMode 정규화: 0=px, 1=line(≈16px), 2=page(≈400px)
    let d=e.deltaY * (e.deltaMode===1?16:e.deltaMode===2?400:1);
    if(e.ctrlKey) d*=2.2;                      // 맥 트랙패드 핀치
    d=Math.max(-260, Math.min(260, d));        // 폭주 방지
    zoomTo(Math.exp(d*0.0032), cx, cy);
  },{passive:false});
  // 더블클릭: 그 지점 중심으로 한 단계 확대
  svg.addEventListener('dblclick',e=>{ e.preventDefault();
    const r=svg.getBoundingClientRect();
    const cx=curVB[0]+ (e.clientX-r.left)/r.width*curVB[2];
    const cy=curVB[1]+ (e.clientY-r.top)/r.height*curVB[3];
    glideVB([cx-(cx-curVB[0])*0.5, cy-(cy-curVB[1])*0.5, curVB[2]*0.5, curVB[3]*0.5], 260);
  });
  // 클릭과 드래그를 이동 임계값으로 분리한다.
  /* 모바일 — 두 손가락 핀치로 확대·축소, 두 손가락 이동으로 패닝.
     한 손가락 세로 스와이프는 touch-action:pan-y가 페이지 스크롤로 넘긴다. */
  let pinch=null;
  const dist2=t=>Math.hypot(t[0].clientX-t[1].clientX, t[0].clientY-t[1].clientY);
  const mid2=t=>({x:(t[0].clientX+t[1].clientX)/2, y:(t[0].clientY+t[1].clientY)/2});
  svg.addEventListener('touchstart',e=>{
    if(e.touches.length!==2) return;
    e.preventDefault();
    if(followId){ cancelAnimationFrame(followId); followId=null; } tgtVB=null;
    const t=[e.touches[0],e.touches[1]];
    pinch={ d:dist2(t), m:mid2(t), vb:[...curVB] };
  },{passive:false});
  svg.addEventListener('touchmove',e=>{
    if(e.touches.length===1 && !pinch){ e.preventDefault(); return; }  // 한 손가락은 pointermove가 지도를 팬다
    if(!pinch || e.touches.length!==2) return;
    e.preventDefault();
    const t=[e.touches[0],e.touches[1]];
    const r=svg.getBoundingClientRect();
    const k=Math.max(0.02, Math.min(50, pinch.d/Math.max(1,dist2(t))));   // 벌리면 확대(k<1)
    const nw=Math.max(mapVB[2]*0.02, Math.min(mapVB[2]*1.6, pinch.vb[2]*k));
    const s=nw/pinch.vb[2];
    // 손가락 중점이 잡고 있던 지점을 고정한 채 배율 적용
    const cx=pinch.vb[0]+(pinch.m.x-r.left)/r.width*pinch.vb[2];
    const cy=pinch.vb[1]+(pinch.m.y-r.top)/r.height*pinch.vb[3];
    const m=mid2(t);
    const nx=cx-(m.x-r.left)/r.width*nw;
    const ny=cy-(m.y-r.top)/r.height*(pinch.vb[3]*s);
    curVB=[nx, ny, nw, pinch.vb[3]*s];
    setVB();
  },{passive:false});
  const endPinch=e=>{ if(pinch && (!e.touches || e.touches.length<2)) pinch=null; };
  svg.addEventListener('touchend',endPinch,{passive:true});
  svg.addEventListener('touchcancel',endPinch,{passive:true});

  // setPointerCapture를 pointerdown에서 즉시 걸면 click 이벤트의 target이 SVG로 바뀌어
  // path 선택이 통째로 죽는다. 실제로 움직였을 때만 캡처한다.
  let drag=null;
  const MOVE_TH = 4;
  svg.addEventListener('pointerdown',e=>{
    drag={ x:e.clientX, y:e.clientY, vb:[...curVB],
           target:e.target.closest('path'), moved:false, id:e.pointerId };
  });
  svg.addEventListener('pointermove',e=>{
    if(!drag) return;
    if(!drag.moved){
      if(Math.hypot(e.clientX-drag.x, e.clientY-drag.y) < MOVE_TH) return;
      drag.moved=true;
      try{ svg.setPointerCapture(drag.id); }catch(_){}
      svg.style.cursor='grabbing';
    }
    const r=svg.getBoundingClientRect();
    if(followId){ cancelAnimationFrame(followId); followId=null; } tgtVB=null;
    curVB=[drag.vb[0]-(e.clientX-drag.x)/r.width*drag.vb[2],
           drag.vb[1]-(e.clientY-drag.y)/r.height*drag.vb[3], drag.vb[2], drag.vb[3]]; setVB();
  });
  const endDrag=()=>{
    if(!drag) return;
    if(!drag.moved) selectPath(drag.target);
    else { try{ svg.releasePointerCapture(drag.id); }catch(_){} }
    svg.style.cursor=''; drag=null;
  };
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel',()=>{ svg.style.cursor=''; drag=null; });
  requestAnimationFrame(()=>setVB());
}

function showMapInfo(x, distName){
  const el=document.getElementById('mapinfo');
  if(!x){ el.innerHTML=`<div class="ph0"><b>${esc(distName||'')}</b><br>지금은 의석이 비어 있어요</div>`; return; }
  el.innerHTML=`
    <div class="hd2">${avatar(x,'ph')}
      <div><div class="nm2">${esc(x.name)}</div>
      <div class="pt2">${esc(x.party)}</div>
      <div class="dg2">${esc(x.dist||'비례대표')}</div></div>
    </div>
    <div class="kv">
      <div>표결 참여<b>${x.vote.part??'–'}%</b></div>
      <div>대표발의<b>${x.prop.n}</b></div>
      <div>당론 이탈<b>${x.defect.rate??0}%</b></div>
      <div>발언<b>${nf(x.speech.n)}</b></div>
    </div>
    <div style="font-size:0.71875rem;color:var(--ink3);line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;
      -webkit-box-orient:vertical;overflow:hidden">${esc(x.cmt||'위원회 미배정')}</div>
    <div style="display:flex;gap:7px">
      <button class="go" data-cd="${x.cd}" style="flex:1">자세히 보기</button>
      <button class="go star2" data-cd="${x.cd}" aria-label="관심 의원"
      style="flex:none;padding:9px 13px;color:${isStar(x.cd)?'var(--accent)':'var(--ink3)'}"><svg class="ic" aria-hidden="true"><use href="#i-star"/></svg></button>
    </div>`;
  el.querySelector('.go').onclick=()=>open(x);
  const s2=el.querySelector('.star2'); if(s2) s2.onclick=()=>{ toggleStar(x.cd); showMapInfo(x); };
}

function fitMap(){
  const box=document.querySelector('.mapbox'); if(!box) return;
  const side=document.querySelector('.mapside');
  // 모바일에서 화면 전체를 채우면 지도가 스크롤을 가로채 아래 내용에 닿지 못한다
  if(innerWidth<=640){
    const h2=Math.max(300, Math.round(Math.min(innerHeight*0.58, 460)));
    box.style.height=h2+'px'; if(side) side.style.height='auto';
    requestAnimationFrame(()=>setVB());
    return;
  }
  const top=box.getBoundingClientRect().top + window.scrollY;
  const h=Math.max(380, Math.round(window.innerHeight - top + window.scrollY - 20));
  box.style.height=h+'px'; if(side) side.style.height=h+'px';
  requestAnimationFrame(()=>setVB());
}
window.addEventListener('resize', ()=>{ if(viewMode==='map') fitMap(); });

function paintMap(list){
  const svg=document.getElementById('map'); if(!mapBuilt) return;
  const ok=new Set(list.filter(x=>x.sgg).map(x=>x.sgg));
  svg.querySelectorAll('#mFill path').forEach(p=>p.classList.toggle('dim', !ok.has(p.dataset.c)));
  // 범례
  const cnt={}; list.forEach(x=>cnt[x.party]=(cnt[x.party]||0)+1);
  document.getElementById('legend').innerHTML='<h5>정당</h5>'+
    Object.entries(cnt).sort((a,b)=>b[1]-a[1]).map(([p,c])=>
      `<div class="lg" data-p="${esc(p)}" role="button" tabindex="0" aria-pressed="${activeParty===p}">
        <i style="background:${pc(p)}"></i>${esc(p)}<em>${c}</em></div>`).join('')
    +`<div class="lg" style="cursor:default"><i style="background:var(--line)"></i>공석<em>1</em></div>`;
  document.getElementById('legend').querySelectorAll('.lg[data-p]').forEach(l=>{
    const act=()=>{ activeParty = activeParty===l.dataset.p ? null : l.dataset.p;
      [...document.querySelectorAll('#parties .chip')].forEach(c=>c.setAttribute('aria-pressed', c.dataset.p===activeParty));
      render(); };
    l.onclick=act;
    l.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); act(); } };
  });
  // 비례대표
  const pr=list.filter(x=>!x.sgg);
  document.getElementById('propbar').innerHTML = pr.length
    ? `<h5>비례대표 ${pr.length}명은 지역구가 없어요</h5><div class="pl">`+
      pr.map(x=>`<button data-cd="${x.cd}" style="background:${pc(x.party)}">${esc(x.name)}</button>`).join('')+`</div>`
    : `<h5>비례대표 없음</h5>`;
  document.getElementById('propbar').querySelectorAll('button').forEach(b=>
    b.onclick=()=>open(D.members.find(x=>x.cd===b.dataset.cd)));
}

function render(){
  const kwRaw = q.value.trim();
  const kw = kwRaw.toLowerCase();
  const kwJamo = JAMO_RE.test(kwRaw);
  const sd = sidoSel.value;
  let list = D.members.filter(x=>{
    if(activeParty && x.party!==activeParty) return false;
    if(sd && x.sido!==sd) return false;
    if(!kw) return true;
    if(kwJamo) return choStr(x.name).includes(kwRaw);
    return (x.name+' '+x.party+' '+(x.dist||'')+' '+(x.sido||'')+' '+(x.cmts||'')+' '+(x.cmt||'')).toLowerCase().includes(kw);
  });
  // 법안·발언 탭에서는 검색어가 그 탭의 콘텐츠에 쓰이므로 의원 목록은 줄이지 않는다
  if(viewMode==='sess'||viewMode==='qt') list=[...D.members];
  const S = sortSel.value;
  const by = {
    part:(a,b)=>(b.vote.part??-1)-(a.vote.part??-1),
    part_a:(a,b)=>(a.vote.part??999)-(b.vote.part??999),
    prop:(a,b)=>b.prop.n-a.prop.n,
    rate:(a,b)=>(b.prop.rate??-1)-(a.prop.rate??-1),
    defect:(a,b)=>(b.cdefect?.rate??-1)-(a.cdefect?.rate??-1),
    speech:(a,b)=>b.speech.n-a.speech.n,
    asset:(a,b)=>(((D.assets||{})[b.cd]||{}).t??-1e15)-(((D.assets||{})[a.cd]||{}).t??-1e15),
    asset_a:(a,b)=>(((D.assets||{})[a.cd]||{}).t??1e15)-(((D.assets||{})[b.cd]||{}).t??1e15),
    again:(a,b)=>{ const g=m=>{ const x=(D.assets||{})[m.cd]; return x? x.t-x.p : -1e15; };
      return g(b)-g(a); },
    news:(a,b)=>((D.news5||{})[b.cd]||[]).length-((D.news5||{})[a.cd]||[]).length,
    reele:(a,b)=>reeleNum(b.reele)-reeleNum(a.reele) || a.name.localeCompare(b.name,'ko'),
    age:(a,b)=>String(a.bth||'9999').localeCompare(String(b.bth||'9999')),
    age_a:(a,b)=>String(b.bth||'0').localeCompare(String(a.bth||'0')),
    ptt:(a,b)=>(b.pttN||0)-(a.pttN||0),
    defect_a:(a,b)=>(a.cdefect?.rate??999)-(b.cdefect?.rate??999),
    name:(a,b)=>a.name.localeCompare(b.name,'ko')
  }[S];
  list = [...list].sort(by);
  (function(){
    const el=document.getElementById('count'); if(!el) return;
    const T={ sess:()=>{ const n2=document.querySelectorAll('#sesmain .brow').length;
                 return n2? nf(n2)+'건' : nf((D.bills||[]).length)+'건'; },
              qt:()=>nf((D.quotes||[]).length)+'건',
              quiz:()=>'299명 비교',
              my:()=>nf(list.length)+'명' };
    el.textContent = (T[viewMode] ? T[viewMode]() : nf(list.length)+'명');
  })();

  const grid = document.getElementById('grid');
  const isMap = viewMode==='map', isQuiz = viewMode==='quiz', isSess = viewMode==='sess', isQt = viewMode==='qt', isMy = viewMode==='my';
  document.getElementById('mapwrap').classList.toggle('on', isMap);
  document.getElementById('quizwrap').classList.toggle('on', isQuiz);
  document.getElementById('seswrap').classList.toggle('on', isSess);
  document.getElementById('qtwrap').classList.toggle('on', isQt);
  document.getElementById('mywrap').classList.toggle('on', isMy);
  grid.style.display = (isMap||isQuiz||isSess||isQt||isMy) ? 'none' : '';
  if(isMy){
    myRender();
    document.getElementById('idx').innerHTML =
      '<span class="lbl">별표를 누르면 소식이 모여요</span>';
    return;
  }
  if(isQt){
    qtQ = q.value; qtRender();
    document.getElementById('idx').innerHTML = '';
    return;
  }
  if(isSess){
    sessRender();
    document.getElementById('idx').innerHTML =
      '<span class="lbl">제목을 누르면 299명의 표가 보여요</span>';
    return;
  }
  if(isQuiz){
    quizRender();
    document.getElementById('idx').innerHTML =
      '<span class="lbl">답할수록 결과가 정확해져요 · 299명 전원과 비교해요</span>';
    return;
  }
  if(isMap){
    buildMap(); paintMap(list); fitMap();
    if(!selCode) document.getElementById('mapinfo').innerHTML =
      '<div class="ph0"><b>지역구를 누르면</b><br>여기에 그 지역 의원이 나와요</div>';
    // 검색이 지역구에 걸리면 지도를 그 지역으로 확대, 여러 곳이면 ‹ ›로 순환
    const distName={}; list.forEach(x=>{ if(x.sgg && !(x.sgg in distName)) distName[x.sgg]=x.dist||x.name; });
    const codes=Object.keys(distName).sort((a,b)=>distName[a].localeCompare(distName[b],'ko'));
    const idxEl=document.getElementById('idx');
    if(kw && codes.length){
      const key2=kw+'|'+codes.join(',');
      if(key2!==mapNavKey){ mapNavKey=key2; mapNavIdx=0; }
      if(mapNavIdx>=codes.length) mapNavIdx=0;
      mapSelectCode(codes[mapNavIdx]);   // 확대만 하지 않고 선택까지 (검색 → 바로 의원 패널)
      idxEl.innerHTML = codes.length>1
        ? `<button data-mn="-1" aria-label="이전 지역구" style="width:auto;padding:0 12px">‹</button>
           <span class="lbl">${esc(distName[codes[mapNavIdx]])} · ${mapNavIdx+1}/${codes.length}곳</span>
           <button data-mn="1" aria-label="다음 지역구" style="width:auto;padding:0 12px">›</button>`
        : `<span class="lbl">${esc(distName[codes[0]])}(으)로 확대했어요</span>`;
      idxEl.querySelectorAll('button[data-mn]').forEach(b=>b.onclick=()=>{
        mapNavIdx=(mapNavIdx + +b.dataset.mn + codes.length)%codes.length;
        render();
      });
    } else {
      if(mapNavKey){ mapNavKey=''; mapNavIdx=0; mapZoomReset(); }
      idxEl.innerHTML=`<span class="lbl">지역구를 눌러 보세요</span>`;
    }
    return;
  }
  grid.className = 'grid' + (viewMode==='compact' ? ' compact' : '');
  const grouped = (S==='name');
  const present = new Set(list.map(x=>choOf(x.name)));
  document.getElementById('idx').innerHTML = grouped
    ? `<span class="lbl">가나다</span>` + IDX_KEYS.map(k=>
        `<button data-k="${k}" ${present.has(k)?'':'disabled'}>${k}</button>`).join('')
      + `<button data-k="__top" style="width:auto;padding:0 10px;font-size:0.6875rem" title="맨 위로">↑</button>`
    : `<span class="lbl">가나다 색인은 가나다 순에서만 나와요</span>`;

  let html='', lastCho=null;
  list.forEach(x=>{
    if(grouped){
      const c=choOf(x.name);
      if(c!==lastCho){
        const n=list.filter(y=>choOf(y.name)===c).length;
        html += `<div class="ghd" id="g-${c}"><b>${c}</b><i>${n}명</i></div>`;
        lastCho=c;
      }
    }
    html += card(x);
  });
  grid.innerHTML = html || `<div class="empty">조건에 맞는 의원이 없어요</div>`;
}

document.getElementById('idx').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b||b.disabled) return;
  if(b.dataset.k==='__top'){ window.scrollTo({top:0,behavior:'smooth'}); return; }
  const t=document.getElementById('g-'+b.dataset.k);
  if(t) t.scrollIntoView({behavior:'smooth',block:'start'});
  [...document.querySelectorAll('#idx button')].forEach(z=>z.classList.toggle('on', z===b));
});

function card(x){ return `
    <button class="card" data-cd="${x.cd}" style="--pc:${pc(x.party)}"
      aria-label="${esc(x.name)} · ${esc(x.party)} · ${esc(x.dist||'비례대표')} — 상세 보기">
      <span class="starbtn ${isStar(x.cd)?'on':''}" data-cd="${x.cd}" role="button" tabindex="0"
        aria-label="${esc(x.name)} 관심 의원 ${isStar(x.cd)?'해제':'추가'}"><svg class="ic" aria-hidden="true"><use href="#i-star"/></svg></span>
      <span class="cmpc ${(typeof CMP!=='undefined'&&CMP&&CMP.includes(x.cd))?'on':''}" data-cmp="${x.cd}" role="button" tabindex="0"
        aria-label="${esc(x.name)} 비교 목록에 담기">${(typeof CMP!=='undefined'&&CMP&&CMP.includes(x.cd))?'비교 담김':'비교'}</span>
      <div class="hd">
        ${avatar(x,'ph')}
        <div>
          <div class="nm">${esc(x.name)}</div>
          <div class="pt">${esc(x.party)}</div>
          <div class="dg">${esc(x.dist==='비례대표'? (x.party+' 비례대표') : (x.dist||'비례대표'))}</div>
        </div>
      </div>
      ${voteCard(x)}
      ${assetCard(x)}
      ${sortBadge(x)}
    </button>`; }

/* 현재 정렬 기준값을 카드에 노출 — 무엇으로 줄 세웠는지 보이게 */
function sortBadge(x){
  const S=(document.getElementById('sort')||{}).value||'name';
  const A=(D.assets||{})[x.cd];
  const map={
    reele:['선수', x.reele||'–'],
    age:['생년', (x.bth||'').slice(0,4)+'년'],
    age_a:['생년', (x.bth||'').slice(0,4)+'년'],
    prop:['대표발의', nf(x.prop.n)+'건'],
    rate:['발의 성사율', (x.prop.rate??0)+'%'],
    speech:['발언', nf(x.speech.n)+'건'],
    ptt:['청원 소개', nf(x.pttN||0)+'건'],
    defect:['당론 이탈', (x.cdefect?.rate??0)+'%'],
    defect_a:['당론 이탈', (x.cdefect?.rate??0)+'%'],
    again:['1년 새 변동', A? ((A.t-A.p)>=0?'+':'')+AMAN(A.t-A.p) : '–'],
    news:['5년 보도', nf(((D.news5||{})[x.cd]||[]).length)+'건']
  };
  const v=map[S];
  if(!v) return '';                       // 이름·참여율·재산은 이미 카드에 있음
  return `<div class="sbadge"><span>${v[0]}</span><b>${esc(String(v[1]))}</b></div>`;
}

/* 카드용 표결 요약 — 재산 블록과 동일한 구조(제목·수치·구성막대·범례)로 맞춘다 */
function voteCard(x){
  const v=x.vote||{};
  const tot=v.tot||0, ab=v.absent||0, cast=Math.max(0,tot-ab);
  const y=v.yes||0, nn=v.no||0, a2=v.abs||0;
  const sum=Math.max(1, y+nn+a2);
  const rk=(()=>{ const R=rankOf('part', x.party); return (R&&R.pos)? R.pos[x.cd] : null; })();
  const seg=(val,cls,nm)=> val>0 ? `<i class="vx-${cls}" style="width:${(val/sum*100).toFixed(1)}%"
      data-tip="${nm} ${nf(val)}건 · 던진 표의 ${Math.round(val/sum*100)}%"></i>` : '';
  if(!tot) return `<div class="acard vcard none" data-tip="재보궐·승계로 새로 합류한 의원이에요. 아직 참여한 기명표결이 없어서 기록이 비어 있어요. 첫 표결부터 자동으로 쌓여요.">
      <span class="al">표결</span><b class="nvnote">이제 막 등원했어요 · 집계 전</b></div>`;
  return `<div class="acard vcard"
      data-tip="표결 참여율 ${v.part??0}% · 전체 ${nf(tot)}건 중 ${nf(cast)}건 참여 · 찬성 ${nf(y)} 반대 ${nf(nn)} 기권 ${nf(a2)}">
    <div class="arow1">
      <span class="al">표결 참여</span>
      <b>${v.part??'–'}%</b>
      <em class="nt2">${nf(cast)}/${nf(tot)}</em>
      ${rk?`<span class="arank">${rk}<i>위</i></span>`:''}
    </div>
    <div class="amix">${seg(y,'y','찬성')}${seg(nn,'n','반대')}${seg(a2,'a','기권')}</div>
    <div class="aleg">
      ${y>0?`<span><i class="vx-y"></i>찬성 ${Math.round(y/sum*100)}%</span>`:''}
      ${nn>0?`<span><i class="vx-n"></i>반대 ${Math.round(nn/sum*100)}%</span>`:''}
      ${a2>0?`<span><i class="vx-a"></i>기권 ${Math.round(a2/sum*100)}%</span>`:''}
    </div>
  </div>`;
}
/* 카드용 재산 요약 — 총액 · 순위 · 구성 비율 막대 */
function assetCard(x){
  const a=(D.assets||{})[x.cd];
  if(!a){
    if(!(x.vote&&x.vote.tot)) return `<div class="acard none" data-tip="재산 공개는 1년에 한 번, 3월에 이뤄져요. 새로 합류한 의원은 다음 공개 때 실려요.">
      <span class="al">재산</span><b class="nvnote">다음 공개 때 실려요</b></div>`;
    return `<div class="acard none" data-tip="재산 신고 자료가 없어요 (장관 겸직 등은 정부공직자윤리위원회 공개)">
    <span class="al">재산</span><b>–</b></div>`;
  }
  const n=Object.keys(D.assets||{}).length;
  const pctTop=Math.max(1,Math.round(a.rk/n*100));
  const diff=a.t-a.p;
  const C=D.acats||[];
  // 구성: 부동산(토지+건물) / 금융(예금·증권·채권·현금) / 기타
  let re=0, fi=0, et=0;
  (a.c||[]).forEach(pr=>{ const k=C[pr[0]], v=pr[1];
    if(k==='채무'||k==='고지거부') return;
    if(k==='토지'||k==='건물') re+=v;
    else if(k==='예금'||k==='증권'||k==='채권'||k==='현금'||k==='정치자금 계좌') fi+=v;
    else et+=v; });
  const sum=Math.max(1, re+fi+et);
  const seg=(v,cls,nm)=> v>0 ? `<i class="ax-${cls}" style="width:${(v/sum*100).toFixed(1)}%"
      data-tip="${nm} ${AMAN(v)} · 자산의 ${Math.round(v/sum*100)}%"></i>` : '';
  return `<div class="acard"
      data-tip="신고 재산 ${AMAN(a.t)} · ${n}명 중 ${a.rk}위(상위 ${pctTop}%) · 1년 새 ${diff>=0?'+':''}${AMAN(diff)} · 부동산 ${AMAN(re)} / 금융 ${AMAN(fi)} / 기타 ${AMAN(et)}">
    <div class="arow1">
      <span class="al">재산</span>
      <b>${AMAN(a.t)}</b>
      <em class="${diff>=0?'up':'dn'}">${diff>=0?'▲':'▼'}${AMAN(Math.abs(diff))}</em>
      <span class="arank">${a.rk}<i>위</i></span>
    </div>
    <div class="amix">${seg(re,'re','부동산')}${seg(fi,'fi','금융')}${seg(et,'et','기타')}</div>
    <div class="aleg">
      ${re>0?`<span><i class="ax-re"></i>부동산 ${Math.round(re/sum*100)}%</span>`:''}
      ${fi>0?`<span><i class="ax-fi"></i>금융 ${Math.round(fi/sum*100)}%</span>`:''}
      ${et>0?`<span><i class="ax-et"></i>기타 ${Math.round(et/sum*100)}%</span>`:''}
    </div>
  </div>`;
}

// ── detail sheet
const sheet = document.getElementById('sheet'), scrim = document.getElementById('scrim');
document.getElementById('grid').addEventListener('click',e=>{
  const st = e.target.closest('.starbtn');
  if(st){ e.stopPropagation(); toggleStar(st.dataset.cd); return; }
  const cc = e.target.closest('[data-cmp]');
  if(cc){ e.stopPropagation(); try{ cmpToggle(cc.dataset.cmp); }catch(e2){} return; }
  const c = e.target.closest('.card'); if(!c) return;
  open(D.members.find(x=>x.cd===c.dataset.cd));
});
/* 별표·비교를 키보드로도 누를 수 있게 */
document.getElementById('grid').addEventListener('keydown',e=>{
  const st=e.target.closest && e.target.closest('.starbtn');
  if(st && (e.key==='Enter'||e.key===' ')){
    e.preventDefault(); e.stopPropagation(); toggleStar(st.dataset.cd);
    st.setAttribute('aria-label', st.getAttribute('aria-label').replace(/추가$|해제$/, isStar(st.dataset.cd)?'해제':'추가'));
  }
  const cc=e.target.closest && e.target.closest('[data-cmp]');
  if(cc && (e.key==='Enter'||e.key===' ')){
    e.preventDefault(); e.stopPropagation(); try{ cmpToggle(cc.dataset.cmp); }catch(e2){} }
});
scrim.addEventListener('click', close);
document.addEventListener('keydown',e=>{ if(e.key==='Escape') close(); });
function close(){ sheet.classList.remove('on'); scrim.classList.remove('on'); document.body.style.overflow='';
  CURM=null; pushRoute(); }
/* 시트가 닫히는 프레임에는 scrollTo가 무효가 되는 브라우저가 있다 → 몇 번 재시도 */
function topAfterSheet(){
  window.scrollTo({top:0});
  requestAnimationFrame(()=>window.scrollTo({top:0}));
  setTimeout(()=>window.scrollTo({top:0}), 140);
}

const VT = {'찬성':'y','반대':'n','기권':'a','불참':'x'};
function sessOfDate(d){ const s=(D.sessions||[]).find(x=>d>=x.bg && d<=x.ed); return s? s.sess+(s.type==='정기회'?'(정기)':'') : ''; }
function newsLink(t){
  const kw = String(t).replace(/\(.*?\)/g,'').replace(/일부개정법률안|전부개정법률안|제정법률안|법률안|폐지법률안/g,'').trim();
  return 'https://search.naver.com/search.naver?where=news&query='+encodeURIComponent(kw);
}

function open(x){
  const bills = x.bills.map((b,i)=>`
    <div class="item">
      <div class="t" data-x="b${i}"><span>${esc(b.name)}</span></div>
      <div class="m"><span>${esc(b.dt||'')}</span><span>${esc(b.cmt||'소관위 미정')}</span>
        ${b.proc?`<span class="tag ${/가결|반영/.test(b.proc)?'ok':''}">${/가결|반영/.test(b.proc)?'':/폐기|철회/.test(b.proc)?'':''} ${esc(b.proc)}</span>`:'<span class="tag">계류</span>'}</div>
      <div class="expand" id="b${i}">
        ${D.sums[b.no] ? esc(D.sums[b.no]) : '<span style="color:var(--ink3)">제안이유가 제공되지 않는 법안입니다.</span>'}
        <div class="lk">
          ${b.link?`<a href="${esc(b.link)}" target="_blank" rel="noopener">의안 원문 보기</a>`:''}
          <a href="${newsLink(b.name)}" target="_blank" rel="noopener">관련 뉴스 검색</a>
        </div>
      </div>
    </div>`).join('');

  const votes = x.votes.map((v,i)=>`
    <div class="item">
      <div class="t" data-x="v${i}"><span class="tag ${VT[v.r]||''}">${ACTICO[v.r]||''} ${esc(v.r)}</span><span>${esc(v.name)}</span></div>
      <div class="m"><span>${esc(v.dt||'')}</span><span>${esc(sessOfDate(v.dt))}</span><span>${esc(v.kind||'')}</span>
        <span>본회의 찬성 ${nf(v.y)} · 반대 ${nf(v.n)}</span></div>
      <div class="expand" id="v${i}">
        이 의안에서 <b>${esc(x.name)}</b> 의원은 <b>${esc(v.r)}</b> 표를 던졌어요
        본회의 전체 표결은 찬성 ${nf(v.y)}표, 반대 ${nf(v.n)}표였어요
        <div class="lk">
          ${v.link?`<a href="${esc(v.link)}" target="_blank" rel="noopener">의안 상세</a>`:''}
          <a href="${newsLink(v.name)}" target="_blank" rel="noopener">관련 뉴스 검색</a>
        </div>
      </div>
    </div>`).join('');

  const sp = x.speech.recent.map(s=>`
    <div class="item">
      <div class="t"><span>${esc(s.t)}</span></div>
      <div class="m"><span>${esc(s.d)}</span>
        <a href="${esc(s.u)}" target="_blank" rel="noopener" class="tag">발언 영상 보기</a></div>
    </div>`).join('');

  sheet.innerHTML = `
  <div class="sh-hd" style="--pc:${pc(x.party)}">
    <div class="row">
      ${avatar(x,'phL')}
      <div>
        <h2>${esc(x.name)}<span class="pill">${esc(x.party)}</span></h2>
        <div class="sub" title="${esc(x.cmts||x.cmt||'')}">${esc(x.reele||'')} · ${esc((x.cmt||'위원회 미배정').length>28?(x.cmt.slice(0,28)+'…'):(x.cmt||'위원회 미배정'))}</div>
        <div class="dg"><b>${esc(x.dist||'비례대표')}</b><s>${esc(x.distType||'')}</s></div>
      </div>
      <button class="cmpadd" data-cd="${x.cd}" title="비교 목록에 담기 (최대 3명)">비교</button>
      <button class="close" aria-label="닫기">&times;</button>
      <span class="starbtn ${isStar(x.cd)?'on':''}" data-cd="${x.cd}" role="button" tabindex="0"
        style="position:static;font-size:1.1875rem;margin-left:6px;cursor:pointer" aria-label="${esc(x.name)} 관심 의원 등록/해제">★</span>
    </div>
    <div class="kpis">
      <div class="kpi"
        data-tip="기명표결 ${nf(x.vote.tot)}건 중 ${nf(x.vote.tot-x.vote.absent)}건 참여">
        <b>${x.vote.part??'–'}%</b><i><svg class="ic-sm" aria-hidden="true"><use href="#i-vote"/></svg>표결 참여율</i>
        <small>${nf(x.vote.tot-x.vote.absent)} / ${nf(x.vote.tot)}건</small></div>
      <div class="kpi"
        data-tip="대표발의 ${nf(x.prop.n)}건 중 ${nf(x.prop.pass)}건 성사 (${x.prop.rate??0}%)">
        <b>${nf(x.prop.n)}</b><i><svg class="ic-sm" aria-hidden="true"><use href="#i-pen"/></svg>대표발의</i>
        <small>성사 ${nf(x.prop.pass)}건 · ${x.prop.rate??0}%</small></div>
      <div class="kpi"
        data-tip="쟁점 ${nf(x.cdefect?.n??0)}건 중 ${nf(x.cdefect?.d??0)}건에서 당론과 다르게 투표">
        <b>${x.cdefect?.rate??0}%</b><i><svg class="ic-sm" aria-hidden="true"><use href="#i-split"/></svg>당론 이탈률</i>
        <small>쟁점 ${nf(x.cdefect?.d??0)} / ${nf(x.cdefect?.n??0)}건</small></div>
      <div class="kpi"
        data-tip="국정감사 회의록에서 집계한 발언 구간 ${nf(x.speech.n)}건 · 상한 없는 전체 집계 (발언 탭 수록문과는 다른 수치)">
        <b>${nf(x.speech.n)}</b><i><svg class="ic-sm" aria-hidden="true"><use href="#i-quote"/></svg>발언 구간</i>
        <small>회의록 전체 집계</small></div>
    </div>
    <div class="tabs" role="tablist">
      <button class="tab" role="tab" aria-selected="true" data-t="p"><svg class="ic" aria-hidden="true"><use href="#i-chart"/></svg>프로필</button>
      <button class="tab" role="tab" aria-selected="false" data-t="b"><svg class="ic" aria-hidden="true"><use href="#i-brief"/></svg>의정활동 <em style="font-style:normal;opacity:.5">${x.bills.length+x.votes.length}</em></button>
      <button class="tab" role="tab" aria-selected="false" data-t="s"><svg class="ic" aria-hidden="true"><use href="#i-quote"/></svg>발언</button>
      <button class="tab" role="tab" aria-selected="false" data-t="w"><svg class="ic" aria-hidden="true"><use href="#i-money"/></svg>재산</button>
      <button class="tab" role="tab" aria-selected="false" data-t="n"><svg class="ic" aria-hidden="true"><use href="#i-news"/></svg>뉴스</button>
      <button class="tab" role="tab" aria-selected="false" data-t="e"><svg class="ic" aria-hidden="true"><use href="#i-inbox"/></svg>청원·겸직 <em style="font-style:normal;opacity:.5">${(x.pttN||0)+(x.occN||0)}</em></button>
      <button class="tab" role="tab" aria-selected="false" data-t="c"><svg class="ic" aria-hidden="true"><use href="#i-cal"/></svg>일정</button>
    </div>
  </div>
  <div class="sh-bd">
    <section class="sec" data-p="p">
      ${profileCharts(x)}
      <details class="fold"><summary>기본 정보와 약력 보기</summary>
      <div class="meta" style="margin-top:14px">
        <div><span>지역구</span>${esc(x.dist||'비례대표')}</div>
        <div><span>선거구 구분</span>${esc(x.distType||'-')}</div>
        <div><span>소속 위원회</span>${esc(x.cmts||'-')}</div>
        <div><span>당선</span>${esc(x.units||'-')}</div>
        <div><span>출생연도</span>${esc(x.bth? String(x.bth).slice(0,4)+'년' : '-')}</div>
        <div><span>사무실</span>${esc(x.addr||'-')}</div>
        <div><span>연락처</span>${esc(x.tel||'-')}</div>
        <div><span>이메일</span>${x.email?`<a href="mailto:${esc(x.email)}">${esc(x.email)}</a>`:'-'}</div>
        <div><span>홈페이지</span>${x.home?`<a href="${esc(x.home)}" target="_blank" rel="noopener">바로가기</a>`:'-'}</div>
      </div>
      <ul class="bio">${x.bio.map(b=>`<li class="${b.h?'h':''}">${esc(b.t)}</li>`).join('') || '<li>등록된 약력이 없어요</li>'}</ul>
      <a class="wikilink" style="margin:14px 0 4px" href="https://namu.wiki/w/${encodeURIComponent(x.name)}" target="_blank" rel="noopener">나무위키에서 더보기 →</a>
      </details>
    </section>
    <section class="sec" data-p="b" hidden>
      ${billCharts(x)}
      ${voteCharts(x)}
      <div class="note">발의와 표결을 시간순으로 합쳤어요 · 제목을 누르면 쉬운 설명이 열려요 · 발의는 <b>최근 25건까지</b>만 실려요(총 건수는 위 숫자)</div>
      <div class="sesf" id="actf">
        <button data-f="">전체</button>
        <button data-f="발의"><i></i>발의 최근 ${x.bills.length}</button>
        ${(()=>{const fv=fullVotesOf(x.cd);
          return `<button data-f="찬성"><i></i>찬성 ${nf(fv.filter(v=>v.r==='찬성').length)}</button>
        <button data-f="반대"><i></i>반대 ${nf(fv.filter(v=>v.r==='반대').length)}</button>
        <button data-f="기권"><i></i>기권 ${nf(fv.filter(v=>v.r==='기권').length)}</button>`;})()}
      </div>
      <div id="actsbox">${mergedActs(x)}</div>
    </section>
    <section class="sec" data-p="w" hidden>${renderAssets(x)}</section>
    <section class="sec" data-p="n" hidden>${renderNews(x)}</section>
    <section class="sec" data-p="e" hidden>
      <div class="note">청원 소개 = 시민 청원을 국회로 들여보낸 기록 · 겸직 = 이해충돌 판단 자료</div>
      <h4><svg class="ic" aria-hidden="true"><use href="#i-bill"/></svg>청원 소개 ${nf(x.pttN||0)}건</h4>
      ${(x.ptt||[]).length? `<table class="tblx"><thead><tr><th>청원</th><th>접수</th><th>소관위</th><th>결과</th></tr></thead><tbody>`+
        x.ptt.map(t=>`<tr><td>${t.u?`<a href="${esc(t.u)}" target="_blank" rel="noopener">${esc(t.t)}</a>`:esc(t.t)}</td>
          <td>${esc(t.d||'')}</td><td>${esc(t.c||'')}</td><td>${esc(t.r||'심사중')}</td></tr>`).join('')+
        `</tbody></table>${x.pttN>10?`<div class="note" style="margin-top:9px">최근 10건만 표시합니다.</div>`:''}`
        : '<div class="empty">소개한 청원이 없어요</div>'}
      <h4 style="margin-top:22px">겸직 결정 ${nf(x.occN||0)}건</h4>
      ${(x.occ||[]).length? `<table class="tblx"><thead><tr><th>겸직기관</th><th>직위</th><th>공개일</th><th>결정</th></tr></thead><tbody>`+
        x.occ.map(o=>`<tr><td>${esc(o.inst)}</td><td>${esc(o.pos||'')}</td><td>${esc(o.day||'')}</td><td>${esc(o.dec||'')}</td></tr>`).join('')+
        `</tbody></table>` : '<div class="empty">겸직 내역이 없어요</div>'}
    </section>
    <section class="sec" data-p="s" hidden>
      <div class="note">국정감사 회의록 발언 구간 ${nf(x.speech.n)}건 · 상한 없는 전체 집계</div>
      ${(()=>{ const my=(D.quotes||[]).filter(z=>z.c===x.cd);
        return my.length? `<h4 style="margin-top:4px">국정감사 발언 원문 ${nf(my.length)}건
          <a href="javascript:;" data-qmem="${esc(x.name)}" style="font-size:0.78125rem;font-weight:600;margin-left:8px;color:var(--accent)">발언 모음에서 보기 →</a></h4>
          <div class="cs" style="margin:-4px 0 8px">발언을 누르면 앞뒤 맥락이 열려요</div>
          <div class="qtgrid" style="margin-bottom:20px">${my.slice(0,12).map((z,zi)=>`
            <div class="qtc qclick" style="--pc4:${pc(x.party)}" data-qx="${zi}" data-qid="${esc(z.d+'|'+z.s.slice(0,24))}">
              <div class="qs2">${esc(z.s)}</div>
              <div class="qtg">${z.t.map(t=>`<span data-qtag="${esc(t)}" style="cursor:pointer">#${esc(t)}</span>`).join('')}</div>
              <div class="qmt" style="font-size:0.65625rem;color:var(--ink3)">${esc(z.m)}위원회 · ${esc(z.d)}</div>
              <div class="qctx" id="qx${zi}" hidden></div>
            </div>`).join('')}</div>` : ''; })()}
      <h4>회의별 발언 영상</h4>
      ${sp || '<div class="empty">발언 기록이 없어요</div>'}
    </section>
    <section class="sec" data-p="c" hidden>
      <div class="note">국회 공식 일정 기준 · 수집 시점 기록이에요</div>
      <div id="calbox"></div>
    </section>
  </div>`;

  sheet.querySelector('.close').onclick = close;
  sheet.querySelectorAll('.starbtn').forEach(b=>b.onclick=()=>toggleStar(b.dataset.cd));
  sheet.querySelectorAll('.tab').forEach(t=>t.onclick=()=>{
    sheet.querySelectorAll('.tab').forEach(z=>z.setAttribute('aria-selected', z===t));
    sheet.querySelectorAll('.sec').forEach(s=>s.hidden = s.dataset.p!==t.dataset.t);
    // 모바일은 보던 위치 유지(강제 상단 이동 금지). 데스크톱만 헤더 아래로 정렬.
    if(innerWidth>640) sheet.scrollTop = sheet.querySelector('.sh-hd').offsetHeight;
    pushRoute(true);
  });
  sheet.querySelectorAll('.t[data-x]').forEach(t=>t.onclick=()=>{
    const e = sheet.querySelector('#'+t.dataset.x); if(e) e.classList.toggle('on');
  });
  sheet.classList.add('on'); scrim.classList.add('on');
  // 시트 내용·이미지가 자리 잡은 뒤라야 헤더 높이가 확정된다
  requestAnimationFrame(()=>{ try{ shOffset(); }catch(e){} });
  setTimeout(()=>{ try{ shOffset(); }catch(e){} }, 260);
  document.body.style.overflow='hidden'; sheet.scrollTop=0;
  pushRoute();
}

render();

/* ===== V3: 정보 다이어트 로직 ===== */
// 마스트헤드 한 줄 요약
(function(){ const m=D.meta;
  const el=document.getElementById('mastsub');
  if(el) el.innerHTML=`제22대 국회 ${nf(m.nMember)}명`;
})();
// 필터 접기
(function(){ const b=document.getElementById('fBtn'), r=document.getElementById('fRow');
  if(!b||!r) return;
  b.onclick=()=>{ const on=r.hidden; r.hidden=!on; b.setAttribute('aria-expanded', String(on)); };
})();
// 밀도 토글 (의원 뷰 안에서만 의미)
(function(){ const d=document.getElementById('dens'); if(!d) return;
  d.onclick=e=>{ const b=e.target.closest('button'); if(!b) return;
    viewMode=b.dataset.d;
    [...d.querySelectorAll('button')].forEach(z=>z.setAttribute('aria-pressed', z.dataset.d===viewMode));
    [...document.querySelectorAll('#view button')].forEach(z=>z.setAttribute('aria-pressed', z.dataset.v==='card'));
    render(); };
})();
// 내비 높이를 CSS 변수로 → 가나다 색인이 내비 바로 아래에 붙도록
(function(){
  const nb=document.querySelector('.navbar'); if(!nb) return;
  const setH=()=>document.documentElement.style.setProperty('--navh', Math.round(nb.getBoundingClientRect().height)+'px');
  setH(); addEventListener('resize', setH);
  if(window.ResizeObserver) new ResizeObserver(setH).observe(nb);
})();
// 정렬 컨트롤을 필터 패널 밖으로 옮겨 항상 보이게 한다
(function(){
  const sel=document.getElementById('sort'), w=document.getElementById('sortWrap');
  if(sel&&w){ w.appendChild(sel); buildSortUI(); }
})();
// 뷰 전환 시 밀도 토글·필터 노출 관리 + 퀴즈 히어로
const _render0=render;
render=function(){
  _render0();
  const isMember = viewMode==='card'||viewMode==='compact';
  const d=document.getElementById('dens'); if(d) d.style.display=isMember?'':'none';
  // 발언 전용 컨트롤(정렬·출처)은 발언 화면에서만 노출
  (function(){ const ctl=document.getElementById('qtCtl'), mt=document.getElementById('qtMeta');
    if(viewMode!=='qt'){
      if(ctl){ ctl.hidden=true; ctl.innerHTML=''; }
      if(mt){ mt.hidden=true; mt.innerHTML=''; }
    }
    // 발언 화면의 총건수는 출처 필터의 '전체'와 겹치므로 감춘다
    const c=document.getElementById('count');
    if(c) c.style.display = (viewMode==='qt') ? 'none' : '';
  })();
  // 검색창은 현재 탭의 콘텐츠를 검색한다 (이전에는 어느 탭에서든 의원만 걸러졌다)
  (function(){
    const qi=document.getElementById('q'); if(!qi) return;
    const PH={ card:'의원 이름·지역구·위원회 검색',
               compact:'의원 이름·지역구·위원회 검색',
               map:'지역구·의원 이름 검색',
               sess:'법안 이름 검색',
               qt:'발언 내용·의원 이름 검색',
               my:'관심 의원 검색',
               quiz:'이 화면에서는 검색을 쓰지 않아요' };
    qi.placeholder = PH[viewMode] || PH.card;
    qi.disabled = (viewMode==='quiz');
    qi.style.opacity = qi.disabled? '0.45' : '';
  })();
  // 필터는 항상 노출한다. 대신 현재 탭에서 의미 없는 컨트롤만 비활성화한다.
  const fb=document.getElementById('fBtn'); if(fb) fb.style.display='';
  (function(){
    const useSido = isMember || viewMode==='map' || viewMode==='my';
    const useParty= isMember || viewMode==='map' || viewMode==='qt' || viewMode==='my' || viewMode==='sess';
    const useSort = isMember || viewMode==='my';
    const sd=document.getElementById('sido'), st=document.getElementById('sort'),
          pc2=document.getElementById('parties'), fh=document.getElementById('fHint');
    const dim=(el,on,why)=>{ if(!el) return;
      el.style.opacity = on?'':'0.35';
      el.style.pointerEvents = on?'':'none';
      el.title = on?'':why; };
    dim(sd,useSido,'이 화면에서는 지역 필터를 쓰지 않아요');
    dim(pc2,useParty,'이 화면에서는 정당 필터를 쓰지 않아요');
    dim(st,useSort,'이 화면에서는 정렬을 쓰지 않아요');
    if(fh){ const off=[!useSido&&'지역',!useParty&&'정당',!useSort&&'정렬'].filter(Boolean);
      fh.textContent = off.length? '이 화면에서는 '+off.join('·')+' 조건이 적용되지 않아요'
        : '정당을 고르면 그 당 의원 이름만 보여요';
      fh.style.display = off.length? '' : 'none'; }
  })();
  if(isMember){
    const g=document.getElementById('grid');
    if(g && !document.getElementById('heroq')){
      const h=document.createElement('div');
      h.className='heroq'; h.id='heroq';
      h.innerHTML=`<div class="ht"><b>나와 가장 비슷한 국회의원 찾기</b>
        <span>5문항 · 15초</span></div><span class="ha">→</span>`;
      h.onclick=()=>{ viewMode='quiz';
        [...document.querySelectorAll('#view button')].forEach(z=>
          z.setAttribute('aria-pressed', z.dataset.v==='quiz'));
        render();
        // 모바일에서는 첫 문항 진행 바가 화면 맨 위에 오도록 맞춘다
        // 렌더 직후엔 smooth 스크롤이 취소된다 → 즉시 이동으로, 레이아웃 확정 뒤 한 번 더
        requestAnimationFrame(quizScroll); setTimeout(quizScroll,120); setTimeout(quizScroll,320);
        pushRoute(); };
      // 배치는 아래 insBox 생성 뒤에 함께 처리한다
      window.__heroEl = h;
    }
    // 흥미로운 발견 — 검색창 위에 배치 (한 번만)
    if(!document.getElementById('insBox')){
      const tb=document.querySelector('.toolbar');
      if(tb){
        const ib=document.createElement('div');
        ib.id='insBox';
        ib.innerHTML = insightCards();
        tb.parentNode.insertBefore(ib, tb);
      }
    }
    // 히어로는 인사이트 바로 아래
    const hero=window.__heroEl || document.getElementById('heroq');
    const ib2=document.getElementById('insBox');
    if(hero && ib2 && hero.previousElementSibling!==ib2){
      ib2.parentNode.insertBefore(hero, ib2.nextSibling);
    }
  }
  // 모바일은 화면이 좁아 요약 카드가 본 내용을 밀어낸다 → 의원 탭에서만 보여준다.
  // (isMember 블록 밖이어야 다른 탭에서도 실행된다)
  insVis();
};
function insVis(){
  const ib=document.getElementById('insBox');
  const hero=window.__heroEl||document.getElementById('heroq');
  const hide = innerWidth<=640 && viewMode!=='card';
  if(ib) ib.hidden=hide;
  if(hero) hero.hidden=hide;
}
addEventListener('resize', insVis);
// 발의 관련 차트 → 법안 탭 / 표결 차트 → 표결 탭
function billCharts(x){
  const PD=x.propD||{res:{},cmt:{},yr:{}};
  const RES_C={'가결':'var(--pos)','대안반영':'#5b8fd6','계류':'var(--neu)','폐기·철회':'var(--neg)','기타':'var(--absent)'};
  const resItems=Object.entries(PD.res).sort((a,b)=>b[1]-a[1]).map(([k,v])=>({k,v,c:RES_C[k]||'var(--absent)'}));
  const cmtItems=Object.entries(PD.cmt).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v])=>({k:k.replace('위원회',''),v}));
  if(!resItems.length) return '';
  return `<div class="chartgrid" style="margin-bottom:12px">
    <div class="chart"><h5><svg class="ic" aria-hidden="true"><use href="#i-scale"/></svg>처리 결과</h5><div class="cs">눌러서 그 법안들만 봐요</div>${donut(resItems,52,'bf')}</div>
    <div class="chart"><h5><svg class="ic" aria-hidden="true"><use href="#i-home"/></svg>어느 위원회 법안일까</h5><div class="cs">눌러서 그 위원회 법안만 봐요</div>${hbar(cmtItems, pc(x.party))}</div>
  </div>`;
}
function voteCharts(x){
  const sv=x.sessVote||{}; const list=(D.sessions||[]).filter(z=>z.n>0);
  const tot=z=>{const o=sv[z.sess]||{};return (o.y||0)+(o.n||0)+(o.a||0)+(o.x||0);};
  const mx=Math.max(0,...list.map(tot));
  const mxs=list.find(z=>tot(z)===mx);
  const first=list[0], last=list[list.length-1];
  return `<div class="chart wide" style="margin-bottom:12px">
    <h5><svg class="ic" aria-hidden="true"><use href="#i-cal"/></svg>회기마다 얼마나 투표했을까</h5>
    <div class="cs">막대 하나가 회기 하나예요. 왼쪽이 과거, 오른쪽이 최근이에요.</div>
    <div class="axleg">
      <span><u style="background:var(--pos)"></u>70% 이상</span>
      <span><u style="background:var(--neu)"></u>40~70%</span>
      <span><u style="background:var(--neg)"></u>40% 미만</span>
      <span class="axmax">막대 높이 = 참여율 · 가로축 = 회기 번호(${first?esc(first.bg.slice(0,7).replace('-','.')):''} → ${last?esc(last.bg.slice(0,7).replace('-','.')):''})</span>
    </div>
    ${sessInsight(sv, D.sessions||[], x.name)}
    ${sessBars(sv, D.sessions||[])}

  </div>`;
}
// 상세 요약 차트: 핵심 2개만
profileCharts=function(x){
  const C=x.cvote||{y:0,n:0,a:0,x:0}, RA=x.rankAll||{}, RP=x.rankParty||{};
  const totC=C.y+C.n+C.a+C.x;
  return `<div class="chartgrid">
    <div class="chart"><h5><svg class="ic" aria-hidden="true"><use href="#i-scale"/></svg>의견이 갈린 법안에서는</h5>
      <div class="cs">쟁점 ${nf(totC)}건에서의 선택 · <b>찬성·반대·기권을 누르면</b> 그 표결만 아래에 모아 봐요</div>
      ${totC? donut([{k:'찬성',v:C.y,c:'var(--pos)'},{k:'반대',v:C.n,c:'var(--neg)'},
               {k:'기권',v:C.a,c:'var(--neu)'},{k:'불참',v:C.x,c:'var(--absent)'}],52,'vf')
            : '<div class="empty">쟁점 표결 기록이 없어요</div>'}
      <div class="vfsum" id="vfSum" hidden></div></div>
    <div class="chart"><h5><svg class="ic" aria-hidden="true"><use href="#i-chart"/></svg>299명 중 어디쯤일까</h5>
      <div class="pctlg">
        <span><i class="f"></i>채워진 만큼이 <b>이 의원</b>의 위치예요</span>
        <span><i class="a"></i>세로선은 <b>299명 전체 평균</b>이에요</span>
      </div>
      ${pctBar('표결 참여율', x.vote.part??0, '%', RA.part??0, RP.part??0, x.party, 'part')}
      ${pctBar('대표발의', x.prop.n, '건', RA.prop??0, RP.prop??0, x.party, 'prop')}
      ${pctBar('발언', x.speech.n, '', RA.speech??0, RP.speech??0, x.party, 'speech')}
      ${pctBar('당론 이탈', x.cdefect?.rate??0, '%', RA.cdef??0, RP.cdef??0, x.party, 'defect')}
    </div>
  </div>`;
};

function yoify(t){
  return t
    .replace(/하려는 것임[.]?$/,'하려는 거예요').replace(/것임[.]?$/,'거예요')
    .replace(/하고자 함[.]?$/,'하려는 거예요').replace(/필요가 있음[.]?$/,'필요가 있어요')
    .replace(/있음[.]?$/,'있어요').replace(/없음[.]?$/,'없어요')
    .replace(/([했였았었])음[.]?$/,'$1어요')
    .replace(/함[.]?$/,'해요').replace(/됨[.]?$/,'돼요').replace(/임[.]?$/,'이에요');
}
/* ── 상호 링크 라우터 ── */
function gotoQuoteOne(key){
  const [d, head]=String(key).split('|');
  try{ close(); }catch(e){}
  viewMode='qt'; qtGrp=null; qtTag=null; qtKw=null; qtQ2=head; qtShown=60;
  [...document.querySelectorAll('#view button')].forEach(z=>z.setAttribute('aria-pressed', z.dataset.v==='qt'));
  render();
  setTimeout(()=>{
    const cards=[...document.querySelectorAll('.qtc')];
    const t=cards.find(c=>(c.querySelector('.qs2')||{}).textContent?.includes(head));
    if(t){ t.classList.add('qhit'); t.scrollIntoView({behavior:'smooth', block:'center'});
      setTimeout(()=>t.classList.remove('qhit'), 2600); }
  }, 220);
}
function gotoBillsByTag(ti){
  try{ close(); }catch(e){}
  curTag=ti; viewMode='sess'; sesFilter='all';
  [...document.querySelectorAll('#view button')].forEach(z=>z.setAttribute('aria-pressed', z.dataset.v==='sess'));
  render();
  setTimeout(()=>{ const m=document.getElementById('sesmain'); m&&m.scrollIntoView({behavior:'smooth',block:'start'}); },90);
}
function gotoBill(id){
  const b=(D.bills||[]).find(x=>x.id===id); if(!b) return;
  try{ close(); }catch(e){}
  viewMode='sess'; curSess=b.s; sesFilter='all';
  [...document.querySelectorAll('#view button')].forEach(z=>z.setAttribute('aria-pressed', z.dataset.v==='sess'));
  render();
  setTimeout(()=>{ toggleVotes(id);
    const el=document.querySelector(`.bt[data-b="${id}"]`);
    if(el) el.scrollIntoView({block:'center',behavior:'smooth'});
  },90);
}
function gotoQuotes(opt){
  try{ close(); }catch(e){}
  viewMode='qt'; qtGrp=null; qtTag=null; qtKw=null; qtShown=60;
  if(opt&&opt.tag){ qtTag=opt.tag;
    qtGrp=Object.keys(TAG_GROUPS).find(g=>(TAG_GROUPS[g]||[]).includes(opt.tag))||null; }
  qtQ2 = (opt&&opt.q) ? opt.q : '';
  [...document.querySelectorAll('#view button')].forEach(z=>z.setAttribute('aria-pressed', z.dataset.v==='qt'));
  render(); window.scrollTo({top:0});
}
document.addEventListener('click',e=>{
  const gb=e.target.closest('[data-gb]'); if(gb){ gotoBill(gb.dataset.gb); return; }
  const qt2=e.target.closest('[data-qtag]'); if(qt2){ gotoQuotes({tag:qt2.dataset.qtag}); return; }
  const ins=e.target.closest('[data-ins]');
  if(ins){ const v=ins.dataset.ins||'';
    if(v.startsWith('sort:')){ const sel=document.getElementById('sort');
      if(sel){ sel.value=v.slice(5); sel.dispatchEvent(new Event('change')); }
      window.scrollTo({top:0,behavior:'smooth'}); }
    else if(v.startsWith('open:')){ const m=(D.members||[]).find(x=>x.cd===v.slice(5)); if(m) open(m); }
    else if(v==='hot'){ try{ close(); }catch(_){}
      hotOnly=true; curTag=null; viewMode='sess';
      [...document.querySelectorAll('#view button')].forEach(z=>z.setAttribute('aria-pressed', z.dataset.v==='sess'));
      render(); window.scrollTo({top:0,behavior:'smooth'}); }
    return; }
  const lr=e.target.closest('.lrow[data-cd]');
  if(lr){ const m=(D.members||[]).find(x=>x.cd===lr.dataset.cd); if(m) open(m); return; }
  const bt2=e.target.closest('[data-btag]'); if(bt2){ gotoBillsByTag(+bt2.dataset.btag); return; }
  const ho=e.target.closest('[data-hot]'); if(ho){ try{ close(); }catch(_){}
    hotOnly=true; curTag=null; viewMode='sess';
    [...document.querySelectorAll('#view button')].forEach(z=>z.setAttribute('aria-pressed', z.dataset.v==='sess'));
    render(); window.scrollTo({top:0,behavior:'smooth'}); return; }
  const qm=e.target.closest('[data-qmem]'); if(qm){ gotoQuotes({q:qm.dataset.qmem}); return; }
});

/* ── 제안이유 미등록 의안: 메타데이터로 정직하게 설명 ── */

/* 연결어미로 끝난 절을 요체 종결어미로 닫기 */
function endYo(t){
  t=String(t).replace(/[\s,·.]+$/,'');
  // 말미의 법조문 인용 괄호 제거: (신설) (삭제) (제1조) (안 제12조) (안 법률 제…호 …)
  for(let i=0;i<3;i++){
    t=t.replace(/\s*\((?:[^()]*(?:제\s*\d+\s*[조항호]|신설|삭제|개정|안\s)[^()]*)\)\s*$/,'')
       .replace(/\s*\(\s*[^()]{0,12}등\s*\)\s*$/,'')
       .replace(/\s*\([^()]*$/,'')            // 열린 채 잘린 괄호
       .replace(/[\s,·.]+$/,'')
       .replace(/\s*[)\]」』”"']+\s*$/,'')     // 짝 없는 닫는 괄호·따옴표
       .replace(/[\s,·.]+$/,'');
  }
  if(/요$/.test(t)) return t;
  const mB=t.match(/([가-힣])니다$/);
  if(mB){ const c2=mB[1].charCodeAt(0)-0xAC00;
    if(c2>=0 && c2<11172 && c2%28===17){                  // 받침 'ㅂ'
      const stem=String.fromCharCode(0xAC00+(c2-17));
      const jung=Math.floor(c2/28)%21;
      const base=t.slice(0,-3)+stem;
      if(/되$/.test(base)) return base.slice(0,-1)+'돼요';
      if(/하$/.test(base)) return base.slice(0,-1)+'해요';
      return base+((jung===0||jung===8)?'아요':'어요');
    } }
  const R=[
    [/입니다$/,'이에요'], [/습니다$/,'어요'], [/ㅂ니다$/,'요'],
    [/고자\s*함$/,'하려는 거예요'], [/하고자\s*$/,'하려고 해요'],
    [/([가-힣])하는\s*한편$/,'$1해요'], [/([가-힣])되는\s*한편$/,'$1돼요'], [/는\s*한편$/,'요'],
    [/([가-힣])하도록\s*하고$/,'$1하도록 해요'], [/([가-힣])하도록\s*하며$/,'$1하도록 해요'],
    [/([가-힣])하고$/,'$1해요'], [/([가-힣])하며$/,'$1해요'],
    [/([가-힣])되고$/,'$1돼요'], [/([가-힣])되며$/,'$1돼요'],
    [/있으므로$/,'있어서요'], [/([가-힣])으므로$/,'$1어서요'],
    [/있으나$/,'있어요'], [/없으나$/,'없어요'], [/([가-힣])으나$/,'$1어요'],
    [/있으며$/,'있어요'], [/없으며$/,'없어요'], [/([가-힣])으며$/,'$1어요'],
    [/지\s*않음$/,'지 않아요'], [/지\s*못함$/,'지 못해요'],
    [/왔음$/,'왔어요'], [/였음$/,'였어요'], [/았음$/,'았어요'], [/었음$/,'었어요'],
    [/함$/,'해요'], [/됨$/,'돼요'], [/임$/,'이에요'], [/음$/,'어요'],
    [/있다$/,'있어요'], [/없다$/,'없어요'], [/한다$/,'해요'], [/된다$/,'돼요'],
    [/([가-힣])다$/,'$1어요'],
    [/([가-힣])하여$/,'$1해요'], [/([가-힣])여$/,'$1여요'],
    [/([가-힣])어$/,'$1어요'], [/([가-힣])아$/,'$1아요'],
    [/([가-힣])고$/,'$1고요'], [/([가-힣])서$/,'$1서요'],
    [/\.$/,'']
  ];
  for(const [re,to] of R){ if(re.test(t)) return t.replace(re,to); }
  const cc=t.charCodeAt(t.length-1)-0xAC00;
  if(cc>=0 && cc<11172 && cc%28===16){                 // 받침 'ㅁ' = 명사형
    const stem=String.fromCharCode(0xAC00+(cc-16));    // 받침 제거
    const jung=Math.floor(cc/28)%21;
    return t.slice(0,-1)+stem+((jung===0||jung===8)?'아요':'어요');
  }
  return /[가-힣]$/.test(t) ? t+'요' : t;
}

function srcLinks(q,m){
  const cmt=(q.m||'')+'위원회';
  const out=[];
  if(q.rid){
    // 회의록 뷰어 + 발언 문구 하이라이트(schwrd)
    // 뷰어 하이라이트는 단어 단위로만 매칭된다 → 가장 특징적인(긴) 단어 1개 사용
    const kw=((q.kw&&q.kw[0])||'') ||
      ((q.s||'').replace(/[^\uAC00-\uD7A3\s]/g,' ').split(/\s+/)
        .filter(w=>w.length>=3).sort((a,b)=>b.length-a.length)[0]||'');
    const vu=`https://record.assembly.go.kr/assembly/viewer/minutes/xml.do?id=${q.rid}&type=view`
      + (kw?`&schwrd=${encodeURIComponent(kw)}`:'');
    // 다운로드가 아니라 웹 뷰어 페이지로 연결 (download/pdf.do 는 Content-Disposition: attachment)
    out.push(`<a href="${vu}" target="_blank" rel="noopener"
      title="국회 회의록 뷰어에서 이 발언 보기 (새 탭)">회의록 원문 </a>`);
  }
  // 이 발언과 같은 주제·같은 시기의 실제 기사 (네이버 검색 API 수집분 우선)
  const arts = qNews(q);
  const nb = arts.length ? `<div class="qnews">
      <div class="qnh">관련 보도 <em>${arts[0][5]==='nv'?'같은 주제 · 발언일 ±10일':esc(m.name)+' 의원 · 발언 시기 기준'}</em></div>
      ${arts.map(a=>`<a href="${esc(a[3])}" target="_blank" rel="noopener">
        <span class="nt">${esc(a[1])}</span><span class="ns">${esc(a[2])} · ${esc(a[0])}</span></a>`).join('')}
    </div>` : '';
  return `<div class="qsrc" onclick="event.stopPropagation()">${out.join('')}</div>${nb}`;
}
/* ── 재산목록 ── */
var A_F = null;
function AMAN(v){                     // 입력 단위: 천원 (국회공보 원자료 기준)
  //  1억원 =       100,000 천원 (1e5)
  //  1조원 = 1,000,000,000 천원 (1e9)
  const a=Math.abs(v), s=v<0?'\u2212':'';   // U+2212 MINUS SIGN
  if(a>=1e9)  return s+(a/1e9).toFixed(2).replace(/\.?0+$/,'')+'조';
  if(a>=1e5){ const v2=(a/1e5).toFixed(a>=1e7?0:1).replace(/\.0$/,'');
    return s+v2.replace(/\B(?=(\d{3})+(?!\d))/,',')+'억'; }
  if(a>=1e4)  return s+(a/1e4).toFixed(1).replace(/\.0$/,'')+'천만';
  if(a>=10)   return s+(a/10).toFixed(a>=100?0:1).replace(/\.0$/,'')+'만';
  return s+nf(a)+'천원';
}
function assetOf(cd){ return (D.assets||{})[cd]||null; }
function assetRank(cd){
  const a=assetOf(cd); if(!a) return null;
  const n=Object.keys(D.assets||{}).length;
  return {rk:a.rk, n, pct:Math.max(1,Math.round(a.rk/n*100))};
}
function renderAssets(x){
  const a=assetOf(x.cd);
  if(!a) return '<div class="empty">재산 신고 자료가 없어요<div class="cs" style="margin-top:6px">장관 겸직 등으로 정부공직자윤리위원회가 따로 공개하는 경우예요</div></div>';
  const C=D.acats||[], R=D.arels||[];
  const rk=assetRank(x.cd);
  const diff=a.t-a.p;
  const catItems=a.c.map(p=>({k:C[p[0]], v:p[1]})).filter(z=>z.v>0 && z.k!=='채무' && z.k!=='고지거부').sort((z,y)=>y.v-z.v);
  const relItems=a.r.map(p=>({k:R[p[0]], v:p[1]})).filter(z=>z.v!==0).sort((z,y)=>Math.abs(y.v)-Math.abs(z.v));
  return '<div class="kpis" style="margin-bottom:14px">'
   + '<div class="kpi" data-tip="본인·배우자·직계존비속 합산, 채무를 뺀 순재산 · '+rk.n+'명 중 '+rk.rk+'위"><b>'+AMAN(a.t)+'</b><i><svg class="ic-sm" aria-hidden="true"><use href="#i-money"/></svg>신고 재산</i><small>'+rk.n+'명 중 '+rk.rk+'위 · 상위 '+rk.pct+'%</small></div>'
   + '<div class="kpi" data-tip="지난해 신고액 '+AMAN(a.p)+' → 올해 '+AMAN(a.t)+' ('+(diff>=0?'+':'')+AMAN(diff)+')"><b style="color:'+(diff>=0?'var(--pos)':'var(--neg)')+'">'+(diff>=0?'+':'')+AMAN(diff)+'</b><i><svg class="ic-sm" aria-hidden="true"><use href="#i-up"/></svg>1년 새 변동</i><small>종전 '+AMAN(a.p)+'</small></div>'
   + '<div class="kpi" data-tip="채무를 빼기 전 자산 총액 · 신고 항목 '+a.i.length+'건"><b>'+AMAN(a.a)+'</b><i><svg class="ic-sm" aria-hidden="true"><use href="#i-bank"/></svg>자산 합계</i><small>'+a.i.length+'개 항목</small></div>'
   + '<div class="kpi" data-af="채무" style="cursor:pointer" data-tip="채무 총액 '+AMAN(a.b)+' · 눌러서 채무 항목만 보기"><b style="color:var(--neg)">'+AMAN(a.b)+'</b><i><svg class="ic-sm" aria-hidden="true"><use href="#i-card"/></svg>채무</i><small>자산에서 빼고 계산해요</small></div>'
   + '</div>'
   + '<div class="chart"><h5><svg class="ic" aria-hidden="true"><use href="#i-brief"/></svg>무엇으로 갖고 있을까</h5><div class="cs">항목을 누르면 그 종류만 아래에서 봐요</div>'
   + hbar(catItems, pc(x.party), 'af', AMAN, k=>aIcon(k,'ic-a')) + '</div>'
   + '<div class="chart"><h5><svg class="ic" aria-hidden="true"><use href="#i-person"/></svg>누구 명의일까</h5>'
   + hbar(relItems.map(z=>({k:z.k, v:Math.abs(z.v)})), pc(x.party), 'af2', AMAN) + '</div>'
   + '<details class="fold"><summary>신고 내역 '+a.i.length+'건 자세히 보기 — 명의·기관·소재지 포함</summary>'
   + '<div class="chart"><h5><svg class="ic" aria-hidden="true"><use href="#i-bill"/></svg>신고 내역 '+a.i.length+'건</h5>'
   + '<div class="sesf" id="afilter"><button data-af="" aria-pressed="'+(!A_F)+'">전체</button>'
   + catItems.slice(0,7).map(z=>'<button data-af="'+esc(z.k)+'" aria-pressed="'+(A_F===z.k)+'">'+aIcon(z.k,'ic-a')+esc(z.k)+'</button>').join('')
   + (a.b>0?'<button data-af="채무" aria-pressed="'+(A_F==='채무')+'">'+aIcon('채무','ic-a')+'채무</button>':'')
   + '</div><div id="alist">'+assetRows(a,C,R)+'</div></div></details>'
   + '<div class="note" style="margin-top:12px">'+esc((D.ameta||{}).src||'')+' · '+esc((D.ameta||{}).by||'')
   + '<br>본인·배우자·직계존비속 재산을 모두 합한 금액이고, 채무는 빼서 계산했어요. 고지거부 항목은 금액이 공개되지 않아 합계에서 빠져요.'
   + '<br>가족 명의 항목과 소재지는 국회공보 공개 원문 그대로예요. 공적 감시 목적으로만 활용해 주세요.</div>';
}
/* 명세 문자열의 숫자에 단위를 붙인다.
   원자료 단위는 천원. 다만 카테고리마다 숫자의 뜻이 달라서 금액인 것만 변환한다.
     예금·정치자금·채무·채권·현금  → 잔액(천원)
     증권 "1,000주" / 가상자산 "10.5개" / 금 "375g" / 건물 "84.97㎡" → 수량·면적이라 건드리지 않음
   변환 대상: 소수점 없는 정수 + 뒤에 단위 문자가 붙지 않은 것 */
var MONEY_CATS = ['예금','정치자금 계좌','채무','채권','현금'];
/* 자산 종류별 픽토그램 (이모지 대신 인라인 SVG) */
var A_ICON = {
  '토지':'a-land', '건물':'a-bldg', '자동차·기타':'a-car', '예금':'a-depo',
  '정치자금 계좌':'a-fund', '채권':'a-bond', '채무':'a-debt', '고지거부':'a-hide',
  '현금':'a-cash', '증권':'a-stock', '가상자산':'a-coin', '골동품·예술품':'a-art',
  '회원권':'a-memb', '출자지분':'a-share', '금·백금':'a-gold', '보석':'a-gem',
  '지식재산권':'a-ip', '출연재산':'a-endow'
};
function aIcon(cat, cls){
  const id = A_ICON[cat] || 'a-cash';
  return '<svg class="'+(cls||'ic-a')+'" aria-hidden="true"><use href="#'+id+'"/></svg>';
}
function unitizeDetail(txt, cat){
  if(!txt || MONEY_CATS.indexOf(cat)<0) return esc(txt||'-');
  const out = String(txt).replace(
    /(?<![\d.])(\d{1,3}(?:,\d{3})+|\d+)(?![\d.])(?!\s*(?:㎡|cc|g|개|주|%|원|년|월|일|층|번지|캐럿|Cm|cm))/g,
    (m)=>{ const v=parseInt(m.replace(/,/g,''),10);
      if(!isFinite(v)) return m;
      if(v===0) return '0원';
      if(v<10) return m+'천원';                 // 1만원 미만은 원자료 그대로 + 단위
      return AMAN(v);
    });
  return esc(out);
}
function assetRows(a,C,R){
  let items=a.i.map(it=>({c:C[it[0]], r:R[it[1]], k:it[2], d:it[3], v:it[4], p:it[5], w:it[6]}));
  if(A_F) items=items.filter(z=>z.c===A_F);
  items.sort((z,y)=>Math.abs(y.v)-Math.abs(z.v));
  if(!items.length) return '<div class="empty">해당 항목이 없어요</div>';
  return items.slice(0,150).map(z=>{
    const d2=z.v-z.p;
    return '<div class="arow"><div class="at"><span class="tag acat">'+aIcon(z.c,'ic-a')+esc(z.c)+'</span>'
      + '<span class="ak">'+esc(z.k||'-')+'</span><span class="ar">'+esc(z.r)+'</span></div>'
      + '<div class="ad">'+unitizeDetail(z.d, z.c)+'</div>'
      + '<div class="av"><b>'+AMAN(z.v)+'</b>'
      + (d2?'<i class="'+(d2>0?'up':'dn')+'">'+(d2>0?'▲':'▼')+' '+AMAN(Math.abs(d2))+'</i>':'')
      + (z.w?'<em>'+esc(z.w)+'</em>':'') + '</div></div>';
  }).join('');
}

/* ── 뉴스 (최근 5년) ── */
var NEWS_Y = null;      // 선택 연도
function newsOf(cd){ return (D.news5||{})[cd]||[]; }
function renderNews(x){
  const all=newsOf(x.cd);
  if(!all.length) return '<div class="empty">수집된 기사가 없어요</div>';
  const byY={}; all.forEach(a=>{ const y=a[0].slice(0,4); (byY[y]=byY[y]||[]).push(a); });
  const years=Object.keys(byY).sort((a,b)=>b.localeCompare(a));
  const list = NEWS_Y ? (byY[NEWS_Y]||[]) : all;
  const mx=Math.max(...years.map(y=>byY[y].length));
  const srcCnt={}; all.forEach(a=>{ if(a[2]) srcCnt[a[2]]=(srcCnt[a[2]]||0)+1; });
  const topSrc=Object.entries(srcCnt).sort((a,b)=>b[1]-a[1]).slice(0,6);
  return '<div class="kpis" style="margin-bottom:14px">'
   + '<div class="kpi" data-tip="구글 뉴스에서 «'+esc(x.name)+' 의원»으로 검색한 최근 5년 기사"><b>'+nf(all.length)+'</b><i>기사</i><small>최근 5년</small></div>'
   + '<div class="kpi" data-tip="기사가 가장 많았던 해"><b>'+(years.length?years.reduce((p,c)=>byY[c].length>byY[p].length?c:p):'–')+'</b><i>최다 연도</i>'
   + '<small>'+(years.length?nf(byY[years.reduce((p,c)=>byY[c].length>byY[p].length?c:p)].length):0)+'건</small></div>'
   + '<div class="kpi" data-tip="기사를 낸 매체 수"><b>'+nf(Object.keys(srcCnt).length)+'</b><i>매체</i><small>중복 제외</small></div>'
   + '</div>'
   + '<div class="chart"><h5><svg class="ic" aria-hidden="true"><use href="#i-cal"/></svg>연도별 보도량</h5><div class="cs">막대를 누르면 그 해 기사만 봐요</div>'
   + '<div class="ybar">'+years.slice().reverse().map(y=>
       '<button class="yb'+(NEWS_Y===y?' on':'')+'" data-ny="'+y+'" data-tip="'+y+'년 '+nf(byY[y].length)+'건">'
       + '<i style="height:'+Math.max(6,byY[y].length/mx*54).toFixed(0)+'px"></i><span>'+y.slice(2)+'</span>'
       + '<em>'+byY[y].length+'</em></button>').join('')+'</div></div>'
   + (topSrc.length? '<div class="chart"><h5><svg class="ic" aria-hidden="true"><use href="#i-home"/></svg>어느 매체가 많이 다뤘나</h5>'
       + hbar(topSrc.map(s=>({k:s[0], v:s[1]})), pc(x.party)) + '</div>' : '')
   + '<div class="chart"><h5><svg class="ic" aria-hidden="true"><use href="#i-news"/></svg>기사 '+nf(list.length)+'건'+(NEWS_Y?' · '+NEWS_Y+'년':'')+'</h5>'
   + (NEWS_Y?'<div class="cs"><a href="javascript:;" id="nyAll">전체 기간 보기</a></div>':'')
   + '<div class="nlist">'+list.slice(0,120).map(a=>
       '<a class="nrow" href="'+esc(a[3])+'" target="_blank" rel="noopener" data-tip="'+esc(a[2]||'')+' · '+esc(a[0])+' · 눌러서 기사 보기">'
       + '<span class="nd">'+esc(a[0])+'</span><span class="nt2">'+esc(a[1])+'</span>'
       + '<span class="nsrc">'+esc(a[2]||'')+'</span></a>').join('')+'</div></div>'
   + '<div class="note" style="margin-top:12px">'+esc((D.n5meta||{}).src||'')+' · '+esc((D.n5meta||{}).span||'')
   + '<br>제목·매체·날짜·링크만 저장했어요. 본문은 각 매체 저작물이라 눌러서 원문에서 보세요.</div>';
}

/* 발언 앞뒤 맥락 */
function ctxHTML(z){
  const nameOf=cd=>{ const m=(D.members||[]).find(y=>y.cd===cd); return m?m.name:'다른 발언자'; };
  const parts=[];
  const x2=z.x||[];
  if(!x2.length) return '<div class="cs">앞뒤 발언 기록이 없어요</div>';
  // 원본 순서상 [이전, 다음] 순으로 저장돼 있다
  if(x2[0]) parts.push('<div class="cx before"><span class="cxl">앞</span><b>'+esc(nameOf(x2[0][0]))+'</b><p>'+esc(x2[0][1])+'</p></div>');
  parts.push('<div class="cx now"><span class="cxl">이 발언</span><b>'+esc(nameOf(z.c))+'</b><p>'+esc(z.s)+'</p></div>');
  if(x2[1]) parts.push('<div class="cx after"><span class="cxl">뒤</span><b>'+esc(nameOf(x2[1][0]))+'</b><p>'+esc(x2[1][1])+'</p></div>');
  const rid=z.rid? '<a class="cxgo" href="https://record.assembly.go.kr/assembly/viewer/minutes/xml.do?id='+z.rid+'&type=view'
      + (z.kw&&z.kw[0]?'&schwrd='+encodeURIComponent(z.kw[0]):'') + '" target="_blank" rel="noopener">회의록 전문에서 보기 </a>' : '';
  return parts.join('') + '<div class="cxbtns">'
    + '<a class="cxgo" href="javascript:;" data-qopen="'+esc(z.d+'|'+z.s.slice(0,24))+'">발언 모음에서 이 발언 보기 →</a>' + rid + '</div>';
}
function tagsOfBill(o){                       // 발의(no) / 표결(id) 양쪽 지원
  if(!o) return [];
  const byId = o.id ? (D.vtag||{})[o.id] : null;
  const no   = o.no || '';
  const byNo = no ? (D.btag||{})[no] : null;
  const ids  = byId || byNo || [];
  return ids.map(i=>({i, n:(D.tags||[])[i]})).filter(x=>x.n);
}
/* 주제 그룹별 색 — 분야가 한눈에 구분되도록 (채도는 낮게 유지) */
const TG_COLOR = {
  '경제':        ['#1F5D50','#E6F2EE'],
  '노동·복지':   ['#8A4B12','#FBEEE0'],
  '교육·미디어': ['#1F4B99','#E6ECF7'],
  '산업·인프라': ['#5B4396','#EEEAF7'],
  '외교·안보':   ['#7A2E3E','#F7E9EC'],
  '정치·사법':   ['#4A4A45','#EFEEEA']
};
const TG_DARK = {
  '경제':        ['#7FD4BC','#1B322C'],
  '노동·복지':   ['#E8B37A','#33261A'],
  '교육·미디어': ['#9CBEF0','#1C2739'],
  '산업·인프라': ['#B9A6E8','#26203A'],
  '외교·안보':   ['#E8A0AF','#331F25'],
  '정치·사법':   ['#C9C6BE','#2A2925']
};
function tagGroupOf(name){
  const G=D.tagGroups||{};
  for(const g in G){ if((G[g]||[]).includes(name)) return g; }
  return null;
}
function tagStyle(name){
  const g=tagGroupOf(name);
  const dark=document.documentElement.dataset.theme==='dark'
    || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  const pair=(dark?TG_DARK:TG_COLOR)[g];
  return pair? `color:${pair[0]};background:${pair[1]}` : '';
}
function tagChips(o){
  let ts=tagsOfBill(o); if(!ts.length) return '';
  ts=[...ts].sort((a,b)=>{
    const ra=TAG_RANK[a.n]!=null?TAG_RANK[a.n]:9999, rb=TAG_RANK[b.n]!=null?TAG_RANK[b.n]:9999;
    return ra!==rb ? ra-rb : String(a.n).localeCompare(b.n,'ko'); });
  return `<div class="btg">${ts.map(t=>`<span data-btag="${t.i}" style="${tagStyle(t.n)}"
    title="${esc(tagGroupOf(t.n)||'')} 분야">#${esc(t.n)}</span>`).join('')}</div>`;
}
function billsByTag(ti){
  const out=[], seen=new Set();
  (D.bills||[]).forEach(b=>{ if(((D.vtag||{})[b.id]||[]).includes(ti)){ out.push(b); seen.add(b.no); } });
  // 표결에 없는 발의 법안도 포함
  (D.members||[]).forEach(m=>(m.bills||[]).forEach(b=>{
    if(seen.has(b.no)) return;
    if(((D.btag||{})[b.no]||[]).includes(ti)){ seen.add(b.no);
      out.push({id:'', no:b.no, name:b.name, cmt:b.cmt, dt:b.dt, kind:'법률안', res:b.proc||'', prop:m.name}); }
  }));
  return out.sort((a,b)=>(b.dt||'').localeCompare(a.dt||''));
}
function billMeta(v){
  if(!v) return null;
  const id=(v.link||'').split('billId=')[1]||v.id||'';
  const b=id? (D.bills||[]).find(x=>x.id===id) : null;
  return b? Object.assign({}, v, b) : v;
}
function metaBullets(meta){
  if(!meta || !meta.name) return '';
  const raw=String(meta.name);
  // 제안자 괄호 제거 → 순수 의안명
  let nm=raw.replace(/\((?:[^()]*(?:위원장|의원|의장|정부|대통령)[^()]*)\)\s*$/,'').trim();
  const isAlt=/\(대안\)/.test(nm);
  const isCmt=/\(위원회안\)/.test(nm);
  nm=nm.replace(/\((?:대안|위원회안|수정안)\)/g,'').trim();
  const out=[];
  const lawOf=suf=>{ const i=nm.lastIndexOf(suf); return i>0? nm.slice(0,i).trim() : ''; };
  let law='', head='';
  if(/일부개정법률안$/.test(nm)){ law=lawOf(' 일부개정법률안')||lawOf('일부개정법률안');
    head='「'+law+'」의 일부 조항을 고치자는 법률 개정안이에요'; }
  else if(/전부개정법률안$/.test(nm)){ law=lawOf('전부개정법률안');
    head='「'+law+'」을 전면적으로 새로 쓰자는 법률 개정안이에요'; }
  else if(/폐지법률안$/.test(nm)){ law=lawOf('폐지법률안');
    head='「'+law+'」을 없애자는 법률 폐지안이에요'; }
  else if(/제정법률안$/.test(nm)){ law=lawOf('제정법률안');
    head='「'+law+'」이라는 법을 새로 만들자는 제정안이에요'; }
  else if(/법률안$/.test(nm)){ law=nm.replace(/안$/,'').trim();   // "…법률안" → "…법률"
    head='「'+law+'」이라는 법을 새로 만들자는 제정안이에요'; }
  else if(/규칙안$/.test(nm)){ head='국회가 스스로 지킬 운영 규칙을 정하거나 고치는 안건이에요'; }
  else if(/회기결정의\s*건/.test(nm)){ head='이번 국회를 며칠 동안 열지 정하는 안건이에요'; }
  else if(/구성의\s*건/.test(nm)){ head='특정 사안을 다룰 특별위원회를 새로 만들자는 안건이에요'; }
  else if(/(임명동의안|동의안)$/.test(nm)){ head='국회의 동의가 있어야 확정되는 사안에 찬반을 묻는 안건이에요'; }
  else if(/승인안$/.test(nm)){ head='이미 이뤄진 조치를 국회가 사후에 인정할지 묻는 안건이에요'; }
  else if(/(선출안|추천안)$/.test(nm)){ head='국회가 특정 자리에 앉힐 사람을 정하는 안건이에요'; }
  else if(/결의안$/.test(nm)){ head='법을 바꾸지는 않고, 이 사안에 대한 국회의 공식 입장을 밝히는 결의안이에요'; }
  else if(/(예산안|결산)/.test(nm)){ head='나라 살림에 쓸 돈을 정하거나 이미 쓴 돈을 확인하는 안건이에요'; }
  else if(/촉구/.test(nm)){ head='정부나 관계 기관에 특정 조치를 요구하는 안건이에요'; }
  else if(/국정조사계획서/.test(nm)) head='특정 사안을 국회가 직접 조사하겠다는 계획을 승인하는 안건이에요';
  else if(/특별검사|특검/.test(nm)) head='특정 사건을 수사할 특별검사를 두자는 안건이에요';
  else if(/청문회/.test(nm)) head='관련자를 국회에 불러 따져 묻는 청문회를 열자는 안건이에요';
  else if(/해임건의|탄핵/.test(nm)) head='공직자의 책임을 국회가 공식적으로 묻는 안건이에요';
  else if(/(계획서|보고서)/.test(nm)) head='정부나 위원회가 낸 계획·보고 내용을 국회가 확인하는 안건이에요';
  else head='국회 본회의에서 처리한 안건이에요';
  out.push(head);
  if(isAlt) out.push('여러 의원이 따로 낸 비슷한 법안을 위원회가 하나로 합쳐 다시 낸 대안이에요');
  else if(isCmt) out.push('의원 개인이 아니라 소관 위원회가 이름으로 낸 안건이에요');
  let cmtN=String(meta.cmt||'');
  if(cmtN.length>18){                       // 이름이 지나치게 긴 특위는 꼬리만
    const mm=cmtN.match(/(국정조사특별위원회|특별위원회|위원회)$/);
    cmtN = mm ? '해당 '+mm[1] : cmtN.slice(0,16)+'…';
  }
  if(cmtN && !/^본회의$/.test(cmtN)) out.push(esc(cmtN)+(/[위회]$/.test(cmtN)?'가':'에서')+' 맡아서 심사해요');
  else if(/^본회의$/.test(meta.cmt||'')) out.push('위원회를 거치지 않고 본회의에서 바로 다루는 안건이에요');
  // 처리 결과
  const res=meta.res||meta.proc||'';
  if(meta.t && meta.y!=null){
    const pctY=Math.round(meta.y/meta.t*100);
    out.push('본회의 표결에서 찬성 '+nf(meta.y)+'명, 반대 '+nf(meta.n||0)+'명, 찬성률 '+pctY+'%로 '+
      (pctY>=50?'통과됐어요':'부결됐어요'));
  } else if(res){
    const R=String(res);
    out.push(/가결|통과/.test(R)?'심사를 거쳐 '+esc(R)+'로 처리됐어요'
      :/대안반영/.test(R)?'이 법안의 내용은 위원회 대안에 반영되어 마무리됐어요'
      :/폐기|철회/.test(R)?'최종적으로 '+esc(R)+'됐어요'
      :'현재 처리 상태는 '+esc(R)+'예요');
  } else if(meta.dt){ out.push('아직 위원회에서 심사 중이에요'); }

  // 발의자 정보 (있으면 한 줄로)
  const prop = meta.prop || (raw.match(/\(([^()]*?의원)\s*등\s*(\d+)인\)/)||[])[0];
  if(prop && out.length<4){
    const pm = raw.match(/\(([^()]*?)의원\s*등\s*(\d+)인\)/);
    if(pm) out.push(esc(pm[1])+' 의원이 대표로, 모두 '+pm[2]+'명이 함께 냈어요');
    else if(meta.prop) out.push(esc(meta.prop)+' 의원이 대표로 냈어요');
  }
  // 핵심 3줄 = [무슨 안건] + [누가/어디서] + [어떻게 됐나]
  const isRes = t=>/표결|통과|부결|가결|폐기|철회|반영|심사 중|계류/.test(t);
  const isWho = t=>/위원회|대안|위원회안|대표로|함께 냈/.test(t);
  const head3 = out[0];
  const resLine = out.slice(1).find(isRes) || '';
  const whoLine = out.slice(1).find(t=>t!==resLine && isWho(t)) || '';
  const three=[head3, whoLine, resLine].filter(Boolean).slice(0,3);
  return '<ul class="ezb">'+three.map(x=>'<li>'+x+'</li>').join('')+'</ul>'
   + '<p class="ezfoot">* 국회가 이 안건의 제안이유를 등록하지 않아, 의안 종류·소관 위원회·표결 결과로 정리했어요.</p>';
}

/* 정밀 라운드 문항 설명 — 제안이유 요약을 첫 5문항과 같은 가벼운 해요체 2~3줄로.
   법률 문어체 어미를 구어체로 바꾸고, 숫자·기한은 굵게 강조한다. */
/* 제안이유 원문 → 퀴즈용 3줄 핵심 요약.
   기본 5문항(D.quiz.easy)은 수집 단계에서 만들어 두지만, 정밀 라운드 문항은
   즉석 선정이라 여기서 만든다. 예전에는 앞 3문장을 어미만 바꿔 내보내서
   법령 인용과 120자짜리 문장이 그대로 남았다 → 기본 문항과 품질이 어긋났다.
   지어내지 않고 원문에서 고르고 줄이기만 한다. */
function easyLines(sum, meta, maxLen){
  const LIM = maxLen || 72;
  if(!sum) return [];
  let t=String(sum).replace(/^\s*\d+\.\s*/,'')
    .replace(/^대안의\s*제안이유\s*(및\s*주요내용)?/,'')
    .replace(/^제안이유\s*(및\s*주요내용)?/,'')
    .replace(/\d+\.\s*주요내용/g,' ')
    .replace(/참고사항[\s\S]*$/,'').replace(/주요내용/g,' ')
    // 법령 인용은 읽기를 막는다: 호수까지 붙은 인용은 통째로, 단순 법명은 괄호만 벗긴다
    .replace(/「법률\s*제\s*[\d,]+\s*호[^」]*」\s*(?:에서|에|의)?\s*(?:정한|규정한|따른)?\s*/g,'')
    .replace(/「([^」]{1,28})」/g,'$1')
    .replace(/\(안\s*제[^)]*\)/g,'').replace(/\(제\d+조[^)]*\)/g,'')
    .replace(/["“”]/g,'').replace(/\s+/g,' ').trim();

  const strip=x=>x.replace(/^(?:대안의\s*)?(?:[가-하]\.|[0-9]+[.)])\s*/,'').trim();
  let parts;
  /* 대안 요약은 '가. ~ 나. ~'로 주요내용을 나열한다. 그 항목 자체가 핵심이라
     프로즈를 자르는 것보다 낫다. 2개 이상 잡힐 때만 쓴다. */
  const enumParts = t.split(/\s(?=(?:[가-하]\.)\s)/)
    .map(x=>strip(x).replace(/\.$/,'').trim()).filter(x=>x.length>=14 && x.length<=200);
  if(enumParts.length>=3){
    parts = enumParts;
  } else {
    parts = t.split(/(?<=[임함음됨다])\.\s*/).map(x=>strip(x).replace(/\.$/,''))
      .filter(x=>x.length>=12);
  }
  if(!parts.length) return [];

  /* 앞 3문장이 아니라 '무엇을 하려는가 / 어떻게 바꾸는가 / 왜 필요한가'를 대표하는 문장을 고른다 */
  if(parts.length>3){
    const score=(x,i)=>{
      let v=0;
      if(/(하려는 것|하려는|하고자|목적으로|취지)/.test(x)) v+=6;
      if(/(하도록|규정|신설|명시|의무|근거를 마련|연장|확대|상향|인상|완화|강화|폐지|도입)/.test(x)) v+=5;
      if(/(문제|어렵|미비|부족|우려|지적|실정|한계|곤란|없는)/.test(x)) v+=4;
      if(/(현행|현재)/.test(x)) v+=2;
      if(i===0) v+=2;
      // 자르지 않고 그대로 실을 수 있는 문장을 크게 우대한다. 잘린 문장이 3줄을
      // 채우면 읽는 사람은 '요약이 덜 됐다'고 느낀다.
      if(x.length<=LIM) v+=7;
      else if(x.length<=LIM*1.35) v+=3;
      v -= Math.max(0, (x.length-LIM*1.35)/40);
      return v;
    };
    parts = parts.map((x,i)=>({x,i,s:score(x,i)})).sort((a,b)=>b.s-a.s).slice(0,3)
      .sort((a,b)=>a.i-b.i).map(o=>o.x);
  } else {
    // 3문장 이하라도 짧은 것부터 살리되 원문 순서는 지킨다
    parts = parts.map((x,i)=>({x,i})).sort((a,b)=>
        ((a.x.length<=LIM?0:1)-(b.x.length<=LIM?0:1)) || (a.i-b.i))
      .slice(0,3).sort((a,b)=>a.i-b.i).map(o=>o.x);
  }

  const soft=x=>x
    .replace(/하고자 하는 것임$|하려는 것임$|하고자 함$/,'하려는 법이에요')
    .replace(/마련하려는 것$|하려는 것$/,'하려는 거예요')
    .replace(/려는 것임$/,'려는 법이에요')
    .replace(/필요가 있음$|필요함$/,'필요하다는 거예요')
    .replace(/제기되고 있음$/,'제기돼요').replace(/지적이 있음$/,'지적이 있어요')
    .replace(/제기됨$/,'제기돼요')
    .replace(/실정임$/,'실정이에요').replace(/상황임$/,'상황이에요')
    .replace(/하였음$/,'했어요').replace(/되었음$/,'됐어요')
    .replace(/있음$/,'있어요').replace(/없음$/,'없어요')
    .replace(/있다$/,'있어요').replace(/없다$/,'없어요')
    .replace(/한다$/,'해요').replace(/된다$/,'돼요').replace(/이다$/,'이에요')
    .replace(/였음$/,'였어요').replace(/발생함$/,'생겼어요').replace(/발생하였음$/,'생겼어요')
    .replace(/규정하고 있음$/,'정하고 있어요').replace(/규정함$/,'정했어요')
    .replace(/않음$/,'않아요').replace(/많음$/,'많아요').replace(/같음$/,'같아요')
    .replace(/받음$/,'받아요').replace(/았음$/,'았어요')
    .replace(/함$/,'해요').replace(/됨$/,'돼요').replace(/음$/,'어요').replace(/임$/,'이에요');

  /* 글자 수로 자르면 '…하도록 하…'처럼 어간에서 끊겨 요약이 덜 된 것처럼 보인다.
     절 단위로 담고, 마지막 절의 연결어미를 종결어미로 바꿔 문장을 닫는다. */
  const STEM={'하':'해요','되':'돼요','있':'있어요','없':'없어요','않':'않아요',
              '받':'받아요','같':'같아요','많':'많아요','삼':'삼아요','드':'들어요'};
  const closeClause=y=>{
    y=y.trim().replace(/[,·]+$/,'');
    // 연결어미 제거 → 어간만 남긴다
    y=y.replace(/(으로써|으로서|함으로써|므로|면서|는데|은데|으나|지만|거나|도록|고자)$/,'')
       .trim().replace(/[,·]+$/,'');
    /* '~에 대하여/관하여/위하여'는 부사절이라 종결로 바꾸면 '건축물에 대해요'처럼
       뜻이 어긋난다. 이런 꼬리는 잘라내고 정직하게 말줄임으로 끝낸다. */
    const SUB=/(대하|관하|위하|의하|통하|기하|따르|이르|비하|더하)$/;
    if(SUB.test(y)) return y.replace(SUB,'').trim().replace(/[,·]+$/,'')+'…';
    if(/(함|됨|음|임)$/.test(y)) return soft(y);           // 함 → 해요
    const m=y.match(/(하여|하고|하며|되어|되고|되며)$/);
    if(m){ const base=m[1][0]==='하'?'해요':'돼요'; return y.slice(0,-m[1].length)+base; }
    const k=y.slice(-1);
    if(STEM[k]) return y.slice(0,-1)+STEM[k];
    if(/[가-힣]$/.test(y)) return y+'…';
    return y+'…';
  };
  const shorten=x=>{
    if(x.length<=LIM) return x;
    const cl=x.split(/(?<=(?:으로써|으로서|므로|면서|는데|은데|으나|지만|하여|하고|하며|되어|되고|되며|거나|,))\s+/);
    let acc='';
    for(const c of cl){
      if(!acc){ acc=c; continue; }
      if((acc+' '+c).length>LIM) break;
      acc+=' '+c;
    }
    if(acc.length<=LIM) return closeClause(acc);
    // 첫 절부터 긴 경우: 단어 경계까지만 되돌린 뒤 닫는다
    const head=acc.slice(0, LIM);
    const sp=head.lastIndexOf(' ');
    return closeClause(sp>LIM*0.45? head.slice(0,sp) : head);
  };

  /* 굵게는 '무엇이 어떻게 바뀌는가'에만. 예전엔 날짜를 기계적으로 굵게 해 뜻 없는 강조가 됐다 */
  const CHANGE=/(연장|확대|상향|인상|완화|강화|축소|인하|폐지|도입|신설|늘리|낮추|줄이|유예|연기|허용|금지)/;
  const mark=x=>{
    if(!CHANGE.test(x)) return x;
    // 월·일은 제외한다 — '2026년 10월 2일로'에서 '2일로'가 굵어지는 식의 오강조가 났다
    const re=/(\d[\d,.]*\s?(?:년|개월|%|억\s?원|만\s?원|천\s?원|원|명|건|배|회|시간|세|퍼센트)(?:까지|부터|으로|로|간|씩|더)?)/g;
    let done=false;
    return x.replace(re,(m,g,off)=>{
      if(done) return m;
      const before=x.slice(Math.max(0,off-14), off);
      if(/(시행|공포|예정|현행|기준)\s*$/.test(before)) return m;   // 시행 예정일 등은 강조 대상이 아님
      const near=x.slice(off, off+16);
      const anchored=/(까지|부터|으로|로|더)$/.test(m.trim()) || CHANGE.test(near);
      if(!anchored) return m;
      done=true; return '**'+m.trim()+'**';
    });
  };

  return parts.map(p=>mark(shorten(soft(p)))).filter(x=>x && x.length>=10);
}
/* 마크다운 굵게(**...**)를 안전하게 HTML로 */
function easyHTML(line){
  return esc(line).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
}
function easyize(sum, meta){
  const lines=easyLines(sum, meta);
  if(!lines.length) return bulletize(sum, meta);
  return '<ul class="ezb">'+lines.map(x=>'<li>'+easyHTML(x)+'</li>').join('')+'</ul>';
}
function bulletize(sum, meta){
  if(!sum) return metaBullets(meta);
  let t=String(sum).replace(/^대안의\s*제안이유\s*(및\s*주요내용)?/,'').replace(/^제안이유\s*(및\s*주요내용)?/,'')
    .replace(/참고사항[\s\S]*$/,'').replace(/주요내용/g,' ')
    .replace(/\(안\s*제[^)]*\)/g,'').replace(/\s+/g,' ').trim();
  let parts=t.split(/(?<=[임함음됨])\.\s*|(?<=^|\s)(?=[가나다라마바]\.\s)/)
    .map(x=>x.replace(/^[가나다라마바]\.\s*/,'').trim()).filter(x=>x.length>=18);
  if(parts.length<2) parts=t.split(/(?<=니다)\.\s+/).filter(x=>x.length>=18);
  if(parts.length<2) parts=t.split(/(?<=다)\.\s+/).filter(x=>x.length>=18);
  // 긴 문장은 절(쉼표·연결어미) 단위로 쪼개서 "…" 없이 끝나게
  const expand=[];
  parts.forEach(pp=>{
    if(pp.length<=170){ expand.push(pp); return; }
    const cls=pp.split(/(?<=[,며고나되]) /); let cur='';
    cls.forEach(c=>{ if((cur+' '+c).trim().length>160 && cur){ expand.push(cur.trim()); cur=c; } else cur=(cur?cur+' ':'')+c; });
    if(cur.trim().length>=18) expand.push(cur.trim());
  });
  // ── 핵심 3줄 선별 ──
  //  법안 요약은 보통 [배경·문제] → [현행 한계] → [개정 목적·내용] 구조다.
  //  각 유형을 대표하는 문장을 하나씩 골라 3줄로 압축한다.
  const pick3=(arr)=>{
    if(arr.length<=3) return arr;
    const score=(t,i)=>{
      let v=0;
      if(/(하려는 것|목적으로|취지)/.test(t)) v+=6;            // 이 법으로 뭘 하려는가
      if(/(하도록|규정|신설|명시|의무|근거를 마련)/.test(t)) v+=5;  // 구체적 내용
      if(/(문제|어렵|미비|부족|우려|지적|실정|없어요|한계)/.test(t)) v+=4; // 왜 필요한가
      if(/(현행|현재)/.test(t)) v+=2;
      if(i===0) v+=2;                                        // 첫 문장 가산
      v += Math.min(2, t.length/90);                         // 너무 짧은 문장 배제
      return v;
    };
    const ranked=arr.map((t,i)=>({t,i,s:score(t,i)})).sort((a,b)=>b.s-a.s).slice(0,3);
    return ranked.sort((a,b)=>a.i-b.i).map(x=>x.t);          // 원문 순서 복원
  };
  const out=pick3(expand).map(x=>{
    let y2=yoify(x.replace(/[,\s]+$/,''));
    if(y2.length>170){
      let cut=-1;
      [', ',' 및 ',' 또는 ',' 등 ','하여 ','하고 '].forEach(sep=>{
        const i=y2.lastIndexOf(sep,166); if(i>100 && i>cut) cut=i+(sep===', '?0:sep.length-1); });
      if(cut<0) cut=y2.lastIndexOf(' ',166);
      y2=y2.slice(0, cut>100?cut:166).replace(/\s+[\d^()\[\]·,]{1,3}$/,'');
    }
    return endYo(y2); });
  // 빈 줄·종결이 깨진 줄 제거 (최소 3줄은 아래에서 보충)
  const clean=out.filter(x=>x && x.length>=12 && /[가-힣]요$/.test(x));
  out.length=0; clean.forEach(x=>out.push(x));
  if(!out.length) return metaBullets(meta);
  // 원문이 짧아 3줄 미만이면 메타 정보로 보완 (지어내지 않고 사실만)
  if(out.length<3 && meta){
    const ex=metaBullets(meta);
    const extra=[...new DOMParser().parseFromString(ex,'text/html').querySelectorAll('li')]
      .map(l=>l.textContent).filter(t=>!/제안이유를 등록하지 않은/.test(t)).slice(1);
    extra.forEach(t=>{ if(out.length<3 && !out.includes(t)) out.push(t); });
  }
  return '<ul class="ezb">'+out.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
}
function fullVotesOf(cd){
  const pos=(D.midx||[]).indexOf(cd); if(pos<0) return [];
  const NM={'1':'찬성','2':'반대','3':'기권'};
  const out=[];
  (D.bills||[]).forEach(b=>{ const v=(D.vfull[b.id]||'')[pos];
    if(v==='1'||v==='2'||v==='3') out.push({name:b.name, dt:b.dt, r:NM[v], kind:b.kind, link:b.link, y:b.y, n:b.n}); });
  return out;
}
const ACTICO={'발의':'','찬성':'','반대':'','기권':'','불참':''};
function mergedActs(x, f){
  const votes=fullVotesOf(x.cd);
  let acts=[...x.bills.map(b=>({d:b.dt||'', ty:1, b})), ...votes.map(v=>({d:v.dt||'', ty:2, v}))];
  if(f==='발의') acts=acts.filter(a=>a.ty===1);
  else if(f&&f.startsWith('B:')){ const st=f.slice(2);
    acts=acts.filter(a=>{ if(a.ty!==1) return false; const pr=a.b.proc||'';
      if(st==='가결') return /가결/.test(pr);
      if(st==='대안반영') return /대안반영/.test(pr);
      if(st==='폐기·철회') return /폐기|철회/.test(pr);
      if(st==='계류') return !pr;
      return pr && !/가결|대안반영|폐기|철회/.test(pr); }); }
  else if(f&&f.startsWith('C:')){ const cm=f.slice(2);
    acts=acts.filter(a=>a.ty===1 && (a.b.cmt||'').includes(cm)); }
  else if(f) acts=acts.filter(a=>a.ty===2 && a.v.r===f);
  acts=acts.sort((a,b)=>b.d.localeCompare(a.d)).slice(0,45);
  if(!acts.length) return '<div class="empty">기록이 없어요</div>';
  return acts.map((a,i)=>{
    if(a.ty===1){ const b=a.b; return `
      <div class="item"><div class="t" data-x="a${i}">
        <span class="tag" style="background:var(--accent);color:#fff">발의</span><span>${esc(b.name)}</span></div>
      <div class="m"><span>${esc(b.dt||'')}</span><span>${esc(b.cmt||'')}</span>
        ${b.proc?`<span class="tag ${/가결|반영/.test(b.proc)?'ok':''}">${esc(b.proc)}</span>`:'<span class="tag">계류</span>'}</div>
      <div class="expand" id="a${i}">${tagChips(b)}${bulletize(D.sums[b.no], b)}
        <div class="lk">${(()=>{const bid2=(b.link||'').split('billId=')[1]||'';
          return bid2&&D.vfull&&D.vfull[bid2]?`<a href="javascript:;" data-gb="${bid2}">299명은 어떻게 투표했을까 →</a>`:'';})()}
        ${b.link?`<a href="${esc(b.link)}" target="_blank" rel="noopener">원문 </a>`:''}
        <a href="${newsLink(b.name)}" target="_blank" rel="noopener">뉴스 검색 </a></div></div></div>`; }
    const v=a.v; const bid=(v.link||'').split('billId=')[1]||''; return `
      <div class="item"><div class="t" data-x="a${i}">
        <span class="tag ${VT[v.r]||''}">${ACTICO[v.r]||''} ${esc(v.r)}</span><span>${esc(v.name)}</span></div>
      <div class="m"><span>${esc(v.dt||'')}</span><span>본회의 찬성 ${nf(v.y)} · 반대 ${nf(v.n)}</span></div>
      <div class="expand" id="a${i}">
        <div style="margin-bottom:9px;font-weight:700">${esc(x.name)} 의원은 <b style="color:${v.r==='찬성'?'var(--pos)':v.r==='반대'?'var(--neg)':'var(--neu)'}">${esc(v.r)}</b>했어요</div>
        ${tagChips(billMeta(v))}${bulletize((D.vsums||{})[(v.link||'').split('billId=')[1]||''], billMeta(v))}
        <div class="lk">${bid&&D.vfull&&D.vfull[bid]?`<a href="javascript:;" data-gb="${bid}">299명은 어떻게 투표했을까 →</a>`:''}
          ${v.link?`<a href="${esc(v.link)}" target="_blank" rel="noopener">의안 원문 </a>`:''}</div></div></div>`;
  }).join('');
}

/* ===================== V2 오버라이드 ===================== */
/* 5문항 원페이지 퀴즈 + 적응형 정밀 라운드 */
let qIdx=0;
let QZ=null;   // 동적 문항 (기본 5 + 정밀 라운드)
function qzInit(){ if(QZ) return;
  /* 지난 답변을 복원 — 탭을 오가도 결과가 사라지지 않게 */
  try{ const s=JSON.parse(localStorage.getItem('dogam.quiz.v1')||'null');
    if(s && Array.isArray(s.qz) && s.qz.length){
      QZ=s.qz; Object.assign(ANS, s.ans||{});
      qIdx=Math.min(s.qIdx||0, QZ.length); return; } }catch(e){}
  QZ=[...(D.quiz||[])]; }
function saveQuiz(){ try{ localStorage.setItem('dogam.quiz.v1',
  JSON.stringify({qz:QZ, ans:ANS, qIdx:qIdx, t:Date.now()})); }catch(e){} }
function pickSplitters(tiedCds, k){
  // 동률 의원들 안에서 표가 갈린 법안을 즉석 선정
  const pos={}; (D.midx||[]).forEach((c,i)=>pos[c]=i);
  const asked=new Set(QZ.map(q=>q.id));
  const cands=[];
  (D.bills||[]).forEach(b=>{
    if(b.kind!=='법률안' || asked.has(b.id)) return;
    const str=D.vfull[b.id]; if(!str) return;
    if(!(D.vsums||{})[b.id] && !(D.sums||{})[b.no]) return;   // 설명 가능한 법안만
    let y=0,nn=0;
    tiedCds.forEach(cd=>{ const v=str[pos[cd]]; if(v==='1')y++; else if(v==='2')nn++; });
    const p=y+nn; if(p < tiedCds.length*0.5 || !y || !nn) return;
    cands.push({b, score: p*Math.min(y,nn)/Math.max(y,nn), y, nn});
  });
  cands.sort((a,b)=>b.score-a.score);
  const out=[], cmts=new Set();
  for(const c of cands){
    if(out.length>=k) break;
    if(cmts.has(c.b.cmt) && cands.length>k*2) continue;
    cmts.add(c.b.cmt);
    out.push({ id:c.b.id, billNo:String(c.b.no), cmt:c.b.cmt, dt:c.b.dt,
      yes:c.b.y, nay:c.b.n, blank:c.b.b||0, link:c.b.link,
      name:c.b.name.replace(/\(대안\)/g,'').replace(/\([^)]*의원[^)]*\)|\(정부\)|\([^)]*위원장\)/g,'').trim(),
      easy:null });
  }
  return out;
}
quizRender=function(){
  qzInit();
  const w=document.getElementById('quizwrap'); const Q=QZ;
  if(qIdx>=Q.length){
    w.innerHTML='<div class="q2wrap"><div id="qresult"></div></div>';
    quizScore();
    ['qReset','qReset0'].forEach(id=>{ const b=document.getElementById(id);
      if(b) b.onclick=()=>{ Object.keys(ANS).forEach(k=>delete ANS[k]); QZ=[...(D.quiz||[])]; qIdx=0; try{localStorage.removeItem('dogam.quiz.v1');}catch(e2){} quizRender(); quizScroll(); }; });
    const qm=document.getElementById('qMore');
    if(qm) qm.onclick=()=>{
      const ansQ=QZ.filter(q=>ANS[q.id]);
      // 현재 동률 상위 의원 재계산
      const VF=D.vfull||{}, MI=D.midx||[]; const pos={}; MI.forEach((c,i)=>pos[c]=i);
      const rows2=[];
      D.members.forEach(m=>{ let hit=0,tot=0;
        ansQ.forEach(q=>{ const v=(VF[q.id]||'')[pos[m.cd]];
          if(v!=='1'&&v!=='2'&&v!=='3') return; tot++;
          if(v==={y:'1',n:'2',a:'3'}[ANS[q.id]]) hit++; });
        if(tot>=Math.max(2,Math.ceil(ansQ.length*0.5))) rows2.push({cd:m.cd, r:hit/tot}); });
      rows2.sort((a,b)=>b.r-a.r);
      const top2=rows2[0]?.r??0;
      const tiedCds=rows2.filter(x=>Math.abs(x.r-top2)<1e-9).map(x=>x.cd);
      const extra=pickSplitters(tiedCds, 5);
      if(!extra.length){ alert('더 가를 수 있는 법안이 없어요'); return; }
      const at=QZ.length; QZ.push(...extra); qIdx=at; quizRender(); quizScroll();
    };
    return;
  }
  const q=Q[qIdx];
  w.innerHTML=`
   <div class="q2wrap">
    <div class="q2top">
      <button class="q2back" id="q2back" ${qIdx===0?'style="visibility:hidden"':''} aria-label="이전">←</button>
      <div class="q2prog">${Q.map((z,i)=>`<i class="${i<qIdx?'done':i===qIdx?'cur':''}"></i>`).join('')}</div>
      <span class="q2n">${qIdx+1} / ${Q.length}</span>
    </div>
    <div class="q2card">
      <div class="q2ask">내가 만일 국회의원이라면<br>이 법안, 어떻게 했을까요?</div>
      <h3 class="q2t">${esc(q.name)}</h3>
      <div class="q2m">${esc(q.dt)} 본회의 · 찬성 ${nf(q.yes)} · 반대 ${nf(q.nay)}${q.blank?` · 기권 ${nf(q.blank)}`:''}</div>
      ${(()=>{ const ls=(q.easy&&q.easy.length)? q.easy
            : easyLines((D.vsums||{})[q.id] || (D.sums||{})[q.billNo], q);
          return ls.length? `<ul class="q2s">${ls.map(x=>`<li>${easyHTML(x)}</li>`).join('')}</ul>`
            : `<div class="q2s" style="list-style:none;color:var(--ink3)">이 법안은 제안이유가 등록돼 있지 않아요. 아래 원문에서 확인할 수 있어요.</div>`; })()}
      <div class="q2a">
        <button data-a="y" class="${ANS[q.id]==='y'?'on y':''}"><i></i>찬성</button>
        <button data-a="n" class="${ANS[q.id]==='n'?'on n':''}"><i></i>반대</button>
        <button data-a="a" class="${ANS[q.id]==='a'?'on a':''}"><i></i>기권</button>
      </div>
      <button class="q2skip" id="q2skip">잘 모르겠어요, 건너뛸래요</button>
    </div>
   </div>`;
  w.querySelector('.q2a').onclick=e=>{ const b=e.target.closest('button'); if(!b) return;
    ANS[q.id]=b.dataset.a;
    [...w.querySelectorAll('.q2a button')].forEach(z=>z.className='');
    b.classList.add('on', b.dataset.a==='y'?'y':b.dataset.a==='n'?'n':'a');
    setTimeout(()=>{ qIdx++; quizRender(); quizScroll(); },280); };
  document.getElementById('q2skip').onclick=()=>{ delete ANS[q.id]; qIdx++; quizRender(); quizScroll(); };
  document.getElementById('q2back').onclick=()=>{ qIdx=Math.max(0,qIdx-1); quizRender(); quizScroll(); };
  if(qIdx===0){ const bb=document.getElementById('q2back'); bb.style.visibility='visible'; bb.textContent='×';
    bb.onclick=()=>{ viewMode='card';
      [...document.querySelectorAll('#view button')].forEach(z=>z.setAttribute('aria-pressed', z.dataset.v==='card'));
      render(); }; }
};

/* 발언 드릴다운 + 전용 검색 */
const TAG_GROUPS = D.tagGroups || {};
let qtGrp=null, qtKw=null, qtQ2='';
/* ── 발언 뷰 (국정감사 회의록 + 언론 인용) ── */
var qtSrc = null;                  // null=전체 / '감사' / '언론'
var qtSort = 'new';                // 발언 정렬: new|old|member|cmt|long|news
const QT_SORTS = [
  ['new','최신순','최신 발언부터'],
  ['old','오래된순','가장 오래된 발언부터'],
  ['member','의원 가나다순','의원 이름 가나다 · 같은 의원은 최신순'],
  ['cmt','위원회·매체순','위원회(국정감사)와 매체(언론) 가나다 · 같은 곳은 최신순'],
  ['long','발언 긴 순','문장이 긴 발언부터 · 맥락이 많이 담긴 순서'],
  ['news','관련 보도 많은 순','그 발언에 붙은 기사가 많은 순 · 화제가 된 발언']
];
/* ── 구 `bodyq` 병합 로직은 제거했다 (2026-08-20)
   예전엔 언론 인용이 기사 제목에서 나왔고, 본문 인용은 하루 40명씩 커서로 돌리는
   별도 실험이라 둘을 섞어야 했다. 이젠 언론 인용 전부가 본문에서 온다.
   수집은 scripts/daily_refresh.js 의 refreshMediaQuotes(). ── */
/* 태그 표시 순서 고정 — 분야(그룹) 순 → 그룹 내 정의 순 */
var TAG_RANK = (function(){
  const r={}; let i=0;
  Object.keys(TAG_GROUPS||{}).forEach(g=>{ (TAG_GROUPS[g]||[]).forEach(t=>{ if(!(t in r)) r[t]=i++; }); });
  (D.tags||[]).forEach(t=>{ if(!(t in r)) r[t]=1000+i++; });   // 그룹 미배정 태그는 뒤로
  return r;
})();
/* 태그별 키워드 표시 순서 — 전체 코퍼스 기준으로 1회 확정 (필터에 따라 흔들리지 않게) */
var KW_ORDER = (function(){
  const per={};
  (D.quotes||[]).forEach(q=>(q.t||[]).forEach(t=>{
    const m=per[t]=per[t]||{}; (q.kw||[]).forEach(k=>{ m[k]=(m[k]||0)+1; }); }));
  const out={};
  Object.keys(per).forEach(t=>{
    out[t]=Object.entries(per[t])
      .sort((a,b)=> b[1]-a[1] || String(a[0]).localeCompare(b[0],'ko'))
      .map(x=>x[0]);
  });
  return out;
})();
function sortTags(list){
  return [...new Set(list||[])].sort((a,b)=>{
    const ra=TAG_RANK[a]!=null?TAG_RANK[a]:9999, rb=TAG_RANK[b]!=null?TAG_RANK[b]:9999;
    return ra!==rb ? ra-rb : String(a).localeCompare(b,'ko');
  });
}
function qKey(q){ return (q.d||'')+'|'+String(q.s||'').slice(0,24); }
function findQuote(key){ return (D.quotes||[]).find(q=>qKey(q)===key) || null; }
var qtOpen = new Set();            // 펼친 카드 키

function quoteBody(q, m){
  const nameOf=cd=>{ const y=(D.members||[]).find(z=>z.cd===cd); return y?y.name:'다른 발언자'; };
  if(q.src==='언론'){
    const arts=qNews(q);
    return '<div class="qx">'
     + '<div class="qxh">이 발언이 실린 기사</div>'
     + '<a class="qxart" href="'+esc(q.mu||'#')+'" target="_blank" rel="noopener">'
     + '<span class="qxt">'+esc(q.mt||'')+'</span>'
     + '<span class="qxs">'+esc(q.ms||'')+' · '+esc(q.d)+'</span></a>'
     + qNewsHTML(arts.slice(0,3), '같은 시기 다른 보도')
     + '</div>';
  }
  const x2=q.x||[];
  const arts=qNews(q);
  return '<div class="qx">'
   + '<div class="qxh">앞뒤 맥락 · '+esc(q.m)+'위원회 '+esc(q.d)+'</div>'
   + (x2[0]? '<div class="qxc"><b>'+esc(nameOf(x2[0][0]))+'</b><p>'+esc(x2[0][1])+'</p></div>'
           : '<div class="qxc none">앞 발언 기록이 없어요</div>')
   + '<div class="qxc now"><b>'+esc(m?m.name:'')+'</b><p>'+esc(q.s)+'</p></div>'
   + (x2[1]? '<div class="qxc"><b>'+esc(nameOf(x2[1][0]))+'</b><p>'+esc(x2[1][1])+'</p></div>'
           : '<div class="qxc none">뒤 발언 기록이 없어요</div>')
   + (q.rid? '<a class="qxlink" href="https://record.assembly.go.kr/assembly/viewer/minutes/xml.do?id='+q.rid
      +'&type=view'+((q.kw&&q.kw[0])?'&schwrd='+encodeURIComponent(q.kw[0]):'')
      +'" target="_blank" rel="noopener">회의록 전문에서 보기 <svg class="ic-sm" aria-hidden="true"><use href="#i-ext"/></svg></a>':'')
   + qNewsHTML(arts, '관련 보도')
   + '</div>';
}


/* 발언 맥락 화면 */
function qtContextView(){
  const w=document.getElementById('qtwrap');
  const q=findQuote(qtCtx);
  if(!q){ qtCtx=null; return qtRender(); }
  const m=(D.members||[]).find(x=>x.cd===q.c);
  const nameOf=cd=>{ const y=(D.members||[]).find(z=>z.cd===cd); return y?y.name:'다른 발언자'; };
  const x2=q.x||[];
  const arts=qNews(q);
  const rid=q.rid;
  const kw=(q.kw&&q.kw[0])||'';
  w.innerHTML = `
    <div class="qctxv">
      <button class="qback" id="qBack"><svg class="ic-sm" aria-hidden="true"><use href="#i-down"/></svg>발언 목록으로</button>
      <div class="qcmeta">${esc(q.m)}위원회 · ${esc(q.d)} 국정감사</div>
      <div class="qcflow">
        ${x2[0]? `<div class="cx before"><span class="cxl">앞 발언</span><b>${esc(nameOf(x2[0][0]))}</b><p>${esc(x2[0][1])}</p></div>`
               : '<div class="cx none">앞 발언 기록이 없어요</div>'}
        <div class="cx now">
          <span class="cxl">이 발언</span>
          <div class="cxwho">${m?avatar(m,'ph'):''}
            <div><b class="cxnm" data-cd="${m?m.cd:''}">${esc(m?m.name:'')}</b>
              <span class="cxpt">${esc(m?m.party:'')}</span></div></div>
          <p class="cxq">${esc(q.s)}</p>
          <div class="qtg">${(q.t||[]).map(t=>`<span data-qtag="${esc(t)}">#${esc(t)}</span>`).join('')}</div>
        </div>
        ${x2[1]? `<div class="cx after"><span class="cxl">뒤 발언</span><b>${esc(nameOf(x2[1][0]))}</b><p>${esc(x2[1][1])}</p></div>`
               : '<div class="cx none">뒤 발언 기록이 없어요</div>'}
      </div>
      <div class="qcsrc">
        ${rid?`<a href="https://record.assembly.go.kr/assembly/viewer/minutes/xml.do?id=${rid}&type=view${kw?'&schwrd='+encodeURIComponent(kw):''}"
          target="_blank" rel="noopener">회의록 전문에서 보기 <svg class="ic-sm" aria-hidden="true"><use href="#i-ext"/></svg></a>`:''}
        ${m?`<a href="javascript:;" class="qcmem" data-cd="${m.cd}">${esc(m.name)} 의원 상세</a>`:''}
      </div>
      ${arts.length?`<div class="qcnews"><div class="qcnh">이 발언과 관련된 보도</div>
        ${arts.map(a=>`<a href="${esc(a[3])}" target="_blank" rel="noopener">
          <span class="nt">${esc(a[1])}</span><span class="ns">${esc(a[2])} · ${esc(a[0])}</span></a>`).join('')}
        <div class="cs">${arts[0][5]==='nv'
          ? '네이버 검색 API · 같은 주제 · 발언일 ±10일로 찾았어요. 이 발언을 보도한 기사라는 뜻은 아니에요'
          : esc((D.qnmeta||{}).q||'')+' · '+esc((D.qnmeta||{}).win||'')+'로 찾았어요'}. 헤드라인은 각 매체 저작물이에요</div></div>`:''}
    </div>`;
  const bk=document.getElementById('qBack');
  if(bk) bk.onclick=()=>{ qtCtx=null; qtRender(); pushRoute(); };
  w.querySelectorAll('[data-cd]').forEach(el=>el.onclick=()=>{
    const mm=(D.members||[]).find(z=>z.cd===el.dataset.cd); if(mm) open(mm); });
}
qtRender=function(){
  const w=document.getElementById('qtwrap');
  document.getElementById('toolbar')?.classList.add('qtmode');   // 정렬·정당·보기방식 숨김
  const idxEl=document.getElementById('idx'); if(idxEl) idxEl.innerHTML='';  // 가나다 색인은 의원 목록 전용
  const qEl=document.getElementById('q');
  if(qEl) qEl.placeholder='발언 내용이나 의원 이름을 검색해 보세요';
  const Q=D.quotes||[];
  // 상단 검색창의 입력도 발언 검색에 반영한다
  const kw=((qtQ2||'').trim() || (document.getElementById('q')?.value||'').trim()).toLowerCase();
  // 각 필터를 개별로 끌 수 있게 분리 — facet 카운트는 '자기 필터를 뺀' 결과로 세야 한다
  const NMAP={}; (D.members||[]).forEach(m=>NMAP[m.cd]=m);
  const passSrc=q=>!qtSrc || q.src===qtSrc;
  // 상단 정당 칩이 발언 화면에서도 실제로 걸리도록 발언자 기준으로 적용한다
  const passMem=q=>{ if(!activeParty) return true; const m2=NMAP[q.c]; return !!m2 && m2.party===activeParty; };
  const inAnyGrp=q=>(q.t||[]).some(t=>Object.keys(TAG_GROUPS).some(g=>TAG_GROUPS[g].includes(t)));
  const passGrp=q=> qtGrp==='__none' ? !inAnyGrp(q)
                  : (!qtGrp || q.t.some(t=>TAG_GROUPS[qtGrp].includes(t)));
  const passTag=q=>!qtTag || q.t.includes(qtTag);
  const passKw =q=>!qtKw  || (q.kw||[]).includes(qtKw);
  const passQ  =q=>{ if(!kw) return true; const m=NMAP[q.c];
    return (q.s+' '+(m?m.name+' '+m.party:'')+' '+q.t.join(' ')+' '+(q.kw||[]).join(' ')).toLowerCase().includes(kw); };
  const passAll=q=>passMem(q)&&passSrc(q)&&passGrp(q)&&passTag(q)&&passKw(q)&&passQ(q);
  let list=Q.filter(passAll);
  // 원본 배열이 수집 배치 순(무작위)이라 필터마다 순서가 흔들렸다.
  // 어떤 필터를 걸어도 같은 기준으로 보이도록 정렬을 고정한다.
  if(!Q.__idx){ try{ Q.forEach((q,i)=>{ if(q.__i==null) q.__i=i; }); Q.__idx=1; }catch(e){} }
  const NAME={}; (D.members||[]).forEach(m=>NAME[m.cd]=m.name);
  const nQ = q2 => (Array.isArray(q2.nq)&&q2.nq.length) ? q2.nq.length
                 : ((q2.qn!=null && D.qnews) ? ((D.qnews[q2.qn]||[]).length) : 0);
  const tie = (a,b)=> (a.m||'').localeCompare(b.m||'','ko')
                   || (NAME[a.c]||'').localeCompare(NAME[b.c]||'','ko')
                   || ((a.__i||0)-(b.__i||0));
  const byNew = (a,b)=> (b.d||'').localeCompare(a.d||'') || tie(a,b);
  const QT_CMP = {
    new: byNew,
    old: (a,b)=> (a.d||'').localeCompare(b.d||'') || tie(a,b),
    member: (a,b)=> (NAME[a.c]||'').localeCompare(NAME[b.c]||'','ko') || byNew(a,b),
    cmt: (a,b)=> (a.src==='언론'? (a.ms||'언론') : (a.m||'')).localeCompare(
                 (b.src==='언론'? (b.ms||'언론') : (b.m||'')),'ko') || byNew(a,b),
    long: (a,b)=> ((b.s||'').length - (a.s||'').length) || byNew(a,b),
    news: (a,b)=> (nQ(b)-nQ(a)) || byNew(a,b)
  };
  list = list.slice().sort(QT_CMP[qtSort] || byNew);
  // ── facet 카운트: "이걸 누르면 몇 건이 되나"를 뜻하도록, 각자 자기 필터만 제외하고 센다
  const srcCnt={};                                   // 출처 탭: 출처 필터 제외
  Q.forEach(q=>{ if(passMem(q)&&passGrp(q)&&passTag(q)&&passKw(q)&&passQ(q)){
    srcCnt[q.src]=(srcCnt[q.src]||0)+1; srcCnt.__all=(srcCnt.__all||0)+1; } });
  const grpCnt={};                                   // 분야 바: 분야·태그 필터 제외
  Q.forEach(q=>{ if(passMem(q)&&passSrc(q)&&passKw(q)&&passQ(q)){
    let any=false;
    Object.keys(TAG_GROUPS).forEach(g=>{ if(q.t.some(t=>TAG_GROUPS[g].includes(t))){ grpCnt[g]=(grpCnt[g]||0)+1; any=true; } });
    if(!any) grpCnt.__none=(grpCnt.__none||0)+1;
    grpCnt.__all=(grpCnt.__all||0)+1; } });
  const tagCnt={};                                   // 태그 바: 태그·키워드 필터 제외
  Q.forEach(q=>{ if(passMem(q)&&passSrc(q)&&passGrp(q)&&passQ(q)) q.t.forEach(t=>tagCnt[t]=(tagCnt[t]||0)+1); });
  const kwCnt={};                                    // 키워드 바: 키워드 필터 제외
  if(qtTag) Q.forEach(q=>{ if(passMem(q)&&passSrc(q)&&passGrp(q)&&passTag(q)&&passQ(q))
    (q.kw||[]).forEach(k2=>{ kwCnt[k2]=(kwCnt[k2]||0)+1; }); });
  const show=list.slice(0,qtShown);
  const hl=t=>{ let out=esc(t);
    if(qtKw) out=out.split(esc(qtKw)).join('<mark>'+esc(qtKw)+'</mark>');
    else if(kw && kw.length>1){ const e2=esc(qtQ2.trim()); if(e2) out=out.split(e2).join('<mark>'+e2+'</mark>'); }
    return out; };
  w.innerHTML=`
    <div class="qthead">
      <div class="qthome">
        <div class="qthd">
          <h3>의원이 직접 한 말</h3>
          <span class="qttot"><b>${nf(Q.length)}</b>건</span>
        </div>
        <p class="qtlede">국정감사 회의록과 언론 기사 <b>본문</b>에서 가져온 <b>따옴표 안의 발언 원문</b>이에요.</p>
      </div>
      <div class="frow"><span class="frl">분야</span>
      <div class="grpbar" id="grpbar">
        <button data-g="" aria-pressed="${!qtGrp}">전체 <em>${nf(grpCnt.__all||0)}</em></button>
        ${Object.keys(TAG_GROUPS).map(g=>`<button data-g="${esc(g)}" aria-pressed="${qtGrp===g}"${(grpCnt[g]||0)===0?' class="kzero"':''}>${esc(g)} <em>${nf(grpCnt[g]||0)}</em></button>`).join('')}
        <button data-g="__none" aria-pressed="${qtGrp==='__none'}"${(grpCnt.__none||0)===0?' class="kzero"':''}>미분류 <em>${nf(grpCnt.__none||0)}</em></button>
      </div></div>
      ${qtGrp&&TAG_GROUPS[qtGrp]?`<div class="frow"><span class="frl">주제</span><div class="tagbar" id="tagbar2">
        ${TAG_GROUPS[qtGrp].map(t=>`<button data-t="${esc(t)}" aria-pressed="${qtTag===t}">#${esc(t)}<em>${nf(tagCnt[t]||0)}</em></button>`).join('')}
      </div></div>`:''}
      ${qtTag?`<div class="frow"><span class="frl">키워드</span><div class="kwbar" id="kwbar">
        ${(KW_ORDER[qtTag]||Object.keys(kwCnt)).slice(0,14).map(k2=>
          `<button data-k="${esc(k2)}" aria-pressed="${qtKw===k2}"${(kwCnt[k2]||0)===0?' class="kzero"':''}
            >${esc(k2)} <em>${nf(kwCnt[k2]||0)}</em></button>`).join('')}
      </div></div>`:''}
      <div class="qtcnt"><b>${nf(list.length)}</b>건<span class="qtord">${esc((QT_SORTS.find(o=>o[0]===qtSort)||QT_SORTS[0])[1])} · ${esc((QT_SORTS.find(o=>o[0]===qtSort)||QT_SORTS[0])[2])}</span></div>
    </div>
    ${qtTag? tnewsHTML(qtTag, qtKw) : ''}
    <div class="qtgrid">
      ${show.map(q=>{ const m=D.members.find(x=>x.cd===q.c); if(!m) return '';
        const key=qKey(q); const open2=qtOpen.has(key);
        return `<article class="qcard${open2?' on':''}" data-qk="${esc(key)}">
          <header class="qhd">
            <button class="qwho" data-cd="${m.cd}">${avatar(m,'ph')}
              <span class="qn2">${esc(m.name)}</span>
              <span class="qp2" style="color:${pc(m.party)}">${esc(m.party)}</span></button>
            <span class="qsrc2 ${q.src==='언론'?'md bd':'gs'}">${q.src==='언론'?esc(q.ms||'언론'):esc(q.m)+'위 국정감사'}</span>${(q.n>1)?`<span class="qbd" title="같은 발언을 ${q.n}개 매체가 실었어요">${q.n}개 매체</span>`:''}
            <time>${esc(q.d)}</time>
          </header>
          <button type="button" class="qtext${q.src==='언론'?' md':''}" data-qtoggle="${esc(key)}">
            <span class="qmark">“</span><span class="qbody">${hl(q.s)}</span><span class="qmark cl">”</span>
          </button>
          <div class="qft">
            ${q.t.length?`<div class="qtg">${sortTags(q.t).map(t=>`<span data-t="${esc(t)}">#${esc(t)}</span>`).join('')}</div>`:'<span class="qtgx"></span>'}
            ${q.dup?`<span class="qdup">같은 발언 ${q.dup}회</span>`:''}
            <button type="button" class="qmore" data-qtoggle="${esc(key)}">${open2?'접기':(q.src==='언론'?'기사 보기':'앞뒤 맥락')}<svg class="ic-sm qmc" aria-hidden="true"><use href="#i-chev"/></svg></button>
          </div>
          ${open2? quoteBody(q,m) : ''}
        </article>`;}).join('') || '<div class="empty">조건에 맞는 발언이 없어요. 검색어나 태그를 바꿔 보세요.</div>'}
    </div>
    ${list.length>qtShown?`<button class="qtmore" id="qtMore">${nf(list.length-qtShown)}건 더 보기</button>`:''}`;
  // 탭 내부 검색창은 상단 통합 검색으로 일원화했다(중복 제거)
  /* 검색창과 같은 줄에 정렬·출처를 놓는다 (홈 상단을 한 줄로) */
  (function(){
    const ctl=document.getElementById('qtCtl'); if(!ctl) return;
    ctl.hidden=false;
    ctl.innerHTML=`
      <select id="qtSortSel" aria-label="발언 정렬 기준" title="정렬 기준">
        ${QT_SORTS.map(o=>`<option value="${o[0]}"${qtSort===o[0]?' selected':''}>${esc(o[1])}</option>`).join('')}
      </select>
      <span class="srcseg" id="srcbar" role="group" aria-label="발언 출처">
        <button data-src="" aria-pressed="${!qtSrc}">전체 <em>${nf(srcCnt.__all||0)}</em></button>
        <button data-src="감사" aria-pressed="${qtSrc==='감사'}">국정감사 <em>${nf(srcCnt['감사']||0)}</em></button>
        <button data-src="언론" aria-pressed="${qtSrc==='언론'}">언론 <em>${nf(srcCnt['언론']||0)}</em></button>
      </span>`;
    const meta=document.getElementById('qtMeta');
    if(meta){
      const ds=Q.map(z=>z.d).filter(Boolean).sort();
      meta.hidden=false;
      meta.innerHTML = ds.length? `<span class="s-nw">최신 <b>${esc(ds[ds.length-1])}</b></span>` : '';
    }
  })();
  const qss=document.getElementById('qtSortSel');
  if(qss) qss.onchange=()=>{ qtSort=qss.value; qtShown=60; qtRender();
    const w2=document.getElementById('qtwrap'); if(w2) w2.scrollIntoView({block:'start',behavior:'smooth'}); };
  document.getElementById('grpbar').onclick=e=>{ const b=e.target.closest('button'); if(!b) return;
    qtGrp=b.dataset.g||null; qtTag=null; qtKw=null; qtShown=60; qtNMon=null; qtNShown=12; qtRender(); };
  const tb2=document.getElementById('tagbar2');
  if(tb2) tb2.onclick=e=>{ const b=e.target.closest('button'); if(!b) return;
    qtTag=qtTag===b.dataset.t?null:b.dataset.t; qtKw=null; qtShown=60; qtNMon=null; qtNShown=12; qtRender(); };
  const kb=document.getElementById('kwbar');
  if(kb) kb.onclick=e=>{ const b=e.target.closest('button'); if(!b) return;
    qtKw=qtKw===b.dataset.k?null:b.dataset.k; qtShown=60; qtNMon=null; qtNShown=12; qtRender(); };
  /* 주제별 언론 보도 패널 — 월 선택 · 더보기 */
  w.querySelectorAll('[data-tnm]').forEach(el=>el.onclick=ev=>{ ev.preventDefault(); ev.stopPropagation();
    const v=el.dataset.tnm; qtNMon = (v && qtNMon!==v) ? v : null; qtNShown=12; qtRender(); });
  const tmb2=w.querySelector('[data-tnmore]');
  if(tmb2) tmb2.onclick=()=>{ qtNShown+=12; qtRender(); };
  w.querySelectorAll('.qtg span').forEach(sp=>sp.onclick=()=>{
    const t=sp.dataset.t; qtGrp=Object.keys(TAG_GROUPS).find(g=>TAG_GROUPS[g].includes(t))||null;
    qtTag=t; qtKw=null; qtShown=60; qtNMon=null; qtNShown=12; qtRender(); window.scrollTo({top:0,behavior:'smooth'}); });
  w.querySelectorAll('.qw').forEach(el=>el.onclick=()=>open(D.members.find(m=>m.cd===el.dataset.cd)));
  const mb=document.getElementById('qtMore'); if(mb) mb.onclick=()=>{ qtShown+=60; qtRender(); };
  try{ pushRouteSoon(); }catch(e){}
};
const TAGS_KW={
 '예산·재정':['예산','재정','국고','기금','결산','세출','추경','재정건전성'],
 '세금':['세금','조세','과세','상속세','법인세','부가가치세','감세','증세','세수','종부세'],
 '부동산·주택':['부동산','주택','아파트','전세','임대','재개발','재건축','분양','집값','LH'],
 '금융':['금융','은행','대출','금리','증권','보험','가계부채','투자','코스피','코스닥'],
 '물가·소비':['물가','소비','내수','장바구니','유통','자영업','소상공인'],
 '노동':['노동','근로','임금','최저임금','노조','고용','해고','비정규직','파업','산업재해','중대재해'],
 '의료·보건':['의료','병원','의사','간호','건강보험','환자','응급','제약','백신','감염'],
 '연금·복지':['연금','복지','기초생활','수급','돌봄','요양','장애인','노인'],
 '저출생·인구':['저출생','출산','육아','보육','인구','다자녀'],
 '교육':['교육','학교','대학','학생','교사','입시','사교육','등록금','학폭'],
 '환경·기후':['환경','기후','탄소','온실가스','미세먼지','재활용','폐기물','생태','오염'],
 '에너지·원전':['에너지','원전','원자력','전기요금','한전','발전소','재생에너지','태양광'],
 '국방·안보':['국방','군','병역','장병','안보','무기','방산','한미','훈련'],
 '북한·통일':['북한','통일','남북','비핵화','개성','대북'],
 '외교·통상':['외교','통상','관세','수출','무역','FTA','대사','정상회담'],
 '교통·물류':['교통','철도','도로','항공','공항','버스','지하철','물류','고속도로'],
 '농림·수산':['농업','농민','어업','수산','축산','쌀','농협','양곡','가축'],
 '과학·AI':['인공지능','AI','반도체','디지털','데이터','플랫폼','스타트업','연구개발','R&D'],
 '방송·통신':['방송','통신','언론','보도','포털','네이버','유튜브','수신료','방통위'],
 '검찰·수사':['검찰','수사','기소','특검','압수수색','공수처','검사'],
 '경찰·치안':['경찰','치안','범죄','마약','피해자','신고'],
 '사법·법원':['법원','재판','판결','헌법재판','법관','영장'],
 '지방·균형발전':['지방','지역','균형발전','지자체','인구소멸','도시'],
 '재난·안전':['재난','안전','참사','화재','소방','침수','사고','점검'],
 '성평등·인권':['성평등','여성','인권','차별','성폭력','아동','청소년'],
 '청년':['청년','대학생','취업준비','첫일자리'],
 '국정운영':['대통령','국무총리','내각','인사','거부권','계엄','탄핵'],
};

/* 일정 캘린더 */
/* ── 일정 캘린더 (공식 일정 + 블로그 활동) ── */
var CAL_SEL = null;      // 선택된 날짜(YYYY-MM-DD)
function calEvents(cd){
  const off=((D.cal||{})[cd]||[]).filter(e=>e.d).map(e=>({d:e.d, k:e.k, c:e.c, g:e.g, t:e.t, s:'off'}));
  const bl=((D.blog||{})[cd]||[]).map(p=>({d:p[0], k:'활동', title:p[1], u:p[2], s:'blog'}));
  return off.concat(bl);
}
function calLabel(e){
  if(e.s==='blog') return '' + (e.title||'');
  return (e.k==='본회의'?'본회의':''+(e.c||'')+'위') + (e.g?' '+e.g:'') + (e.t?' · '+e.t:'');
}
function renderCal(m){
  const box=document.getElementById('calbox'); if(!box) return;
  const ev=calEvents(m.cd);
  if(!ev.length){ box.innerHTML='<div class="empty">기록된 일정이 없어요</div>'; return; }
  const byD={}; ev.forEach(e=>{ (byD[e.d]=byD[e.d]||[]).push(e); });
  const allD=Object.keys(byD).sort();
  let cur=(CAL_SEL||allD[allD.length-1]||ev[0].d).slice(0,7);
  const draw=()=>{
    const Y=+cur.slice(0,4), M=+cur.slice(5,7);
    const startDow=new Date(Y,M-1,1).getDay(), days=new Date(Y,M,0).getDate();
    let cells='';
    for(let i=0;i<startDow;i++) cells+='<span class="cd0"></span>';
    for(let d=1;d<=days;d++){
      const key=Y+'-'+String(M).padStart(2,'0')+'-'+String(d).padStart(2,'0');
      const es=byD[key]||[];
      const hasP=es.some(e=>e.k==='본회의'), hasC=es.some(e=>e.s==='off'&&e.k!=='본회의'), hasB=es.some(e=>e.s==='blog');
      const tip = es.length
        ? key+' · '+es.length+'건\n'+es.slice(0,4).map(e=>'· '+calLabel(e).slice(0,40)).join('\n')+(es.length>4?'\n… 외 '+(es.length-4)+'건':'')
        : key+' · 일정 없음';
      cells+='<span class="cd1'+(es.length?' has':'')+(CAL_SEL===key?' sel':'')+'" data-tip="'+esc(tip)+'"'
        + (es.length?' data-calday="'+key+'" style="cursor:pointer"':'')+'>'+d
        + '<i>'+(hasP?'<u class="p"></u>':'')+(hasC?'<u class="c"></u>':'')+(hasB?'<u class="b"></u>':'')+'</i></span>';
    }
    const shown = CAL_SEL ? (byD[CAL_SEL]||[]) : ev.filter(e=>e.d.startsWith(cur));
    shown.sort((a,b)=>a.d.localeCompare(b.d)||String(a.t||'').localeCompare(String(b.t||'')));
    box.innerHTML=
      '<div class="calhd"><button id="calP" aria-label="이전 달">‹</button><b>'+Y+'년 '+M+'월</b>'
      + '<button id="calN" aria-label="다음 달">›</button>'
      + '<span class="callg"><u class="p"></u>본회의 <u class="c"></u>위원회 <u class="b"></u>활동</span></div>'
      + '<div class="calgrid">'+['일','월','화','수','목','금','토'].map(d=>'<span class="cdw">'+d+'</span>').join('')+cells+'</div>'
      + '<div class="calsub">'+(CAL_SEL
          ? ''+CAL_SEL+' · '+shown.length+'건 <a href="javascript:;" id="calAll">이 달 전체 보기</a>'
          : ''+Y+'년 '+M+'월 · '+shown.length+'건 <span class="cs">날짜를 누르면 그날만 봐요</span>')+'</div>'
      + '<div class="callist">'+(shown.length? shown.map(e=>{
          if(e.s==='blog') return '<a class="calev blog" href="'+esc(e.u)+'" target="_blank" rel="noopener"'
            + ' data-tip="'+esc(e.d+' · 의원이 직접 올린 글 · 눌러서 원문 보기')+'">'
            + '<b>'+(+e.d.slice(8))+'일</b><span class="kd2 b">활동</span>'
            + '<span>'+esc(e.title||'')+'</span><span class="go2"></span></a>';
          return '<div class="calev" data-tip="'+esc(e.d+' · '+(e.k==='본회의'?'본회의':(e.c||'')+'위원회')+(e.g?' · '+e.g:'')+(e.t?' · '+e.t:''))+'">'
            + '<b>'+(+e.d.slice(8))+'일</b>'
            + '<span class="kd2 '+(e.k==='본회의'?'p':'c')+'">'+(e.k==='본회의'?'본회의':''+esc(e.c||'')+'위')+'</span>'
            + '<span>'+esc(e.g||'')+(e.t?' · '+esc(e.t):'')+'</span></div>';
        }).join('') : '<div class="empty">이 기간에는 기록된 일정이 없어요</div>')+'</div>';
    const p=document.getElementById('calP'), n2=document.getElementById('calN');
    if(p) p.onclick=()=>{ const d=new Date(Y,M-2,1); cur=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); CAL_SEL=null; draw(); };
    if(n2) n2.onclick=()=>{ const d=new Date(Y,M,1); cur=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); CAL_SEL=null; draw(); };
    const ca=document.getElementById('calAll');
    if(ca) ca.onclick=()=>{ CAL_SEL=null; draw(); };
    box.querySelectorAll('.cd1[data-calday]').forEach(el=>el.onclick=()=>{
      CAL_SEL = (CAL_SEL===el.dataset.calday) ? null : el.dataset.calday;
      cur = (CAL_SEL||cur).slice(0,7); draw();
      const lst=box.querySelector('.callist'); if(lst) lst.scrollIntoView({behavior:'smooth', block:'nearest'});
    });
  };
  draw();
}
let CURM=null, ACT_F=null;
function renderActs(x){
  const box=document.getElementById('actsbox'); if(!box) return;
  box.innerHTML = mergedActs(x, ACT_F);
  box.querySelectorAll('.t[data-x]').forEach(t=>t.onclick=()=>{
    const e=document.getElementById(t.dataset.x); if(e) e.classList.toggle('on'); });
  const f=document.getElementById('actf');
  if(f){
    [...f.querySelectorAll('button')].forEach(b=>b.setAttribute('aria-pressed', String((b.dataset.f||'')===(ACT_F||''))));
    const old=f.querySelector('#actfTag'); if(old) old.remove();
    if(ACT_F && /^[BC]:/.test(ACT_F)){
      const tag=document.createElement('button');
      tag.id='actfTag'; tag.dataset.f=ACT_F; tag.setAttribute('aria-pressed','true');
      tag.innerHTML='#'+esc(ACT_F.slice(2))+' <span style="opacity:.75;margin-left:2px">×</span>';
      f.appendChild(tag);
    }
  }
}
/* 의정활동 목록을 시트 고정 헤더 바로 아래로 스크롤 */
function showActs(){
  const sh2=document.getElementById('sheet'), af2=document.getElementById('actf');
  if(!sh2||!af2) return;
  const hd=sh2.querySelector('.sh-hd'), tb=sh2.querySelector('.tabs');
  const eff = innerWidth<=640 ? (tb?tb.getBoundingClientRect().height:0)
                              : (hd?hd.getBoundingClientRect().height:0);
  sh2.scrollTop += af2.getBoundingClientRect().top - sh2.getBoundingClientRect().top - eff - 8;
}
document.addEventListener('click',e=>{
  const qc=e.target.closest('.qclick');
  if(qc && CURM && !e.target.closest('[data-qtag],[data-qopen],.cxgo')){
    const box=qc.querySelector('.qctx');
    if(box){
      if(!box.dataset.done){
        const my=(D.quotes||[]).filter(z=>z.c===CURM.cd);
        const z=my[+qc.dataset.qx];
        if(z){ box.innerHTML=ctxHTML(z); box.dataset.done='1'; }
      }
      box.hidden=!box.hidden;
    }
    return; }
  const qt2=e.target.closest('[data-qtoggle]');
  if(qt2){ const k=qt2.dataset.qtoggle;
    if(qtOpen.has(k)) qtOpen.delete(k); else qtOpen.add(k);
    qtRender();
    setTimeout(()=>{ const el=document.querySelector('.qcard[data-qk="'+CSS.escape(k)+'"]');
      if(el) el.scrollIntoView({behavior:'smooth', block:'nearest'}); },30);
    return; }
  const sb=e.target.closest('#srcbar button');
  if(sb){ qtSrc=sb.dataset.src||null; qtShown=60; qtRender(); return; }
  const qo=e.target.closest('[data-qopen]');
  if(qo){ gotoQuoteOne(qo.dataset.qopen); return; }
  const ny=e.target.closest('[data-ny]');
  if(ny && CURM){ NEWS_Y = (NEWS_Y===ny.dataset.ny) ? null : ny.dataset.ny;
    const sec=document.querySelector('[data-p=n]'); if(sec) sec.innerHTML=renderNews(CURM);
    return; }
  if(e.target.closest('#nyAll') && CURM){ NEWS_Y=null;
    const sec=document.querySelector('[data-p=n]'); if(sec) sec.innerHTML=renderNews(CURM);
    return; }
  const af=e.target.closest('#afilter button');
  if(af && CURM){ A_F=af.dataset.af||null;
    const a=assetOf(CURM.cd);
    if(a){ const al=document.getElementById('alist');
      const det=al && al.closest('details'); if(det && !det.open) det.open=true;
      al.innerHTML=assetRows(a, D.acats||[], D.arels||[]);
      [...document.querySelectorAll('#afilter button')].forEach(b=>b.setAttribute('aria-pressed', String((b.dataset.af||'')===(A_F||''))));
    } return; }
  const ac=e.target.closest('[data-af]:not(button)');
  if(ac && CURM){ A_F=ac.dataset.af||null;
    const a=assetOf(CURM.cd);
    if(a){ const al=document.getElementById('alist');
      const det=al && al.closest('details'); if(det && !det.open) det.open=true;
      al.innerHTML=assetRows(a, D.acats||[], D.arels||[]);
      [...document.querySelectorAll('#afilter button')].forEach(b=>b.setAttribute('aria-pressed', String((b.dataset.af||'')===(A_F||''))));
      setTimeout(()=>{ al.scrollIntoView({behavior:'smooth', block:'center'}); }, 60); }
    return; }
  const fb=e.target.closest('#actf button');
  if(fb && CURM){ const v=fb.dataset.f||null; ACT_F=(v===ACT_F)?null:v; renderActs(CURM); return; }
  /* 그래프 클릭으로 필터·정렬을 바꾸는 동작은 제거했다(사용자 요청). 그래프는 표시 전용. */
  /* 예외(사용자 요청): 의정활동의 [처리 결과]·[어느 위원회 법안일까] 차트는
     클릭 시 하단 목록의 필터 태그가 연동되고 그 목록으로 스크롤한다. */
  const bf=e.target.closest('[data-bf]');
  if(bf && CURM){ ACT_F='B:'+bf.dataset.bf;
    renderActs(CURM); setTimeout(showActs,60); return; }
  const cf=e.target.closest('[data-cf]');
  if(cf && CURM){ ACT_F='C:'+cf.dataset.cf;
    renderActs(CURM); setTimeout(showActs,60); return; }
  /* 예외(사용자 요청): '의견이 갈린 법안에서는' 도넛만 클릭 시 바로 아래에
     그 의원의 찬성/반대/기권/불참 법안을 펼쳐 보여준다. */
  const seg=e.target.closest('[data-vf]');
  if(seg && CURM){
    const vf=seg.dataset.vf;
    const box=document.getElementById('vfSum');
    if(!box) return;
    if(vf==='불참'){
      box.hidden=false;
      box.innerHTML='<div class="vfh">불참 <b>'+nf((CURM.cvote||{}).x||0)+'건</b></div>'
        +'<p class="vfp">표결에 참여하지 않은 건이라 개별 안건 기록이 없어요.</p>';
      return;
    }
    const NM={'찬성':'1','반대':'2','기권':'3'};
    const pos=(D.midx||[]).indexOf(CURM.cd);
    const hits=[];
    (D.bills||[]).forEach(b=>{ if(!b.c) return;
      const v=((D.vfull||{})[b.id]||'')[pos];
      if(v===NM[vf]) hits.push(b); });
    hits.sort((a,b)=>(b.dt||'').localeCompare(a.dt||''));
    box.hidden=false;
    box.innerHTML =
      '<div class="vfh"><span class="vfd vf-'+NM[vf]+'"></span>'+esc(vf)+' <b>'+nf(hits.length)+'건</b>'
      + '<button class="vfx2" id="vfClose" aria-label="닫기"><svg class="ic-sm" aria-hidden="true"><use href="#i-x"/></svg></button></div>'
      + (hits.length? '<ul class="vfl">'+hits.slice(0,5).map(b=>
          '<li data-vfb="'+esc(b.id)+'" data-vfno="'+esc(String(b.no||''))+'" style="cursor:pointer">'
          + '<div class="vfr"><span class="vfn">'+esc(b.name.replace(/\(.*$/,'').slice(0,40))+'</span>'
          + '<em>'+esc(b.dt||'')+'</em></div>'
          + '<div class="vfxp" hidden></div></li>').join('')+'</ul>'
          + (hits.length>5? '<div class="vfmore">외 '+nf(hits.length-5)+'건 · 의정활동 탭에서 전부 볼 수 있어요</div>':'')
        : '<p class="vfp">해당하는 쟁점 표결이 없어요.</p>');
    return;
  }
  /* vfSum 목록의 법안 클릭 → 그 의원의 표결 + 핵심 3줄 요약 펼침 */
  const vb=e.target.closest('[data-vfb]');
  if(vb && CURM){
    const d2=vb.querySelector('.vfxp');
    if(d2){
      if(!d2.dataset.done){
        const bid=vb.dataset.vfb;
        const pos=(D.midx||[]).indexOf(CURM.cd);
        const NM2={'1':'찬성','2':'반대','3':'기권','0':'불참'};
        const v=((D.vfull||{})[bid]||'')[pos];
        const verdict=NM2[v]||'기록 없음';
        const col=v==='1'?'var(--pos)':v==='2'?'var(--neg)':'var(--neu)';
        const sum=(D.vsums||{})[bid]||(D.sums||{})[vb.dataset.vfno];
        d2.innerHTML='<div style="margin:8px 0 6px;font-weight:700">'+esc(CURM.name)+' 의원은 <b style="color:'+col+'">'+esc(verdict)+'</b>했어요</div>'
          + (sum? easyize(sum,{}) : '<p class="vfp">등록된 요약이 없어요.</p>');
        d2.dataset.done='1';
      }
      d2.hidden=!d2.hidden;
    }
    return;
  }
  if(e.target.closest('#vfClose')){ const b2=document.getElementById('vfSum'); if(b2){ b2.hidden=true; b2.innerHTML=''; } }
});
const _open0=open;
open=function(m){ CURM=m; ACT_F=null; _open0(m); renderCal(m); renderActs(m); };
render();   // V3 래퍼 적용 재렌더

/* ── 해시 라우터 ──
   단일 파일이라 서버 라우팅을 쓸 수 없고 file:// 로도 열려야 하므로 hash 기반.
   브라우저 뒤로가기가 서비스를 이탈하지 않고 이전 화면으로 돌아가게 한다. */
var ROUTE_LOCK = false;                    // applyRoute 중 재진입 방지
const VIEW_SLUG = {card:'의원', compact:'의원', map:'지역구', sess:'법안',
                   qt:'발언', quiz:'매칭', my:'내의원'};
const SLUG_VIEW = {'의원':'card','지역구':'map','법안':'sess','발언':'qt','매칭':'quiz','내의원':'my'};
const TAB_SLUG  = {p:'프로필', b:'의정활동', s:'발언', w:'재산', n:'뉴스', e:'청원', c:'일정'};
const SLUG_TAB  = Object.fromEntries(Object.entries(TAB_SLUG).map(([k,v])=>[v,k]));

function currentRoute(){
  const seg=['', VIEW_SLUG[viewMode]||'발언'];
  if(viewMode==='qt' && typeof qtCtx!=='undefined' && qtCtx){
    seg.push('맥락', encodeURIComponent(qtCtx));
  }
  if(viewMode==='sess'){
    if(hotOnly) seg.push('쟁점');
    else if(curTag!=null) seg.push('주제', encodeURIComponent((D.tags||[])[curTag]||curTag));
    else if(curSess) seg.push('회기', encodeURIComponent(curSess));
  }
  if(viewMode==='sess' && typeof CURBILL!=='undefined' && CURBILL){
    seg.push('의안', encodeURIComponent(CURBILL));
  }
  if(CURM && sheet.classList.contains('on')){
    // 의원 화면에서는 접두를 반복하지 않는다 (#/의원/강명구)
    if(seg[1]!=='의원') seg.push('의원');
    seg.push(encodeURIComponent(CURM.name));
    const t=sheet.querySelector('.tab[aria-selected=true]');
    if(t && t.dataset.t!=='p') seg.push(TAB_SLUG[t.dataset.t]||t.dataset.t);
  }
  let h='#'+seg.join('/').replace(/^#?\/*/,'/');
  try{ h+=routeQuery(); }catch(e){}
  return h;
}
function pushRoute(replace){
  if(ROUTE_LOCK) return;
  const h=currentRoute();
  if(location.hash===h) return;
  try{ history[replace?'replaceState':'pushState']({r:h}, '', h); }catch(e){}
}
function applyRoute(){
  ROUTE_LOCK = true;
  try{
    const h0=location.hash.replace(/^#\/?/,'');
    const qi2=h0.indexOf('?');
    const qs2=qi2>=0? h0.slice(qi2+1) : '';
    const raw=decodeURIComponent(qi2>=0? h0.slice(0,qi2) : h0);
    const p=raw? raw.split('/').map(x=>decodeURIComponent(x)) : [];
    try{ applyRouteQuery(new URLSearchParams(qs2), SLUG_VIEW[p[0]]||'qt'); }catch(e){}
    const v=SLUG_VIEW[p[0]] || 'qt';

    // 의원 상세 열기 여부
    const mi=p.indexOf('의원', 1);
    const memberName = (p[0]==='의원' && p.length>1 && !SLUG_VIEW[p[1]]) ? p[1]
                      : (mi>0 ? p[mi+1] : null);

    // 법안 하위 상태
    if(v==='qt'){
      qtCtx = (p[1]==='맥락' && p[2]) ? p[2] : null;
    }
    if(v==='sess'){
      const bi2=p.indexOf('의안',1);
      if(bi2>0 && p[bi2+1]){ const bid3=p[bi2+1];
        setTimeout(()=>{ try{ gotoBill(bid3); }catch(e){} }, 180); }
      hotOnly = (p[1]==='쟁점');
      if(p[1]==='주제'){ const ti=(D.tags||[]).indexOf(p[2]); curTag = ti>=0? ti : null; }
      else curTag=null;
      if(p[1]==='회기' && p[2]) curSess=p[2];
    }
    if(viewMode!==v){
      viewMode=v;
      [...document.querySelectorAll('#view button')].forEach(z=>
        z.setAttribute('aria-pressed', z.dataset.v===v));
    }
    render();

    if(memberName){
      const m=(D.members||[]).find(x=>x.name===memberName);
      if(m){
        open(m);
        const tabSlug=p[p.length-1];
        const tk=SLUG_TAB[tabSlug];
        if(tk){ const t=sheet.querySelector('.tab[data-t="'+tk+'"]'); if(t) t.click(); }
      }
    } else if(sheet.classList.contains('on')) close();
  } finally { ROUTE_LOCK = false; }
}

/* 핀치 줌은 접근성을 위해 막지 않는다(저시력 확대 필수).
   더블탭 확대만 touch-action:manipulation(CSS)으로 완화한다. */

/* 모바일 의원 상세 — 아래로 끌어내려 닫기.
   시트가 맨 위에 있을 때만 시작한다(내용 스크롤과 충돌 방지). */
(function(){
  const sh=document.getElementById('sheet'); if(!sh) return;
  let sy=0, dy=0, on=false;
  const TH=90;                                   // 이 이상 끌면 닫는다
  const reset=snap=>{
    sh.style.transition = snap ? 'transform .22s cubic-bezier(.2,0,0,1)' : '';
    sh.style.transform='';
    if(snap) setTimeout(()=>{ sh.style.transition=''; },240);
  };
  sh.addEventListener('touchstart',e=>{
    if(innerWidth>640 || e.touches.length!==1 || sh.scrollTop>0){ on=false; return; }
    on=true; sy=e.touches[0].clientY; dy=0; sh.style.transition='none';
  },{passive:true});
  sh.addEventListener('touchmove',e=>{
    if(!on) return;
    dy=e.touches[0].clientY-sy;
    if(dy<=0){ sh.style.transform=''; return; }
    if(sh.scrollTop>0){ on=false; reset(); return; }
    sh.style.transform='translate(-50%,'+dy+'px)';
  },{passive:true});
  const end=()=>{
    if(!on) return; on=false;
    if(dy>TH){ reset(false); close(); }          // close()가 .on을 떼며 원래 애니메이션으로 내려간다
    else reset(true);
    dy=0;
  };
  sh.addEventListener('touchend',end,{passive:true});
  sh.addEventListener('touchcancel',end,{passive:true});
})();

/* 모바일 의원 상세 — 헤더가 위로 밀려 올라가되 탭 줄은 남도록 오프셋 계산.
   sticky top = -(헤더높이 - 탭줄높이) */
function shOffset(){
  const sh=document.getElementById('sheet'); if(!sh) return;
  const hd=sh.querySelector('.sh-hd'), tb=sh.querySelector('.tabs');
  if(!hd||!tb || innerWidth>640){ sh.style.removeProperty('--shOff'); return; }
  const off=Math.max(0, Math.round(hd.getBoundingClientRect().height - tb.getBoundingClientRect().height));
  sh.style.setProperty('--shOff', off+'px');
}
addEventListener('resize', shOffset);

/* 마스트헤드 제목 → 홈(첫 화면). 검색·정당·지역 필터도 초기화 */
(function(){
  const h=document.querySelector('.mast h1'); if(!h) return;
  h.style.cursor='pointer';
  h.setAttribute('role','link'); h.setAttribute('tabindex','0'); h.title='첫 화면으로';
  const go=()=>{
    q.value=''; activeParty=null;
    if(typeof sidoSel!=='undefined' && sidoSel) sidoSel.value='';
    [...document.querySelectorAll('#parties .chip')].forEach(c=>c.setAttribute('aria-pressed','false'));
    try{ history.pushState({},'','#/발언'); }catch(e){ location.hash='#/발언'; }
    applyRoute();
    scrollTo(0,0);
  };
  h.addEventListener('click',go);
  h.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); go(); } });
})();

/* 지표 설명 바텀시트 */
(function(){
  // 시트 마크업이 이 스크립트보다 뒤에 있어 등록 시점엔 null이다 → 클릭 때 조회한다
  const $sh=()=>document.getElementById('mSheet');
  const openS=()=>{
    const sh=$sh(); if(!sh) return;
    const body=document.getElementById('mSheetBody'); body.innerHTML = METRIC_DOC.map(d=>
      '<details class="mrow"><summary><b>'+esc(d[0])+'</b><span>'+esc(d[1])+'</span></summary><p>'+esc(d[2])+'</p></details>').join('')
      + '<div class="cs" style="margin-top:10px">모든 수치는 국회 공식 공개 자료를 집계한 값이에요. '
      + '공식 집계와 의원별 기록이 다를 때는 두 숫자를 모두 보여줘요.</div>';
    sh.hidden=false; requestAnimationFrame(()=>sh.classList.add('on'));
    document.body.style.overflow='hidden'; };
  const closeS=()=>{ const sh=$sh(); if(!sh) return;
    sh.classList.remove('on'); document.body.style.overflow='';
    setTimeout(()=>{ sh.hidden=true; }, 200); };
  document.addEventListener('click', e=>{
    if(e.target.closest('#mHelp')) { openS(); return; }
    if(e.target.closest('#mSheetX') || e.target.closest('#mSheetDim')) closeS();
  });
  addEventListener('keydown', e=>{ const sh=$sh(); if(e.key==='Escape' && sh && !sh.hidden) closeS(); });
})();
/* 상태 변화를 URL에 반영 */
(function(){
  const vb=document.getElementById('view');
  if(vb) vb.addEventListener('click', ()=>setTimeout(pushRoute,0));
  addEventListener('popstate', applyRoute);
  addEventListener('hashchange', ()=>{ if(!ROUTE_LOCK) applyRoute(); });
  if(location.hash.length>2) setTimeout(applyRoute,0); else pushRoute(true);
})();


/* ── 즉시 표시 커스텀 툴팁 ──
   호버가 있는 기기: 마우스를 따라다니는 말풍선.
   호버가 없는 기기(모바일): 마우스 경로는 끄고, 길게 누르면(0.5초) 하단 토스트로 보여준다.
   짧은 탭은 원래 클릭 동작(정렬 등)을 그대로 수행하므로 충돌이 없다. */
(function(){
  let tip=document.getElementById('gtip');
  if(!tip){ tip=document.createElement('div'); tip.id='gtip'; document.body.appendChild(tip); }
  const noHover = matchMedia('(hover: none)').matches;

  if(!noHover){
    let cur=null;
    const place=e=>{ const pad=14;
      const r=tip.getBoundingClientRect();
      let x=e.clientX+pad, y=e.clientY+pad;
      if(x+r.width>innerWidth-8) x=e.clientX-r.width-pad;
      if(y+r.height>innerHeight-8) y=e.clientY-r.height-pad;
      tip.style.left=Math.max(6,x)+'px'; tip.style.top=Math.max(6,y)+'px'; };
    document.addEventListener('mousemove',e=>{
      const el=(e.target&&e.target.closest)?e.target.closest('[data-tip]'):null;
      if(el!==cur){ cur=el;
        if(el){ tip.textContent=el.getAttribute('data-tip'); tip.classList.add('on'); }
        else tip.classList.remove('on'); }
      if(el) place(e);
    }, true);
    document.addEventListener('scroll',()=>{ cur=null; tip.classList.remove('on'); }, true);
    return;
  }

  // 모바일: 길게 누르면 하단 토스트
  tip.classList.add('toast');
  let timer=null, hideT=null;
  const show=el=>{
    tip.textContent=el.getAttribute('data-tip');
    tip.style.left=''; tip.style.top='';
    tip.classList.add('on');
    clearTimeout(hideT); hideT=setTimeout(()=>tip.classList.remove('on'), 3000);
    if(navigator.vibrate) navigator.vibrate(8);
  };
  document.addEventListener('touchstart',e=>{
    const el=e.target.closest && e.target.closest('[data-tip]');
    clearTimeout(timer);
    if(el) timer=setTimeout(()=>show(el), 500);
  }, {capture:true, passive:true});
  ['touchmove','touchend','touchcancel'].forEach(t=>
    document.addEventListener(t, ()=>clearTimeout(timer), {capture:true, passive:true}));
})();

/* ================================================================
   개선 모듈 (2026-08-18) — 접근성·공유·비교·내보내기
   ================================================================ */

/* ── URL 쿼리 상태 ── */
var CURBILL=null;
function routeQuery(){
  const ps=new URLSearchParams();
  if(viewMode==='card'||viewMode==='compact'){
    const k=q.value.trim(); if(k) ps.set('q',k);
    if(sortSel.value!=='name') ps.set('sort',sortSel.value);
    if(activeParty) ps.set('party',activeParty);
    if(sidoSel.value) ps.set('sido',sidoSel.value);
  }
  if(viewMode==='qt'){
    if(qtSrc) ps.set('src',qtSrc); if(qtGrp) ps.set('grp',qtGrp);
    if(qtTag) ps.set('tag',qtTag); if(qtKw) ps.set('kw',qtKw);
    if(qtSort && qtSort!=='new') ps.set('sort',qtSort);
    if(activeParty) ps.set('party',activeParty);
    const k=((qtQ2||'').trim() || q.value.trim()); if(k) ps.set('q',k);
  }
  if(viewMode==='map'){ const k=q.value.trim(); if(k) ps.set('q',k); }
  const s=ps.toString(); return s? '?'+s : '';
}
function applyRouteQuery(ps, v){
  if(v==='card'||v==='compact'){
    q.value=ps.get('q')||'';
    const so=ps.get('sort'); sortSel.value=(so&&[...sortSel.options].some(o=>o.value===so))?so:'name';
    sidoSel.value=ps.get('sido')||'';
    activeParty=ps.get('party')||null;
    [...document.querySelectorAll('#parties .chip')].forEach(c=>c.setAttribute('aria-pressed', c.dataset.p===activeParty));
  }
  if(v==='qt'){
    qtSrc=ps.get('src')||null; qtGrp=ps.get('grp')||null;
    qtTag=ps.get('tag')||null; qtKw=ps.get('kw')||null;
    { const so2=ps.get('sort'); qtSort=(so2 && QT_SORTS.some(o=>o[0]===so2))? so2 : 'new'; }
    if(ps.has('party')){ activeParty=ps.get('party')||null;
      [...document.querySelectorAll('#parties .chip')].forEach(c=>c.setAttribute('aria-pressed', c.dataset.p===activeParty)); }
    if(ps.get('q')!=null){ qtQ2=ps.get('q'); }
  }
  if(v==='map' && ps.get('q')!=null) q.value=ps.get('q');
}
/* 의안 롤콜 열림 상태를 URL에 반영 */
(function(){
  const _tv=toggleVotes;
  toggleVotes=function(billId){
    _tv(billId);
    try{
      const box=document.getElementById('vp-'+billId);
      CURBILL = (box && box.classList.contains('on')) ? billId : null;
      pushRoute(true);
    }catch(e){}
  };
})();

/* ── 화면별 문서 제목 (공유·탭 구분용) ── */
function updateTitle(){
  let t='정치인 도감 · 제22대 국회';
  try{
    if(typeof CURM!=='undefined' && CURM && sheet.classList.contains('on'))
      t=CURM.name+' 의원 · 정치인 도감';
    else{
      const nm={map:'지역구',sess:'법안',qt:'발언',quiz:'표결 매칭',my:'내 의원'}[viewMode];
      if(nm) t=nm+' · 정치인 도감';
    }
  }catch(e){}
  if(document.title!==t) document.title=t;
}
(function(){
  const _pr=pushRoute;
  pushRoute=function(r){ _pr(r); updateTitle(); };
  addEventListener('hashchange', updateTitle);
  addEventListener('popstate', updateTitle);
  setTimeout(updateTitle, 0);
})();

/* ── 의원 상세 시트: 포커스 이동·트랩·배경 격리 ──
   배경 격리(inert)는 close()를 감싸는 방식으로 하면 안 된다.
   scrim 클릭 리스너가 '감싸기 이전의 원본 close' 참조를 들고 있어서,
   딤 배경으로 닫으면 inert가 그대로 남아 이후 모든 카드 클릭이 막혔다.
   그래서 시트의 class 변화를 감시해 열림/닫힘 한 곳에서만 처리한다. */
(function(){
  let lastFocus=null;
  const bgEls=()=>[document.querySelector('main'),document.querySelector('.mast'),
    document.querySelector('.navbar'),document.getElementById('toolbar'),
    document.getElementById('fRow'),document.getElementById('idx'),
    document.querySelector('footer'),document.getElementById('cmpbar')].filter(Boolean);
  const setInert=on=>bgEls().forEach(el=>{ try{ el.inert=on; }catch(e){} });

  const _o=open;
  open=function(m){
    if(!sheet.classList.contains('on')) lastFocus=document.activeElement;
    _o(m);
    try{
      sheet.setAttribute('aria-label', (m&&m.name? m.name+' 의원 상세':'의원 상세'));
      sheet.tabIndex=-1;
      setTimeout(()=>{ try{ sheet.focus({preventScroll:true}); }catch(e){} }, 40);
    }catch(e){}
  };

  /* 어떤 경로로 닫히든(scrim·X·ESC·드래그·라우터) 여기서 단일 처리 */
  let wasOn=false;
  new MutationObserver(()=>{
    const on=sheet.classList.contains('on');
    if(on===wasOn) return;
    wasOn=on;
    setInert(on);
    if(!on){
      try{
        if(lastFocus && lastFocus!==document.body && document.contains(lastFocus))
          lastFocus.focus({preventScroll:true});
        else{ const c=document.querySelector('.card'); if(c) c.focus({preventScroll:true}); }
      }catch(e){}
    }
  }).observe(sheet,{attributes:true,attributeFilter:['class']});

  /* 안전망 — 어떤 이유로든 시트가 닫혔는데 배경이 잠겨 있으면 즉시 푼다 */
  const unstick=()=>{
    if(!sheet.classList.contains('on') && document.querySelector('main')?.inert){ setInert(false); wasOn=false; }
  };
  ['pointerdown','keydown','visibilitychange'].forEach(ev=>
    document.addEventListener(ev, unstick, true));
  addEventListener('pageshow', unstick);
  addEventListener('popstate', ()=>setTimeout(unstick,0));

  /* 문서 레벨에 둔다 — 재렌더로 포커스가 body로 빠지면 시트에 붙은 리스너는 못 잡는다 */
  document.addEventListener('keydown',e=>{
    if(sheet.classList.contains('on')) trapTab(e, sheet);
  });
  /* 시트 안 별표 버튼 키보드 지원 */
  sheet.addEventListener('keydown',e=>{
    const st=e.target.closest && e.target.closest('.starbtn');
    if(st && (e.key==='Enter'||e.key===' ')){ e.preventDefault(); e.stopPropagation(); toggleStar(st.dataset.cd); }
  });
})();

/* ── 매칭 답변 자동 저장 ── */
(function(){
  const _qr=quizRender;
  quizRender=function(){ _qr(); try{ saveQuiz(); }catch(e){} };
})();

/* ── 내보내기 유틸 ── */
function dlBlob(name, blob){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download=name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 5000);
}
function dlCSV(name, rows){
  const csv='\uFEFF'+rows.map(r=>r.map(v=>{ v=String(v??'');
    return /[",\n]/.test(v)? '"'+v.replace(/"/g,'""')+'"' : v; }).join(',')).join('\n');
  dlBlob(name, new Blob([csv],{type:'text/csv;charset=utf-8'}));
}
function membersCSV(){
  const rows=[['이름','정당','지역구','시도','선수','표결참여율(%)','참여/전체','대표발의(건)','발의성사율(%)','당론이탈률(%)','이탈/쟁점','발언구간(건)','청원소개(건)','재산(천원)','1년증감(천원)','5년보도(건)']];
  D.members.forEach(m=>{ const a=(D.assets||{})[m.cd];
    rows.push([m.name,m.party,m.dist||'비례대표',m.sido||'',m.reele||'',
      m.vote?.part??'', (m.vote? (m.vote.tot-m.vote.absent)+'/'+m.vote.tot:''),
      m.prop?.n??'', m.prop?.rate??'', m.cdefect?.rate??'',
      (m.cdefect? m.cdefect.d+'/'+m.cdefect.n:''), m.speech?.n??'', m.pttN||0,
      a? a.t:'', a? (a.t-a.p):'', ((D.news5||{})[m.cd]||[]).length]);
  });
  dlCSV('정치인도감_의원지표_'+(D.meta.gen||'')+'.csv', rows);
}
function payloadJSON(){
  dlBlob('정치인도감_데이터_'+(D.meta.gen||'')+'.json',
    new Blob([JSON.stringify(D)],{type:'application/json'}));
}

/* ── 데이터 사전 ── */
const DATA_DICT=[
 ['meta','수집일(gen)·대수(age)·소스별 건수 요약'],
 ['members[299]','의원. cd=의원코드(조인 키), name, party, dist(지역구), sido, sgg(선거구코드), reele(선수), bth(출생), cmt/cmts(위원회), vote{part,tot,yes,no,abs,absent}, cvote(쟁점표결), prop{n,pass,rate}, propD(발의 상세분포), cdefect{n,d,rate}(당론이탈·자체계산), speech{n,recent}(국감 발언구간), sessVote(회기별), rankAll/rankParty(백분위), bills/votes(최근 25건), ptt/pttN(청원), occ(겸직), bio, photo(base64)'],
 ['bills[1,656]','기명표결 의안. id=의안ID(PRC_…, likms 링크와 조인), name, dt, kind, res(결과), y/n/b(공식집계), cmt, tags'],
 ['vfull','의안ID → 299자 표결 문자열 (1=찬성 2=반대 3=기권 0=불참 -=기록없음), midx의 순서와 대응'],
 ['midx[299]','vfull 문자열의 자리 순서 = 의원 cd 배열'],
 ['quotes[14,211]','발언. c=의원cd, s=발언문, t=주제태그, kw=키워드, m=위원회, d=날짜, rid=회의록ID, x=[앞발언,뒤발언], nq=관련보도 인덱스, src=감사(8,892)|언론(5,319) · 둘 다 의원당 최대 40건'],
 ['quotes[].src=언론','기사 본문의 따옴표 인용. ms=매체목, mu=원문URL, mt=기사제목, body=1, n=같은 발언을 실은 매체 수 · 화자 귀속은 인용문에서 가장 가까운 이름(+주격조사) 또는 인용 끝~첫 종결 발화동사 사이의 이름으로만 판정'],
 ['sums','의안번호 → 제안이유·주요내용 요약 3줄'],
 ['assets','의원cd → 재산. t=총액(천원), p=종전, a=자산합, b=채무, c=[분류,금액], r=[관계,금액], i=신고내역(국회공보 원문), rk=순위 · 277명'],
 ['news5 / qnews / blog','의원cd → 5년 보도목록 / 발언 관련 보도 / 블로그 글 (제목·매체·날짜·링크만)'],
 ['nvn','주제별 언론 보도 (네이버 검색 API · 최근 1년). p=매체명 사전, dm=도메인 사전, mo=13개월 버킷, a=기사[날짜,제목,매체idx,도메인idx,경로,요약90자], t=태그idx → {i:수록기사 idx, n:전량 건수, pn:매체수, f/l:최초·최종일, m:월별 건수, p:상위매체, q:검색어}'],
 ['quotes[].nq','발언 → 같은 주제·발언일 ±10일 기사의 nvn.a 인덱스 (최대 3건, 5,084건에 부여)'],
 ['geo','선거구 지도. features(254개 path)·outlines·labels — 오마이뉴스 2024_22_elec_map(MIT)'],
 ['quiz','매칭 기본 문항(의안ID·요약)'],
 ['sched / cal','의원 일정(수집 시점 기록)'],
 ['라이선스','원자료: 열린국회정보 OpenAPI 공공누리 제1유형(출처표시·상업적 이용·변형 가능) · 이 사이트의 파생 지표(당론 이탈률·주제태그·쟁점분류)도 동일 조건으로 자유롭게 쓰되 출처(정치인 도감)를 밝혀 주세요'],
];
(function(){
  const modal=document.createElement('div'); modal.id='cmpModal';
  modal.innerHTML='<div class="cmpin" role="dialog" aria-modal="true" aria-label="비교·데이터 사전"><div id="cmpBody"></div>'
    +'<div class="cmx"><button id="cmpCsv" class="pri2" hidden>CSV 저장</button><button id="cmpX">닫기</button></div></div>';
  document.body.appendChild(modal);
  modal.addEventListener('click',e=>{ if(e.target===modal) cmpClose(); });
  document.getElementById('cmpX').onclick=()=>cmpClose();
  addEventListener('keydown',e=>{ if(e.key==='Escape' && modal.classList.contains('on')) cmpClose(); });
})();
function cmpClose(){ document.getElementById('cmpModal').classList.remove('on'); }
function showDict(){
  const b=document.getElementById('cmpBody');
  b.innerHTML='<h3>데이터 사전</h3><div class="cs2">전체 데이터 JSON의 최상위 키와 필드 뜻이에요 · 수집일 '+esc(D.meta.gen||'')+'</div>'
    +'<table><thead><tr><th style="text-align:left">키</th><th style="text-align:left">내용</th></tr></thead><tbody>'
    +DATA_DICT.map(d=>'<tr><td>'+esc(d[0])+'</td><td style="text-align:left">'+esc(d[1])+'</td></tr>').join('')
    +'</tbody></table>';
  document.getElementById('cmpCsv').hidden=true;
  document.getElementById('cmpModal').classList.add('on');
}

/* ── 의원 비교 (최대 3명) ── */
var CMP=(()=>{ try{ return JSON.parse(localStorage.getItem('dogam.cmp.v1'))||[]; }catch(e){ return []; } })();
function cmpSave(){ try{ localStorage.setItem('dogam.cmp.v1', JSON.stringify(CMP)); }catch(e){} }
function dToast(msg){
  let t=document.getElementById('dtoast');
  if(!t){ t=document.createElement('div'); t.id='dtoast'; t.setAttribute('role','status'); document.body.appendChild(t); }
  t.textContent=msg; t.classList.add('on');
  clearTimeout(t.__h); t.__h=setTimeout(()=>t.classList.remove('on'), 2600);
}
function cmpToggle(cd){
  const i=CMP.indexOf(cd);
  if(i>=0){ CMP.splice(i,1); }
  else{
    if(CMP.length>=3){ dToast('비교는 최대 3명까지예요. 아래 바에서 비우고 다시 담아 주세요.'); return; }
    CMP.push(cd);
    const m=D.members.find(x=>x.cd===cd);
    if(m) dToast(m.name+' 의원을 비교에 담았어요 ('+CMP.length+'/3)');
  }
  cmpSave(); cmpBar(); cmpPaintBtns();
}
function cmpPaintBtns(){
  document.querySelectorAll('.cmpadd').forEach(b=>{
    const on=CMP.includes(b.dataset.cd);
    b.classList.toggle('on', on); b.textContent=on?'✓ 비교 담김':'+ 비교';
  });
  document.querySelectorAll('[data-cmp]').forEach(b=>{
    const on=CMP.includes(b.dataset.cmp);
    b.classList.toggle('on', on); b.textContent=on?'비교 담김':'비교';
  });
}
function cmpBar(){
  let bar=document.getElementById('cmpbar');
  if(!bar){ bar=document.createElement('div'); bar.id='cmpbar'; document.body.appendChild(bar); }
  if(!CMP.length){ bar.classList.remove('on'); bar.innerHTML=''; return; }
  const names=CMP.map(cd=>{ const m=D.members.find(x=>x.cd===cd); return m? m.name:cd; });
  bar.innerHTML='<b>비교 '+CMP.length+'명</b> <span>'+names.map(esc).join(' · ')+'</span>'
    +'<button class="go" id="cmpGo">나란히 보기</button><button class="clr" id="cmpClr">비우기</button>';
  bar.classList.add('on');
  document.getElementById('cmpGo').onclick=cmpShow;
  document.getElementById('cmpClr').onclick=()=>{ CMP=[]; cmpSave(); cmpBar(); cmpPaintBtns(); };
}
var cmpTab='sum';
function cmpMemberCol(m3, tab){
  const A2=(D.assets||{})[m3.cd];
  const kpis=`
    <div class="kpis cmpk">
      <div class="kpi"><b>${m3.vote&&m3.vote.tot? (m3.vote.part??'–')+'%':'–'}</b><i>표결 참여율</i><small>${m3.vote&&m3.vote.tot? nf(m3.vote.tot-m3.vote.absent)+' / '+nf(m3.vote.tot)+'건':'집계 전'}</small></div>
      <div class="kpi"><b>${nf(m3.prop?.n??0)}</b><i>대표발의</i><small>성사 ${nf(m3.prop?.pass??0)}건 · ${m3.prop?.rate??0}%</small></div>
      <div class="kpi"><b>${m3.cdefect?.rate??0}%</b><i>당론 이탈률</i><small>쟁점 ${nf(m3.cdefect?.d??0)} / ${nf(m3.cdefect?.n??0)}건</small></div>
      <div class="kpi"><b>${nf(m3.speech?.n??0)}</b><i>발언 구간</i><small>회의록 전체 집계</small></div>
    </div>`;
  let body='';
  try{
    if(tab==='p') body = kpis + profileCharts(m3);
    else if(tab==='b') body = billCharts(m3) + voteCharts(m3).replace(/id="vfSum"/g,'data-vfsum="1"').replace(/data-vf="/g,'data-vfx="');
    else if(tab==='w') body = renderAssets(m3)
      .replace(/ id="afilter"/g,'').replace(/ id="alist"/g,'').replace(/data-af="/g,'data-afx="')
      .replace(/항목을 누르면 그 종류만 아래에서 봐요/g,'구성 비율이에요 · 상세는 의원 이름을 눌러 확인하세요');
    else if(tab==='s'){
      const qs2=(D.quotes||[]).filter(z=>z.c===m3.cd).slice(0,6);
      body = qs2.length? qs2.map(z=>`
        <div class="cmq"><p>“${esc(z.s)}”</p>
          <span>${z.src==='언론'? esc(z.ms||'언론'): esc(z.m)+'위 국정감사'} · ${esc(z.d)}</span></div>`).join('')
        : '<div class="empty">수록된 발언이 없어요</div>';
    }
    else if(tab==='n'){
      const ns=((D.news5||{})[m3.cd]||[]).slice(0,8);
      body = ns.length? ns.map(a2=>`
        <a class="cmn" href="${esc(a2[3]||'#')}" target="_blank" rel="noopener">
          <span class="t2">${esc(a2[1]||'')}</span><span class="s2">${esc(a2[2]||'')} · ${esc(a2[0]||'')}</span></a>`).join('')
        : '<div class="empty">수집된 보도가 없어요</div>';
    }
  }catch(e){ body='<div class="empty">이 항목을 그리는 중 문제가 생겼어요</div>'; }
  return `<div class="cmpcol" style="--pc:${pc(m3.party)}">
    <div class="cmphd">
      ${avatar(m3,'ph')}
      <div><button class="cmpnm" data-cmopen="${m3.cd}" title="의원 상세 열기">${esc(m3.name)}</button>
        <div class="cmpsub">${esc(m3.party)} · ${esc(m3.dist||'비례대표')}</div></div>
      <button class="cmprm" data-cmrm="${m3.cd}" title="비교에서 빼기" aria-label="${esc(m3.name)} 비교에서 빼기">&times;</button>
    </div>
    <div class="cmpbody">${body}</div>
  </div>`;
}
function cmpShow(){
  try{
  try{ if(sheet.classList.contains('on')) close(); }catch(e){}
  const ms=CMP.map(cd=>D.members.find(x=>x.cd===cd)).filter(Boolean);
  if(!ms.length){ dToast('비교할 의원이 없어요. 카드의 [비교] 버튼으로 담아 주세요.'); return; }
  const A=cd=>(D.assets||{})[cd];
  const fmt=(v,u)=>v==null?'–':(nf(v)+(u||''));
  const rows=[
    ['정당', ...ms.map(m=>m.party)],
    ['지역구', ...ms.map(m=>m.dist||'비례대표')],
    ['선수', ...ms.map(m=>m.reele||'–')],
    ['표결 참여율', ...ms.map(m=>m.vote&&m.vote.tot? (m.vote.part??'–')+'% ('+nf(m.vote.tot-m.vote.absent)+'/'+nf(m.vote.tot)+')' : '집계 전')],
    ['쟁점 표결 찬/반/기권/불참', ...ms.map(m=>m.cvote? [m.cvote.y,m.cvote.n,m.cvote.a,m.cvote.x].map(nf).join(' / '):'–')],
    ['대표발의', ...ms.map(m=>fmt(m.prop?.n,'건'))],
    ['발의 성사율', ...ms.map(m=>(m.prop?.rate??'–')+'%')],
    ['당론 이탈률', ...ms.map(m=>(m.cdefect?.rate??'–')+'% ('+(m.cdefect? m.cdefect.d+'/'+m.cdefect.n:'–')+')')],
    ['국감 발언 구간', ...ms.map(m=>fmt(m.speech?.n,'건'))],
    ['청원 소개', ...ms.map(m=>fmt(m.pttN||0,'건'))],
    ['신고 재산', ...ms.map(m=>A(m.cd)? AMAN(A(m.cd).t):'–')],
    ['1년 새 변동', ...ms.map(m=>{ const a=A(m.cd); if(!a) return '–';
      const d2=a.t-a.p; return (d2>=0?'+':'')+AMAN(d2); })],
    ['5년 보도', ...ms.map(m=>nf(((D.news5||{})[m.cd]||[]).length)+'건')],
  ];
  const TABS=[['sum','요약 비교'],['p','프로필'],['b','의정활동'],['w','재산'],['s','발언'],['n','뉴스']];
  const b=document.getElementById('cmpBody');
  b.innerHTML='<h3>의원 나란히 보기</h3>'
    +'<div class="cs2">'+(cmpTab==='sum'
      ? '지표마다 분모가 달라요 — 괄호가 분모예요. 이름을 누르면 그 의원 상세로 가요.'
      : '같은 항목을 나란히 봐요 · 이름을 누르면 그 의원 상세로 가요')+'</div>'
    +'<div class="cmptabs">'+TABS.map(t=>'<button data-cmt="'+t[0]+'" aria-pressed="'+(cmpTab===t[0])+'">'+t[1]+'</button>').join('')+'</div>'
    +(cmpTab==='sum'
      ? '<table><thead><tr><th></th>'+ms.map(m=>'<th><button class="cmpnm" data-cmopen="'+m.cd+'">'+esc(m.name)+'</button></th>').join('')+'</tr></thead><tbody>'
        +rows.map(r=>'<tr>'+r.map(c=>'<td>'+ (String(c).startsWith('<')?c:esc(String(c))) +'</td>').join('')+'</tr>').join('')
        +'</tbody></table>'
      : '<div class="cmpcols">'+ms.map(m=>cmpMemberCol(m, cmpTab)).join('')+'</div>');
  const cb=document.getElementById('cmpCsv');
  cb.hidden = cmpTab!=='sum';
  cb.onclick=()=>dlCSV('의원비교_'+ms.map(m=>m.name).join('_')+'.csv',
    [['지표', ...ms.map(m=>m.name)], ...rows]);
  b.querySelectorAll('[data-cmt]').forEach(t=>t.onclick=()=>{ cmpTab=t.dataset.cmt; cmpShow(); });
  b.querySelectorAll('[data-cmopen]').forEach(n=>n.onclick=()=>{ cmpClose();
    const m4=D.members.find(x=>x.cd===n.dataset.cmopen); if(m4) open(m4); });
  b.querySelectorAll('[data-cmrm]').forEach(n=>n.onclick=()=>{ cmpToggle(n.dataset.cmrm);
    if(CMP.length) cmpShow(); else cmpClose(); });
  document.getElementById('cmpModal').classList.add('on');
  }catch(e){ dToast('비교 화면을 여는 중 문제가 생겼어요. 새로고침 후 다시 시도해 주세요.'); }
}
document.addEventListener('click',e=>{
  const cb=e.target.closest && e.target.closest('.cmpadd');
  if(cb){ e.stopPropagation(); cmpToggle(cb.dataset.cd); }
});
cmpBar();
/* 시트가 열릴 때 비교 버튼 상태 갱신 */
(function(){ const _o2=open; open=function(m){ _o2(m); setTimeout(cmpPaintBtns,50); }; })();

/* ── 푸터: 언론 인용 수 동기화 + 데이터 받기·옵트아웃 연결 ── */
(function(){
  const el=document.getElementById('pressN');
  if(el) el.textContent=nf((D.quotes||[]).filter(z=>z.src==='언론').length);
  const dj=document.getElementById('dlJson'); if(dj) dj.onclick=payloadJSON;
  const dc=document.getElementById('dlCsv'); if(dc) dc.onclick=membersCSV;
  const db=document.getElementById('dictBtn'); if(db) db.onclick=showDict;
  const oo=document.getElementById('optOut');
  if(oo){
    const paint=()=>{ oo.textContent = localStorage.getItem('dogam.noTrack')==='1'
      ? '꺼져 있음 · 다시 켜기' : '수집 끄기'; };
    oo.onclick=()=>{ const on=localStorage.getItem('dogam.noTrack')==='1';
      if(on) localStorage.removeItem('dogam.noTrack');
      else localStorage.setItem('dogam.noTrack','1');
      paint();
      dToast('설정했어요. 새로고침 후 적용돼요.'); };
    paint();
  }
})();

/* ── 공용 포커스 트랩 ── */
/* a[href]로 한정 — [href]만 쓰면 SVG <use>까지 잡혀 '마지막 요소' 판정이 깨진다.
   tabIndex>=0 필터로 실제 포커스 가능한 것만 남긴다. */
const FOCUSABLE='a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"])';
/* 닫힌 <details> 내부는 offsetParent가 남아 있어 '보인다'고 오판된다.
   그 상태로 두면 목록 끝에 포커스 불가 요소가 끼어 마지막 감지가 실패한다. */
function isFocusable(el){
  if(el.disabled || el.tabIndex<0) return false;
  if(typeof el.checkVisibility==='function'){
    if(!el.checkVisibility({checkVisibilityCSS:true, contentVisibilityAuto:true})) return false;
  } else if(el.offsetParent===null){ return false; }
  const d=el.closest('details:not([open])');
  if(d && el!==d.querySelector(':scope > summary')) return false;
  return true;
}
function trapTab(e, root){
  if(e.key!=='Tab' || !root) return;
  const f=[...root.querySelectorAll(FOCUSABLE)].filter(isFocusable);
  if(!f.length) return;
  const first=f[0], last=f[f.length-1], a=document.activeElement;
  // 루트 밖에 포커스가 있거나 경계에 있으면 루트 안으로 되돌린다
  if(!root.contains(a)){ first.focus(); e.preventDefault(); return; }
  if(e.shiftKey && a===first){ last.focus(); e.preventDefault(); }
  else if(!e.shiftKey && a===last){ first.focus(); e.preventDefault(); }
}
/* ── 비교·사전 모달 포커스 관리 ── */
(function(){
  const modal=()=>document.getElementById('cmpModal');
  let lastF=null;
  const _show=cmpShow;
  cmpShow=function(){
    // 모달이 이미 열려 있으면(탭 전환) 복귀 지점을 덮어쓰지 않는다
    if(!modal()?.classList.contains('on')) lastF=document.activeElement;
    _show();
    const m=modal(); if(!m||!m.classList.contains('on')) return;
    const inner=m.querySelector('.cmpin'); if(inner){ inner.tabIndex=-1;
      setTimeout(()=>{ try{ inner.focus({preventScroll:true}); }catch(e){} }, 40); }
  };
  const _dict=showDict;
  showDict=function(){ lastF=document.activeElement; _dict();
    const inner=modal()?.querySelector('.cmpin'); if(inner){ inner.tabIndex=-1;
      setTimeout(()=>{ try{ inner.focus({preventScroll:true}); }catch(e){} }, 40); }
  };
  const _close=cmpClose;
  cmpClose=function(){ _close();
    if(lastF && lastF!==document.body && document.contains(lastF)){
      try{ lastF.focus({preventScroll:true}); }catch(e){} }
  };
  document.addEventListener('keydown',e=>{
    const m=modal(); if(m && m.classList.contains('on')) trapTab(e, m.querySelector('.cmpin')||m);
    const ms=document.getElementById('mSheet');
    if(ms && !ms.hidden) trapTab(e, ms.querySelector('.msbd')||ms);
  });
})();

/* ── 툴팁 접근성: 텍스트 없는 지표 막대에 aria-label 부여 + 포커스 툴팁 ── */
function a11yTips(){
  try{
    document.querySelectorAll('[data-tip]').forEach(el=>{
      if(el.__a11y) return; el.__a11y=1;
      if(!el.hasAttribute('aria-label') && !el.textContent.trim())
        el.setAttribute('aria-label', el.getAttribute('data-tip'));
    });
  }catch(e){}
}
(function(){
  const _r=render;
  render=function(){ _r(); requestAnimationFrame(a11yTips); };
  const _o3=open; open=function(m){ _o3(m); requestAnimationFrame(a11yTips); };
  a11yTips();
  const tip=document.getElementById('gtip');
  if(tip) tip.setAttribute('aria-hidden','true');
  document.addEventListener('focusin',e=>{
    const el=e.target.closest && e.target.closest('[data-tip]');
    const t2=document.getElementById('gtip'); if(!t2) return;
    if(el){ t2.textContent=el.getAttribute('data-tip'); t2.classList.add('on');
      const r=el.getBoundingClientRect();
      t2.style.left=Math.max(6, Math.min(r.left, innerWidth-260))+'px';
      t2.style.top=Math.min(r.bottom+8, innerHeight-60)+'px'; }
    else t2.classList.remove('on');
  });
  document.addEventListener('focusout',()=>{ const t2=document.getElementById('gtip');
    if(t2) t2.classList.remove('on'); });
})();


;

/* ── 방문 집계 · 분석 — 웹 배포에서만 동작, file:// 열람은 침묵 ── */
(function(){
  if(!/^https?:$/.test(location.protocol)) return;
  /* 익명 통계 수집 옵트아웃 — 푸터의 '익명 통계 끄기'로 설정 */
  if(localStorage.getItem('dogam.noTrack')==='1') return;

  /* 오늘 방문자 배지 — Abacus 무료 카운터(키=KST 날짜라 자정에 자동 리셋).
     집계는 모든 방문자에게 하되, 표시는 주인 브라우저에서만:
     ?owner=1 로 한 번 접속하면 이 브라우저에 플래그가 남아 계속 보인다. ?owner=0 은 해제. */
  const qsOwner=new URLSearchParams(location.search).get('owner');
  if(qsOwner==='1') localStorage.setItem('dogamOwner','1');
  if(qsOwner==='0') localStorage.removeItem('dogamOwner');
  const isOwner=localStorage.getItem('dogamOwner')==='1';
  const kst=new Date(Date.now()+9*3600e3).toISOString().slice(0,10);
  const el=document.getElementById('visToday');
  const seen=sessionStorage.getItem('vis-'+kst);
  fetch('https://abacus.jasoncameron.dev/'+(seen?'get':'hit')+'/dogam-rumins01/d'+kst)
    .then(r=>r.json())
    .then(d=>{ sessionStorage.setItem('vis-'+kst,'1');
      if(el && isOwner && d.value>0){ el.textContent='오늘 방문자 '+Number(d.value).toLocaleString('ko-KR')+'명'; el.hidden=false; } })
    .catch(()=>{});

  /* Mixpanel — 공식 로더 스니펫(mixpanel-js, Apache-2.0) + snake_case 수동 이벤트, 전부 익명 */
  var MIXPANEL_LIB_URL='https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js';
(function(document, mixpanel) {
    // Only stub out if this is the first time running the snippet.
    if (!mixpanel['__SV']) {
        var script, first_script, gen_fn, functions, i, lib_name = "mixpanel";
        window[lib_name] = mixpanel;

        mixpanel['_i'] = [];

        mixpanel['init'] = function (token, config, name) {
            // support multiple mixpanel instances
            var target = mixpanel;
            if (typeof(name) !== 'undefined') {
                target = mixpanel[name] = [];
            } else {
                name = lib_name;
            }

            // Pass in current people object if it exists
            target['people'] = target['people'] || [];
            target['toString'] = function(no_stub) {
                var str = lib_name;
                if (name !== lib_name) {
                    str += "." + name;
                }
                if (!no_stub) {
                    str += " (stub)";
                }
                return str;
            };
            target['people']['toString'] = function() {
                // 1 instead of true for minifying
                return target.toString(1) + ".people (stub)";
            };

            function _set_and_defer(target, fn) {
                var split = fn.split(".");
                if (split.length == 2) {
                    target = target[split[0]];
                    fn = split[1];
                }
                target[fn] = function() {
                    target.push([fn].concat(Array.prototype.slice.call(arguments, 0)));
                };
            }

            // create shallow clone of the public mixpanel interface
            // Note: only supports 1 additional level atm, e.g. mixpanel.people.set, not mixpanel.people.set.do_something_else.
            functions = "disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders start_session_recording stop_session_recording people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split(' ');
            for (i = 0; i < functions.length; i++) {
                _set_and_defer(target, functions[i]);
            }

            // special case for get_group(): chain method calls like mixpanel.get_group('foo', 'bar').unset('baz')
            var group_functions = "set set_once union unset remove delete".split(' ');
            target['get_group'] = function() {
                var mock_group = {};

                var call1_args = arguments;
                var call1 = ['get_group'].concat(Array.prototype.slice.call(call1_args, 0));

                function _set_and_defer_chained(fn_name) {
                    mock_group[fn_name] = function() {
                        var call2_args = arguments;
                        var call2 = [fn_name].concat(Array.prototype.slice.call(call2_args, 0));
                        target.push([call1, call2]);
                    };
                }
                for (var i = 0; i < group_functions.length; i++) {
                    _set_and_defer_chained(group_functions[i]);
                }
                return mock_group;
            };

            // register mixpanel instance
            mixpanel['_i'].push([token, config, name]);
        };

        // Snippet version, used to fail on new features w/ old snippet
        mixpanel['__SV'] = 1.2;

        script = document.createElement("script");
        script.type = "text/javascript";
        script.async = true;

        if (typeof MIXPANEL_CUSTOM_LIB_URL !== 'undefined') {
            script.src = MIXPANEL_CUSTOM_LIB_URL;
        } else if (document.location.protocol === 'file:' && MIXPANEL_LIB_URL.match(/^\/\//)) {
            script.src = 'https:' + MIXPANEL_LIB_URL;
        } else {
            script.src = MIXPANEL_LIB_URL;
        }

        first_script = document.getElementsByTagName("script")[0];
        first_script.parentNode.insertBefore(script, first_script);
    }
// Pass in current Mixpanel object if it exists (for ppl like Optimizely)
})(document, window['mixpanel'] || []);

  mixpanel.init('0ae4a4cf9b65206d1af1d563565c66f6',{persistence:'localStorage'});
  var track=function(n,p){ try{ mixpanel.track(n,p); }catch(e){} };
  var curScreen=function(){ return (typeof viewMode!=='undefined')?viewMode:''; };

  track('page_viewed',{referrer:document.referrer||'direct'});

  /* 모든 클릭 — 버튼·링크뿐 아니라 카드(div)·지도 지역구(svg path)·칩까지 위임으로 전수 */
  document.addEventListener('click',function(e){
    var t=e.target.closest('button,a,select,summary,[role=button],[data-c],[data-cd],.card,.chip,.lg,.tab');
    if(!t) return;
    var label=(t.dataset&&(t.dataset.n||t.dataset.p))||t.getAttribute('aria-label')||t.title
      ||(t.textContent||'').replace(/\s+/g,' ').trim().slice(0,60)||t.id||t.tagName;
    var cls=(t.className&&t.className.baseVal!==undefined?t.className.baseVal:String(t.className||'')).slice(0,80);
    track('ui_clicked',{label:label, tag:t.tagName.toLowerCase(),
      id:t.id||undefined, cls:cls||undefined, screen:curScreen(), path:location.hash});
  },{capture:true,passive:true});

  /* 스크롤 깊이 — 화면(라우트)마다 25/50/75/100% 최초 도달 시 1회 */
  var sdSeen={};
  var sdCheck=function(){
    var max=document.documentElement.scrollHeight-innerHeight;
    if(max<200) return;
    var pct=Math.round(scrollY/max*100);
    [25,50,75,100].forEach(function(m){
      if(pct>=m && !sdSeen[m]){ sdSeen[m]=1;
        track('scroll_depth_reached',{depth_pct:m, screen:curScreen(), path:location.hash}); }
    });
  };
  var sdT=null;
  addEventListener('scroll',function(){ if(sdT) return;
    sdT=setTimeout(function(){ sdT=null; sdCheck(); },400); },{passive:true});

  /* 화면 이동 — pushState 라우팅이라 hashchange만으론 못 잡아 pushRoute를 감싼다 */
  var lastH='';
  var emitRoute=function(){
    var h=location.hash||'#/발언';
    if(h===lastH) return; lastH=h;
    sdSeen={};
    var p=[]; try{ p=decodeURIComponent(h.replace(/^#\/?/,'')).split('/').filter(Boolean); }catch(e){}
    var mi=p.indexOf('의원');
    var nm=(mi>=0 && p[mi+1] && !SLUG_VIEW[p[mi+1]]) ? p[mi+1] : null;
    var props={screen:p[0]||'의원', path:h};
    if(nm) props.member_name=nm;
    track('screen_viewed', props);
    if(nm){
      var m=(typeof CURM!=='undefined'&&CURM&&CURM.name===nm)?CURM:null;
      track('member_opened',{member_name:nm, party:m?m.party:undefined, dist:m?(m.dist||'비례'):undefined});
    }
  };
  if(typeof pushRoute==='function'){
    var _pr=pushRoute;
    pushRoute=function(r){ _pr(r); emitRoute(); };
  }
  addEventListener('hashchange', emitRoute);
  addEventListener('popstate', emitRoute);
  emitRoute();

  /* 검색 — 입력 멈추고 1초 뒤 1회 */
  var q=document.getElementById('q'); var qTimer=null;
  if(q) q.addEventListener('input',function(){
    clearTimeout(qTimer);
    qTimer=setTimeout(function(){
      var v=q.value.trim();
      if(v.length>=2) track('search_performed',{query:v, screen:curScreen()});
    },1000);
  });

  /* 매칭 결과 도달 = value moment (3문항 이상 답하면 결과가 뜬다) */
  if(typeof quizScore==='function'){
    var _qs=quizScore; var matched=false;
    quizScore=function(){ _qs();
      try{ var n=Object.keys(ANS||{}).length;
        if(!matched && n>=3){ matched=true; track('match_completed',{answers:n}); }
      }catch(e){}
    };
  }
})();
