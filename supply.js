/* STOCK INSIGHT PRO - 수급 동향 모듈
 * 기존 app.js는 수정하지 않습니다. index.html에서 이 파일을 app.js 다음에 불러오세요.
 * 확인되지 않은 시장 수급 API를 임의 호출하거나 가짜 수치를 표시하지 않습니다.
 */
(() => {
  'use strict';
  if (window.__SIP_SUPPLY_LOADED__) return;
  window.__SIP_SUPPLY_LOADED__ = true;

  const $ = (id) => document.getElementById(id);
  const state = { period: 'day', days: 10, tab: 'kospi' };
  const fmt = (v) => v == null ? '—' : Number(v).toLocaleString('ko-KR');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const sections = [
    {id:'kospi', label:'코스피'},
    {id:'kosdaq', label:'코스닥'},
    {id:'futures', label:'선물'},
    {id:'compare', label:'통합 비교'},
    {id:'cumulative', label:'누적 수급'}
  ];

  function injectStyles() {
    if ($('sip-supply-style')) return;
    const link = document.createElement('link');
    link.id = 'sip-supply-style';
    link.rel = 'stylesheet';
    link.href = './supply.css?v=1';
    document.head.appendChild(link);
  }

  function build() {
    injectStyles();
    const header = document.querySelector('header');
    const main = document.querySelector('main');
    if (!header || !main || $('sip-supply-nav')) return;

    const nav = document.createElement('button');
    nav.id = 'sip-supply-nav';
    nav.type = 'button';
    nav.textContent = '수급 동향';
    nav.setAttribute('aria-label', '수급 동향 페이지 열기');
    header.querySelector('.tools')?.prepend(nav);

    const page = document.createElement('section');
    page.id = 'sip-supply-page';
    page.hidden = true;
    page.innerHTML = `
      <div class="sip-head">
        <div><span class="sip-eyebrow">MARKET FLOW</span><h2>수급 동향</h2>
        <p>코스피 · 코스닥 · 선물 시장의 투자자별 흐름</p></div>
        <button type="button" id="sip-refresh" class="sip-refresh">↻ 새로고침</button>
      </div>
      <div class="sip-tabs" role="tablist">${sections.map(s=>`<button type="button" data-sip-tab="${s.id}" class="${s.id===state.tab?'active':''}">${s.label}</button>`).join('')}</div>
      <div class="sip-toolbar">
        <div class="sip-periods" aria-label="차트 기간">
          <button data-sip-period="day" class="active">일</button><button data-sip-period="week">주</button><button data-sip-period="month">월</button><button data-sip-period="year">년</button>
        </div>
        <div class="sip-days" aria-label="조회 기간">
          ${[10,60].map(n=>`<button data-sip-days="${n}" class="${n===state.days?'active':''}">${n}일</button>`).join('')}
        </div>
      </div>
      <div id="sip-content"></div>
      <p class="sip-disclaimer">※ 현재 프로젝트에서 확인된 공개 API에는 시장 전체 투자자별 수급·프로그램 매매·선물 투자자별 데이터의 안정적인 조회 경로가 포함되어 있지 않습니다. 검증되지 않은 값은 표시하지 않습니다.</p>`;
    main.prepend(page);

    nav.addEventListener('click', () => setView(true));
    $('sip-refresh').addEventListener('click', render);
    page.querySelectorAll('[data-sip-tab]').forEach(b => b.addEventListener('click', () => {
      state.tab = b.dataset.sipTab;
      page.querySelectorAll('[data-sip-tab]').forEach(x=>x.classList.toggle('active',x===b));
      render();
    }));
    page.querySelectorAll('[data-sip-period]').forEach(b => b.addEventListener('click', () => {
      state.period = b.dataset.sipPeriod;
      page.querySelectorAll('[data-sip-period]').forEach(x=>x.classList.toggle('active',x===b));
      render();
    }));
    page.querySelectorAll('[data-sip-days]').forEach(b => b.addEventListener('click', () => {
      state.days = Number(b.dataset.sipDays);
      page.querySelectorAll('[data-sip-days]').forEach(x=>x.classList.toggle('active',x===b));
      render();
    }));
    render();
  }

  function setView(show) {
    const main = document.querySelector('main');
    if (!main) return;
    [...main.children].forEach(el => {
      if (el.id === 'sip-supply-page') el.hidden = !show;
      else el.hidden = show;
    });
    $('sip-supply-nav')?.classList.toggle('active', show);
    if (!show) [...main.children].forEach(el => { if (el.id !== 'sip-supply-page') el.hidden = false; });
    window.scrollTo({top:0, behavior:'instant'});
  }

  function emptyChart(label) {
    return `<div class="sip-chart-empty"><div class="sip-empty-mark">⌁</div><b>${esc(label)} 데이터 대기</b><span>검증된 시장 데이터 연결 후 그래프가 표시됩니다.</span></div>`;
  }

  function investorTable(title, extra='') {
    return `<article class="sip-card"><div class="sip-card-title"><b>${title}</b><small>${state.days}거래일 · ${state.period==='day'?'일간':state.period==='week'?'주간':state.period==='month'?'월간':'연간'}</small></div>
      <div class="sip-table-wrap"><table><thead><tr><th>일자</th><th>개인</th><th>외국인</th><th>기관</th>${extra}</tr></thead><tbody><tr><td colspan="${extra?5:4}" class="sip-no-data">시장 수급 데이터 API 연결 필요</td></tr></tbody></table></div></article>`;
  }

  function indexTable() {
    return `<article class="sip-card"><div class="sip-card-title"><b>지수 및 시장 현황</b><small>최근 ${state.days}거래일</small></div>
      <div class="sip-table-wrap"><table><thead><tr><th>일자</th><th>지수</th><th>등락</th><th>등락률</th><th>상승</th><th>보합</th><th>하락</th></tr></thead>
      <tbody><tr><td colspan="7" class="sip-no-data">지수·등락 종목 수 데이터 API 연결 필요</td></tr></tbody></table></div></article>`;
  }

  function programTable() {
    return `<article class="sip-card"><div class="sip-card-title"><b>프로그램 매매</b><small>차익 · 비차익</small></div>
      <div class="sip-table-wrap"><table><thead><tr><th>일자</th><th>차익</th><th>비차익</th><th>합계</th></tr></thead><tbody><tr><td colspan="4" class="sip-no-data">프로그램 매매 데이터 API 연결 필요</td></tr></tbody></table></div></article>`;
  }

  function futuresTable() {
    return `<article class="sip-card"><div class="sip-card-title"><b>선물 거래 현황</b><small>KOSPI200 선물 기준</small></div>
      <div class="sip-table-wrap"><table><thead><tr><th>일자</th><th>지수</th><th>등락</th><th>등락률</th><th>거래량</th><th>거래대금</th><th>미결제</th><th>베이시스</th></tr></thead><tbody><tr><td colspan="8" class="sip-no-data">선물 데이터 API 연결 필요</td></tr></tbody></table></div></article>`;
  }

  function comparison() {
    return `<article class="sip-card"><div class="sip-card-title"><b>시장별 투자자 순매수 비교</b><small>날짜별 코스피 · 코스닥 · 선물</small></div>
      <div class="sip-table-wrap"><table><thead><tr><th>일자</th><th>시장</th><th>개인</th><th>외국인</th><th>기관</th></tr></thead><tbody><tr><td colspan="5" class="sip-no-data">통합 수급 데이터 API 연결 필요</td></tr></tbody></table></div></article>`;
  }

  function cumulative() {
    return `<article class="sip-card"><div class="sip-card-title"><b>투자자별 누적 순매수</b><small>선택 구간 첫날을 0으로 시작</small></div>
      <div class="sip-cum-legend"><span class="personal">개인</span><span class="foreign">외국인</span><span class="institution">기관</span></div>
      ${emptyChart('누적 순매수')}
      <p class="sip-note">누적값은 선택 기간의 일별 순매수 값을 합산해 계산합니다. 선물 순매수는 헤지·차익거래 목적일 수 있어 현물 순매수와 별도로 해석해야 합니다.</p></article>`;
  }

  function render() {
    const content = $('sip-content');
    if (!content) return;
    const name = sections.find(s=>s.id===state.tab)?.label || '코스피';
    let html = `<div class="sip-summary"><div><small>조회 시장</small><b>${name}</b></div><div><small>조회 기간</small><b>최근 ${state.days}거래일</b></div><div><small>데이터 상태</small><b class="sip-wait">API 연결 대기</b></div></div>`;
    if (state.tab === 'kospi') html += `${emptyChart('코스피 지수')}${indexTable()}${investorTable('코스피 투자자별 순매수')}${programTable()}`;
    else if (state.tab === 'kosdaq') html += `${emptyChart('코스닥 지수')}${indexTable()}${investorTable('코스닥 투자자별 순매수')}${programTable()}`;
    else if (state.tab === 'futures') html += `${emptyChart('KOSPI200 선물')}${futuresTable()}${investorTable('선물 투자자별 순매수')}`;
    else if (state.tab === 'compare') html += comparison();
    else html += cumulative();
    content.innerHTML = html;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build, {once:true});
  else build();
})();
