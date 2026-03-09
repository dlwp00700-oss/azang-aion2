  // 🏅 어비스 데이터 및 다중 계산 로직
    const ABY_DATA = {
        10: { name: '십부장', color: '#fff', ap: {weapon:126200, top:84100, bottom:63100, head:52600, shoulder:52600, glove:42100, shoe:52600, cloak:42100, neck:52600, ear:42100, ring:31600}, mCount:{} },
        100: { name: '백부장', color: '#69f0ae', ap: {weapon:409500, top:273000, bottom:204800, head:170600, shoulder:170600, glove:136500, shoe:170600, cloak:136500, neck:170600, ear:136500, ring:102400}, mCount:{weapon:50, top:35, bottom:25, head:20, shoulder:20, glove:15, shoe:20, cloak:15, neck:20, ear:15, ring:15} },
        1000: { name: '천부장', color: '#ffca28', ap: {weapon:1171500, top:781000, bottom:585800, head:488200, shoulder:488200, glove:390500, shoe:488200, cloak:390500, neck:488200, ear:40000, ring:30} }, // 반지수정
        10000: { name: '군단장', color: '#ff9800', ap: {weapon:3636300, top:2424200, bottom:1818200, head:1515100, shoulder:1515100, glove:1212100, shoe:1515100, cloak:1212100, neck:1515100, ear:1212100, ring:909100}, mCount:{weapon:240, top:160, bottom:120, head:100, shoulder:100, glove:80, shoe:100, cloak:80, neck:100, ear:80, ring:80} }
    };
    // 천부장 훈장 데이터 보정 (제공해주신 데이터 기반)
    ABY_DATA[1000].mCount = {weapon:120, top:80, bottom:60, head:50, shoulder:50, glove:40, shoe:50, cloak:40, neck:50, ear:40, ring:30};

    let abyCart = [];

    async function addToCart() {
        const rank = document.getElementById('aby_rank').value;
        const part = document.getElementById('aby_part').value;
        const data = ABY_DATA[rank];
        const partName = document.getElementById('aby_part').options[document.getElementById('aby_part').selectedIndex].text;
        
        // 🚀 1. 엑스박스를 원천 차단하기 위해 무기/가더는 ⚔️ 고정, 나머지도 1차 이모지로 세팅
        const EMOJI_MAP = {
            'weapon': '⚔️', 'guarder': '⚔️', 'top': '👕', 'bottom': '👖', 'head': '🪖',
            'shoulder': '🦾', 'glove': '🧤', 'shoe': '🥾', 'cloak': '🧥',
            'neck': '📿', 'ear': '💎', 'ring': '💍'
        };

        let cartItem = {
            id: Date.now(),
            rank: rank,
            rankName: data.name,
            part: part,
            partName: partName,
            ap: data.ap[part],
            medal: data.mCount[part] || 0,
            color: data.color,
            iconType: 'emoji', // 기본값은 이모지 모드
            icon: EMOJI_MAP[part] || '📦'
        };

        abyCart.push(cartItem);
        renderAbyCart();
        calcAbyss();

        // 🚀 2. 무기/가더가 아니면 "가디언 십부장의 투구"처럼 풀네임으로 검색해서 진짜 아이콘 훔쳐오기
        if (part !== 'weapon' && part !== 'guarder') {
            try {
                let searchPartName = (part === 'ear') ? '귀고리' : partName;
                // 확실한 매칭을 위해 앞에 "가디언 "을 강제로 붙여서 검색!
                let exactKeyword = encodeURIComponent('가디언 ' + data.name + '의 ' + searchPartName);

                let res = await fetch(`${API_BASE}/searchDictItem?keyword=${exactKeyword}`);
                let dictData = await res.json();
                let items = dictData.contents || dictData.list || [];
                
                // 검색된 진짜 이미지가 있으면 아이콘 타입을 url로 바꾸고 교체
                if (items.length > 0 && items[0].icon) {
                    cartItem.iconType = 'url';
                    cartItem.icon = items[0].icon;
                    renderAbyCart(); // 바뀐 예쁜 아이콘으로 부드럽게 재렌더링!
                }
            } catch(e) { console.log("아이콘 갱신 실패 (기본 이모지 유지)"); }
        }
    }

    function removeFromCart(id) {
        abyCart = abyCart.filter(item => item.id !== id);
        renderAbyCart();
        calcAbyss();
    }

    function renderAbyCart() {
        const container = document.getElementById('aby_cart_list');
        if(abyCart.length === 0) {
            container.innerHTML = `<p style="text-align:center; color:#444; font-size:12px; margin-top:60px;">장바구니가 비어있습니다.</p>`;
            return;
        }
        let html = '';
        abyCart.forEach(item => {
            // 🚀 핵심: iconType이 url이면 이미지 태그를, emoji면 네모 박스 안에 텍스트를 출력!
            let iconHtml = '';
            if (item.iconType === 'url') {
                iconHtml = `<img src="${item.icon}" style="width:32px; height:32px; border-radius:4px; border:1px solid #444;" onerror="this.style.display='none'">`;
            } else {
                iconHtml = `<div style="width:32px; height:32px; border-radius:4px; border:1px solid #444; background:#1a1a24; display:flex; justify-content:center; align-items:center; font-size:18px;">${item.icon}</div>`;
            }

            html += `
            <div style="display:flex; align-items:center; gap:10px; background:#111; padding:8px; border-radius:6px; margin-bottom:8px; border:1px solid #333;">
                ${iconHtml}
                <div style="flex:1;">
                    <div style="font-size:12px; font-weight:bold; color:${item.color}">${item.rankName} ${item.partName}</div>
                    <div style="font-size:10px; color:#888;">${item.ap.toLocaleString()} AP / ${item.medal} 훈장</div>
                </div>
                <button onclick="removeFromCart(${item.id})" style="background:none; border:none; color:#ff5252; cursor:pointer; font-weight:bold;">×</button>
            </div>`;
        });
        container.innerHTML = html;
    }

   
  // ==========================================
    // 🏅 어비스 파밍 정밀 계산 로직
    // ==========================================
    // 🚀 신규: 시즌 미션 전체 체크 토글 기능
    function toggleGroup(el, className) {
        document.querySelectorAll('.' + className).forEach(chk => {
            chk.checked = el.checked;
        });
        calcAbyss(); 
    }

    // 🚀 신규: 주간 미션 전체 체크 토글 기능
    function toggleAllWeekly(el) {
        document.querySelectorAll('.chk-sil-w, .chk-gol-w').forEach(chk => {
            chk.checked = el.checked;
        });
        calcAbyss(); // 체크 후 자동 계산
    }
    
    // ==========================================
    // 🏅 어비스 파밍 정밀 계산 로직 (실시간 자동 갱신 탑재)
    // ==========================================
    let CURRENT_AP_LIMIT = 5000000;

    // 🚀 신규: 매주 수요일 오전 5시(KST)를 귀신같이 잡아내는 자동 갱신 엔진
    function updateApLimitUI() {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const kstTime = new Date(utc + (9 * 3600000)); // 해외에서 접속해도 무조건 한국 시간으로 강제 맞춤!
        
        // 기준점: 2026년 2월 18일(수) 오전 5시 정각 (이때 한도가 5,000,000)
        const baseDate = new Date("2026-02-18T05:00:00+09:00"); 
        
        let diffMs = kstTime.getTime() - baseDate.getTime();
        if (diffMs < 0) diffMs = 0;
        
        const msPerWeek = 7 * 24 * 60 * 60 * 1000;
        const weeksPassed = Math.floor(diffMs / msPerWeek); // 몇 주가 지났는지 완벽 계산
        
        // 기본 500만에 + 매주 지날 때마다 50만씩 무한 증식!
        CURRENT_AP_LIMIT = 5000000 + (weeksPassed * 500000); 
        
        // 1. 오늘 실시간 날짜 (YYYY-MM-DD)
        const yyyy = kstTime.getFullYear();
        const mm = String(kstTime.getMonth() + 1).padStart(2, '0');
        const dd = String(kstTime.getDate()).padStart(2, '0');
        
        // 2. 다음 갱신일 날짜 계산 (다음 수요일)
        const nextUpdate = new Date(baseDate.getTime() + ((weeksPassed + 1) * msPerWeek));
        const nextMM = nextUpdate.getMonth() + 1;
        const nextDD = nextUpdate.getDate();
        
        if (document.getElementById('limit_today_date')) {
            document.getElementById('limit_today_date').innerText = `${yyyy}-${mm}-${dd}`;
            document.getElementById('limit_display').innerText = CURRENT_AP_LIMIT.toLocaleString() + " AP";
            document.getElementById('limit_next_date').innerText = `${nextMM}월 ${nextDD}일(수) 오전 5:00`;
        }
    }

    function calcAbyss() {
        updateApLimitUI(); 
        const baseLimit = CURRENT_AP_LIMIT;
        
        const myAp = parseInt(document.getElementById('my_ap').value) || 0;
        const seasonAp = parseInt(document.getElementById('season_ap').value) || 0; // 🚀 신규: 누적 어포 가져오기
        
        // 🚀 버그 수정: 남은 한도는 무조건 '시즌 누적 어포'로만 뺍니다!
        const remainLimit = Math.max(0, baseLimit - seasonAp);
        document.getElementById('remain_limit_text').innerText = `한도까지 남은 획득 가능 어포: ${remainLimit.toLocaleString()} AP`;

        // 1. 시즌 퀘스트 체크값 합산 (단순 표시용)
        let seasonSil = 0, seasonGol = 0, seasonPla = 0;
        document.querySelectorAll('.chk-sil-s:checked').forEach(c => seasonSil += parseInt(c.value));
        document.querySelectorAll('.chk-gol-s:checked').forEach(c => seasonGol += parseInt(c.value));
        document.querySelectorAll('.chk-pla-s:checked').forEach(c => seasonPla += parseInt(c.value));
        
        // 🚀 시즌 남은 훈장 텍스트 업데이트
        document.getElementById('season_remain_text').innerText = `시즌 중 얻을 수 있는 남은 훈장 : 은 ${14 - seasonSil}개 | 금 ${11 - seasonGol}개 | 백금 ${8 - seasonPla}개`;

        // 2. 주간 수급량 체크값 합산 (파밍 기간 계산용)
        let weekSil = 0, weekGol = 0;
        document.querySelectorAll('.chk-sil-w:checked').forEach(c => weekSil += parseInt(c.value));
        document.querySelectorAll('.chk-gol-w:checked').forEach(c => weekGol += parseInt(c.value));
        
        // 🚀 이번 주 남은 훈장 텍스트 업데이트
        document.getElementById('weekly_remain_text').innerText = `이번 주에 얻을 수 있는 남은 훈장 : 은 ${39 - weekSil}개 | 금 ${18 - weekGol}개`;

        if(abyCart.length === 0) {
            document.getElementById('aby_res_time').innerText = "0주";
            document.getElementById('aby_res_desc').innerText = "장바구니에 장비를 담아주세요.";
            return;
        }

        let totalAp = 0;
        let reqSilver = 0, reqGold = 0, reqPlat = 0;

        abyCart.forEach(item => {
            totalAp += item.ap;
            if (item.rank == 100) reqSilver += item.medal;
            else if (item.rank == 1000) reqGold += item.medal;
            else if (item.rank == 10000) reqPlat += item.medal;
        });

        // 🚀 실 보유량 계산 (시즌 미션 자동 합산 제거! 오직 유저가 쓴 값만 들어감)
        let mySilver = parseInt(document.getElementById('my_medal_silver').value) || 0;
        let myGold = parseInt(document.getElementById('my_medal_gold').value) || 0;
        let myPlat = parseInt(document.getElementById('my_medal_plat').value) || 0;

        // 남은 필요량
        let remAp = Math.max(0, totalAp - myAp);
        let remSilver = Math.max(0, reqSilver - mySilver);
        let remGold = Math.max(0, reqGold - myGold);
        let remPlat = Math.max(0, reqPlat - myPlat);

        let highestRank = Math.max(...abyCart.map(i => parseInt(i.rank)));
        const wAp = parseInt(document.getElementById('week_ap').value) || 0;

        // 3. AP 소모 비용 (구매 시)
        let weeklyApCost = 0;
        if(document.getElementById('chk_sil_ap') && document.getElementById('chk_sil_ap').checked) weeklyApCost += 100000;
        if(document.getElementById('chk_gol_ap') && document.getElementById('chk_gol_ap').checked) weeklyApCost += 300000;

        let netWeeklyAp = wAp - weeklyApCost;
        let apWeeks = 0;
        if (remAp > 0) {
            if (netWeeklyAp <= 0) apWeeks = 999;
            else apWeeks = Math.ceil(remAp / netWeeklyAp);
        }

        // 4. 훈장 파밍 기간 (하위 훈장 변환 로직 포함)
        let medalWeeks = 0;
        let effectiveWeeklyMedal = 0;

        if (highestRank === 100 && remSilver > 0) {
            effectiveWeeklyMedal = weekSil;
            medalWeeks = (effectiveWeeklyMedal > 0) ? Math.ceil(remSilver / effectiveWeeklyMedal) : 999;
        } else if (highestRank === 1000 && remGold > 0) {
            effectiveWeeklyMedal = weekGol + (weekSil * 0.2); 
            medalWeeks = (effectiveWeeklyMedal > 0) ? Math.ceil(remGold / effectiveWeeklyMedal) : 999;
        } else if (highestRank === 10000 && remPlat > 0) {
            effectiveWeeklyMedal = (weekSil * 0.03); 
            medalWeeks = (effectiveWeeklyMedal > 0) ? Math.ceil(remPlat / effectiveWeeklyMedal) : 999;
        }

        let finalWeeks = Math.max(apWeeks, medalWeeks);

        let medalDesc = [];
        if (reqSilver > 0 || remSilver > 0) medalDesc.push(`은 ${remSilver}개`);
        if (reqGold > 0 || remGold > 0) medalDesc.push(`금 ${remGold}개`);
        if (reqPlat > 0 || remPlat > 0) medalDesc.push(`백금 ${remPlat}개`);
        let medalStr = medalDesc.length > 0 ? medalDesc.join(', ') : "0개";

        if (finalWeeks === 999) {
            document.getElementById('aby_res_time').innerHTML = `<span style="font-size:20px; color:#ff5252;">주간 획득량 부족</span>`;
            if (netWeeklyAp <= 0 && remAp > 0) {
                document.getElementById('aby_res_desc').innerHTML = `AP 지출이 수입보다 많습니다.`;
            } else {
                document.getElementById('aby_res_desc').innerHTML = `체크리스트에서 훈장 수급처를 체크해주세요!`;
            }
        } else {
            document.getElementById('aby_res_time').innerText = `약 ${finalWeeks}주`;
            document.getElementById('aby_res_desc').innerText = `남은 필요량: ${remAp.toLocaleString()} AP / 훈장: ${medalStr}`;
        }
    }

    const oldSwitch = switchTab;
    switchTab = (id, el) => {
        oldSwitch(id, el);
        if(id === 'abyss') calcAbyss();
        window.history.pushState(null, '', '?menu=' + id);
    };
       
