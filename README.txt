STOCK INSIGHT PRO - 수급 동향 모듈

포함 파일
- supply.js : 기존 app.js와 분리된 수급 동향 UI 모듈
- supply.css : 기존 디자인 변수(--bg, --card, --line, --text, --muted, --accent)를 사용하는 추가 스타일

설치
1) 두 파일을 index.html과 같은 폴더에 업로드합니다.
2) index.html의 </head> 바로 앞에 아래 한 줄을 추가합니다.
   <link rel="stylesheet" href="./supply.css?v=1">
3) 기존 app.js 스크립트 태그 바로 다음에 아래 한 줄을 추가합니다.
   <script src="./supply.js?v=1"></script>
4) GitHub Pages에 배포 후 새로고침합니다.

중요한 데이터 안내
이 모듈은 화면/탭/기간 선택/모바일 표 레이아웃을 추가합니다. 현재 저장소와 제공된 Cloudflare Worker에서 확인된 API 목록에는 코스피·코스닥 시장 전체 투자자별 순매수, 프로그램 매매, KOSPI200 선물 투자자별 수급의 검증된 데이터 엔드포인트가 확인되지 않았습니다.
따라서 가짜 숫자나 임의 API 응답을 실제 데이터처럼 표시하지 않고 'API 연결 필요'로 표시합니다.
실제 데이터를 연결하려면 해당 항목을 제공하는 데이터 공급처/API 명세(요청 URL, 파라미터, 응답 JSON, 인증 방식)가 필요합니다. KRX 데이터는 이용 조건/인증 여부에 따라 별도 연결 작업이 필요할 수 있습니다.

기존 app.js, index.html, style.css, cloudflare_worker.js 원본은 이 ZIP 안에서 덮어쓰지 않습니다.
