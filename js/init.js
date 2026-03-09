   // ✅ 단 하나의 로드 초기화만 유지 (중복 onload 금지)
window.addEventListener('load', () => {
  // 1) 공통 초기화
  if (typeof initPetCalc === "function") initPetCalc();
  if (typeof renderFavorites === "function") renderFavorites();

  // (있으면) 메인 요약 랭킹 등
  if (typeof loadTotalRanking === "function") loadTotalRanking(0);

  // 서버 목록/공지
  if (typeof initServerList === "function") initServerList();
  if (typeof loadGoogleSheetNotices === "function") loadGoogleSheetNotices();

  // 2) URL 파라미터 처리
  const urlParams = new URLSearchParams(window.location.search);

  const pMenu = urlParams.get('menu');
  if (pMenu) {
    // onclick 문자열 검색은 깨지기 쉬워서, 일단 기존 방식 유지하되 안전하게 처리
    const targetBtn = document.querySelector(`.nav-item[onclick*="'${pMenu}'"]`);
    if (targetBtn && typeof switchTab === "function") {
      switchTab(pMenu, targetBtn);
    } else if (typeof switchTab === "function") {
      // 버튼 못 찾으면 탭만이라도 열기 (switchTab이 문자열만 받아도 동작하는 구조면 유효)
      try { switchTab(pMenu); } catch (_) {}
    }

    // ✅ ranking으로 직접 진입한 경우: 탭 데이터도 즉시 로딩
    if (pMenu === 'ranking' && typeof loadFullRanking === "function") {
      loadFullRanking(0);
    }
  }

  // 3) 공유 링크 캐릭터 로딩 (🚀 리스트 안 거치고 다이렉트 로딩으로 진화!)
    const pServer = urlParams.get('server');
    let pName = urlParams.get('name'); // 🚀 값을 변경해야 하므로 const 대신 let으로 바꿉니다.
    
    if (pServer && pName) {
        // 🚀 [해결2] 예전에 잘못 복사해둔 링크로 접속하더라도 <strong> 태그를 깔끔하게 지워줍니다!
        pName = String(pName).replace(/<\/?[^>]+(>|$)/g, "");

        const serverSel = document.getElementById('searchServer');
    const nameInput = document.getElementById('charNameInput');

    if (serverSel) {
      serverSel.innerHTML = `<option value="${pServer}">공유된 캐릭터 로딩 중.</option>`;
      serverSel.value = pServer;
    }
    if (nameInput) nameInput.value = pName;

    setTimeout(async () => {
        const statusMsg = document.getElementById('statusMsg');
        if(statusMsg) statusMsg.innerHTML = "🔍 고유 식별자 찾는 중...";
        
        try {
            // 리스트를 띄우지 않고 API를 백그라운드로 찔러서 characterId를 몰래 찾아옵니다.
            const url1 = `${API_BASE}/searchList?name=${encodeURIComponent(pName)}&race=1&serverId=${pServer}`;
            const url2 = `${API_BASE}/searchList?name=${encodeURIComponent(pName)}&race=2&serverId=${pServer}`;
            const [res1, res2] = await Promise.all([
                fetch(url1).then(r => r.json()).catch(e => ({ list: [] })),
                fetch(url2).then(r => r.json()).catch(e => ({ list: [] }))
            ]);
            
            const list = [...(res1.contents || res1.list || []), ...(res2.contents || res2.list || [])];
            
            // 정확히 이름과 서버가 일치하는 캐릭터 딱 한 명 색출
            const exactMatch = list.find(c => {
                const cName = (c.characterName || c.name || "").replace(/<\/?[^>]+(>|$)/g, "");
                return cName === pName && (c.serverId == pServer);
            });
            
            if (exactMatch && typeof loadCharacterDetail === "function") {
                // 정확히 찾았으면 묻지도 따지지도 않고 바로 장비 시뮬레이터로 꽂아줍니다!
                loadCharacterDetail(exactMatch.characterId, pServer, pName);
            } else if (typeof searchCharacter === "function") {
                // 혹시라도 서버 변경 등으로 못 찾으면 안전하게 원래 검색창 띄우기
                searchCharacter();
            }
        } catch (e) {
            if (typeof searchCharacter === "function") searchCharacter();
        }
    }, 300);
  }
});
