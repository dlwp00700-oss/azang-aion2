 
 // 🚀 현재 선택된 종족 탭을 기억하기 위한 전역 변수
    const elyosServers = [{id:1001,n:'시엘'},{id:1002,n:'네자칸'},{id:1003,n:'바이젤'},{id:1004,n:'카이시넬'},{id:1005,n:'유스티엘'},{id:1006,n:'아리엘'},{id:1007,n:'프레기온'},{id:1008,n:'메스람타에다'},{id:1009,n:'히타니에'},{id:1010,n:'나니아'},{id:1011,n:'타하바타'},{id:1012,n:'루터스'},{id:1013,n:'페르노스'},{id:1014,n:'다미누'},{id:1015,n:'카사카'},{id:1016,n:'바카르마'},{id:1017,n:'챈가룽'},{id:1018,n:'코치룽'},{id:1019,n:'이슈타르'},{id:1020,n:'티아마트'},{id:1021,n:'포에타'}];
    const asmoServers = [{id:2001,n:'이스라펠'},{id:2002,n:'지켈'},{id:2003,n:'트리니엘'},{id:2004,n:'루미엘'},{id:2005,n:'마르쿠탄'},{id:2006,n:'아스펠'},{id:2007,n:'에레슈키갈'},{id:2008,n:'브리트라'},{id:2009,n:'네몬'},{id:2010,n:'하달'},{id:2011,n:'루드라'},{id:2012,n:'울고른'},{id:2013,n:'무닌'},{id:2014,n:'오다르'},{id:2015,n:'젠카카'},{id:2016,n:'크로메데'},{id:2017,n:'콰이링'},{id:2018,n:'바바룽'},{id:2019,n:'파프니르'},{id:2020,n:'인드나흐'},{id:2021,n:'이스할겐'}];

    let currentFullRankRace = 0;

    // 🚀 신규: 버튼 상태 업데이트 및 서버 목록 동적 생성
    function changeRankRace(raceId, preventLoad = false) {
        currentFullRankRace = raceId;
        
        // 1. 눌린 버튼 시각적 효과 (색상 변경)
        const btns = document.querySelectorAll('.rank-race-btn');
       btns.forEach((btn, i) => {
            btn.classList.remove('active');
            if (i === raceId) btn.classList.add('active');
        });

        // 2. 종족에 맞춰 서버 드롭다운 옵션 바꾸기
        const serverSel = document.getElementById('rankFilterServer');
        let html = '<option value="">전체 서버</option>';
        if (raceId === 0 || raceId === 1) elyosServers.forEach(s => html += `<option value="${s.id}">[천] ${s.n}</option>`);
        if (raceId === 0 || raceId === 2) asmoServers.forEach(s => html += `<option value="${s.id}">[마] ${s.n}</option>`);
        
        serverSel.innerHTML = html;
        serverSel.value = ""; // 종족을 바꾸면 서버 선택 초기화

        // 3. 랭킹 데이터 다시 불러오기
        if (!preventLoad) loadFullRanking(raceId);
    }

    // 🚀 신규: 완전 초기화 버튼 로직
    function resetRankFilter() {
        document.getElementById('rankFilterJob').value = '';
        changeRankRace(0); // 전체, 전체 서버, 전체 직업으로 리셋
    }

    // ==========================================
    // 🏆 랭킹 불러오기 (통합 서버 드롭다운 적용)
    // ==========================================
    async function loadFullRanking(raceId) {
        const rankArea = document.getElementById('realRankingBox');
        if (!rankArea) return;

        if (raceId !== undefined) {
            currentFullRankRace = raceId;
        } else {
            raceId = currentFullRankRace;
        }

        // 🚀 하나로 합쳐진 서버 드롭다운과 직업 값 가져오기
        const serverVal = document.getElementById('rankFilterServer') ? document.getElementById('rankFilterServer').value : '';
        const jobVal = document.getElementById('rankFilterJob') ? document.getElementById('rankFilterJob').value : '';

        rankArea.innerHTML = `
            <div style="text-align:center; padding:80px 0; background:#111; border:1px solid #ffca28; border-radius:8px;">
                <span style="color:#ffca28; font-size:16px; font-weight:bold;">서버에서 랭킹 데이터를 가져오고 있습니다... ⏳</span><br>
                <span style="color:#aaa; font-size:12px; margin-top:10px; display:inline-block;">(요청 정보 - 종족:${raceId}, 서버:${serverVal}, 직업:${jobVal})</span>
            </div>
        `;

        try {
            const res = await fetch(`${API_BASE}/totalRanking?race=${raceId}&server=${serverVal}&job=${encodeURIComponent(jobVal)}`);
            if (!res.ok) throw new Error(`서버 응답 오류 (상태 코드: ${res.status})`);
            
            const data = await res.json();
            const rankList = data.list || [];
            
            if (rankList.length === 0) {
                rankArea.innerHTML = `<div style="text-align:center; padding:80px 0; background:#111; border:1px solid #ff5252; color:#ff5252; font-weight:bold; border-radius:8px;">조건에 맞는 캐릭터가 없습니다.</div>`;
                return;
            }

            let html = '';
            rankList.forEach((user, index) => {
                const apScore = user.point ? Number(user.point).toLocaleString() : '0';
                const charName = user.characterName || '이름없음';
                const serverName = user.serverName || '서버';
                const className = user.className || '직업';
                const pImg = user.profileImage || '';

                let rankColor = "#aaa";
                if(index === 0) rankColor = "#ffca28";
                else if(index === 1) rankColor = "#e0e0e0";
                else if(index === 2) rankColor = "#cd7f32";

                let serverColor = (user.race === 1) ? "#4fc3f7" : "#ff5252";

                html += `
                <div style="display:flex; align-items:center; padding:12px 15px; border-bottom:1px solid #222; background:#141418; margin-bottom:2px; border-radius:4px;">
                    <div style="width:50px; text-align:center; color:${rankColor}; font-weight:bold; font-size:16px;">${index + 1}</div>
                    <div style="flex:1; display:flex; align-items:center; gap:12px; cursor:pointer;" onclick="switchTab('equip', document.querySelector('.nav-item')); loadCharacterDetail('${user.characterId}', '${user.serverId}', '${charName}')">
                        <img src="${pImg}" style="width:36px; height:36px; border-radius:50%; border:2px solid ${serverColor};" onerror="this.src='https://aion2zang.info/flogo.png'">
                        <div>
                            <div style="font-weight:bold; font-size:14px; color:#fff;">${charName}</div>
                            <div style="font-size:11px; color:#888;"><span style="color:${serverColor};">[${serverName}]</span> ${className}</div>
                        </div>
                    </div>
                    <div style="width:120px; text-align:right; color:#ffca28; font-weight:bold; font-size:14px;">${apScore} AP</div>
                </div>`;
            });
            rankArea.innerHTML = html;
            
        } catch (e) {
            rankArea.innerHTML = `
                <div style="text-align:center; padding:80px 0; background:#111; border:1px solid #ff5252; color:#ff5252; border-radius:8px;">
                    <span style="font-weight:bold; font-size:15px;">데이터 표시 중 오류 발생 ❌</span><br>
                </div>
            `;
        }
    }

    // 🚀 맨 처음 접속했을 때 드롭다운에 모든 서버를 미리 채워두는 트리거
    changeRankRace(0, true);
