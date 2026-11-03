const WORKER='https://st.mcraft-tiger-574.workers.dev';
const DESKTOP='https://stock.naver.com';
const $=id=>document.getElementById(id);
const kinds={
 priceTop:{title:'거래대금 상위 50',desc:'당일 누적 거래대금 순',metric:'거래대금',order:'priceTop'},
 quantTop:{title:'거래량 상위 50',desc:'당일 누적 거래량 순',metric:'거래량',order:'quantTop'},
 popular:{title:'인기 종목 50',desc:'네이버 증권 검색 인기 순위',metric:'인기 지수',order:'popular'},
 marketSum:{title:'시가총액 상위 50',desc:'시가총액 순',metric:'시가총액',order:'marketSum'},
 up:{title:'상승률 상위 50',desc:'당일 등락률 높은 순',metric:'등락률',order:'up'},
 down:{title:'하락률 상위 50',desc:'당일 등락률 낮은 순',metric:'등락률',order:'down'}
};
let active='priceTop',market='ALL',cache={};
const sectorMap={
 '000660':['반도체','메모리·HBM'],'005930':['반도체·전자','메모리·파운드리'],'005935':['반도체·전자','삼성전자 우선주'],
 '042700':['반도체 장비','HBM·패키징'],'092870':['반도체 장비','테스트 장비'],'080220':['반도체','저전력 메모리'],
 '353200':['반도체 부품','PCB·패키지 기판'],'008060':['반도체 부품','PCB'],'222800':['반도체 부품','PCB·기판'],
 '006400':['2차전지','배터리'],'373220':['2차전지','배터리'],'051910':['화학·2차전지','양극재·화학'],
 '034020':['원전·에너지','발전설비'],'298040':['전력기기','변압기'],'267260':['전력기기','전력설비'],'010120':['전력기기','전력자동화'],
 '035420':['인터넷·AI','플랫폼·클라우드'],'035720':['인터넷·AI','플랫폼'],'053800':['사이버보안','보안 솔루션'],
 '053800':['사이버보안','보안 솔루션'],'053800':['사이버보안','보안 솔루션'],'053800':['사이버보안','보안 솔루션'],
 '012330':['자동차부품','모듈·전장'],'005380':['자동차','완성차'],'000270':['자동차','완성차'],
 '042660':['조선·방산','선박·특수선'],'329180':['조선','선박·엔진'],'009300':['조선','LNG선·해양'],
 '012450':['방산·우주','항공엔진·방산'],'211270':['우주·통신','위성통신'],'064550':['바이오','바이오시밀러'],
 '207940':['바이오','위탁개발생산'],'196170':['바이오','플랫폼·기술수출'],'105560':['금융','금융지주'],
 '055550':['금융','금융지주'],'003550':['지주·산업','지주회사'],'028260':['지주·건설','지주·건설']
};
function classify(x){
 const m=sectorMap[x.code];if(m)return m;
 const n=x.name||'';
 const rules=[
 [/반도체|하이닉스|칩|테크윙|테스트|프로브|패키지|PCB|기판|소재|장비/,'반도체','반도체 관련 장비·부품'],
 [/AI|인공지능|래블업|인텔리빅스|SK스퀘어|로봇|소프트웨어|클라우드/,'AI·소프트웨어','AI·데이터·소프트웨어'],
 [/배터리|에너지솔루션|SDI|퓨처엠|포스코홀딩스/,'2차전지·소재','배터리·양극재·소재'],
 [/전력|일렉트릭|중공업|변압기/,'전력기기','전력망·변압기·자동화'],
 [/바이오|제약|셀트리온|알테오젠/,'바이오','의약품·바이오 플랫폼'],
 [/조선|해양|중공업/,'조선','선박·해양플랜트'],
 [/항공|대한항공|한진칼/,'항공·운송','항공·운송 서비스'],
 [/방산|우주|위성/,'방산·우주','방산·위성·항공우주'],
 [/안랩|시큐|보안|인증/,'사이버보안','정보보안·인증'],
 [/자동차|모비스|기아|현대차/,'자동차','완성차·자동차부품'],
 [/금융|은행|증권|보험|지주/,'금융·지주','금융·지주회사'],
 [/화장품|뷰티|에이피알/,'뷰티','화장품·미용기기']
 ];
 for(const [re,s,d] of rules)if(re.test(n))return [s,d];
 return ['기타','사업 분야 확인 필요'];
}
function num(v){if(v===null||v===undefined||v==='')return null;if(typeof v==='object')v=v.value??v.formattedValue??v.text??v.price??v.amount??v.closePrice;const s=String(v).replace(/,/g,'').replace(/[원주%]/g,'').trim();const n=Number(s);return Number.isFinite(n)?n:null}
function first(o,keys){for(const k of keys){if(o&&o[k]!==undefined&&o[k]!==null&&o[k]!=='')return o[k]}return null}
function fmt(v){if(v===null||v===undefined)return '—';return Math.round(v).toLocaleString('ko-KR')}
function money(v){if(v===null||v===undefined)return '—';if(v>=1e12)return (v/1e12).toFixed(2)+'조';if(v>=1e8)return (v/1e8).toFixed(0)+'억';return fmt(v)}
function pct(v){if(v===null||v===undefined)return '—';return (v>0?'+':'')+v.toFixed(2)+'%'}
function codeOf(v){let s=String(v||'').toUpperCase().replace(/^A(?=\d{6}$)/,'');const m=s.match(/[0-9A-Z]{6}/);return m?m[0]:''}
function getRows(root){
 const codeKeys=['itemCode','itemcode','stockCode','stockcode','code','reutersCode','symbolCode','shortCode','isuCd','ISU_CD','stockItemCode'];
 const nameKeys=['itemName','itemname','stockName','stockname','name','stockNm','korName','isuNm','ISU_NM','koreanName','displayName'];
 const seen=new Set();
 function normalize(o){
  const code=codeOf(first(o,codeKeys)),name=String(first(o,nameKeys)||'').trim();
  if(!code||!name||seen.has(code))return null;seen.add(code);
  const priceObj=o.price?.krx||o.price?.nxt||o.price||{};
  const price=num(first(o,['closePrice','currentPrice','nowPrice','tradePrice','priceValue'])??first(priceObj,['closePrice','currentPrice','nowPrice','tradePrice']));
  const rate=num(first(o,['fluctuationsRatio','changeRate','compareToPreviousCloseRate','changeRateValue'])??first(priceObj,['fluctuationsRatio','changeRate','compareToPreviousCloseRate']));
  const value=num(first(o,['accumulatedTradingValue','tradingValue','accAmount','priceTop','tradeValue','totalTradingValue']));
  const volume=num(first(o,['accumulatedTradingVolume','tradingVolume','accQuant','quantTop','volume','totalTradingVolume']));
  const cap=num(first(o,['marketValue','marketCap','marketSum','marketCapitalization','marketCapital']));
  const hit=num(first(o,['hitCount','searchCount','count','rankingValue']));
  const [sector,detail]=classify({code,name});
  return {code,name,price,rate,value,volume,cap,hit,sector,detail,market:String(first(o,['marketType','market','stockExchangeType','exchangeType'])||'').toUpperCase()};
 }
 function walk(node,depth=0){
  if(!node||typeof node!=='object'||depth>9)return [];
  if(Array.isArray(node)){
   const out=node.map(v=>v&&typeof v==='object'&&!Array.isArray(v)?normalize(v):null).filter(Boolean);
   if(out.length>=1)return out;
   for(const v of node){const got=walk(v,depth+1);if(got.length)return got;}return [];
  }
  const preferred=['items','stocks','stockList','stocklist','result','data','list','contents','rankings','rankingList','domesticStocks','stockItems','searchTopList'];
  for(const k of preferred)if(node[k]&&typeof node[k]==='object'){const got=walk(node[k],depth+1);if(got.length)return got;}
  for(const [k,v] of Object.entries(node))if(!preferred.includes(k)&&v&&typeof v==='object'){const got=walk(v,depth+1);if(got.length)return got;}
  return [];
 }
 return walk(root);
}
async function fetchJson(url){
 const r=await fetch(WORKER+'/?url='+encodeURIComponent(url),{cache:'no-store'});
 if(!r.ok)throw new Error('데이터 요청 오류 ('+r.status+')');
 return r.json();
}
async function load(kind=active,force=false){
 active=kind;
 document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('active',b.dataset.kind===kind));
 const cfg=kinds[kind];$('summary-title').textContent=cfg.title;$('list-title').textContent=cfg.title;$('list-desc').textContent=cfg.desc;$('metric-head').textContent=cfg.metric;
 $('rows').innerHTML='<tr><td colspan="6" class="empty">순위를 불러오는 중입니다…</td></tr>';
 try{
  let data;
  if(!force&&cache[kind])data=cache[kind];
  else{
   let url;
   if(kind==='popular')url=`${DESKTOP}/api/domestic/market/searchTop?nationType=KOR&startIdx=0&pageSize=50`;
   else url=`${DESKTOP}/api/domestic/market/stock/default?tradeType=KRX&marketType=${market}&orderType=${cfg.order}&startIdx=0&pageSize=50`;
   const raw=await fetchJson(url);data=getRows(raw);
   if(data.length<10)throw new Error(`응답에서 종목 ${data.length}개만 확인했습니다. 원본 API 구조가 변경됐을 수 있습니다.`);
   cache[kind]=data;
  }
  render(data);
  $('updated').textContent='조회 '+new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
 }catch(e){$('rows').innerHTML=`<tr><td colspan="6" class="error">${escapeHtml(e.message)}<br><small>Cloudflare Worker 주소와 배포 상태를 확인해 주세요.</small></td></tr>`;$('updated').textContent='조회 실패'}
}
function render(data){
 const rows=market==='ALL'||active==='popular'?data:data.filter(x=>!x.market||x.market===market|| (market==='KOSDAQ'&&x.market.includes('KOSDAQ'))||(market==='KOSPI'&&x.market.includes('KOSPI')));
 const list=rows.slice(0,50);
 $('summary-count').textContent=list.length+'개';
 const up=list.filter(x=>(x.rate||0)>0).length,down=list.filter(x=>(x.rate||0)<0).length;
 $('summary-breadth').innerHTML=`<span class="up">${up}</span> / <span class="down">${down}</span>`;
 $('rows').innerHTML=list.map((x,i)=>{
  const metric=active==='priceTop'?money(x.value):active==='quantTop'?fmt(x.volume):active==='marketSum'?money(x.cap):active==='popular'?fmt(x.hit):pct(x.rate);
  return `<tr><td class="rank">${i+1}</td><td class="stock"><b>${escapeHtml(x.name)}</b><small>${x.code}</small></td><td class="num">${fmt(x.price)}</td><td class="rate ${x.rate>0?'up':x.rate<0?'down':''}">${pct(x.rate)}</td><td class="num metric">${metric}</td><td class="sector"><b>${escapeHtml(x.sector)}</b><small>${escapeHtml(x.detail)}</small></td></tr>`;
 }).join('')||'<tr><td colspan="6" class="empty">해당 시장의 종목이 없습니다.</td></tr>';
 const counts={};list.forEach(x=>counts[x.sector]=(counts[x.sector]||0)+1);
 const sorted=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
 $('sector-total').textContent=sorted.length+'개 섹터';
 $('sector-list').innerHTML=sorted.map(([s,c])=>`<div class="sector-row"><span>${escapeHtml(s)}</span><div class="bar"><i style="width:${c/list.length*100}%"></i></div><b>${c}</b></div>`).join('');
}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
$('tabs').addEventListener('click',e=>{const b=e.target.closest('button[data-kind]');if(b){market='ALL';document.querySelectorAll('.filters button').forEach(x=>x.classList.toggle('selected',x.dataset.market==='ALL'));load(b.dataset.kind)}});
document.querySelectorAll('.filters button').forEach(b=>b.addEventListener('click',()=>{market=b.dataset.market;document.querySelectorAll('.filters button').forEach(x=>x.classList.toggle('selected',x===b));cache[active]=null;load(active,true)}));
$('refresh').addEventListener('click',()=>load(active,true));
load();
