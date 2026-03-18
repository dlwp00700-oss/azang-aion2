    const API_BASE = "/api";
    let currentLoadedChar = null; // 최상단에 추가!
    let currentEquipData = []; 
    let simulationState = {};
    let activeSlotIndex = -1;
    let activeCategoryInfo = null;
    let currentNewItemAPIData = null;

    const EXCLUDE_KEYWORDS = ['아르카나', '룬', '아뮬렛', '양피지', '나침반', '종', '거울', '성배', '외형', '명화', '날개', '돌파석', '계승석', '조율석', '강화석', '마석', '신석', '도안', '레시피', '상자', '주화', '천칭'];

    const CATEGORY_MAP = [
        // 무기류
        { key: 'w_longsword', ncId: 'Sword', label: '장검', match: ['장검'], queries: ['장검'] },
        { key: 'w_greatsword', ncId: 'Greatsword', label: '대검', match: ['대검'], queries: ['대검'] },
        { key: 'w_dagger', ncId: 'Dagger', label: '단검', match: ['단검', '비수'], queries: ['단검'] },
        { key: 'w_bow', ncId: 'Bow', label: '활', match: ['활', '장궁', '궁'], queries: ['활'] },
        { key: 'w_spellbook', ncId: 'Magicbook', label: '법서', match: ['법서'], queries: ['법서'] },
        { key: 'w_orb', ncId: 'Orb', label: '보주', match: ['보주'], queries: ['보주'] },
        { key: 'w_mace', ncId: 'Mace', label: '전곤', match: ['전곤', '망치', '멸곤'], queries: ['전곤'] },
        { key: 'w_staff', ncId: 'Staff', label: '법봉', match: ['법봉'], queries: ['법봉'] },
        { key: 'guarder', ncId: 'Guarder', label: '가더', match: ['가더', '방패'], queries: ['가더'] },
        
        // 방어구류
        { key: 'head', ncId: 'Helmet', label: '투구', match: ['투구','머리','모자','관','두건','안경','장식'], queries: ['투구','머리','모자'] },
        { key: 'top', ncId: 'Torso', label: '상의', match: ['상의','흉갑','튜닉','조끼'], queries: ['상의','흉갑','튜닉','조끼'] },
        { key: 'bottom', ncId: 'Pants', label: '하의', match: ['하의','각반','바지','다리'], queries: ['하의','각반','바지'] },
        { key: 'shoulder', ncId: 'Shoulder', label: '견갑', match: ['견갑','어깨','견대'], queries: ['견갑','어깨'] },
        { key: 'glove', ncId: 'Gloves', label: '장갑', match: ['장갑','토시'], queries: ['장갑'] },
        { key: 'shoe', ncId: 'Boots', label: '신발', match: ['신발','장화','토우'], queries: ['신발','장화'] },
        { key: 'cloak', ncId: 'Cape', label: '망토', match: ['망토'], queries: ['망토'] },
        
        // 장신구류
        { key: 'necklace', ncId: 'Necklace', label: '목걸이', match: ['목걸이'], queries: ['목걸이'] },
        { key: 'earring', ncId: 'Earring', label: '귀걸이', match: ['귀걸이', '귀고리'], queries: ['귀걸이', '귀고리'] }, 
        { key: 'ring', ncId: 'Ring', label: '반지', match: ['반지'], queries: ['반지'] },
        { key: 'bracelet', ncId: 'Bracelet', label: '팔찌', match: ['팔찌'], queries: ['팔찌'] }
    ];

    function getGradeColor(grade) {
        if (grade === "Unique") return "#ffca28"; // 유일 (노랑)
        if (grade === "Hero" || grade === "Epic") return "#ff9800"; // 영웅 (주황)
        if (grade === "Legend") return "#4fc3f7"; // 전승 (파랑 - 🚨공식 데이터 반영!)
        if (grade === "Rare") return "#69f0ae"; // 희귀 (초록)
        return "#fff";
    }

   // 🚀 완벽한 부위 판별 함수 (클릭 시 화면 멈춤 에러 완벽 해결)
    function getSmartCategory(item) {
        if (!item) return null;
        
        let iName = (item.name || "").replace(/\s*\(늘어남\)\s*/g, '').trim();
        let cName = (item.categoryName || (item.category && item.category.name) || "").replace(/\s*\(늘어남\)\s*/g, '').trim();
        
        // 🌟 핵심: ID가 숫자로 들어올 경우를 대비해 String으로 감싸서 에러를 원천 차단합니다!
        let catId = String(item.categoryId || (item.category && item.category.id) || ""); 

        let baseCatId = catId.replace(/_Extend|_Ext/g, '');

        let exactMatch = CATEGORY_MAP.find(c => c.ncId === catId || c.ncId === baseCatId);
        if (exactMatch) return exactMatch;

        for (let cat of CATEGORY_MAP) {
            if (cat.match.some(m => iName.includes(m))) return cat;
        }

        for (let cat of CATEGORY_MAP) {
            if (cat.match.some(m => cName.includes(m))) return cat;
        }

        if (iName.endsWith('대검')) return CATEGORY_MAP.find(c => c.key === 'w_greatsword');
        if (iName.endsWith('단검') || iName.endsWith('비수')) return CATEGORY_MAP.find(c => c.key === 'w_dagger');
        if (iName.endsWith('장검') || iName.endsWith('검')) return CATEGORY_MAP.find(c => c.key === 'w_longsword');
        if (iName.endsWith('도')) return CATEGORY_MAP.find(c => c.key === 'w_dagger');
        if (iName.endsWith('활') || iName.endsWith('궁')) return CATEGORY_MAP.find(c => c.key === 'w_bow');
        if (iName.endsWith('전곤') || iName.endsWith('망치') || iName.endsWith('해머') || iName.endsWith('곤')) return CATEGORY_MAP.find(c => c.key === 'w_mace');
        if (iName.endsWith('법서') || iName.endsWith('서')) return CATEGORY_MAP.find(c => c.key === 'w_spellbook');
        if (iName.endsWith('보주') || iName.endsWith('주')) return CATEGORY_MAP.find(c => c.key === 'w_orb');
        if (iName.endsWith('법봉') || iName.endsWith('지팡이') || iName.endsWith('봉')) return CATEGORY_MAP.find(c => c.key === 'w_staff');
        
        if (iName.endsWith('방패') || iName.endsWith('가더')) return CATEGORY_MAP.find(c => c.key === 'guarder');

        if (iName.endsWith('목걸이')) return CATEGORY_MAP.find(c => c.key === 'necklace');
        if (iName.endsWith('귀걸이') || iName.endsWith('귀고리')) return CATEGORY_MAP.find(c => c.key === 'earring');
        if (iName.endsWith('반지')) return CATEGORY_MAP.find(c => c.key === 'ring');
        if (iName.endsWith('팔찌')) return CATEGORY_MAP.find(c => c.key === 'bracelet');
        
        return null;
    }

    const STAT_LABEL = { atk:"공격력", acc:"명중", amp:"피해 증폭(%)", wAmp:"무기 피증(%)", pvpAmp:"PVP 피증(%)", pveAmp:"PVE 피증(%)", crit:"치명타", critDmg:"치명타 피해 증폭(%)", critAddDmg:"치명타 공격력", critRes:"치명 저항", hp:"생명력", mp:"정신력", def:"방어력", spd:"전투 속도(%)", power:"위력", agi:"민첩", acc_stat:"정확", will:"의지", know:"지식", vit:"체력", dest:"파괴", death:"죽음", wis:"지혜", destiny:"운명", space:"공간", time_stat:"시간", life:"생명", illusion:"환상", freedom:"자유", justice:"정의", atkPct:"공격력 증가(%)", defPct:"방어력 증가(%)", bossAmp:"보스 피증(%)", raceAmp:"종족 피증(%)", pveRes:"PVE 내성(%)", pvpRes:"PVP 내성(%)", genRes:"일반 내성(%)" };

    // =========================================================
    // 🚀 복구된 핵심 엔진: 이 아래부터 복사해서 넣으시면 됩니다!
    const STAT_KEYS = Object.keys(STAT_LABEL);

    function mapStatName(name) {
        if(!name) return null;
        if(name.includes('공격력 증가')) return 'atkPct';
        if(name.includes('방어력 증가')) return 'defPct';
        if(name.includes('생명력 증가')) return 'hpPct';
        if(name.includes('일반 피해 증폭') || name==='DamageAmplify') return 'amp';
        if(name.includes('무기 피해 증폭') || name==='AmplifyWeaponDamage') return 'wAmp';
        if(name.includes('PVP 피해 증폭') || name==='PvPAmplifyDamage') return 'pvpAmp';
        if(name.includes('PVE 피해 증폭') || name==='PvEAmplifyDamage') return 'pveAmp';
        if(name.includes('치명타 피해 증폭') || name==='CriticalAmplifyDamage') return 'critDmg';
        if(name==='공격력' || name==='WeaponFixingDamage' || name.includes('추가 공격력')) return 'atk';
        if(name==='명중' || name==='WeaponAccuracy') return 'acc';
        if(name==='치명타' || name==='Critical') return 'crit';
        if(name==='치명타 저항' || name==='CriticalResist' || name.includes('치명타 방어력')) return 'critRes';
        if(name==='방어력' || name==='Defense' || name.includes('추가 방어력')) return 'def';
        if(name==='생명력' || name==='MaxHp') return 'hp';
        if(name==='정신력' || name==='MaxMp') return 'mp';
        if(name==='일반 피해 내성' || name==='DamageResist') return 'genRes';
        if(name.includes('PVE 피해 내성') || name==='PvEDamageResist' || name.includes('PVE 방어력')) return 'pveRes';
        if(name.includes('PVP 피해 내성') || name==='PvPDamageResist') return 'pvpRes';
        if(name==='위력' || name==='STR') return 'power';
        if(name==='민첩' || name==='DEX') return 'agi';
        if(name==='정확' || name==='AGI') return 'acc_stat';
        if(name==='의지' || name==='WIS') return 'will';
        if(name==='지식' || name==='INT') return 'know';
        if(name==='체력' || name==='CON') return 'vit';
        if(name==='파괴' || name==='Destruction') return 'dest';
        if(name==='죽음' || name==='Death') return 'death';
        if(name==='지혜' || name==='Wisdom') return 'wis';
        if(name==='운명' || name==='Destiny') return 'destiny';
        if(name==='공간' || name==='Space') return 'space';
        if(name==='시간' || name==='Time') return 'time_stat';
        if(name==='생명' || name==='Life') return 'life';
        if(name==='환상' || name==='Illusion') return 'illusion';
        if(name==='자유' || name==='Freedom') return 'freedom';
        if(name==='정의' || name==='Justice') return 'justice';
        return null;
    }
    // 🚀 복구 끝
    // =========================================================
	
	function findData(obj, key) {
        if (!obj || typeof obj !== 'object') return null;
        if (key in obj) return obj[key];
        for (let k in obj) { const res = findData(obj[k], key); if (res) return res; }
        return null;
    }

    function getGradeColor(grade) {
        if (grade === "Unique") return "#ffca28"; 
        if (grade === "Hero" || grade === "Epic") return "#ff9800"; 
        if (grade === "Rare") return "#69f0ae"; 
        return "#fff";
    }

   

    function goToHome() {
        document.getElementById('appBody').className = 'home-mode';
        document.getElementById('characterSelection').style.display = 'none';
        document.getElementById('statusMsg').innerHTML = "* 서버 연동 완료";
        document.getElementById('charNameInput').value = '';
    }

    let serverListCache = [];
    
    // 🚀 페이지 켜질 때 몰래 서버 목록만 받아오기 (유저 몰래)
    async function initServerList() {
        try {
            const res = await fetch(`${API_BASE}/servers`);
            const data = await res.json();
            serverListCache = data.serverList || [];
            selectSearchFaction(0, document.querySelector('.fac-btn.active')); // 전체 목록 띄우기
        } catch (e) {
            document.getElementById('searchServer').innerHTML = `<option value="">서버 목록 불러오기 실패</option>`;
        }
    }

   
    // 🚀 종족 버튼 누를 때마다 서버 목록 즉시 변경 + 기본 문구 맞춤 변경
    function selectSearchFaction(raceId, btnEl) {
        document.getElementById('searchFaction').value = raceId;
        
        // 버튼 색상 변경 로직
        document.querySelectorAll('.fac-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.style.borderColor = '#333';
        });
        if(btnEl) {
            btnEl.classList.add('active');
            btnEl.style.borderColor = raceId === 1 ? '#4fc3f7' : (raceId === 2 ? '#448aff' : '#ffca28');
        }

        const serverSelect = document.getElementById('searchServer');
        if (serverListCache.length === 0) return; // 아직 몰래 로딩 중이면 대기

        // 🚀 선택한 종족에 따라 기본 옵션 글씨 다르게 설정
        let defaultText = "🌐 전체 서버 검색";
        if (raceId === 1) defaultText = "🕊️ 천족 서버 검색";
        else if (raceId === 2) defaultText = "🦇 마족 서버 검색";

        let html = `<option value="">${defaultText}</option>`;
        const filtered = raceId === 0 ? serverListCache : serverListCache.filter(s => s.raceId === raceId);
        filtered.forEach(s => { html += `<option value="${s.serverId}">${s.serverName}</option>`; });
        serverSelect.innerHTML = html;

        // 🚀 신규: 검색어칸에 이미 이름이 있다면, 클릭 즉시 바로 재검색 실행!
        const currentSearchName = document.getElementById('charNameInput').value.trim();
        if (currentSearchName) {
            setTimeout(() => { searchCharacter(); }, 50);
        }
    }

    function getSetName(itemName) {
        if(!itemName) return null;
        if(itemName.includes("백부장")) return "백부장";
        if(itemName.includes("천부장")) return "천부장";
        if(itemName.includes("십부장")) return "십부장";
        if(itemName.includes("군단장")) return "군단장";
        return null;
    }

    function calcSetEffects(counts) {
        let eff = { pvpAmp: 0, pveAmp: 0, abyssPveAmp: 0 };
        const rules = {
            "십부장": { 2: {pve:-5, ab:10}, 5: {pve:-5, ab:10}, 8: {pve:-5, ab:10}, 12: {pve:-5, ab:10} },
            "백부장": { 2: {pvp:5, pve:-5, ab:10}, 5: {pve:-5, ab:10}, 8: {pve:-5, ab:10}, 12: {pve:-5, ab:10} },
            "천부장": { 2: {pvp:5, pve:-5, ab:10}, 5: {pve:-5, ab:10}, 8: {pvp:5, pve:-5, ab:10}, 12: {pve:-5, ab:10} },
            "군단장": { 2: {pvp:6, pve:-5, ab:10}, 5: {pve:-5, ab:10}, 8: {pvp:6, pve:-5, ab:10}, 12: {pve:-5, ab:10} }
        };
        for(let set in counts) {
            let count = counts[set];
            if(rules[set]) {
                for(let req in rules[set]) {
                    if(count >= parseInt(req)) {
                        eff.pvpAmp += rules[set][req].pvp || 0;
                        eff.pveAmp += rules[set][req].pve || 0;
                        eff.abyssPveAmp += rules[set][req].ab || 0;
                    }
                }
            }
        }
        return eff;
    }

    // 🚀 신규 추가: 어비스 세트 효과 텍스트 생성기 (이게 빠져있었습니다!)
    function getSetEffectText(counts) {
        const rules = {
            "십부장": { 2: { ab: 10, pve: -5 }, 5: { ab: 10, pve: -5 }, 8: { ab: 10, pve: -5 }, 12: { ab: 10, pve: -5 } },
            "백부장": { 2: { ab: 10, pvp: 5, pve: -5 }, 5: { ab: 10, pvpR: 5, pve: -5 }, 8: { ab: 10, pve: -5 }, 12: { ab: 10, pve: -5 } },
            "천부장": { 2: { ab: 10, pvp: 5, pve: -5 }, 5: { ab: 10, pvpR: 5, pve: -5 }, 8: { ab: 10, pvp: 5, pve: -5 }, 12: { ab: 10, pvpR: 5, pve: -5 } },
            "군단장": { 2: { ab: 10, pvp: 6, pve: -5 }, 5: { ab: 10, pvpR: 6, pve: -5 }, 8: { ab: 10, pvp: 6, pve: -5 }, 12: { ab: 10, pvpR: 6, pve: -5 } }
        };

        let activeSets = [];

        for(let set in counts) {
            let count = counts[set];
            let setName = "";
            if(set.includes("십부장")) setName = "십부장";
            else if(set.includes("백부장")) setName = "백부장";
            else if(set.includes("천부장")) setName = "천부장";
            else if(set.includes("군단장")) setName = "군단장";

            if(setName && rules[setName]) {
                let pve = 0, pvp = 0, pvpR = 0, ab = 0;
                let maxTier = 0;
                
                // 적용되는 모든 단계의 스탯을 누적 합산
                for(let req in rules[setName]) {
                    if(count >= parseInt(req)) {
                        pve += rules[setName][req].pve || 0;
                        pvp += rules[setName][req].pvp || 0;
                        pvpR += rules[setName][req].pvpR || 0;
                        ab += rules[setName][req].ab || 0;
                        maxTier = req;
                    }
                }

                if(maxTier > 0) {
                    let stats = [];
                    if(pve !== 0) stats.push(`PVE ${pve}%`);
                    if(pvp !== 0) stats.push(`PVP +${pvp}%`);
                    if(pvpR !== 0) stats.push(`PVP내성 +${pvpR}%`);
                    if(ab !== 0) stats.push(`어비스PVE +${ab}%`);
                    
                    activeSets.push(`<span style="color:#ffca28;">[${setName} ${count}피스]</span> (${stats.join(', ')})`);
                }
            }
        }
        
        return activeSets.length > 0 ? activeSets.join(' <br>➕ ') : '<span style="color:#888;">발동 중인 어비스 세트 효과 없음</span>';
    }

    function extractBaseStats(eq, overrideBrk) {
        let stats = {}; 
        let displayLines = []; 
        if(!eq) return { total: stats, display: displayLines };

        const mStats = findData(eq, 'mainStats') || [];
        const FIXED_STATS = ["pvpAmp", "pveAmp", "amp", "wAmp", "spd", "atkPct", "defPct", "bossAmp", "raceAmp", "pveRes", "pvpRes", "genRes"]; 
        let seenNames = new Set(); 

        mStats.forEach(st => {
            let name = st.name || "능력치";
            let bVal = parseFloat((st.value||"0").toString().replace(/[^0-9.]/g, ''))||0;
            let eVal = parseFloat((st.extra||"0").toString().replace(/[^0-9.]/g, ''))||0;

            let k = mapStatName(name) || mapStatName(st.id) || name; 
            let isFixed = FIXED_STATS.includes(k);

            if (!seenNames.has(name) && !name.includes("증가")) {
                seenNames.add(name);
                stats[k] = (stats[k] || 0) + (bVal + (isFixed ? 0 : eVal)); 
                displayLines.push({ name: name, bVal: bVal, eVal: eVal, isFixed: isFixed, isOrange: false });
            }
        });

        let brkLvl = parseInt(overrideBrk !== undefined ? overrideBrk : (eq.exceedLevel || 0));
        
        if (brkLvl > 0) {
            let catObj = getSmartCategory(eq);
            let catKey = catObj ? catObj.key : 'w_longsword';
            let brkStats = [];

            if (catKey.startsWith('w_') || catKey === 'guarder') {
                brkStats = [ {k:'atk', n:'공격력', v:30*brkLvl}, {k:'atkPct', n:'공격력 증가', v:1*brkLvl, pct:true} ];
            } else if (['necklace', 'earring', 'ring'].includes(catKey)) {
                brkStats = [ {k:'atk', n:'공격력', v:20*brkLvl}, {k:'def', n:'방어력', v:40*brkLvl}, {k:'atkPct', n:'공격력 증가', v:1*brkLvl, pct:true} ];
            } else { 
                brkStats = [ {k:'def', n:'방어력', v:80*brkLvl}, {k:'hp', n:'생명력', v:80*brkLvl}, {k:'defPct', n:'방어력 증가', v:1*brkLvl, pct:true} ];
            }

            brkStats.forEach(s => {
                stats[s.k] = (stats[s.k] || 0) + s.v; 
                displayLines.push({ name: s.n, bVal: s.v, eVal: 0, isFixed: true, isOrange: true, forcePct: s.pct });
            });
        }

        return { total: stats, display: displayLines };
    }

    function extractEngraveStats(eq) {
        let stats = {}; 
        if(!eq) return stats;
        const sStats = findData(eq, 'subStats') || [];
        sStats.forEach(st => {
            let sVal = parseFloat((st.value||"0").toString().replace(/[^0-9.]/g, ''))||0;
            let rawName = st.name;
            let k = mapStatName(rawName) || mapStatName(st.id) || rawName; 
            stats[k] = (stats[k] || 0) + sVal;
        });
        return stats;
    }

    function calculateEquippedCP(eq) {
        let baseLv = parseInt(eq.level || eq.itemLevel || eq.equipLevel || 0);
        let enh = parseInt(eq.enchantLevel || 0);
        let brk = parseInt(eq.exceedLevel || 0);
        
        let catObj = getSmartCategory(eq);
        let isWepGua = catObj && (catObj.key.startsWith('w_') || catObj.key === 'guarder');
        
        let total = baseLv + (enh * 1) + (brk * 5) + (isWepGua ? 5 : 0);
        
        if (eq.magicStoneStat && Array.isArray(eq.magicStoneStat)) {
            eq.magicStoneStat.forEach(ms => {
                let g = ms.grade;
                if(g === 'Unique' || g === 'Epic' || g === 'Hero') total += 4;
                else if(g === 'Legend') total += 3;
                else if(g === 'Rare') total += 2;
                else total += 1;
            });
        }
        return total;
    }

    function calculateNewItemCP(eq, enh, brk) {
        let baseLv = parseInt(eq.level || eq.itemLevel || eq.equipLevel || 0);
        let enhVal = parseInt(enh || 0);
        let brkVal = parseInt(brk || 0);
        
        let catObj = getSmartCategory(eq);
        let isWepGua = catObj && (catObj.key.startsWith('w_') || catObj.key === 'guarder');
        
        return baseLv + (enhVal * 1) + (brkVal * 5) + (isWepGua ? 5 : 0);
    }

    async function searchCharacter() {
        const name = document.getElementById('charNameInput').value.trim();
        const race = document.getElementById('searchFaction').value;
        const serverId = document.getElementById('searchServer').value;
        const statusMsg = document.getElementById('statusMsg');
        const selectionDiv = document.getElementById('characterSelection'); 
        const listDiv = document.getElementById('selectionList'); 

        if(!name) return alert("캐릭터명을 입력하세요!");
        statusMsg.innerHTML = "🔍 검색 중...";
        selectionDiv.style.display = 'none'; 

        try {
            let charList = [];
            
            // 🚀 마법의 코드: '전체(0)'일 때는 천족(1)과 마족(2) API를 동시에 찔러서 결과를 싹 다 긁어모읍니다!
            if (race === "0" || race === 0) {
                const url1 = `${API_BASE}/searchList?name=${encodeURIComponent(name)}&race=1${serverId ? `&serverId=${serverId}` : ''}`;
                const url2 = `${API_BASE}/searchList?name=${encodeURIComponent(name)}&race=2${serverId ? `&serverId=${serverId}` : ''}`;
                
                // Promise.all을 써서 두 번의 검색을 빛의 속도로 동시에 진행
                const [res1, res2] = await Promise.all([
                    fetch(url1).then(r => r.json()).catch(e => ({ list: [] })),
                    fetch(url2).then(r => r.json()).catch(e => ({ list: [] }))
                ]);
                
                const list1 = res1.contents || res1.list || [];
                const list2 = res2.contents || res2.list || [];
                charList = [...list1, ...list2]; // 두 종족 결과 합치기!
            } else {
                // 특정 종족이 선택되었을 때는 기존처럼 한 번만 검색
                let apiUrl = `${API_BASE}/searchList?name=${encodeURIComponent(name)}&race=${race}`;
                if (serverId) apiUrl += `&serverId=${serverId}`;
                const listRes = await fetch(apiUrl);
                const listData = await listRes.json();
                charList = listData.contents || listData.list || [];
            }

            if (charList.length === 0) { statusMsg.innerHTML = "❌ 검색된 캐릭터가 없습니다."; return; }

            statusMsg.innerHTML = `✅ ${charList.length}명의 캐릭터 발견`;
            selectionDiv.style.display = 'block'; 
            listDiv.innerHTML = ''; 

            charList.forEach(char => {
                const charCard = document.createElement('div');
                charCard.style.cssText = "padding: 10px 15px; background: #2a2a35; color: white; border: 1px solid #444; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; transition: 0.2s;";
                charCard.onmouseover = () => charCard.style.borderColor = "#4fc3f7";
                charCard.onmouseout = () => charCard.style.borderColor = "#444";

                
               
                // NC가 멋대로 붙인 <strong> 태그를 깔끔하게 벗겨내는 필터!
                let rawName = char.characterName || char.name || "이름 없음";
                const charName = String(rawName).replace(/<\/?[^>]+(>|$)/g, ""); 
                const serverName = char.serverName || "서버 미확인";
                const level = char.level || "-";
                
                // 🚀 공식 홈페이지의 비밀: 직업을 글자가 아닌 'pcId'라는 숫자로 줍니다!
                // 아래에 실제 게임의 직업 번호에 맞게 이름을 적어주시면 완벽하게 번역됩니다.
                const PC_CLASS_MAP = {
                    5: "검성", 6: "검성", 7: "검성", 8: "검성",
                    9: "수호성", 10: "수호성", 11: "수호성", 12: "수호성",
                    13: "궁성", 14: "궁성", 15: "궁성", 16: "궁성",
                    17: "살성", 18: "살성", 19: "살성", 20: "살성",
                    21: "정령성", 22: "정령성", 23: "정령성", 24: "정령성",
                    25: "마도성", 26: "마도성", 27: "마도성", 28: "마도성",
                    29: "치유성", 30: "치유성", 31: "치유성", 32: "치유성",
                    33: "호법성", 34: "호법성", 35: "호법성", 36: "호법성"
                };

                let className = char.jobName || char.className || char.class;
                if (!className && char.pcId) {
                    className = PC_CLASS_MAP[char.pcId] || `미확인(번호:${char.pcId})`;
                } else if (!className) {
                    className = "미확인";
                }
                
                // 🚀 마족 색상 패치 (숫자로 2가 들어올 때도 마족으로 인식)
                const raceName = String(char.raceName || char.race || "");
                let nameColor = "#4fc3f7"; // 천족 기본 색상 (파랑)
                if (char.raceId == 2 || char.race == 2 || raceName === "2" || raceName.includes('마족')) {
                    nameColor = "#ff5252"; // 마족 (빨강)
                }

                const infoDiv = document.createElement('div');
                infoDiv.style.cssText = "cursor: pointer; flex: 1;";
                
                // 🚀 요청하신 디자인으로 변경: [서버] | Lv | 캐릭터명 | 직업
                infoDiv.innerHTML = `
                    <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                        <span style="color:#aaa; font-size:12px;">[${serverName}]</span>
                        <span style="color:#555; font-size:10px;">|</span>
                        <span style="color:#ccc; font-size:12px; font-weight:bold;">Lv.${level}</span>
                        <span style="color:#555; font-size:10px;">|</span>
                        <span style="font-weight:bold; font-size:14px; color:${nameColor};">${charName}</span>
                        <span style="color:#555; font-size:10px;">|</span>
                        <span style="color:#ffca28; font-size:12px; font-weight:bold;">${className}</span>
                    </div>
                `;
                infoDiv.onclick = () => {
                    selectionDiv.style.display = 'none';
                    loadCharacterDetail(char.characterId, char.serverId || serverId, charName);
                };

                const favBtn = document.createElement('button');
                favBtn.innerHTML = "⭐ 저장";
                favBtn.style.cssText = "background: #111; color: #ffca28; border: 1px solid #555; padding: 5px 10px; border-radius: 4px; font-size: 11px; cursor: pointer; transition: 0.2s; font-weight:bold;";
                favBtn.onmouseover = () => favBtn.style.background = "#332a00";
                favBtn.onmouseout = () => favBtn.style.background = "#111";
                favBtn.onclick = (e) => {
                    e.stopPropagation();
                    addFavorite(char.characterId, char.serverId || serverId, charName, serverName, className);
                };

                charCard.appendChild(infoDiv);
                charCard.appendChild(favBtn);
                listDiv.appendChild(charCard);
            });

        } catch (e) { statusMsg.innerHTML = "❌ 검색 오류"; }
    }

    async function loadCharacterDetail(characterId, serverId, characterName) {
    // 🚀 [해결1] 랭킹 등에서 넘어온 이름에 숨어있는 <strong> 태그를 강제로 벗겨냅니다!
    characterName = String(characterName).replace(/<\/?[^>]+(>|$)/g, "");

    const statusMsg = document.getElementById('statusMsg');
    currentLoadedChar = { serverId: serverId, characterName: characterName }; // 로드 성공 시 기억!
        
        // 🚀 추가된 마법의 코드: 새로고침 없이 주소창만 아툴처럼 싹 바꿔치기!
        const newUrl = `?server=${serverId}&name=${encodeURIComponent(characterName)}`;
        window.history.pushState({path:newUrl}, '', newUrl);

        statusMsg.innerHTML = `⏳ [${characterName}] 분석 중...`;
        try {
            const detailRes = await fetch(`${API_BASE}/characterDetail?characterId=${encodeURIComponent(characterId)}&serverId=${serverId}`);
            const data = await detailRes.json();
            
            const statList = data.stat?.statList || data.info?.stat?.statList || [];

			// 기존 CP
			let cpStat = statList.find(s => s.type === "ItemLevel" || s.name === "아이템레벨");
			const oldCp = cpStat ? cpStat.value : 0;
			document.getElementById('baseCp').value = oldCp;
			
			// 새 전투력
			const combatPower =
			    data.profile?.combatPower ??
			    data.info?.profile?.combatPower ??
			    0;
			
			// 화면 표시
			const cpTextEl = document.getElementById('cpDisplayText');
			if (cpTextEl) {
			    cpTextEl.textContent = `CP ${oldCp} | 전투력 ${combatPower}`;
			}
			
			const setStat = (id, typeKey, nameKey) => {
			    let s = statList.find(x => x.type === typeKey || (x.name && x.name.includes(nameKey)));
			    if (s) document.getElementById(id).value = s.value;
			};
            
            setStat('basePower', 'STR', '위력');
            setStat('baseAgi', 'DEX', '민첩');
            setStat('baseAccStat', 'AGI', '정확');
            setStat('baseWill', 'WIS', '의지');
            setStat('baseKnow', 'INT', '지식');
            setStat('baseVit', 'CON', '체력');
            setStat('baseDest', 'Destruction', '파괴');
            setStat('baseDeath', 'Death', '죽음');
            setStat('baseWis', 'Wisdom', '지혜');
            setStat('baseDestiny', 'Destiny', '운명');
            setStat('baseSpace', 'Space', '공간');
            setStat('baseTime', 'Time', '시간');
            setStat('baseLife', 'Life', '생명');
            setStat('baseIllusion', 'Illusion', '환상');
            setStat('baseFreedom', 'Freedom', '자유');
            setStat('baseJustice', 'Justice', '정의');

            const rawEquip = data.equipment?.equipment?.equipmentList || data.equipment?.equipmentList || [];
            currentEquipData = rawEquip.filter(eq => !EXCLUDE_KEYWORDS.some(kw => (eq.name||"").includes(kw)));
            
            simulationState = {}; 
            activeSlotIndex = -1; 
            currentNewItemAPIData = null;
            
            statusMsg.innerHTML = `<span style="color:var(--pos)">✅ [${characterName}] 로드 완료!</span>`;
            document.getElementById('appBody').className = 'dash-mode';
            
            renderEquipGrid();

            // 🌟 [추가된 부분] 캐릭터 로드 시 자동 최적화 탭에도 내 장비 즉시 뿌려주기!
            if (typeof renderOptEquipList === 'function') renderOptEquipList();
            if (typeof toggleOptGoalInput === 'function') toggleOptGoalInput();

            document.getElementById('workbench').innerHTML = `<div class="empty-wb"><div style="font-size:40px; margin-bottom:15px;">🛠️</div>왼쪽 목록에서 <b>변경하고 싶은 장비</b>를 클릭하세요.</div>`;
            updateDeltaDashboard();
        } catch (e) { 
            statusMsg.innerHTML = "❌ 정보 로드 실패"; 
        }
    }

    function renderEquipGrid() {
        const grid = document.getElementById('equipResultArea');
        grid.innerHTML = "";
        
        currentEquipData.forEach((eq, index) => {
            const name = eq.name || "알 수 없는 장비";
            const enh = eq.enchantLevel || 0;
            const brk = eq.exceedLevel || 0; 
            const imgTag = eq.icon ? `<img src="${eq.icon}" class="item-icon" onerror="this.style.display='none'">` : `<div class="item-icon"></div>`;
            
            let baseLv = eq.level || eq.itemLevel || eq.equipLevel || "?";
            let bonusHtml = "";

            let diamondsHtml = ''; 
            for (let i = 0; i < 5; i++) diamondsHtml += `<div class="diamond-pip ${i < brk ? 'active' : ''}"></div>`;
            
            const isSimulated = simulationState[index] ? 'simulated' : '';
            const isActive = activeSlotIndex === index ? 'active' : '';

            grid.innerHTML += `
            <div class="equip-card ${isActive} ${isSimulated}" onclick="openWorkbench(${index})">
                <div class="sim-badge">🔄 변경됨</div>
                <div class="item-header">
                    ${imgTag}
                    <div style="min-width:0; width:100%;">
                        <div class="eq-title"><span class="eq-enh">+${enh}</span> <span style="color:${getGradeColor(eq.grade)}">${name}</span></div>
                        <div style="font-size:11px; color:#888;">Lv.${baseLv} ${bonusHtml}</div>
                        <div class="diamond-container">${diamondsHtml}</div>
                    </div>
                </div>
            </div>`;
        });
    }

    function setMaxEngrave(btnElement) {
        const row = btnElement.closest('.eng-row');
        const sel = row.querySelector('.wb-eng-type');
        const input = row.querySelector('.wb-eng-val');

        if(sel.selectedIndex > 0) {
            const maxVal = sel.options[sel.selectedIndex].getAttribute('data-max');
            if(maxVal) {
                input.value = parseFloat(maxVal.replace(/[^0-9.]/g, ''));
                applySimulation(true);
            }
        }
    }

    function openWorkbench(index) {
        activeSlotIndex = index;
        renderEquipGrid(); 
        const eq = currentEquipData[index];
        activeCategoryInfo = getSmartCategory(eq) || {key: 'w_longsword', label: '무기'};
        currentNewItemAPIData = null; 

        let enhOptions = ''; for(let i=0; i<=20; i++) enhOptions += `<option value="${i}">+${i}강</option>`;
        
        let weaponFiltersHtml = CATEGORY_MAP.filter(c => c.key.startsWith('w_')).map(c => `
            <label class="filter-label"><input type="checkbox" class="filter-category" value="${c.key}" ${activeCategoryInfo.key === c.key ? 'checked' : ''} onchange="searchDictItem()"> ${c.label}</label>
        `).join('');

        let armorFiltersHtml = CATEGORY_MAP.filter(c => !c.key.startsWith('w_')).map(c => `
            <label class="filter-label"><input type="checkbox" class="filter-category" value="${c.key}" ${activeCategoryInfo.key === c.key ? 'checked' : ''} onchange="searchDictItem()"> ${c.label}</label>
        `).join('');

        let gradeFiltersHtml = `
            <label class="filter-label"><input type="checkbox" class="filter-grade" value="Unique" checked onchange="searchDictItem()"> 유일</label>
            <label class="filter-label"><input type="checkbox" class="filter-grade" value="Epic" checked onchange="searchDictItem()"> 영웅</label>
            <label class="filter-label"><input type="checkbox" class="filter-grade" value="Legend" onchange="searchDictItem()"> 전승</label>
            <label class="filter-label"><input type="checkbox" class="filter-grade" value="Rare" onchange="searchDictItem()"> 희귀</label>
        `;

        // 🚀 신규: 획득처 필터 HTML
        let sourceFiltersHtml = `
            <label class="filter-label"><input type="checkbox" class="filter-source" value="craft" checked onchange="searchDictItem()"> 🛠️ 제작</label>
            <label class="filter-label"><input type="checkbox" class="filter-source" value="dungeon" checked onchange="searchDictItem()"> 🏰 원정</label>
            <label class="filter-label"><input type="checkbox" class="filter-source" value="abyss" checked onchange="searchDictItem()"> 🏅 어비스</label>
            <label class="filter-label"><input type="checkbox" class="filter-source" value="etc" checked onchange="searchDictItem()"> 📦 기타(드랍 등)</label>
        `;

        let html = `
        <div class="wb-title">
            <span>🛠️ 시뮬레이팅: <span style="color:#fff;">[${eq.name.split(' ')[0]||'장비'}]</span> 교체</span>
            <button class="btn-reset" onclick="resetSimulation(${index})">🔄 이 부위 초기화</button>
        </div>

        <div style="background:#111; border:1px solid #222; padding:12px; border-radius:6px; margin-bottom:15px;">
            <div style="display:flex; gap:10px; margin-bottom:10px;">
                <input type="text" id="dictSearchInput" class="sim-input" placeholder="검색어 (예: 백부장... 비워둬도 됨!)" style="flex:2;" onkeypress="if(event.keyCode==13) searchDictItem()">
                <button class="btn-dict-search" onclick="searchDictItem()">🔍 직접 검색</button>
            </div>
            
            <div style="display:flex; flex-direction:column; gap:12px; font-size:12px; background:#0a0a0c; padding:15px; border-radius:4px; border:1px dashed #333;">
                <div style="display:flex; gap:15px; align-items:center; border-bottom:1px solid #222; padding-bottom:10px;">
                    <span style="color:#ffca28; font-weight:bold; width:45px;">💎 등급</span>
                    <div style="display:flex; flex-wrap:wrap; gap:8px; flex:1;">
                        ${gradeFiltersHtml}
                    </div>
                </div>
                <div style="display:flex; gap:15px; align-items:center; border-bottom:1px solid #222; padding-bottom:10px;">
                    <span style="color:#69f0ae; font-weight:bold; width:45px;">🎁 획득</span>
                    <div style="display:flex; flex-wrap:wrap; gap:8px; flex:1;">
                        ${sourceFiltersHtml}
                    </div>
                </div>
                <div style="display:flex; gap:15px; align-items:flex-start;">
                    <span style="color:#ff5252; font-weight:bold; width:45px; margin-top:2px;">⚔️ 무기</span>
                    <div style="display:flex; flex-wrap:wrap; gap:8px; flex:1;">
                        ${weaponFiltersHtml}
                    </div>
                </div>
                <div style="display:flex; gap:15px; align-items:flex-start; margin-top:4px;">
                    <span style="color:#4fc3f7; font-weight:bold; width:45px; margin-top:2px;">🛡️ 방어</span>
                    <div style="display:flex; flex-wrap:wrap; gap:8px; flex:1;">
                        ${armorFiltersHtml}
                    </div>
                </div>
            </div>
        </div>

        <div id="dictResultArea" class="dict-result-area"></div>

        <div class="compare-container">
            <div class="card-box" id="wbOldCard"></div>
            <div style="display:flex; align-items:center; color:#4fc3f7; font-size:24px;">➡</div>
            <div class="card-box new-card" id="wbNewCard">
                <div class="card-header" style="color:#00e676;">교체 후 예상 스펙</div>
                <div id="newCardHeader" style="min-height: 60px; display:flex; align-items:center; justify-content:center; color:#666; font-size:12px;">사전에서 아이템을 선택하세요.</div>
                
                <div style="display:flex; gap:10px; margin: 10px 0;">
                    <select id="wbEnh" class="sim-select" onchange="updateNewItemByEnhance()">${enhOptions}</select>
                    <select id="wbBrk" class="sim-select" style="color:#ffca28;" onchange="updateNewItemByEnhance()"><option value="0">0돌파</option><option value="1">1돌파</option><option value="2">2돌파</option><option value="3">3돌파</option><option value="4">4돌파</option><option value="5">5돌파</option></select>
                </div>

                <div class="stat-group">
                    <div class="stat-group-title sg-base">🛡️ 기본 능력치 <span style="font-size:10px; color:#888; font-weight:normal;">(자동 합산)</span></div>
                    <div id="newBaseStatsDisplay" style="min-height:30px;"></div>
                </div>

                <div class="stat-group" style="margin-bottom:0;">
                    <div class="stat-group-title sg-engrave" style="display:flex; justify-content:space-between; border-bottom:1px dashed #444; padding-bottom:6px;">
                        <span>🔮 영혼 각인 (최대 6칸)</span>
                        <button class="btn-inherit" onclick="inheritEnhanceAndEngrave()">◀ 기존 계승</button>
                    </div>
                    <div id="wbEngravings" style="margin-top:8px;">
                        <div style="text-align:center; padding:20px 0; color:#666; font-size:12px;">아이템을 선택하면 각인 목록이 나타납니다.</div>
                    </div>
                </div>
            </div>
        </div>
        <div style="text-align:right; font-size:11px; color:#ff9800; margin-top:5px; margin-bottom:10px;">* 교체 장비의 아이템 레벨(CP)은 마석이 포함되지 않은 기본 수치입니다.</div>
        <button class="btn-apply" onclick="applySimulation()">🚀 장비 교체 적용하기 (딜량/방어 계산)</button>
        `;

        document.getElementById('workbench').innerHTML = html;
        renderOldCard();
        renderNewCardValues(); 

        if(simulationState[index]) {
            currentNewItemAPIData = simulationState[index].apiData; 
            document.getElementById('wbEnh').value = simulationState[index].rawInput.enh;
            document.getElementById('wbBrk').value = simulationState[index].rawInput.brk;
            renderNewCardValues();
            updateEngraveDropdowns(simulationState[index].rawInput.engravings);
        }

        setTimeout(() => { searchDictItem(); }, 100);
    }

    function updateEngraveDropdowns(savedEngravings = null) {
        if(!currentNewItemAPIData || !currentNewItemAPIData.subStats) return;

        let optionsHtml = `<option value="">선택 안함</option>`;
        currentNewItemAPIData.subStats.forEach(st => {
            let k = mapStatName(st.name) || mapStatName(st.id) || st.name;
            let maxVal = st.value; 
            optionsHtml += `<option value="${k}" data-max="${maxVal}">${st.name} (최대 ${maxVal})</option>`;
        });

        let engHtml = ''; 
        for(let i=0; i<6; i++) {
            engHtml += `
            <div class="eng-row">
                <span style="color:#666; width:15px; text-align:center;">${i+1}</span>
                <select class="wb-eng-type" onchange="applySimulation(true)">${optionsHtml}</select>
                <input type="number" class="wb-eng-val" placeholder="수치" oninput="applySimulation(true)" step="0.1">
                <button class="btn-max" onclick="setMaxEngrave(this)">MAX</button>
            </div>`;
        }
        document.getElementById('wbEngravings').innerHTML = engHtml;

        if(savedEngravings && savedEngravings.length > 0) {
            const eTypes = document.querySelectorAll('.wb-eng-type'); 
            const eVals = document.querySelectorAll('.wb-eng-val');
            savedEngravings.forEach((s, i) => { 
                if(s && i<eTypes.length && s.type) { 
                    if (!Array.from(eTypes[i].options).some(opt => opt.value === s.type)) {
                        let labelName = STAT_LABEL[s.type] || s.type;
                        eTypes[i].add(new Option(labelName + " (계승됨)", s.type));
                    }
                    eTypes[i].value = s.type; 
                    eVals[i].value = s.val; 
                } 
            });
        }
    }

    // =========================================================================
    // 🌟 [개선] 장비 시뮬레이터 사전 검색을 '자체 DB' 기반으로 초고속화!
    // =========================================================================
    function searchDictItem() {
        let keyword = document.getElementById('dictSearchInput').value.trim();
        const resultArea = document.getElementById('dictResultArea');
        
        const checkedGrades = Array.from(document.querySelectorAll('.filter-grade:checked')).map(cb => cb.value);
        const checkedCategories = Array.from(document.querySelectorAll('.filter-category:checked')).map(cb => cb.value);
        const checkedSources = Array.from(document.querySelectorAll('.filter-source:checked')).map(cb => cb.value);

        resultArea.style.display = 'block';

        if (typeof globalItemDB === 'undefined' || globalItemDB.length === 0) {
        // db.json -> db.json으로 변경
        resultArea.innerHTML = `<div style="padding:15px; text-align:center; color:#ffca28;">아이템 DB(db.json)를 로드 중입니다... 잠시 후 다시 시도해주세요.</div>`;
        return;
    }

        // 🚀 통신(API) 없이 내장 DB에서 0.01초 만에 필터링!
       let items = globalItemDB.filter(item => {
            // 제외 키워드 필터링
            if (EXCLUDE_KEYWORDS.some(kw => (item.name || "").includes(kw))) return false;

            // 1. 이름 검색 필터
            if (keyword && !item.name.includes(keyword)) return false;

            // 2. 등급 필터
            if (checkedGrades.length > 0 && !checkedGrades.includes(item.grade)) return false;
            
            // 3. 부위(카테고리) 필터
            let itemCat = getSmartCategory(item);
            if (!itemCat) return false; 
            if (checkedCategories.length > 0 && !checkedCategories.includes(itemCat.key)) return false;
            
            // 🚀 4. 획득처 필터 완벽 적용
            if (checkedSources.length === 0) return false; // 체크가 하나도 없으면 아무것도 안 나옴

            let itemSources = item.sources || [];
            let matchSource = false;
            
            let isCraft = itemSources.includes('제작');
            let isDungeon = itemSources.includes('원정') || itemSources.includes('성역');
            let isAbyss = itemSources.includes('교환 상점');
            
            // 유저가 체크한 항목에 해당하면 통과!
            if (checkedSources.includes('craft') && isCraft) matchSource = true;
            if (checkedSources.includes('dungeon') && isDungeon) matchSource = true;
            if (checkedSources.includes('abyss') && isAbyss) matchSource = true;
            
            // 3가지 주요 획득처에 포함되지 않는(드랍/퀘스트 등) 아이템들은 '기타'를 체크했을 때 나오게 합니다.
            if (checkedSources.includes('etc') && !isCraft && !isDungeon && !isAbyss) matchSource = true;
            
            if (!matchSource) return false; 
            
            return true;
        });

        if(items.length === 0) { 
            resultArea.innerHTML = `<div style="padding:15px; text-align:center; color:#ff5252;">조건에 맞는 아이템이 없습니다. 필터를 조절해보세요!</div>`; 
            return; 
        }
        
        // 레벨이 높은 순으로 정렬
        items.sort((a, b) => {
            let lvA = parseInt(a.level || a.itemLevel || a.equipLevel || 0);
            let lvB = parseInt(b.level || b.itemLevel || b.equipLevel || 0);
            return lvB - lvA;
        });

        // 렌더링
        let html = '';
        items.forEach(item => {
            let dispLv = item.level || item.itemLevel || item.equipLevel || "?";
            let sourceBadge = '';
            if (item.sources && item.sources.includes('제작')) sourceBadge = '<span style="background:#4a148c; color:#e1bee7; font-size:9px; padding:2px 4px; border-radius:3px; margin-left:4px;">🛠️제작</span>';
            else if (item.sources && (item.sources.includes('원정') || item.sources.includes('성역'))) sourceBadge = '<span style="background:#004d40; color:#b2dfdb; font-size:9px; padding:2px 4px; border-radius:3px; margin-left:4px;">🏰원정</span>';
            else if (item.sources && item.sources.includes('교환 상점')) sourceBadge = '<span style="background:#b71c1c; color:#ffcdd2; font-size:9px; padding:2px 4px; border-radius:3px; margin-left:4px;">🏅어비스</span>';

            html += `<div class="dict-item" onclick="selectDictItem('${item.id}', '${item.name}')">
                <img src="${item.icon||''}" style="width:36px; height:36px; border-radius:4px; border:1px solid #444;" onerror="this.style.display='none'">
                <div>
                    <div style="color:${getGradeColor(item.grade)}; font-weight:bold; font-size:13px; display:flex; align-items:center;">
                        ${item.name} ${sourceBadge}
                    </div>
                    <div style="font-size:11px; color:#888;">Lv.${dispLv} | ${item.gradeName||item.grade}</div>
                </div>
            </div>`;
        });
        resultArea.innerHTML = html;
    }

    // 🌟 [개선] 아이템 클릭 시 '로딩 없이' 즉시 스탯 반영!
   // =========================================================================
// 🌟 [하이브리드-1] 아이템 클릭 시 실시간으로 '진짜 스탯'만 가져오기
// =========================================================================
async function selectDictItem(id, name, savedEngravings = null) {
    const enh = parseInt(document.getElementById('wbEnh').value) || 0;
    const brk = parseInt(document.getElementById('wbBrk').value) || 0;
    const apiBaseUrl = typeof API_BASE !== 'undefined' ? API_BASE : '/api';
    
    const resultArea = document.getElementById('dictResultArea');
    resultArea.innerHTML = '<div style="padding:20px; text-align:center; color:#00e676;">정밀 스탯을 불러오는 중입니다... ⏳</div>';

    try {
        // 대표님 라이브 서버를 통해 진짜 알맹이(mainStats)를 쏙 빼옵니다!
        let res = await fetch(`${apiBaseUrl}/getDictItemDetail?id=${id}&enchantLevel=${enh}&exceedLevel=${brk}`);
        if (!res.ok) throw new Error("서버 에러");
        let detailData = await res.json();

        if (!detailData.mainStats) throw new Error("알맹이 없음");

        currentNewItemAPIData = detailData;
        resultArea.style.display = 'none';
        
        renderNewCardValues(); 
        updateEngraveDropdowns(savedEngravings); 
        applySimulation(true);
    } catch(e) {
        resultArea.innerHTML = `<div style="padding:20px; text-align:center; color:#ff5252;">NC 서버 오류로 해당 아이템의 스탯을 불러올 수 없습니다.</div>`;
    }
}
    function updateNewItemByEnhance() {
        if(!currentNewItemAPIData) { return; }
        
        let currentEngravings = [];
        const eTypes = document.querySelectorAll('.wb-eng-type'); 
        const eVals = document.querySelectorAll('.wb-eng-val');
        if (eTypes.length > 0) {
            for(let i=0; i<6; i++) {
                currentEngravings.push({ type: eTypes[i].value, val: eVals[i].value });
            }
        }
        
        selectDictItem(currentNewItemAPIData.id, currentNewItemAPIData.name, currentEngravings.length ? currentEngravings : null);
    }

    function renderOldCard() {
        const oldEq = currentEquipData[activeSlotIndex];
        const oldCard = document.getElementById('wbOldCard');

        const oImg = oldEq.icon ? `<img src="${oldEq.icon}" style="width:44px; height:44px; border-radius:6px; border:1px solid #444;" onerror="this.style.display='none'">` : '';
        const extracted = extractBaseStats(oldEq); 
        const oEngraveStats = extractEngraveStats(oldEq);
        const oCp = calculateEquippedCP(oldEq); 
        
        let baseLv = oldEq.level || oldEq.itemLevel || oldEq.equipLevel || "?";
        let oBase = parseInt(baseLv) || 0;
        let oBonus = oCp - oBase;
        
        let bonusHtml = "";
        let diamondsHtml = ''; for (let i = 0; i < 5; i++) diamondsHtml += `<div class="diamond-pip ${i < (oldEq.exceedLevel||0) ? 'active' : ''}"></div>`;

        let bHtml = '';
        extracted.display.forEach(line => {
            let label = STAT_LABEL[line.name] || line.name;
            let unit = (line.isFixed || line.forcePct || label.includes('%') || label.includes('증가') || label.includes('내성') || label.includes('증폭')) ? '%' : '';
            let valText = '';

            if (line.isOrange) {
                valText = `<span style="color:#ff9800; font-weight:bold;">${line.bVal}${unit}</span>`;
                label = `<span style="color:#ff9800; font-weight:bold;">${label}</span>`;
            } else {
                valText = `${line.bVal}${unit}`;
                if (line.eVal > 0 && !line.isFixed) { valText += ` <span style="color:#4fc3f7;">(+${line.eVal})</span>`; }
            }
            bHtml += `<div class="stat-row"><span>${label}</span> <span>${valText}</span></div>`;
        });

        let oHtml = `
            <div class="card-header" style="color:#888;">현재 장착 중인 아이템</div>
            <div style="display:flex; align-items:center; gap:10px; margin-top:10px; padding-bottom:10px; border-bottom:1px solid #222;">
                ${oImg}
                <div>
                    <div style="color:${getGradeColor(oldEq.grade)}; font-weight:bold; font-size:14px;">+${oldEq.enchantLevel||0} ${oldEq.name}</div>
                    <div style="font-size:11px; color:#888; margin:2px 0;">Lv.${oBase} <span style="color:#4fc3f7; font-weight:bold;">(+${oBonus})</span></div>
                    <div style="display:flex; align-items:center; gap:6px;"><div class="diamond-container">${diamondsHtml}</div></div>
                </div>
            </div>
            <div style="flex:1; margin-top:10px; display:flex; flex-direction:column; gap:10px;">
                <div class="stat-group">
                    <div class="stat-group-title sg-base">🛡️ 기본 능력치</div>
                    ${bHtml || '<div style="color:#666; font-size:11px; text-align:center;">기본 능력치 없음</div>'}
                </div>
                <div class="stat-group"><div class="stat-group-title sg-engrave">🔮 영혼 각인 & 마석</div>`;
        
        let hasOEng = false;
        for(let k in oEngraveStats) { 
            if(oEngraveStats[k] > 0) { 
                let label = STAT_LABEL[k] || k;
                oHtml += `<div class="stat-row"><span>${label}</span> <span>${oEngraveStats[k]}</span></div>`; 
                hasOEng = true; 
            } 
        }
        if(!hasOEng) oHtml += `<div style="color:#666; font-size:11px; text-align:center;">각인 없음</div>`;
        oHtml += `</div></div>`;
        oldCard.innerHTML = oHtml;
    }

    function renderNewCardValues() {
        if(!currentNewItemAPIData) return;
        
        const nEq = currentNewItemAPIData;
        const enh = parseInt(document.getElementById('wbEnh').value) || 0;
        const brk = parseInt(document.getElementById('wbBrk').value) || 0;
        
        let baseLv = nEq.level || nEq.itemLevel || nEq.equipLevel || "?";
        let diamondsHtml = ''; for (let i = 0; i < 5; i++) diamondsHtml += `<div class="diamond-pip ${i < brk ? 'active' : ''}"></div>`;

        const nCp = calculateNewItemCP(nEq, enh, brk); 
        let nBase = parseInt(baseLv) || 0;
        let nBonus = nCp - nBase;

        const nImg = nEq.icon ? `<img src="${nEq.icon}" style="width:44px; height:44px; border-radius:6px; border:1px solid #444;" onerror="this.style.display='none'">` : '';

        document.getElementById('newCardHeader').innerHTML = `
            ${nImg}
            <div style="text-align:left;">
                <div style="color:${getGradeColor(nEq.grade)}; font-weight:bold; font-size:14px;">+${enh} ${nEq.name}</div>
                <div style="font-size:11px; color:#888; margin:2px 0;">Lv.${nBase} <span style="color:#4fc3f7; font-weight:bold;">(+${nBonus})</span></div>
                <div style="display:flex; align-items:center; gap:6px;"><div class="diamond-container">${diamondsHtml}</div></div>
            </div>
        `;

        const extracted = extractBaseStats(nEq, brk);

        let bHtml = '';
        extracted.display.forEach(line => {
            let label = STAT_LABEL[line.name] || line.name;
            let unit = (line.isFixed || line.forcePct || label.includes('%') || label.includes('증가') || label.includes('내성') || label.includes('증폭')) ? '%' : '';
            let valText = '';

            if (line.isOrange) {
                valText = `<span style="color:#ff9800; font-weight:bold;">${line.bVal}${unit}</span>`;
                label = `<span style="color:#ff9800; font-weight:bold;">${label}</span>`;
            } else {
                valText = `${line.bVal}${unit}`;
                if (line.eVal > 0 && !line.isFixed) { valText += ` <span style="color:#4fc3f7;">(+${line.eVal})</span>`; }
            }
            bHtml += `<div class="stat-row"><span>${label}</span> <span>${valText}</span></div>`;
        });

        document.getElementById('newBaseStatsDisplay').innerHTML = bHtml || '<div style="color:#666; font-size:11px; text-align:center;">기본 능력치 없음</div>';
    }

    function inheritEnhanceAndEngrave() {
        if(activeSlotIndex === -1 || !currentNewItemAPIData) return;
        const eq = currentEquipData[activeSlotIndex];
        
        document.getElementById('wbEnh').value = Math.min(eq.enchantLevel || 0, 20);
        document.getElementById('wbBrk').value = eq.exceedLevel || 0;
        
        const sStats = findData(eq, 'subStats') || [];
        let inheritedEngravings = [];
        
        for(let i=0; i<6; i++) {
            if(i < sStats.length) {
                let sub = sStats[i];
                let rawName = sub.name;
                let mappedType = mapStatName(rawName) || mapStatName(sub.id) || rawName;
                inheritedEngravings.push({
                    type: mappedType,
                    val: parseFloat((sub.value || "0").toString().replace(/[^0-9.]/g, '')) || 0
                });
            } else {
                inheritedEngravings.push({ type: "", val: "" });
            }
        }
        
        selectDictItem(currentNewItemAPIData.id, currentNewItemAPIData.name, inheritedEngravings);
    }

    function applySimulation(isAuto = false) {
        if(activeSlotIndex === -1 || !currentNewItemAPIData) {
            if(!isAuto) alert("새 아이템을 검색하여 선택해주세요!");
            return;
        }
        const rawInput = { enh: document.getElementById('wbEnh').value, brk: document.getElementById('wbBrk').value, engravings: [] };
        
        let nEngraveStats = {}; 
        const eTypes = document.querySelectorAll('.wb-eng-type'); const eVals = document.querySelectorAll('.wb-eng-val');
        
        for(let i=0; i<6; i++) {
            rawInput.engravings.push({ type: eTypes[i].value, val: eVals[i].value });
            if(eTypes[i].value) nEngraveStats[eTypes[i].value] = (nEngraveStats[eTypes[i].value] || 0) + (parseFloat(eVals[i].value)||0);
        }

        let totalStats = extractBaseStats(currentNewItemAPIData, rawInput.brk).total;
        for(let k in nEngraveStats) { totalStats[k] = (totalStats[k] || 0) + nEngraveStats[k]; }
        
        const nCp = calculateNewItemCP(currentNewItemAPIData, rawInput.enh, rawInput.brk);

        simulationState[activeSlotIndex] = { stats: totalStats, cp: nCp, rawInput: rawInput, apiData: currentNewItemAPIData };
        
        if(!isAuto) renderEquipGrid();
        updateDeltaDashboard(); 
    }

    function resetSimulation(index) {
        delete simulationState[index];
        openWorkbench(index); renderEquipGrid(); updateDeltaDashboard();
    }

    function updateDeltaDashboard() {
        const base = {
            cp: parseInt(document.getElementById('baseCp').value) || 0,
            atk: parseInt(document.getElementById('baseAtk').value) || 0,
            def: parseInt(document.getElementById('baseDef').value) || 0,
            hp: parseInt(document.getElementById('baseHp').value) || 0,
            amp: parseFloat(document.getElementById('baseAmp').value) || 0,
            pveAmp: parseFloat(document.getElementById('basePveAmp').value) || 0,
            pvpAmp: parseFloat(document.getElementById('basePvpAmp').value) || 0,
            wAmp: parseFloat(document.getElementById('baseWAmp').value) || 0,
            critDmg: parseFloat(document.getElementById('baseCritDmg').value) || 0,
            genRes: parseFloat(document.getElementById('baseGenRes').value) || 0,
            pveRes: parseFloat(document.getElementById('basePveRes').value) || 0,
            pvpRes: parseFloat(document.getElementById('basePvpRes').value) || 0,
            enemyGenRes: parseFloat(document.getElementById('enemyGenRes').value) || 0,
            enemyPvpRes: parseFloat(document.getElementById('enemyPvpRes').value) || 0,
            enemyAmp: parseFloat(document.getElementById('enemyAmp').value) || 0,
            enemyPvpAmp: parseFloat(document.getElementById('enemyPvpAmp').value) || 0,
            enemyAtk: parseFloat(document.getElementById('enemyAtk').value) || 8000,
            acc: 0, crit: 0, spd: 0 

            
        };

        

        let delta = {};
        STAT_KEYS.forEach(k => delta[k] = 0);
        delta.cp = 0;
        
        let oSetCounts = {};
        currentEquipData.forEach(eq => { let sName = getSetName(eq.name); if(sName) oSetCounts[sName] = (oSetCounts[sName] || 0) + 1; });
        let nSetCounts = { ...oSetCounts };

        for (let idx in simulationState) {
            const oldEq = currentEquipData[idx];
            const oldBase = extractBaseStats(oldEq).total; 
            const oldEng = extractEngraveStats(oldEq);
            
            const oldCp = calculateEquippedCP(oldEq);
            const newCp = simulationState[idx].cp; 

            const newEqStats = simulationState[idx].stats; 

            delta.cp += (newCp - oldCp);
            for(let k in newEqStats) { delta[k] = (delta[k] || 0) + newEqStats[k]; }
            for(let k in oldBase) { delta[k] = (delta[k] || 0) - oldBase[k]; }
            for(let k in oldEng) { delta[k] = (delta[k] || 0) - oldEng[k]; }

            let oSet = getSetName(oldEq.name); if(oSet) nSetCounts[oSet]--;
            let nSet = getSetName(simulationState[idx].apiData.name); if(nSet) nSetCounts[nSet] = (nSetCounts[nSet] || 0) + 1;
        }

        let oSetEff = calcSetEffects(oSetCounts);
        let nSetEff = calcSetEffects(nSetCounts);

        delta.pvpAmp += (nSetEff.pvpAmp - oSetEff.pvpAmp);
        delta.pveAmp += (nSetEff.pveAmp - oSetEff.pveAmp);

        delta.atkPct = (delta.atkPct || 0) + (delta.power || 0) * 0.1;
        delta.evasion = (delta.evasion || 0) + (delta.agi || 0) * 0.1;
        delta.block = (delta.block || 0) + (delta.agi || 0) * 0.1;
        delta.critRes = (delta.critRes || 0) + (delta.agi || 0) * 0.1;
        delta.acc = (delta.acc || 0) + (delta.acc_stat || 0) * 0.1;
        delta.crit = (delta.crit || 0) + (delta.acc_stat || 0) * 0.1;
        delta.statusRes = (delta.statusRes || 0) + (delta.will || 0) * 0.1;
        delta.statusAcc = (delta.statusAcc || 0) + (delta.know || 0) * 0.1;
        delta.hpPct = (delta.hpPct || 0) + (delta.vit || 0) * 0.1;

        delta.atk = (delta.atk || 0) + (delta.dest || 0) * 0.2;
        delta.crit = (delta.crit || 0) + (delta.death || 0) * 0.2;
        delta.mp = (delta.mp || 0) + (delta.destiny || 0) * 0.2;
        delta.block = (delta.block || 0) + (delta.space || 0) * 0.2;
        delta.spd = (delta.spd || 0) + (delta.time_stat || 0) * 0.2;
        delta.hp = (delta.hp || 0) + (delta.life || 0) * 0.2;
        delta.acc = (delta.acc || 0) + (delta.freedom || 0) * 0.2;
        delta.evasion = (delta.evasion || 0) + (delta.freedom || 0) * 0.2;
        delta.def = (delta.def || 0) + (delta.justice || 0) * 0.2;

        const finalCp = base.cp + delta.cp;
        const cpDiffEl = document.getElementById('cpDiffDisplay');
        if(delta.cp > 0) cpDiffEl.innerHTML = `<span>${base.cp} ➡ <span style="color:#fff;">${finalCp}</span></span> <span class="pos" style="font-size:16px;">(▲ ${delta.cp})</span>`;
        else if(delta.cp < 0) cpDiffEl.innerHTML = `<span>${base.cp} ➡ <span style="color:#fff;">${finalCp}</span></span> <span class="neg" style="font-size:16px;">(▼ ${Math.abs(delta.cp)})</span>`;
        else cpDiffEl.innerHTML = `<span style="color:#ccc;">${base.cp} ➡ ${finalCp} (-)</span>`;

        function formatDiff(oldV, newV, isPct=false) {
            let diff = newV - oldV;
            if(Math.abs(diff) < 0.001) return `<span style="color:#888;">${newV.toFixed(isPct?1:0)}${isPct?'%':''} ➡ ${newV.toFixed(isPct?1:0)}${isPct?'%':''} (-)</span>`;
            let color = diff > 0 ? 'pos' : 'neg'; let arrow = diff > 0 ? '▲' : '▼';
            return `<span>${oldV.toFixed(isPct?1:0)}${isPct?'%':''}</span> ➡ <span class="${color}">${newV.toFixed(isPct?1:0)}${isPct?'%':''} (${arrow}${Math.abs(diff).toFixed(isPct?1:0)}${isPct?'%':''})</span>`;
        }
        function formatMultDiff(oldV, newV) {
            let diff = newV - oldV;
            if(Math.abs(diff) < 0.001) return `<span style="color:#888;">${newV.toFixed(3)}x ➡ ${newV.toFixed(3)}x (-)</span>`;
            let color = diff > 0 ? 'pos' : 'neg'; let arrow = diff > 0 ? '▲' : '▼';
            return `<span>${oldV.toFixed(3)}x</span> ➡ <span class="${color}">${newV.toFixed(3)}x (${arrow}${Math.abs(diff).toFixed(3)})</span>`;
        }
        
        function formatDmgDiff(oldV, newV) {
            let diff = newV - oldV;
            if(Math.abs(diff) < 0.5) return `<span style="color:#888;">${newV.toFixed(0)} ➡ ${newV.toFixed(0)} (-)</span>`;
            let color = diff < 0 ? 'pos' : 'neg'; 
            let arrow = diff < 0 ? '▼' : '▲';
            return `<span>${oldV.toFixed(0)}</span> ➡ <span class="${color}" style="font-weight:bold;">${newV.toFixed(0)} <span style="font-size:11px; font-weight:normal;">(${arrow}${Math.abs(diff).toFixed(0)})</span></span>`;
        }

        let isAbyss = document.getElementById('isAbyssToggle').checked;

        let oDef = base.def; 
        let nDef = (base.def + delta.def) * (1 + (delta.defPct||0)/100); 
        let oHp = base.hp; 
        let nHp = (base.hp + delta.hp) * (1 + (delta.hpPct||0)/100);

        let oPveAtk = base.atk; 
        let nPveAtk = (base.atk + delta.atk) * (1 + (delta.atkPct||0)/100); 

        let oPveAmpSum = (base.amp + base.pveAmp + (isAbyss ? oSetEff.abyssPveAmp : 0)) / 100;
        let nPveAmpSum = (base.amp + base.pveAmp + delta.amp + delta.pveAmp + (isAbyss ? nSetEff.abyssPveAmp : 0)) / 100;
        let oWeaponAmp = base.wAmp / 100; let nWeaponAmp = (base.wAmp + delta.wAmp) / 100;

        let pveResFactor = (1 - base.enemyGenRes/100);
        let oPveMult = Math.max(0.1, (1 + oPveAmpSum) * (1 + oWeaponAmp) * pveResFactor); 
        let nPveMult = Math.max(0.1, (1 + nPveAmpSum) * (1 + nWeaponAmp) * pveResFactor);
        
        let oPveReal = oPveAtk * oPveMult; 
        let nPveReal = nPveAtk * nPveMult;

        document.getElementById('pve-atk').innerHTML = formatDiff(oPveAtk, nPveAtk);
        document.getElementById('pve-amp').innerHTML = formatDiff(oPveAmpSum*100, nPveAmpSum*100, true);
        document.getElementById('pve-mult').innerHTML = formatMultDiff(oPveMult, nPveMult);
        
        let pveRealDiff = nPveReal - oPveReal;
        document.getElementById('pve-real-atk').innerHTML = `${oPveReal.toFixed(0)} ➡ ${nPveReal.toFixed(0)} <span style="font-size:14px;" class="${pveRealDiff>0?'pos':(pveRealDiff<0?'neg':'neu')}">(${pveRealDiff>0?'▲':'▼'}${Math.abs(pveRealDiff).toFixed(0)})</span>`;

        let oCritMult = 1.5 + (base.critDmg / 100);
        let nCritMult = 1.5 + ((base.critDmg + delta.critDmg) / 100);
        let oPveCritReal = oPveReal * oCritMult; let nPveCritReal = nPveReal * nCritMult;
        let pveDpsDiff = (oPveCritReal > 0) ? ((nPveCritReal / oPveCritReal) - 1) * 100 : 0;
        
        const pveEl = document.getElementById('pve-final-dps');
        if(pveDpsDiff > 0) pveEl.innerHTML = `<span class="pos">▲ 치명타 적중 시 실질 딜량 ${pveDpsDiff.toFixed(2)}% 증가</span>`;
        else if(pveDpsDiff < 0) pveEl.innerHTML = `<span class="neg">▼ 치명타 적중 시 실질 딜량 ${Math.abs(pveDpsDiff).toFixed(2)}% 감소</span>`;
        else pveEl.innerHTML = `<span class="neu">- 딜량 변화 없음 -</span>`;

        let oPveResMult = (1 - base.genRes/100) * (1 - base.pveRes/100);
        let nPveResMult = (1 - (base.genRes + delta.genRes)/100) * (1 - (base.pveRes + delta.pveRes)/100);
        let enemyPveAmpMult = 1 + base.enemyAmp/100;
        
        let oPveIncoming = base.enemyAtk * enemyPveAmpMult * oPveResMult;
        let nPveIncoming = base.enemyAtk * enemyPveAmpMult * nPveResMult;

        let oPveDmgTaken = Math.max(1, oPveIncoming - (oDef / 10));
        let nPveDmgTaken = Math.max(1, nPveIncoming - (nDef / 10));

        let oPveSurvHits = oHp / oPveDmgTaken;
        let nPveSurvHits = nHp / nPveDmgTaken;

        document.getElementById('pve-def').innerHTML = formatDiff(oDef, nDef);
        document.getElementById('pve-hp').innerHTML = formatDiff(oHp, nHp);
        document.getElementById('pve-incoming').innerHTML = formatDmgDiff(oPveIncoming, nPveIncoming);
        document.getElementById('pve-dmg-taken').innerHTML = formatDmgDiff(oPveDmgTaken, nPveDmgTaken);

        let pveSurvHitsDiff = nPveSurvHits - oPveSurvHits;
        const pveSurvEl = document.getElementById('pve-final-surv');
        if(pveSurvHitsDiff > 0.05) pveSurvEl.innerHTML = `<span class="pos">✅ 동일 공격에 대해 약 ${pveSurvHitsDiff.toFixed(1)}대 더 버팀! (생존력 상승)</span>`;
        else if(pveSurvHitsDiff < -0.05) pveSurvEl.innerHTML = `<span class="neg">❌ 동일 공격에 대해 약 ${Math.abs(pveSurvHitsDiff).toFixed(1)}대 덜 버팀 (생존력 하락)</span>`;
        else pveSurvEl.innerHTML = `<span class="neu">- 종합 생존력 변화 없음 -</span>`;

        let oPvpAtk = base.atk; 
        let nPvpAtk = (base.atk + delta.atk) * (1 + (delta.atkPct||0)/100);

        let oPvpAmpSum = (base.amp + base.pvpAmp + oSetEff.pvpAmp) / 100;
        let nPvpAmpSum = (base.amp + base.pvpAmp + delta.amp + delta.pvpAmp + nSetEff.pvpAmp) / 100;

        let pvpResFactor = (1 - base.enemyGenRes/100) * (1 - base.enemyPvpRes/100);
        let oPvpMult = Math.max(0.1, (1 + oPvpAmpSum) * (1 + oWeaponAmp) * pvpResFactor); 
        let nPvpMult = Math.max(0.1, (1 + nPvpAmpSum) * (1 + nWeaponAmp) * pvpResFactor);
        
        let oPvpReal = oPvpAtk * oPvpMult; 
        let nPvpReal = nPvpAtk * nPvpMult;

        document.getElementById('pvp-atk').innerHTML = formatDiff(oPvpAtk, nPvpAtk);
        document.getElementById('pvp-amp').innerHTML = formatDiff(oPvpAmpSum*100, nPvpAmpSum*100, true);
        document.getElementById('pvp-mult').innerHTML = formatMultDiff(oPvpMult, nPvpMult);
        
        let pvpRealDiff = nPvpReal - oPvpReal;
        document.getElementById('pvp-real-atk').innerHTML = `${oPvpReal.toFixed(0)} ➡ ${nPvpReal.toFixed(0)} <span style="font-size:14px;" class="${pvpRealDiff>0?'pos':(pvpRealDiff<0?'neg':'neu')}">(${pvpRealDiff>0?'▲':'▼'}${Math.abs(pvpRealDiff).toFixed(0)})</span>`;

        let oPvpCritReal = oPvpReal * oCritMult; let nPvpCritReal = nPvpReal * nCritMult;
        let pvpDpsDiff = (oPvpCritReal > 0) ? ((nPvpCritReal / oPvpCritReal) - 1) * 100 : 0;
        
        const pvpEl = document.getElementById('pvp-final-dps');
        if(pvpDpsDiff > 0) pvpEl.innerHTML = `<span class="pos">▲ 치명타 적중 시 실질 딜량 ${pvpDpsDiff.toFixed(2)}% 증가</span>`;
        else if(pvpDpsDiff < 0) pvpEl.innerHTML = `<span class="neg">▼ 치명타 적중 시 실질 딜량 ${Math.abs(pvpDpsDiff).toFixed(2)}% 감소</span>`;
        else pvpEl.innerHTML = `<span class="neu">- 딜량 변화 없음 -</span>`;

        let oPvpResMult = (1 - base.genRes/100) * (1 - base.pvpRes/100);
        let nPvpResMult = (1 - (base.genRes + delta.genRes)/100) * (1 - (base.pvpRes + delta.pvpRes)/100);
        let enemyPvpAmpMult = 1 + (base.enemyAmp + base.enemyPvpAmp)/100;
        
        let oPvpIncoming = base.enemyAtk * enemyPvpAmpMult * oPvpResMult;
        let nPvpIncoming = base.enemyAtk * enemyPvpAmpMult * nPvpResMult;

        let oPvpDmgTaken = Math.max(1, oPvpIncoming - (oDef / 10));
        let nPvpDmgTaken = Math.max(1, nPvpIncoming - (nDef / 10));

        let oPvpSurvHits = oHp / oPvpDmgTaken;
        let nPvpSurvHits = nHp / nPvpDmgTaken;

        document.getElementById('pvp-def').innerHTML = formatDiff(oDef, nDef);
        document.getElementById('pvp-hp').innerHTML = formatDiff(oHp, nHp);
        document.getElementById('pvp-incoming').innerHTML = formatDmgDiff(oPvpIncoming, nPvpIncoming);
        document.getElementById('pvp-dmg-taken').innerHTML = formatDmgDiff(oPvpDmgTaken, nPvpDmgTaken);

        let pvpSurvHitsDiff = nPvpSurvHits - oPvpSurvHits;
        const pvpSurvEl = document.getElementById('pvp-final-surv');
        if(pvpSurvHitsDiff > 0.05) pvpSurvEl.innerHTML = `<span class="pos">✅ 동일 공격에 대해 약 ${pvpSurvHitsDiff.toFixed(1)}대 더 버팀! (생존력 상승)</span>`;
        else if(pvpSurvHitsDiff < -0.05) pvpSurvEl.innerHTML = `<span class="neg">❌ 동일 공격에 대해 약 ${Math.abs(pvpSurvHitsDiff).toFixed(1)}대 덜 버팀 (생존력 하락)</span>`;
        else pvpSurvEl.innerHTML = `<span class="neu">- 종합 생존력 변화 없음 -</span>`;


        // 🚀 여기에 방금 그 코드를 넣으셔야 합니다! (함수가 끝나기 직전)
        let oldDesc = getSetEffectText(oSetCounts);
        let newDesc = getSetEffectText(nSetCounts);

        let logHtml = `
        <details style="background:#141418; border:1px solid #333; border-radius:8px; padding:10px; font-size:12px; color:#ccc; margin-top:15px;">
            <summary style="cursor:pointer; font-weight:bold; color:#4fc3f7; outline:none; display:flex; align-items:center; gap:5px;">
                🔍 어비스 세트 효과 변경 상세 보기 <span style="font-size:10px; color:#888;">(클릭하여 펼치기)</span>
            </summary>
            <div style="margin-top:10px; padding-top:10px; border-top:1px dashed #333; line-height:1.6;">
                <div style="margin-bottom:10px; padding:8px; background:rgba(255, 82, 82, 0.1); border-left:3px solid #ff5252; border-radius:4px;">
                    <span style="color:#ff5252; font-weight:bold; display:block; margin-bottom:4px;">[변경 전 세트]</span>
                    ${oldDesc}
                </div>
                <div style="padding:8px; background:rgba(105, 240, 174, 0.1); border-left:3px solid #69f0ae; border-radius:4px;">
                    <span style="color:#69f0ae; font-weight:bold; display:block; margin-bottom:4px;">[변경 후 세트]</span>
                    ${newDesc}
                </div>
            </div>
        </details>
        `;

        const logBoxPve = document.getElementById('setEffectLogPve');
        const logBoxPvp = document.getElementById('setEffectLogPvp');
        if(logBoxPve) logBoxPve.innerHTML = logHtml;
        if(logBoxPvp) logBoxPvp.innerHTML = logHtml;
    }

    function saveStatPreset(slot) {
        const preset = {
            baseAtk: document.getElementById('baseAtk').value,
            baseAmp: document.getElementById('baseAmp').value,
            basePveAmp: document.getElementById('basePveAmp').value,
            basePvpAmp: document.getElementById('basePvpAmp').value,
            baseWAmp: document.getElementById('baseWAmp').value,
            baseCritDmg: document.getElementById('baseCritDmg').value,
            baseDef: document.getElementById('baseDef').value,
            baseHp: document.getElementById('baseHp').value,
            baseGenRes: document.getElementById('baseGenRes').value,
            basePveRes: document.getElementById('basePveRes').value,
            basePvpRes: document.getElementById('basePvpRes').value,
            enemyAtk: document.getElementById('enemyAtk').value,
            enemyGenRes: document.getElementById('enemyGenRes').value,
            enemyPvpRes: document.getElementById('enemyPvpRes').value,
            enemyAmp: document.getElementById('enemyAmp').value,
            enemyPvpAmp: document.getElementById('enemyPvpAmp').value,
            basePower: document.getElementById('basePower').value,
            baseAgi: document.getElementById('baseAgi').value,
            baseAccStat: document.getElementById('baseAccStat').value,
            baseWill: document.getElementById('baseWill').value,
            baseKnow: document.getElementById('baseKnow').value,
            baseVit: document.getElementById('baseVit').value,
            baseDest: document.getElementById('baseDest').value,
            baseDeath: document.getElementById('baseDeath').value,
            baseWis: document.getElementById('baseWis').value,
            baseDestiny: document.getElementById('baseDestiny').value,
            baseSpace: document.getElementById('baseSpace').value,
            baseTime: document.getElementById('baseTime').value,
            baseLife: document.getElementById('baseLife').value,
            baseIllusion: document.getElementById('baseIllusion').value,
            baseFreedom: document.getElementById('baseFreedom').value,
            baseJustice: document.getElementById('baseJustice').value
        };
        localStorage.setItem(`aion2_stat_preset_${slot}`, JSON.stringify(preset));
        alert(`✅ ${slot}번 프리셋 슬롯에 내 스탯이 저장되었습니다!`);
    }

    function loadStatPreset(slot, isInitial = false) {
        const saved = localStorage.getItem(`aion2_stat_preset_${slot}`);
        if(saved) {
            try {
                const preset = JSON.parse(saved);
                if(preset.baseAtk !== undefined) document.getElementById('baseAtk').value = preset.baseAtk;
                if(preset.baseAmp !== undefined) document.getElementById('baseAmp').value = preset.baseAmp;
                if(preset.basePveAmp !== undefined) document.getElementById('basePveAmp').value = preset.basePveAmp;
                if(preset.basePvpAmp !== undefined) document.getElementById('basePvpAmp').value = preset.basePvpAmp;
                if(preset.baseWAmp !== undefined) document.getElementById('baseWAmp').value = preset.baseWAmp;
                if(preset.baseCritDmg !== undefined) document.getElementById('baseCritDmg').value = preset.baseCritDmg;
                if(preset.baseDef !== undefined) document.getElementById('baseDef').value = preset.baseDef;
                if(preset.baseHp !== undefined) document.getElementById('baseHp').value = preset.baseHp;
                if(preset.baseGenRes !== undefined) document.getElementById('baseGenRes').value = preset.baseGenRes;
                if(preset.basePveRes !== undefined) document.getElementById('basePveRes').value = preset.basePveRes;
                if(preset.basePvpRes !== undefined) document.getElementById('basePvpRes').value = preset.basePvpRes;
                if(preset.enemyAtk !== undefined) document.getElementById('enemyAtk').value = preset.enemyAtk;
                if(preset.enemyGenRes !== undefined) document.getElementById('enemyGenRes').value = preset.enemyGenRes;
                if(preset.enemyPvpRes !== undefined) document.getElementById('enemyPvpRes').value = preset.enemyPvpRes;
                if(preset.enemyAmp !== undefined) document.getElementById('enemyAmp').value = preset.enemyAmp;
                if(preset.enemyPvpAmp !== undefined) document.getElementById('enemyPvpAmp').value = preset.enemyPvpAmp;
                
                if(preset.basePower !== undefined) document.getElementById('basePower').value = preset.basePower;
                if(preset.baseAgi !== undefined) document.getElementById('baseAgi').value = preset.baseAgi;
                if(preset.baseAccStat !== undefined) document.getElementById('baseAccStat').value = preset.baseAccStat;
                if(preset.baseWill !== undefined) document.getElementById('baseWill').value = preset.baseWill;
                if(preset.baseKnow !== undefined) document.getElementById('baseKnow').value = preset.baseKnow;
                if(preset.baseVit !== undefined) document.getElementById('baseVit').value = preset.baseVit;
                if(preset.baseDest !== undefined) document.getElementById('baseDest').value = preset.baseDest;
                if(preset.baseDeath !== undefined) document.getElementById('baseDeath').value = preset.baseDeath;
                if(preset.baseWis !== undefined) document.getElementById('baseWis').value = preset.baseWis;
                if(preset.baseDestiny !== undefined) document.getElementById('baseDestiny').value = preset.baseDestiny;
                if(preset.baseSpace !== undefined) document.getElementById('baseSpace').value = preset.baseSpace;
                if(preset.baseTime !== undefined) document.getElementById('baseTime').value = preset.baseTime;
                if(preset.baseLife !== undefined) document.getElementById('baseLife').value = preset.baseLife;
                if(preset.baseIllusion !== undefined) document.getElementById('baseIllusion').value = preset.baseIllusion;
                if(preset.baseFreedom !== undefined) document.getElementById('baseFreedom').value = preset.baseFreedom;
                if(preset.baseJustice !== undefined) document.getElementById('baseJustice').value = preset.baseJustice;

                updateDeltaDashboard();
                if(!isInitial) alert(`📂 ${slot}번 프리셋을 불러왔습니다!`);
            } catch(e) { console.error("프리셋 로드 실패"); }
        } else {
            if(!isInitial) alert(`❌ ${slot}번 프리셋은 비어있습니다. 먼저 스탯을 저장해주세요!`);
        }
    }

    function renderFavorites() {
        const favList = JSON.parse(localStorage.getItem('aion2_favorites')) || [];
        const container = document.getElementById('favoriteList');
        container.innerHTML = '';
        if (favList.length === 0) {
            container.innerHTML = `<span style="color:#666; font-size:12px;">검색 결과에서 '⭐ 저장'을 눌러 자주 보는 캐릭터를 추가하세요.</span>`;
            return;
        }
        favList.forEach(fav => {
            const fBtn = document.createElement('div');
            fBtn.style.cssText = "display:flex; align-items:stretch; background:#222; border:1px solid #444; border-radius:6px; overflow:hidden;";
            
            const loadDiv = document.createElement('div');
            loadDiv.style.cssText = "padding:6px 10px; cursor:pointer; font-size:12px; font-weight:bold; color:#fff; display:flex; align-items:center; transition:0.2s;";
            loadDiv.innerHTML = `<span style="color:#4fc3f7; margin-right:4px;">[${fav.serverName}]</span> ${fav.charName}`;
            loadDiv.onmouseover = () => loadDiv.style.background = "#2a2a35";
            loadDiv.onmouseout = () => loadDiv.style.background = "transparent";
            // 👇👇 여기서부터 수정 👇👇
loadDiv.onclick = () => {
    // 화면에 'tab-equip'(장비 시뮬레이터 탭)이 있는지 확인합니다.
    if (document.getElementById('tab-equip')) {
        // 1. 시뮬레이터 화면이면 기존처럼 바로 정보를 불러옵니다.
        loadCharacterDetail(fav.charId, fav.serverId, fav.charName);
    } else {
        // 2. 홈 화면 등 다른 곳이면 시뮬레이터 화면으로 스무스하게 넘어갑니다!
        window.location.href = `simulator.html?name=${encodeURIComponent(fav.charName)}&server=${encodeURIComponent(fav.serverId)}`;
    }
};
// 👆👆 여기까지 수정 👆👆
            
            const delDiv = document.createElement('div');
            delDiv.style.cssText = "padding:6px 8px; cursor:pointer; background:#333; color:#ff5252; font-size:12px; display:flex; align-items:center; transition:0.2s;";
            delDiv.innerHTML = "✖";
            delDiv.onmouseover = () => delDiv.style.background = "#555";
            delDiv.onmouseout = () => delDiv.style.background = "#333";
            delDiv.onclick = () => removeFavorite(fav.charId);

            fBtn.appendChild(loadDiv);
            fBtn.appendChild(delDiv);
            container.appendChild(fBtn);
        });
    }

    function addFavorite(charId, serverId, charName, serverName, className) {
        let favList = JSON.parse(localStorage.getItem('aion2_favorites')) || [];
        if (favList.find(f => f.charId === charId)) {
            alert("이미 즐겨찾기에 추가된 캐릭터입니다!");
            return;
        }
        favList.push({ charId, serverId, charName, serverName, className });
        localStorage.setItem('aion2_favorites', JSON.stringify(favList));
        renderFavorites();
        alert(`⭐ [${serverName}] ${charName} 캐릭터가 즐겨찾기에 추가되었습니다!`);
    }

    function removeFavorite(charId) {
        let favList = JSON.parse(localStorage.getItem('aion2_favorites')) || [];
        favList = favList.filter(f => f.charId !== charId);
        localStorage.setItem('aion2_favorites', JSON.stringify(favList));
        renderFavorites();
    }

    // ==========================================
    // 🗂️ 카테고리 탭 전환 로직
    // ==========================================
   function switchTab(tabId, element) {
  const tabEl = document.getElementById('tab-' + tabId);
  if (!tabEl) {
    console.error('[switchTab] tab element not found:', 'tab-' + tabId);
    return; // ✅ 아무 것도 건드리지 말고 종료 (빈 화면 방지)
  }

  // ✅ element가 없으면 nav-item을 스스로 찾기
  if (!element) {
    element =
      document.querySelector(`.nav-item[data-tab="${tabId}"]`)
      || document.querySelector(`.nav-item[onclick*="'${tabId}'"]`);
  }

  // 1) 탭/네비 active 초기화
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  // 2) 목표 탭 활성화
  tabEl.classList.add('active');

  // 3) 네비 버튼도 있으면 활성화 (없어도 탭은 보여야 함)
  if (element) element.classList.add('active');

  // 4) 랭킹 탭이면 로딩
  if (tabId === 'ranking' && typeof loadFullRanking === 'function') {
    loadFullRanking(0);
  }
}

   
      

    
   // ==========================================
    // 🏆 메인 화면: 전 서버 통합 랭킹 불러오기
    // ==========================================
    async function loadTotalRanking(raceId = 0) {
        const rankArea = document.getElementById('totalRankingArea');
        const btnAll = document.getElementById('btnRankAll');
        const btnElyos = document.getElementById('btnRankElyos');
        const btnAsmo = document.getElementById('btnRankAsmo');

		if (!rankArea) return;

        // 버튼 색상 초기화
        [btnAll, btnElyos, btnAsmo].forEach(btn => {
            if(btn) btn.style.cssText = "flex:1; padding:8px; background:#111; color:#888; border:1px solid #333; border-radius:4px; cursor:pointer; transition:0.2s;";
        });

        // 눌린 탭 하이라이트
        if (raceId === 0 && btnAll) {
            btnAll.style.cssText = "flex:1; padding:8px; background:#1a1a24; color:#fff; border:1px solid #ffca28; border-radius:4px; font-weight:bold; cursor:pointer;";
        } else if (raceId === 1 && btnElyos) {
            btnElyos.style.cssText = "flex:1; padding:8px; background:#1a1a24; color:#fff; border:1px solid #4fc3f7; border-radius:4px; font-weight:bold; cursor:pointer;";
        } else if (raceId === 2 && btnAsmo) {
            btnAsmo.style.cssText = "flex:1; padding:8px; background:#2a1a1a; color:#fff; border:1px solid #ff5252; border-radius:4px; font-weight:bold; cursor:pointer;";
        }

        rankArea.innerHTML = `<div style="text-align:center; padding:50px 0; color:#aaa;">랭킹 데이터를 불러오는 중... ⏳</div>`;

        try {
            const res = await fetch(`${API_BASE}/totalRanking?race=${raceId}`);
            const data = await res.json();
            const rankList = data.list || [];
            
            if (rankList.length === 0) {
                rankArea.innerHTML = `<div style="text-align:center; padding:50px 0; color:#ff5252;">랭킹 데이터가 없습니다.</div>`;
                return;
            }

            let html = '';
            rankList.slice(0, 5).forEach((user, index) => {
                let rankColor = "#888"; 
                if(index === 0) rankColor = "#ffca28"; 
                else if(index === 1) rankColor = "#ccc"; 
                else if(index === 2) rankColor = "#cd7f32"; 

                let cName = user.characterName || "이름없음";
                let sName = user.serverName || "서버";
                let ap = user.point || 0; 
                let pImg = user.profileImage || ""; 
                let serverColor = (user.race === 1) ? "#4fc3f7" : "#ff5252";
                
                // 🚀 신규: 직업 이름 가져오기
                let className = user.className || "직업 미확인"; 

                // 🚀 수정: 무조건 한 줄로 나오도록 flex-shrink와 white-space 옵션 추가!
                // 🚀 간격과 크기를 시원시원하게 변경 (padding: 12px 0, 이미지 32px, 폰트 14px 등)
                html += `
                <div class="rank-row" style="${index === 4 ? 'border:none;' : ''} display:flex; align-items:center; flex-wrap:nowrap; padding: 12px 0; margin-bottom: 4px;">
                    <span style="color:${rankColor}; font-weight:bold; width:45px; flex-shrink:0; font-size: 15px;">${index + 1}위</span>
                    <span style="display:flex; align-items:center; flex:1; gap:12px; cursor:pointer; overflow:hidden; white-space:nowrap;" onclick="loadCharacterDetail('${user.characterId}', '${user.serverId}', '${cName}')">
                        ${pImg ? `<img src="${pImg}" style="width:32px; height:32px; border-radius:50%; border:1px solid #444; flex-shrink:0;" onerror="this.style.display='none'">` : '<div style="width:32px; height:32px; border-radius:50%; border:1px solid #444; background:#111; flex-shrink:0;"></div>'}
                        <span style="overflow:hidden; text-overflow:ellipsis; font-size:14px;"><span style="color:${serverColor};">[${sName}]</span> ${cName} <span style="font-size:12px; color:#888;">(${className})</span></span>
                    </span>
                    <span style="color:#ffca28; font-weight:bold; flex-shrink:0; font-size:14px;">${Number(ap).toLocaleString()} AP</span>
                </div>`;
            });
            rankArea.innerHTML = html;
        } catch (e) {
            rankArea.innerHTML = `<div style="text-align:center; padding:50px 0; color:#ff5252;">서버 응답 오류 (나중에 다시 시도해주세요)</div>`;
        }
    }

     

   
   



    // ==========================================
    // 🎲 펫 옵션 기댓값 시뮬레이터 로직 (UI 개선 & 슬롯 완벽 분리 & 레벨 매핑)
    // ==========================================
    
    // 🚨 여기에 가지고 계신 900줄짜리 DATA.csv 파일 내용을 전부 복사해서 덮어씌워 주세요! 🚨
    const RAW_PET_DATA = `Category,Level,Slot,Grade,Option,MinValue,MaxValue,Unit,ProbabilityPercent
지성/야성/자연/변형,9,1,영웅,추가 방어력,80,160,flat,0.0714
Category	Level	Slot	Grade	Option	MinValue	MaxValue	Unit	ProbabilityPercent
지성/야성/자연/변형	9	1	영웅	추가 방어력	80	160	flat	0.0714
지성/야성/자연/변형	9	1	영웅	치명타 방어력	100	200	flat	0.0714
지성/야성/자연/변형	9	1	영웅	후방 방어력	100	200	flat	0.0714
지성/야성/자연/변형	9	1	영웅	PVE 방어력	100	200	flat	0.0714
지성/야성/자연/변형	9	1	영웅	추가 명중	20	40	flat	0.0714
지성/야성/자연/변형	9	1	영웅	치명타	15	30	flat	0.0714
지성/야성/자연/변형	9	1	영웅	보스 공격력	10	20	flat	0.0714
지성/야성/자연/변형	9	1	영웅	추가 회피	20	40	flat	0.0714
지성/야성/자연/변형	9	1	영웅	치명타 저항	15	30	flat	0.0714
지성/야성/자연/변형	9	1	영웅	막기	25	50	flat	0.0714
지성/야성/자연/변형	9	1	영웅	후방 치명타	25	50	flat	0.0715
지성/야성/자연/변형	9	1	영웅	후방 치명타 저항	20	40	flat	0.0715
지성/야성/자연/변형	9	1	영웅	생명력	100	200	flat	0.0715
지성/야성/자연/변형	9	1	영웅	정신력	50	100	flat	0.0715
지성/야성/자연/변형	9	4	영웅	추가 방어력	80	160	flat	0.0714
지성/야성/자연/변형	9	4	영웅	치명타 방어력	100	200	flat	0.0714
지성/야성/자연/변형	9	4	영웅	후방 방어력	100	200	flat	0.0714
지성/야성/자연/변형	9	4	영웅	PVE 방어력	100	200	flat	0.0714
지성/야성/자연/변형	9	4	영웅	추가 명중	20	40	flat	0.0714
지성/야성/자연/변형	9	4	영웅	치명타	15	30	flat	0.0714
지성/야성/자연/변형	9	4	영웅	보스 공격력	10	20	flat	0.0714
지성/야성/자연/변형	9	4	영웅	추가 회피	20	40	flat	0.0714
지성/야성/자연/변형	9	4	영웅	치명타 저항	15	30	flat	0.0714
지성/야성/자연/변형	9	4	영웅	막기	25	50	flat	0.0714
지성/야성/자연/변형	9	4	영웅	후방 치명타	25	50	flat	0.0715
지성/야성/자연/변형	9	4	영웅	후방 치명타 저항	20	40	flat	0.0715
지성/야성/자연/변형	9	4	영웅	생명력	100	200	flat	0.0715
지성/야성/자연/변형	9	4	영웅	정신력	50	100	flat	0.0715
지성/야성/자연/변형	9	7	영웅	추가 방어력	80	160	flat	0.0714
지성/야성/자연/변형	9	7	영웅	치명타 방어력	100	200	flat	0.0714
지성/야성/자연/변형	9	7	영웅	후방 방어력	100	200	flat	0.0714
지성/야성/자연/변형	9	7	영웅	PVE 방어력	100	200	flat	0.0714
지성/야성/자연/변형	9	7	영웅	추가 명중	20	40	flat	0.0714
지성/야성/자연/변형	9	7	영웅	치명타	15	30	flat	0.0714
지성/야성/자연/변형	9	7	영웅	보스 공격력	10	20	flat	0.0714
지성/야성/자연/변형	9	7	영웅	추가 회피	20	40	flat	0.0714
지성/야성/자연/변형	9	7	영웅	치명타 저항	15	30	flat	0.0714
지성/야성/자연/변형	9	7	영웅	막기	25	50	flat	0.0714
지성/야성/자연/변형	9	7	영웅	후방 치명타	25	50	flat	0.0715
지성/야성/자연/변형	9	7	영웅	후방 치명타 저항	20	40	flat	0.0715
지성/야성/자연/변형	9	7	영웅	생명력	100	200	flat	0.0715
지성/야성/자연/변형	9	7	영웅	정신력	50	100	flat	0.0715
지성/야성/자연/변형	9	1	유일	추가 방어력	60	120	flat	0.714
지성/야성/자연/변형	9	1	유일	치명타 방어력	80	160	flat	0.714
지성/야성/자연/변형	9	1	유일	후방 방어력	80	160	flat	0.714
지성/야성/자연/변형	9	1	유일	PVE 방어력	80	160	flat	0.714
지성/야성/자연/변형	9	1	유일	추가 명중	17	34	flat	0.714
지성/야성/자연/변형	9	1	유일	치명타	10	20	flat	0.714
지성/야성/자연/변형	9	1	유일	보스 공격력	8	16	flat	0.714
지성/야성/자연/변형	9	1	유일	추가 회피	15	30	flat	0.714
지성/야성/자연/변형	9	1	유일	치명타 저항	10	20	flat	0.714
지성/야성/자연/변형	9	1	유일	막기	20	40	flat	0.714
지성/야성/자연/변형	9	1	유일	후방 치명타	16	32	flat	0.715
지성/야성/자연/변형	9	1	유일	후방 치명타 저항	15	30	flat	0.715
지성/야성/자연/변형	9	1	유일	생명력	70	140	flat	0.715
지성/야성/자연/변형	9	1	유일	정신력	35	70	flat	0.715
지성/야성/자연/변형	9	4	유일	추가 방어력	60	120	flat	0.714
지성/야성/자연/변형	9	4	유일	치명타 방어력	80	160	flat	0.714
지성/야성/자연/변형	9	4	유일	후방 방어력	80	160	flat	0.714
지성/야성/자연/변형	9	4	유일	PVE 방어력	80	160	flat	0.714
지성/야성/자연/변형	9	4	유일	추가 명중	17	34	flat	0.714
지성/야성/자연/변형	9	4	유일	치명타	10	20	flat	0.714
지성/야성/자연/변형	9	4	유일	보스 공격력	8	16	flat	0.714
지성/야성/자연/변형	9	4	유일	추가 회피	15	30	flat	0.714
지성/야성/자연/변형	9	4	유일	치명타 저항	10	20	flat	0.714
지성/야성/자연/변형	9	4	유일	막기	20	40	flat	0.714
지성/야성/자연/변형	9	4	유일	후방 치명타	16	32	flat	0.715
지성/야성/자연/변형	9	4	유일	후방 치명타 저항	15	30	flat	0.715
지성/야성/자연/변형	9	4	유일	생명력	70	140	flat	0.715
지성/야성/자연/변형	9	4	유일	정신력	35	70	flat	0.715
지성/야성/자연/변형	9	7	유일	추가 방어력	60	120	flat	0.714
지성/야성/자연/변형	9	7	유일	치명타 방어력	80	160	flat	0.714
지성/야성/자연/변형	9	7	유일	후방 방어력	80	160	flat	0.714
지성/야성/자연/변형	9	7	유일	PVE 방어력	80	160	flat	0.714
지성/야성/자연/변형	9	7	유일	추가 명중	17	34	flat	0.714
지성/야성/자연/변형	9	7	유일	치명타	10	20	flat	0.714
지성/야성/자연/변형	9	7	유일	보스 공격력	8	16	flat	0.714
지성/야성/자연/변형	9	7	유일	추가 회피	15	30	flat	0.714
지성/야성/자연/변형	9	7	유일	치명타 저항	10	20	flat	0.714
지성/야성/자연/변형	9	7	유일	막기	20	40	flat	0.714
지성/야성/자연/변형	9	7	유일	후방 치명타	16	32	flat	0.715
지성/야성/자연/변형	9	7	유일	후방 치명타 저항	15	30	flat	0.715
지성/야성/자연/변형	9	7	유일	생명력	70	140	flat	0.715
지성/야성/자연/변형	9	7	유일	정신력	35	70	flat	0.715
지성/야성/자연/변형	9	2	영웅	추가 공격력	8	16	flat	0.0666
지성/야성/자연/변형	9	2	영웅	최대 공격력	10	20	flat	0.0666
지성/야성/자연/변형	9	2	영웅	치명타 공격력	10	20	flat	0.0666
지성/야성/자연/변형	9	2	영웅	후방 공격력	10	20	flat	0.0666
지성/야성/자연/변형	9	2	영웅	PVE 공격력	10	20	flat	0.0666
지성/야성/자연/변형	9	2	영웅	추가 명중	20	40	flat	0.0666
지성/야성/자연/변형	9	2	영웅	치명타	15	30	flat	0.0666
지성/야성/자연/변형	9	2	영웅	보스 공격력	10	20	flat	0.0666
지성/야성/자연/변형	9	2	영웅	추가 회피	20	40	flat	0.0666
지성/야성/자연/변형	9	2	영웅	치명타 저항	15	30	flat	0.0666
지성/야성/자연/변형	9	2	영웅	막기	25	50	flat	0.0666
지성/야성/자연/변형	9	2	영웅	후방 치명타	25	50	flat	0.0666
지성/야성/자연/변형	9	2	영웅	후방 치명타 저항	20	40	flat	0.0666
지성/야성/자연/변형	9	2	영웅	생명력	100	200	flat	0.0671
지성/야성/자연/변형	9	2	영웅	정신력	50	100	flat	0.0671
지성/야성/자연/변형	9	5	영웅	추가 공격력	8	16	flat	0.0666
지성/야성/자연/변형	9	5	영웅	최대 공격력	10	20	flat	0.0666
지성/야성/자연/변형	9	5	영웅	치명타 공격력	10	20	flat	0.0666
지성/야성/자연/변형	9	5	영웅	후방 공격력	10	20	flat	0.0666
지성/야성/자연/변형	9	5	영웅	PVE 공격력	10	20	flat	0.0666
지성/야성/자연/변형	9	5	영웅	추가 명중	20	40	flat	0.0666
지성/야성/자연/변형	9	5	영웅	치명타	15	30	flat	0.0666
지성/야성/자연/변형	9	5	영웅	보스 공격력	10	20	flat	0.0666
지성/야성/자연/변형	9	5	영웅	추가 회피	20	40	flat	0.0666
지성/야성/자연/변형	9	5	영웅	치명타 저항	15	30	flat	0.0666
지성/야성/자연/변형	9	5	영웅	막기	25	50	flat	0.0666
지성/야성/자연/변형	9	5	영웅	후방 치명타	25	50	flat	0.0666
지성/야성/자연/변형	9	5	영웅	후방 치명타 저항	20	40	flat	0.0666
지성/야성/자연/변형	9	5	영웅	생명력	100	200	flat	0.0671
지성/야성/자연/변형	9	5	영웅	정신력	50	100	flat	0.0671
지성/야성/자연/변형	9	8	영웅	추가 공격력	8	16	flat	0.0666
지성/야성/자연/변형	9	8	영웅	최대 공격력	10	20	flat	0.0666
지성/야성/자연/변형	9	8	영웅	치명타 공격력	10	20	flat	0.0666
지성/야성/자연/변형	9	8	영웅	후방 공격력	10	20	flat	0.0666
지성/야성/자연/변형	9	8	영웅	PVE 공격력	10	20	flat	0.0666
지성/야성/자연/변형	9	8	영웅	추가 명중	20	40	flat	0.0666
지성/야성/자연/변형	9	8	영웅	치명타	15	30	flat	0.0666
지성/야성/자연/변형	9	8	영웅	보스 공격력	10	20	flat	0.0666
지성/야성/자연/변형	9	8	영웅	추가 회피	20	40	flat	0.0666
지성/야성/자연/변형	9	8	영웅	치명타 저항	15	30	flat	0.0666
지성/야성/자연/변형	9	8	영웅	막기	25	50	flat	0.0666
지성/야성/자연/변형	9	8	영웅	후방 치명타	25	50	flat	0.0666
지성/야성/자연/변형	9	8	영웅	후방 치명타 저항	20	40	flat	0.0666
지성/야성/자연/변형	9	8	영웅	생명력	100	200	flat	0.0671
지성/야성/자연/변형	9	8	영웅	정신력	50	100	flat	0.0671
지성/야성/자연/변형	9	2	유일	추가 공격력	6	12	flat	0.666
지성/야성/자연/변형	9	2	유일	최대 공격력	8	16	flat	0.666
지성/야성/자연/변형	9	2	유일	치명타 공격력	8	16	flat	0.666
지성/야성/자연/변형	9	2	유일	후방 공격력	8	16	flat	0.666
지성/야성/자연/변형	9	2	유일	PVE 공격력	8	16	flat	0.666
지성/야성/자연/변형	9	2	유일	추가 명중	17	34	flat	0.666
지성/야성/자연/변형	9	2	유일	치명타	10	20	flat	0.666
지성/야성/자연/변형	9	2	유일	보스 공격력	8	16	flat	0.666
지성/야성/자연/변형	9	2	유일	추가 회피	15	30	flat	0.666
지성/야성/자연/변형	9	2	유일	치명타 저항	10	20	flat	0.666
지성/야성/자연/변형	9	2	유일	막기	20	40	flat	0.666
지성/야성/자연/변형	9	2	유일	후방 치명타	16	32	flat	0.666
지성/야성/자연/변형	9	2	유일	후방 치명타 저항	15	30	flat	0.666
지성/야성/자연/변형	9	2	유일	생명력	70	140	flat	0.671
지성/야성/자연/변형	9	2	유일	정신력	35	70	flat	0.671
지성/야성/자연/변형	9	5	유일	추가 공격력	6	12	flat	0.666
지성/야성/자연/변형	9	5	유일	최대 공격력	8	16	flat	0.666
지성/야성/자연/변형	9	5	유일	치명타 공격력	8	16	flat	0.666
지성/야성/자연/변형	9	5	유일	후방 공격력	8	16	flat	0.666
지성/야성/자연/변형	9	5	유일	PVE 공격력	8	16	flat	0.666
지성/야성/자연/변형	9	5	유일	추가 명중	17	34	flat	0.666
지성/야성/자연/변형	9	5	유일	치명타	10	20	flat	0.666
지성/야성/자연/변형	9	5	유일	보스 공격력	8	16	flat	0.666
지성/야성/자연/변형	9	5	유일	추가 회피	15	30	flat	0.666
지성/야성/자연/변형	9	5	유일	치명타 저항	10	20	flat	0.666
지성/야성/자연/변형	9	5	유일	막기	20	40	flat	0.666
지성/야성/자연/변형	9	5	유일	후방 치명타	16	32	flat	0.666
지성/야성/자연/변형	9	5	유일	후방 치명타 저항	15	30	flat	0.666
지성/야성/자연/변형	9	5	유일	생명력	70	140	flat	0.671
지성/야성/자연/변형	9	5	유일	정신력	35	70	flat	0.671
지성/야성/자연/변형	9	8	유일	추가 공격력	6	12	flat	0.666
지성/야성/자연/변형	9	8	유일	최대 공격력	8	16	flat	0.666
지성/야성/자연/변형	9	8	유일	치명타 공격력	8	16	flat	0.666
지성/야성/자연/변형	9	8	유일	후방 공격력	8	16	flat	0.666
지성/야성/자연/변형	9	8	유일	PVE 공격력	8	16	flat	0.666
지성/야성/자연/변형	9	8	유일	추가 명중	17	34	flat	0.666
지성/야성/자연/변형	9	8	유일	치명타	10	20	flat	0.666
지성/야성/자연/변형	9	8	유일	보스 공격력	8	16	flat	0.666
지성/야성/자연/변형	9	8	유일	추가 회피	15	30	flat	0.666
지성/야성/자연/변형	9	8	유일	치명타 저항	10	20	flat	0.666
지성/야성/자연/변형	9	8	유일	막기	20	40	flat	0.666
지성/야성/자연/변형	9	8	유일	후방 치명타	16	32	flat	0.666
지성/야성/자연/변형	9	8	유일	후방 치명타 저항	15	30	flat	0.666
지성/야성/자연/변형	9	8	유일	생명력	70	140	flat	0.671
지성/야성/자연/변형	9	8	유일	정신력	35	70	flat	0.671
지성/야성/자연/변형	9	3	영웅	피해 증폭	1.2	2.4	%	0.0555
지성/야성/자연/변형	9	3	영웅	강타	1.2	2.4	%	0.0555
지성/야성/자연/변형	9	3	영웅	완벽	1.2	2.4	%	0.0555
지성/야성/자연/변형	9	3	영웅	지성쪽 피해 증폭	2.4	4.8	%	0.0555
지성/야성/자연/변형	9	3	영웅	무기 피해 증폭	1.2	2.4	%	0.0555
지성/야성/자연/변형	9	3	영웅	치명타 피해 증폭	1.5	3	%	0.0555
지성/야성/자연/변형	9	3	영웅	후방 피해 증폭	1.5	3	%	0.0555
지성/야성/자연/변형	9	3	영웅	PVE 피해 증폭	1.5	3	%	0.0555
지성/야성/자연/변형	9	3	영웅	추가 명중	20	40	flat	0.0556
지성/야성/자연/변형	9	3	영웅	치명타	15	30	flat	0.0556
지성/야성/자연/변형	9	3	영웅	보스 공격력	10	20	flat	0.0556
지성/야성/자연/변형	9	3	영웅	추가 회피	20	40	flat	0.0556
지성/야성/자연/변형	9	3	영웅	치명타 저항	15	30	flat	0.0556
지성/야성/자연/변형	9	3	영웅	막기	25	50	flat	0.0556
지성/야성/자연/변형	9	3	영웅	후방 치명타	25	50	flat	0.0556
지성/야성/자연/변형	9	3	영웅	후방 치명타 저항	20	40	flat	0.0556
지성/야성/자연/변형	9	3	영웅	생명력	100	200	flat	0.0556
지성/야성/자연/변형	9	3	영웅	정신력	50	100	flat	0.0556
지성/야성/자연/변형	9	9	영웅	피해 증폭	1.2	2.4	%	0.0555
지성/야성/자연/변형	9	9	영웅	강타	1.2	2.4	%	0.0555
지성/야성/자연/변형	9	9	영웅	완벽	1.2	2.4	%	0.0555
지성/야성/자연/변형	9	9	영웅	지성쪽 피해 증폭	2.4	4.8	%	0.0555
지성/야성/자연/변형	9	9	영웅	무기 피해 증폭	1.2	2.4	%	0.0555
지성/야성/자연/변형	9	9	영웅	치명타 피해 증폭	1.5	3	%	0.0555
지성/야성/자연/변형	9	9	영웅	후방 피해 증폭	1.5	3	%	0.0555
지성/야성/자연/변형	9	9	영웅	PVE 피해 증폭	1.5	3	%	0.0555
지성/야성/자연/변형	9	9	영웅	추가 명중	20	40	flat	0.0556
지성/야성/자연/변형	9	9	영웅	치명타	15	30	flat	0.0556
지성/야성/자연/변형	9	9	영웅	보스 공격력	10	20	flat	0.0556
지성/야성/자연/변형	9	9	영웅	추가 회피	20	40	flat	0.0556
지성/야성/자연/변형	9	9	영웅	치명타 저항	15	30	flat	0.0556
지성/야성/자연/변형	9	9	영웅	막기	25	50	flat	0.0556
지성/야성/자연/변형	9	9	영웅	후방 치명타	25	50	flat	0.0556
지성/야성/자연/변형	9	9	영웅	후방 치명타 저항	20	40	flat	0.0556
지성/야성/자연/변형	9	9	영웅	생명력	100	200	flat	0.0556
지성/야성/자연/변형	9	9	영웅	정신력	50	100	flat	0.0556
지성/야성/자연/변형	9	3	유일	피해 증폭	0.9	1.8	%	0.555
지성/야성/자연/변형	9	3	유일	강타	0.9	1.8	%	0.555
지성/야성/자연/변형	9	3	유일	완벽	0.9	1.8	%	0.555
지성/야성/자연/변형	9	3	유일	지성쪽 피해 증폭	2	4	%	0.555
지성/야성/자연/변형	9	3	유일	무기 피해 증폭	0.9	1.8	%	0.555
지성/야성/자연/변형	9	3	유일	치명타 피해 증폭	1.2	2.4	%	0.555
지성/야성/자연/변형	9	3	유일	후방 피해 증폭	1.2	2.4	%	0.555
지성/야성/자연/변형	9	3	유일	PVE 피해 증폭	1.2	2.4	%	0.555
지성/야성/자연/변형	9	3	유일	추가 명중	17	34	flat	0.556
지성/야성/자연/변형	9	3	유일	치명타	10	20	flat	0.556
지성/야성/자연/변형	9	3	유일	보스 공격력	8	16	flat	0.556
지성/야성/자연/변형	9	3	유일	추가 회피	15	30	flat	0.556
지성/야성/자연/변형	9	3	유일	치명타 저항	10	20	flat	0.556
지성/야성/자연/변형	9	3	유일	막기	20	40	flat	0.556
지성/야성/자연/변형	9	3	유일	후방 치명타	16	32	flat	0.556
지성/야성/자연/변형	9	3	유일	후방 치명타 저항	15	30	flat	0.556
지성/야성/자연/변형	9	3	유일	생명력	70	140	flat	0.556
지성/야성/자연/변형	9	3	유일	정신력	35	70	flat	0.556
지성/야성/자연/변형	9	9	유일	피해 증폭	0.9	1.8	%	0.555
지성/야성/자연/변형	9	9	유일	강타	0.9	1.8	%	0.555
지성/야성/자연/변형	9	9	유일	완벽	0.9	1.8	%	0.555
지성/야성/자연/변형	9	9	유일	지성쪽 피해 증폭	2	4	%	0.555
지성/야성/자연/변형	9	9	유일	무기 피해 증폭	0.9	1.8	%	0.555
지성/야성/자연/변형	9	9	유일	치명타 피해 증폭	1.2	2.4	%	0.555
지성/야성/자연/변형	9	9	유일	후방 피해 증폭	1.2	2.4	%	0.555
지성/야성/자연/변형	9	9	유일	PVE 피해 증폭	1.2	2.4	%	0.555
지성/야성/자연/변형	9	9	유일	추가 명중	17	34	flat	0.556
지성/야성/자연/변형	9	9	유일	치명타	10	20	flat	0.556
지성/야성/자연/변형	9	9	유일	보스 공격력	8	16	flat	0.556
지성/야성/자연/변형	9	9	유일	추가 회피	15	30	flat	0.556
지성/야성/자연/변형	9	9	유일	치명타 저항	10	20	flat	0.556
지성/야성/자연/변형	9	9	유일	막기	20	40	flat	0.556
지성/야성/자연/변형	9	9	유일	후방 치명타	16	32	flat	0.556
지성/야성/자연/변형	9	9	유일	후방 치명타 저항	15	30	flat	0.556
지성/야성/자연/변형	9	9	유일	생명력	70	140	flat	0.556
지성/야성/자연/변형	9	9	유일	정신력	35	70	flat	0.556
지성/야성/자연/변형	9	6	영웅	피해내성	1.2	2.4	%	0.0555
지성/야성/자연/변형	9	6	영웅	철벽	1.2	2.4	%	0.0555
지성/야성/자연/변형	9	6	영웅	재생	1.2	2.4	%	0.0555
지성/야성/자연/변형	9	6	영웅	지성쪽 피해 내성	2.4	4.8	%	0.0555
지성/야성/자연/변형	9	6	영웅	무기 피해 내성	1.2	2.4	%	0.0555
지성/야성/자연/변형	9	6	영웅	치명타 피해 내성	1.3	2.6	%	0.0555
지성/야성/자연/변형	9	6	영웅	후방 피해 내성	1.3	2.6	%	0.0555
지성/야성/자연/변형	9	6	영웅	PVE 피해 내성	1.5	3	%	0.0555
지성/야성/자연/변형	9	6	영웅	추가 명중	20	40	flat	0.0556
지성/야성/자연/변형	9	6	영웅	치명타	15	30	flat	0.0556
지성/야성/자연/변형	9	6	영웅	보스 공격력	10	20	flat	0.0556
지성/야성/자연/변형	9	6	영웅	추가 회피	20	40	flat	0.0556
지성/야성/자연/변형	9	6	영웅	치명타 저항	15	30	flat	0.0556
지성/야성/자연/변형	9	6	영웅	막기	25	50	flat	0.0556
지성/야성/자연/변형	9	6	영웅	후방 치명타	25	50	flat	0.0556
지성/야성/자연/변형	9	6	영웅	후방 치명타 저항	20	40	flat	0.0556
지성/야성/자연/변형	9	6	영웅	생명력	100	200	flat	0.0556
지성/야성/자연/변형	9	6	영웅	정신력	50	100	flat	0.0556
지성/야성/자연/변형	9	6	유일	피해내성	0.9	1.8	%	0.555
지성/야성/자연/변형	9	6	유일	철벽	0.9	1.8	%	0.555
지성/야성/자연/변형	9	6	유일	재생	0.9	1.8	%	0.555
지성/야성/자연/변형	9	6	유일	지성쪽 피해 내성	2	4	%	0.555
지성/야성/자연/변형	9	6	유일	무기 피해 내성	0.9	1.8	%	0.555
지성/야성/자연/변형	9	6	유일	치명타 피해 내성	1	2	%	0.555
지성/야성/자연/변형	9	6	유일	후방 피해 내성	1	2	%	0.555
지성/야성/자연/변형	9	6	유일	PVE 피해 내성	1.2	2.4	%	0.555
지성/야성/자연/변형	9	6	유일	추가 명중	17	34	flat	0.556
지성/야성/자연/변형	9	6	유일	치명타	10	20	flat	0.556
지성/야성/자연/변형	9	6	유일	보스 공격력	8	16	flat	0.556
지성/야성/자연/변형	9	6	유일	추가 회피	15	30	flat	0.556
지성/야성/자연/변형	9	6	유일	치명타 저항	10	20	flat	0.556
지성/야성/자연/변형	9	6	유일	막기	20	40	flat	0.556
지성/야성/자연/변형	9	6	유일	후방 치명타	16	32	flat	0.556
지성/야성/자연/변형	9	6	유일	후방 치명타 저항	15	30	flat	0.556
지성/야성/자연/변형	9	6	유일	생명력	70	140	flat	0.556
지성/야성/자연/변형	9	6	유일	정신력	35	70	flat	0.556
지성/야성/자연/변형	10	1	영웅	추가 방어력	80	160	flat	0.357
지성/야성/자연/변형	10	1	영웅	치명타 방어력	100	200	flat	0.357
지성/야성/자연/변형	10	1	영웅	후방 방어력	100	200	flat	0.357
지성/야성/자연/변형	10	1	영웅	PVE 방어력	100	200	flat	0.357
지성/야성/자연/변형	10	1	영웅	추가 명중	20	40	flat	0.357
지성/야성/자연/변형	10	1	영웅	치명타	15	30	flat	0.357
지성/야성/자연/변형	10	1	영웅	보스 공격력	10	20	flat	0.357
지성/야성/자연/변형	10	1	영웅	추가 회피	20	40	flat	0.357
지성/야성/자연/변형	10	1	영웅	치명타 저항	15	30	flat	0.357
지성/야성/자연/변형	10	1	영웅	막기	25	50	flat	0.357
지성/야성/자연/변형	10	1	영웅	후방 치명타	25	50	flat	0.3575
지성/야성/자연/변형	10	1	영웅	후방 치명타 저항	20	40	flat	0.3575
지성/야성/자연/변형	10	1	영웅	생명력	100	200	flat	0.3575
지성/야성/자연/변형	10	1	영웅	정신력	50	100	flat	0.3575
지성/야성/자연/변형	10	4	영웅	추가 방어력	80	160	flat	0.357
지성/야성/자연/변형	10	4	영웅	치명타 방어력	100	200	flat	0.357
지성/야성/자연/변형	10	4	영웅	후방 방어력	100	200	flat	0.357
지성/야성/자연/변형	10	4	영웅	PVE 방어력	100	200	flat	0.357
지성/야성/자연/변형	10	4	영웅	추가 명중	20	40	flat	0.357
지성/야성/자연/변형	10	4	영웅	치명타	15	30	flat	0.357
지성/야성/자연/변형	10	4	영웅	보스 공격력	10	20	flat	0.357
지성/야성/자연/변형	10	4	영웅	추가 회피	20	40	flat	0.357
지성/야성/자연/변형	10	4	영웅	치명타 저항	15	30	flat	0.357
지성/야성/자연/변형	10	4	영웅	막기	25	50	flat	0.357
지성/야성/자연/변형	10	4	영웅	후방 치명타	25	50	flat	0.3575
지성/야성/자연/변형	10	4	영웅	후방 치명타 저항	20	40	flat	0.3575
지성/야성/자연/변형	10	4	영웅	생명력	100	200	flat	0.3575
지성/야성/자연/변형	10	4	영웅	정신력	50	100	flat	0.3575
지성/야성/자연/변형	10	7	영웅	추가 방어력	80	160	flat	0.357
지성/야성/자연/변형	10	7	영웅	치명타 방어력	100	200	flat	0.357
지성/야성/자연/변형	10	7	영웅	후방 방어력	100	200	flat	0.357
지성/야성/자연/변형	10	7	영웅	PVE 방어력	100	200	flat	0.357
지성/야성/자연/변형	10	7	영웅	추가 명중	20	40	flat	0.357
지성/야성/자연/변형	10	7	영웅	치명타	15	30	flat	0.357
지성/야성/자연/변형	10	7	영웅	보스 공격력	10	20	flat	0.357
지성/야성/자연/변형	10	7	영웅	추가 회피	20	40	flat	0.357
지성/야성/자연/변형	10	7	영웅	치명타 저항	15	30	flat	0.357
지성/야성/자연/변형	10	7	영웅	막기	25	50	flat	0.357
지성/야성/자연/변형	10	7	영웅	후방 치명타	25	50	flat	0.3575
지성/야성/자연/변형	10	7	영웅	후방 치명타 저항	20	40	flat	0.3575
지성/야성/자연/변형	10	7	영웅	생명력	100	200	flat	0.3575
지성/야성/자연/변형	10	7	영웅	정신력	50	100	flat	0.3575
지성/야성/자연/변형	10	1	유일	추가 방어력	60	120	flat	1.071
지성/야성/자연/변형	10	1	유일	치명타 방어력	80	160	flat	1.071
지성/야성/자연/변형	10	1	유일	후방 방어력	80	160	flat	1.071
지성/야성/자연/변형	10	1	유일	PVE 방어력	80	160	flat	1.071
지성/야성/자연/변형	10	1	유일	추가 명중	17	34	flat	1.071
지성/야성/자연/변형	10	1	유일	치명타	10	20	flat	1.071
지성/야성/자연/변형	10	1	유일	보스 공격력	8	16	flat	1.071
지성/야성/자연/변형	10	1	유일	추가 회피	15	30	flat	1.071
지성/야성/자연/변형	10	1	유일	치명타 저항	10	20	flat	1.071
지성/야성/자연/변형	10	1	유일	막기	20	40	flat	1.071
지성/야성/자연/변형	10	1	유일	후방 치명타	16	32	flat	1.0725
지성/야성/자연/변형	10	1	유일	후방 치명타 저항	15	30	flat	1.0725
지성/야성/자연/변형	10	1	유일	생명력	70	140	flat	1.0725
지성/야성/자연/변형	10	1	유일	정신력	35	70	flat	1.0725
지성/야성/자연/변형	10	4	유일	추가 방어력	60	120	flat	1.071
지성/야성/자연/변형	10	4	유일	치명타 방어력	80	160	flat	1.071
지성/야성/자연/변형	10	4	유일	후방 방어력	80	160	flat	1.071
지성/야성/자연/변형	10	4	유일	PVE 방어력	80	160	flat	1.071
지성/야성/자연/변형	10	4	유일	추가 명중	17	34	flat	1.071
지성/야성/자연/변형	10	4	유일	치명타	10	20	flat	1.071
지성/야성/자연/변형	10	4	유일	보스 공격력	8	16	flat	1.071
지성/야성/자연/변형	10	4	유일	추가 회피	15	30	flat	1.071
지성/야성/자연/변형	10	4	유일	치명타 저항	10	20	flat	1.071
지성/야성/자연/변형	10	4	유일	막기	20	40	flat	1.071
지성/야성/자연/변형	10	4	유일	후방 치명타	16	32	flat	1.0725
지성/야성/자연/변형	10	4	유일	후방 치명타 저항	15	30	flat	1.0725
지성/야성/자연/변형	10	4	유일	생명력	70	140	flat	1.0725
지성/야성/자연/변형	10	4	유일	정신력	35	70	flat	1.0725
지성/야성/자연/변형	10	7	유일	추가 방어력	60	120	flat	1.071
지성/야성/자연/변형	10	7	유일	치명타 방어력	80	160	flat	1.071
지성/야성/자연/변형	10	7	유일	후방 방어력	80	160	flat	1.071
지성/야성/자연/변형	10	7	유일	PVE 방어력	80	160	flat	1.071
지성/야성/자연/변형	10	7	유일	추가 명중	17	34	flat	1.071
지성/야성/자연/변형	10	7	유일	치명타	10	20	flat	1.071
지성/야성/자연/변형	10	7	유일	보스 공격력	8	16	flat	1.071
지성/야성/자연/변형	10	7	유일	추가 회피	15	30	flat	1.071
지성/야성/자연/변형	10	7	유일	치명타 저항	10	20	flat	1.071
지성/야성/자연/변형	10	7	유일	막기	20	40	flat	1.071
지성/야성/자연/변형	10	7	유일	후방 치명타	16	32	flat	1.0725
지성/야성/자연/변형	10	7	유일	후방 치명타 저항	15	30	flat	1.0725
지성/야성/자연/변형	10	7	유일	생명력	70	140	flat	1.0725
지성/야성/자연/변형	10	7	유일	정신력	35	70	flat	1.0725
지성/야성/자연/변형	10	2	영웅	추가 공격력	8	16	flat	0.333
지성/야성/자연/변형	10	2	영웅	최대 공격력	10	20	flat	0.333
지성/야성/자연/변형	10	2	영웅	치명타 공격력	10	20	flat	0.333
지성/야성/자연/변형	10	2	영웅	후방 공격력	10	20	flat	0.333
지성/야성/자연/변형	10	2	영웅	PVE 공격력	10	20	flat	0.333
지성/야성/자연/변형	10	2	영웅	추가 명중	20	40	flat	0.333
지성/야성/자연/변형	10	2	영웅	치명타	15	30	flat	0.333
지성/야성/자연/변형	10	2	영웅	보스 공격력	10	20	flat	0.333
지성/야성/자연/변형	10	2	영웅	추가 회피	20	40	flat	0.333
지성/야성/자연/변형	10	2	영웅	치명타 저항	15	30	flat	0.333
지성/야성/자연/변형	10	2	영웅	막기	25	50	flat	0.333
지성/야성/자연/변형	10	2	영웅	후방 치명타	25	50	flat	0.333
지성/야성/자연/변형	10	2	영웅	후방 치명타 저항	20	40	flat	0.333
지성/야성/자연/변형	10	2	영웅	생명력	100	200	flat	0.3355
지성/야성/자연/변형	10	2	영웅	정신력	50	100	flat	0.3355
지성/야성/자연/변형	10	5	영웅	추가 공격력	8	16	flat	0.333
지성/야성/자연/변형	10	5	영웅	최대 공격력	10	20	flat	0.333
지성/야성/자연/변형	10	5	영웅	치명타 공격력	10	20	flat	0.333
지성/야성/자연/변형	10	5	영웅	후방 공격력	10	20	flat	0.333
지성/야성/자연/변형	10	5	영웅	PVE 공격력	10	20	flat	0.333
지성/야성/자연/변형	10	5	영웅	추가 명중	20	40	flat	0.333
지성/야성/자연/변형	10	5	영웅	치명타	15	30	flat	0.333
지성/야성/자연/변형	10	5	영웅	보스 공격력	10	20	flat	0.333
지성/야성/자연/변형	10	5	영웅	추가 회피	20	40	flat	0.333
지성/야성/자연/변형	10	5	영웅	치명타 저항	15	30	flat	0.333
지성/야성/자연/변형	10	5	영웅	막기	25	50	flat	0.333
지성/야성/자연/변형	10	5	영웅	후방 치명타	25	50	flat	0.333
지성/야성/자연/변형	10	5	영웅	후방 치명타 저항	20	40	flat	0.333
지성/야성/자연/변형	10	5	영웅	생명력	100	200	flat	0.3355
지성/야성/자연/변형	10	5	영웅	정신력	50	100	flat	0.3355
지성/야성/자연/변형	10	8	영웅	추가 공격력	8	16	flat	0.333
지성/야성/자연/변형	10	8	영웅	최대 공격력	10	20	flat	0.333
지성/야성/자연/변형	10	8	영웅	치명타 공격력	10	20	flat	0.333
지성/야성/자연/변형	10	8	영웅	후방 공격력	10	20	flat	0.333
지성/야성/자연/변형	10	8	영웅	PVE 공격력	10	20	flat	0.333
지성/야성/자연/변형	10	8	영웅	추가 명중	20	40	flat	0.333
지성/야성/자연/변형	10	8	영웅	치명타	15	30	flat	0.333
지성/야성/자연/변형	10	8	영웅	보스 공격력	10	20	flat	0.333
지성/야성/자연/변형	10	8	영웅	추가 회피	20	40	flat	0.333
지성/야성/자연/변형	10	8	영웅	치명타 저항	15	30	flat	0.333
지성/야성/자연/변형	10	8	영웅	막기	25	50	flat	0.333
지성/야성/자연/변형	10	8	영웅	후방 치명타	25	50	flat	0.333
지성/야성/자연/변형	10	8	영웅	후방 치명타 저항	20	40	flat	0.333
지성/야성/자연/변형	10	8	영웅	생명력	100	200	flat	0.3355
지성/야성/자연/변형	10	8	영웅	정신력	50	100	flat	0.3355
지성/야성/자연/변형	10	2	유일	추가 공격력	6	12	flat	0.999
지성/야성/자연/변형	10	2	유일	최대 공격력	8	16	flat	0.999
지성/야성/자연/변형	10	2	유일	치명타 공격력	8	16	flat	0.999
지성/야성/자연/변형	10	2	유일	후방 공격력	8	16	flat	0.999
지성/야성/자연/변형	10	2	유일	PVE 공격력	8	16	flat	0.999
지성/야성/자연/변형	10	2	유일	추가 명중	17	34	flat	0.999
지성/야성/자연/변형	10	2	유일	치명타	10	20	flat	0.999
지성/야성/자연/변형	10	2	유일	보스 공격력	8	16	flat	0.999
지성/야성/자연/변형	10	2	유일	추가 회피	15	30	flat	0.999
지성/야성/자연/변형	10	2	유일	치명타 저항	10	20	flat	0.999
지성/야성/자연/변형	10	2	유일	막기	20	40	flat	0.999
지성/야성/자연/변형	10	2	유일	후방 치명타	16	32	flat	0.999
지성/야성/자연/변형	10	2	유일	후방 치명타 저항	15	30	flat	0.999
지성/야성/자연/변형	10	2	유일	생명력	70	140	flat	1.0065
지성/야성/자연/변형	10	2	유일	정신력	35	70	flat	1.0065
지성/야성/자연/변형	10	5	유일	추가 공격력	6	12	flat	0.999
지성/야성/자연/변형	10	5	유일	최대 공격력	8	16	flat	0.999
지성/야성/자연/변형	10	5	유일	치명타 공격력	8	16	flat	0.999
지성/야성/자연/변형	10	5	유일	후방 공격력	8	16	flat	0.999
지성/야성/자연/변형	10	5	유일	PVE 공격력	8	16	flat	0.999
지성/야성/자연/변형	10	5	유일	추가 명중	17	34	flat	0.999
지성/야성/자연/변형	10	5	유일	치명타	10	20	flat	0.999
지성/야성/자연/변형	10	5	유일	보스 공격력	8	16	flat	0.999
지성/야성/자연/변형	10	5	유일	추가 회피	15	30	flat	0.999
지성/야성/자연/변형	10	5	유일	치명타 저항	10	20	flat	0.999
지성/야성/자연/변형	10	5	유일	막기	20	40	flat	0.999
지성/야성/자연/변형	10	5	유일	후방 치명타	16	32	flat	0.999
지성/야성/자연/변형	10	5	유일	후방 치명타 저항	15	30	flat	0.999
지성/야성/자연/변형	10	5	유일	생명력	70	140	flat	1.0065
지성/야성/자연/변형	10	5	유일	정신력	35	70	flat	1.0065
지성/야성/자연/변형	10	8	유일	추가 공격력	6	12	flat	0.999
지성/야성/자연/변형	10	8	유일	최대 공격력	8	16	flat	0.999
지성/야성/자연/변형	10	8	유일	치명타 공격력	8	16	flat	0.999
지성/야성/자연/변형	10	8	유일	후방 공격력	8	16	flat	0.999
지성/야성/자연/변형	10	8	유일	PVE 공격력	8	16	flat	0.999
지성/야성/자연/변형	10	8	유일	추가 명중	17	34	flat	0.999
지성/야성/자연/변형	10	8	유일	치명타	10	20	flat	0.999
지성/야성/자연/변형	10	8	유일	보스 공격력	8	16	flat	0.999
지성/야성/자연/변형	10	8	유일	추가 회피	15	30	flat	0.999
지성/야성/자연/변형	10	8	유일	치명타 저항	10	20	flat	0.999
지성/야성/자연/변형	10	8	유일	막기	20	40	flat	0.999
지성/야성/자연/변형	10	8	유일	후방 치명타	16	32	flat	0.999
지성/야성/자연/변형	10	8	유일	후방 치명타 저항	15	30	flat	0.999
지성/야성/자연/변형	10	8	유일	생명력	70	140	flat	1.0065
지성/야성/자연/변형	10	8	유일	정신력	35	70	flat	1.0065
지성/야성/자연/변형	10	3	영웅	피해 증폭	1.2	2.4	%	0.2775
지성/야성/자연/변형	10	3	영웅	강타	1.2	2.4	%	0.2775
지성/야성/자연/변형	10	3	영웅	완벽	1.2	2.4	%	0.2775
지성/야성/자연/변형	10	3	영웅	지성쪽 피해 증폭	2.4	4.8	%	0.2775
지성/야성/자연/변형	10	3	영웅	무기 피해 증폭	1.2	2.4	%	0.2775
지성/야성/자연/변형	10	3	영웅	치명타 피해 증폭	1.5	3	%	0.2775
지성/야성/자연/변형	10	3	영웅	후방 피해 증폭	1.5	3	%	0.2775
지성/야성/자연/변형	10	3	영웅	PVE 피해 증폭	1.5	3	%	0.2775
지성/야성/자연/변형	10	3	영웅	추가 명중	20	40	flat	0.278
지성/야성/자연/변형	10	3	영웅	치명타	15	30	flat	0.278
지성/야성/자연/변형	10	3	영웅	보스 공격력	10	20	flat	0.278
지성/야성/자연/변형	10	3	영웅	추가 회피	20	40	flat	0.278
지성/야성/자연/변형	10	3	영웅	치명타 저항	15	30	flat	0.278
지성/야성/자연/변형	10	3	영웅	막기	25	50	flat	0.278
지성/야성/자연/변형	10	3	영웅	후방 치명타	25	50	flat	0.278
지성/야성/자연/변형	10	3	영웅	후방 치명타 저항	20	40	flat	0.278
지성/야성/자연/변형	10	3	영웅	생명력	100	200	flat	0.278
지성/야성/자연/변형	10	3	영웅	정신력	50	100	flat	0.278
지성/야성/자연/변형	10	9	영웅	피해 증폭	1.2	2.4	%	0.2775
지성/야성/자연/변형	10	9	영웅	강타	1.2	2.4	%	0.2775
지성/야성/자연/변형	10	9	영웅	완벽	1.2	2.4	%	0.2775
지성/야성/자연/변형	10	9	영웅	지성쪽 피해 증폭	2.4	4.8	%	0.2775
지성/야성/자연/변형	10	9	영웅	무기 피해 증폭	1.2	2.4	%	0.2775
지성/야성/자연/변형	10	9	영웅	치명타 피해 증폭	1.5	3	%	0.2775
지성/야성/자연/변형	10	9	영웅	후방 피해 증폭	1.5	3	%	0.2775
지성/야성/자연/변형	10	9	영웅	PVE 피해 증폭	1.5	3	%	0.2775
지성/야성/자연/변형	10	9	영웅	추가 명중	20	40	flat	0.278
지성/야성/자연/변형	10	9	영웅	치명타	15	30	flat	0.278
지성/야성/자연/변형	10	9	영웅	보스 공격력	10	20	flat	0.278
지성/야성/자연/변형	10	9	영웅	추가 회피	20	40	flat	0.278
지성/야성/자연/변형	10	9	영웅	치명타 저항	15	30	flat	0.278
지성/야성/자연/변형	10	9	영웅	막기	25	50	flat	0.278
지성/야성/자연/변형	10	9	영웅	후방 치명타	25	50	flat	0.278
지성/야성/자연/변형	10	9	영웅	후방 치명타 저항	20	40	flat	0.278
지성/야성/자연/변형	10	9	영웅	생명력	100	200	flat	0.278
지성/야성/자연/변형	10	9	영웅	정신력	50	100	flat	0.278
지성/야성/자연/변형	10	3	유일	피해 증폭	0.9	1.8	%	0.8325
지성/야성/자연/변형	10	3	유일	강타	0.9	1.8	%	0.8325
지성/야성/자연/변형	10	3	유일	완벽	0.9	1.8	%	0.8325
지성/야성/자연/변형	10	3	유일	지성쪽 피해 증폭	2	4	%	0.8325
지성/야성/자연/변형	10	3	유일	무기 피해 증폭	0.9	1.8	%	0.8325
지성/야성/자연/변형	10	3	유일	치명타 피해 증폭	1.2	2.4	%	0.8325
지성/야성/자연/변형	10	3	유일	후방 피해 증폭	1.2	2.4	%	0.8325
지성/야성/자연/변형	10	3	유일	PVE 피해 증폭	1.2	2.4	%	0.8325
지성/야성/자연/변형	10	3	유일	추가 명중	17	34	flat	0.834
지성/야성/자연/변형	10	3	유일	치명타	10	20	flat	0.834
지성/야성/자연/변형	10	3	유일	보스 공격력	8	16	flat	0.834
지성/야성/자연/변형	10	3	유일	추가 회피	15	30	flat	0.834
지성/야성/자연/변형	10	3	유일	치명타 저항	10	20	flat	0.834
지성/야성/자연/변형	10	3	유일	막기	20	40	flat	0.834
지성/야성/자연/변형	10	3	유일	후방 치명타	16	32	flat	0.834
지성/야성/자연/변형	10	3	유일	후방 치명타 저항	15	30	flat	0.834
지성/야성/자연/변형	10	3	유일	생명력	70	140	flat	0.834
지성/야성/자연/변형	10	3	유일	정신력	35	70	flat	0.834
지성/야성/자연/변형	10	9	유일	피해 증폭	0.9	1.8	%	0.8325
지성/야성/자연/변형	10	9	유일	강타	0.9	1.8	%	0.8325
지성/야성/자연/변형	10	9	유일	완벽	0.9	1.8	%	0.8325
지성/야성/자연/변형	10	9	유일	지성쪽 피해 증폭	2	4	%	0.8325
지성/야성/자연/변형	10	9	유일	무기 피해 증폭	0.9	1.8	%	0.8325
지성/야성/자연/변형	10	9	유일	치명타 피해 증폭	1.2	2.4	%	0.8325
지성/야성/자연/변형	10	9	유일	후방 피해 증폭	1.2	2.4	%	0.8325
지성/야성/자연/변형	10	9	유일	PVE 피해 증폭	1.2	2.4	%	0.8325
지성/야성/자연/변형	10	9	유일	추가 명중	17	34	flat	0.834
지성/야성/자연/변형	10	9	유일	치명타	10	20	flat	0.834
지성/야성/자연/변형	10	9	유일	보스 공격력	8	16	flat	0.834
지성/야성/자연/변형	10	9	유일	추가 회피	15	30	flat	0.834
지성/야성/자연/변형	10	9	유일	치명타 저항	10	20	flat	0.834
지성/야성/자연/변형	10	9	유일	막기	20	40	flat	0.834
지성/야성/자연/변형	10	9	유일	후방 치명타	16	32	flat	0.834
지성/야성/자연/변형	10	9	유일	후방 치명타 저항	15	30	flat	0.834
지성/야성/자연/변형	10	9	유일	생명력	70	140	flat	0.834
지성/야성/자연/변형	10	9	유일	정신력	35	70	flat	0.834
지성/야성/자연/변형	10	6	영웅	피해내성	1.2	2.4	%	0.2775
지성/야성/자연/변형	10	6	영웅	철벽	1.2	2.4	%	0.2775
지성/야성/자연/변형	10	6	영웅	재생	1.2	2.4	%	0.2775
지성/야성/자연/변형	10	6	영웅	지성쪽 피해 내성	2.4	4.8	%	0.2775
지성/야성/자연/변형	10	6	영웅	무기 피해 내성	1.2	2.4	%	0.2775
지성/야성/자연/변형	10	6	영웅	치명타 피해 내성	1.3	2.6	%	0.2775
지성/야성/자연/변형	10	6	영웅	후방 피해 내성	1.3	2.6	%	0.2775
지성/야성/자연/변형	10	6	영웅	PVE 피해 내성	1.5	3	%	0.2775
지성/야성/자연/변형	10	6	영웅	추가 명중	20	40	flat	0.278
지성/야성/자연/변형	10	6	영웅	치명타	15	30	flat	0.278
지성/야성/자연/변형	10	6	영웅	보스 공격력	10	20	flat	0.278
지성/야성/자연/변형	10	6	영웅	추가 회피	20	40	flat	0.278
지성/야성/자연/변형	10	6	영웅	치명타 저항	15	30	flat	0.278
지성/야성/자연/변형	10	6	영웅	막기	25	50	flat	0.278
지성/야성/자연/변형	10	6	영웅	후방 치명타	25	50	flat	0.278
지성/야성/자연/변형	10	6	영웅	후방 치명타 저항	20	40	flat	0.278
지성/야성/자연/변형	10	6	영웅	생명력	100	200	flat	0.278
지성/야성/자연/변형	10	6	영웅	정신력	50	100	flat	0.278
지성/야성/자연/변형	10	6	유일	피해내성	0.9	1.8	%	0.8325
지성/야성/자연/변형	10	6	유일	철벽	0.9	1.8	%	0.8325
지성/야성/자연/변형	10	6	유일	재생	0.9	1.8	%	0.8325
지성/야성/자연/변형	10	6	유일	지성쪽 피해 내성	2	4	%	0.8325
지성/야성/자연/변형	10	6	유일	무기 피해 내성	0.9	1.8	%	0.8325
지성/야성/자연/변형	10	6	유일	치명타 피해 내성	1	2	%	0.8325
지성/야성/자연/변형	10	6	유일	후방 피해 내성	1	2	%	0.8325
지성/야성/자연/변형	10	6	유일	PVE 피해 내성	1.2	2.4	%	0.8325
지성/야성/자연/변형	10	6	유일	추가 명중	17	34	flat	0.834
지성/야성/자연/변형	10	6	유일	치명타	10	20	flat	0.834
지성/야성/자연/변형	10	6	유일	보스 공격력	8	16	flat	0.834
지성/야성/자연/변형	10	6	유일	추가 회피	15	30	flat	0.834
지성/야성/자연/변형	10	6	유일	치명타 저항	10	20	flat	0.834
지성/야성/자연/변형	10	6	유일	막기	20	40	flat	0.834
지성/야성/자연/변형	10	6	유일	후방 치명타	16	32	flat	0.834
지성/야성/자연/변형	10	6	유일	후방 치명타 저항	15	30	flat	0.834
지성/야성/자연/변형	10	6	유일	생명력	70	140	flat	0.834
지성/야성/자연/변형	10	6	유일	정신력	35	70	flat	0.834
특수	9	1	영웅	추가 공격력	8	16	flat	0.1111
특수	9	1	영웅	최대 공격력	10	20	flat	0.1111
특수	9	1	영웅	관통	80	160	flat	0.1111
특수	9	1	영웅	봉혼석 추가 피해	8	16	flat	0.1111
특수	9	1	영웅	치명타 공격력	10	20	flat	0.1111
특수	9	1	영웅	후방 공격력	10	20	flat	0.1111
특수	9	1	영웅	PVE 공격력	10	20	flat	0.1111
특수	9	1	영웅	생명력	100	200	flat	0.1111
특수	9	1	영웅	정신력	50	100	flat	0.1112
특수	9	2	영웅	추가 공격력	8	16	flat	0.1111
특수	9	2	영웅	최대 공격력	10	20	flat	0.1111
특수	9	2	영웅	관통	80	160	flat	0.1111
특수	9	2	영웅	봉혼석 추가 피해	8	16	flat	0.1111
특수	9	2	영웅	치명타 공격력	10	20	flat	0.1111
특수	9	2	영웅	후방 공격력	10	20	flat	0.1111
특수	9	2	영웅	PVE 공격력	10	20	flat	0.1111
특수	9	2	영웅	생명력	100	200	flat	0.1111
특수	9	2	영웅	정신력	50	100	flat	0.1112
특수	9	4	영웅	추가 공격력	8	16	flat	0.1111
특수	9	4	영웅	최대 공격력	10	20	flat	0.1111
특수	9	4	영웅	관통	80	160	flat	0.1111
특수	9	4	영웅	봉혼석 추가 피해	8	16	flat	0.1111
특수	9	4	영웅	치명타 공격력	10	20	flat	0.1111
특수	9	4	영웅	후방 공격력	10	20	flat	0.1111
특수	9	4	영웅	PVE 공격력	10	20	flat	0.1111
특수	9	4	영웅	생명력	100	200	flat	0.1111
특수	9	4	영웅	정신력	50	100	flat	0.1112
특수	9	5	영웅	추가 공격력	8	16	flat	0.1111
특수	9	5	영웅	최대 공격력	10	20	flat	0.1111
특수	9	5	영웅	관통	80	160	flat	0.1111
특수	9	5	영웅	봉혼석 추가 피해	8	16	flat	0.1111
특수	9	5	영웅	치명타 공격력	10	20	flat	0.1111
특수	9	5	영웅	후방 공격력	10	20	flat	0.1111
특수	9	5	영웅	PVE 공격력	10	20	flat	0.1111
특수	9	5	영웅	생명력	100	200	flat	0.1111
특수	9	5	영웅	정신력	50	100	flat	0.1112
특수	9	7	영웅	추가 공격력	8	16	flat	0.1111
특수	9	7	영웅	최대 공격력	10	20	flat	0.1111
특수	9	7	영웅	관통	80	160	flat	0.1111
특수	9	7	영웅	봉혼석 추가 피해	8	16	flat	0.1111
특수	9	7	영웅	치명타 공격력	10	20	flat	0.1111
특수	9	7	영웅	후방 공격력	10	20	flat	0.1111
특수	9	7	영웅	PVE 공격력	10	20	flat	0.1111
특수	9	7	영웅	생명력	100	200	flat	0.1111
특수	9	7	영웅	정신력	50	100	flat	0.1112
특수	9	8	영웅	추가 공격력	8	16	flat	0.1111
특수	9	8	영웅	최대 공격력	10	20	flat	0.1111
특수	9	8	영웅	관통	80	160	flat	0.1111
특수	9	8	영웅	봉혼석 추가 피해	8	16	flat	0.1111
특수	9	8	영웅	치명타 공격력	10	20	flat	0.1111
특수	9	8	영웅	후방 공격력	10	20	flat	0.1111
특수	9	8	영웅	PVE 공격력	10	20	flat	0.1111
특수	9	8	영웅	생명력	100	200	flat	0.1111
특수	9	8	영웅	정신력	50	100	flat	0.1112
특수	9	1	유일	추가 공격력	6	12	flat	1.111
특수	9	1	유일	최대 공격력	8	16	flat	1.111
특수	9	1	유일	관통	60	120	flat	1.111
특수	9	1	유일	봉혼석 추가 피해	6	12	flat	1.111
특수	9	1	유일	치명타 공격력	8	16	flat	1.111
특수	9	1	유일	후방 공격력	8	16	flat	1.111
특수	9	1	유일	PVE 공격력	8	16	flat	1.111
특수	9	1	유일	생명력	70	140	flat	1.111
특수	9	1	유일	정신력	35	70	flat	1.112
특수	9	2	유일	추가 공격력	6	12	flat	1.111
특수	9	2	유일	최대 공격력	8	16	flat	1.111
특수	9	2	유일	관통	60	120	flat	1.111
특수	9	2	유일	봉혼석 추가 피해	6	12	flat	1.111
특수	9	2	유일	치명타 공격력	8	16	flat	1.111
특수	9	2	유일	후방 공격력	8	16	flat	1.111
특수	9	2	유일	PVE 공격력	8	16	flat	1.111
특수	9	2	유일	생명력	70	140	flat	1.111
특수	9	2	유일	정신력	35	70	flat	1.112
특수	9	4	유일	추가 공격력	6	12	flat	1.111
특수	9	4	유일	최대 공격력	8	16	flat	1.111
특수	9	4	유일	관통	60	120	flat	1.111
특수	9	4	유일	봉혼석 추가 피해	6	12	flat	1.111
특수	9	4	유일	치명타 공격력	8	16	flat	1.111
특수	9	4	유일	후방 공격력	8	16	flat	1.111
특수	9	4	유일	PVE 공격력	8	16	flat	1.111
특수	9	4	유일	생명력	70	140	flat	1.111
특수	9	4	유일	정신력	35	70	flat	1.112
특수	9	5	유일	추가 공격력	6	12	flat	1.111
특수	9	5	유일	최대 공격력	8	16	flat	1.111
특수	9	5	유일	관통	60	120	flat	1.111
특수	9	5	유일	봉혼석 추가 피해	6	12	flat	1.111
특수	9	5	유일	치명타 공격력	8	16	flat	1.111
특수	9	5	유일	후방 공격력	8	16	flat	1.111
특수	9	5	유일	PVE 공격력	8	16	flat	1.111
특수	9	5	유일	생명력	70	140	flat	1.111
특수	9	5	유일	정신력	35	70	flat	1.112
특수	9	7	유일	추가 공격력	6	12	flat	1.111
특수	9	7	유일	최대 공격력	8	16	flat	1.111
특수	9	7	유일	관통	60	120	flat	1.111
특수	9	7	유일	봉혼석 추가 피해	6	12	flat	1.111
특수	9	7	유일	치명타 공격력	8	16	flat	1.111
특수	9	7	유일	후방 공격력	8	16	flat	1.111
특수	9	7	유일	PVE 공격력	8	16	flat	1.111
특수	9	7	유일	생명력	70	140	flat	1.111
특수	9	7	유일	정신력	35	70	flat	1.112
특수	9	8	유일	추가 공격력	6	12	flat	1.111
특수	9	8	유일	최대 공격력	8	16	flat	1.111
특수	9	8	유일	관통	60	120	flat	1.111
특수	9	8	유일	봉혼석 추가 피해	6	12	flat	1.111
특수	9	8	유일	치명타 공격력	8	16	flat	1.111
특수	9	8	유일	후방 공격력	8	16	flat	1.111
특수	9	8	유일	PVE 공격력	8	16	flat	1.111
특수	9	8	유일	생명력	70	140	flat	1.111
특수	9	8	유일	정신력	35	70	flat	1.112
특수	9	3	영웅	관통	80	160	flat	0.1
특수	9	3	영웅	피해 증폭	1.2	2.4	%	0.1
특수	9	3	영웅	강타	1.2	2.4	%	0.1
특수	9	3	영웅	완벽	1.2	2.4	%	0.1
특수	9	3	영웅	무기 피해 증폭	1.2	2.4	%	0.1
특수	9	3	영웅	치명타 피해 증폭	1.5	3	%	0.1
특수	9	3	영웅	후방 피해 증폭	1.5	3	%	0.1
특수	9	3	영웅	PVE 피해 증폭	1.5	3	%	0.1
특수	9	3	영웅	생명력	100	200	flat	0.1
특수	9	3	영웅	정신력	50	100	flat	0.1
특수	9	9	영웅	관통	80	160	flat	0.1
특수	9	9	영웅	피해 증폭	1.2	2.4	%	0.1
특수	9	9	영웅	강타	1.2	2.4	%	0.1
특수	9	9	영웅	완벽	1.2	2.4	%	0.1
특수	9	9	영웅	무기 피해 증폭	1.2	2.4	%	0.1
특수	9	9	영웅	치명타 피해 증폭	1.5	3	%	0.1
특수	9	9	영웅	후방 피해 증폭	1.5	3	%	0.1
특수	9	9	영웅	PVE 피해 증폭	1.5	3	%	0.1
특수	9	9	영웅	생명력	100	200	flat	0.1
특수	9	9	영웅	정신력	50	100	flat	0.1
특수	9	3	유일	관통	60	120	flat	1
특수	9	3	유일	피해 증폭	0.9	1.8	%	1
특수	9	3	유일	강타	0.9	1.8	%	1
특수	9	3	유일	완벽	0.9	1.8	%	1
특수	9	3	유일	무기 피해 증폭	0.9	1.8	%	1
특수	9	3	유일	치명타 피해 증폭	1.2	2.4	%	1
특수	9	3	유일	후방 피해 증폭	1.2	2.4	%	1
특수	9	3	유일	PVE 피해 증폭	1.2	2.4	%	1
특수	9	3	유일	생명력	70	140	flat	1
특수	9	3	유일	정신력	35	70	flat	1
특수	9	9	유일	관통	60	120	flat	1
특수	9	9	유일	피해 증폭	0.9	1.8	%	1
특수	9	9	유일	강타	0.9	1.8	%	1
특수	9	9	유일	완벽	0.9	1.8	%	1
특수	9	9	유일	무기 피해 증폭	0.9	1.8	%	1
특수	9	9	유일	치명타 피해 증폭	1.2	2.4	%	1
특수	9	9	유일	후방 피해 증폭	1.2	2.4	%	1
특수	9	9	유일	PVE 피해 증폭	1.2	2.4	%	1
특수	9	9	유일	생명력	70	140	flat	1
특수	9	9	유일	정신력	35	70	flat	1
특수	9	6	영웅	관통	80	160	flat	0.1
특수	9	6	영웅	피해 내성	1.2	2.4	%	0.1
특수	9	6	영웅	철벽	1.2	2.4	%	0.1
특수	9	6	영웅	재생	1.2	2.4	%	0.1
특수	9	6	영웅	무기 피해 내성	1.2	2.4	%	0.1
특수	9	6	영웅	치명타 피해 내성	1.3	2.6	%	0.1
특수	9	6	영웅	후방 피해 내성	1.3	2.6	%	0.1
특수	9	6	영웅	PVE피해 내성	1.5	3	%	0.1
특수	9	6	영웅	생명력	100	200	flat	0.1
특수	9	6	영웅	정신력	50	100	flat	0.1
특수	9	6	유일	관통	60	120	flat	1
특수	9	6	유일	피해 내성	0.9	1.8	%	1
특수	9	6	유일	철벽	0.9	1.8	%	1
특수	9	6	유일	재생	0.9	1.8	%	1
특수	9	6	유일	무기 피해 내성	0.9	1.8	%	1
특수	9	6	유일	치명타 피해 내성	1	2	%	1
특수	9	6	유일	후방 피해 내성	1	2	%	1
특수	9	6	유일	PVE피해 내성	1.2	2.4	%	1
특수	9	6	유일	생명력	70	140	flat	1
특수	9	6	유일	정신력	35	70	flat	1
특수	10	1	영웅	추가 공격력	8	16	flat	0.5555
특수	10	1	영웅	최대 공격력	10	20	flat	0.5555
특수	10	1	영웅	관통	80	160	flat	0.5555
특수	10	1	영웅	봉혼석 추가 피해	8	16	flat	0.5555
특수	10	1	영웅	치명타 공격력	10	20	flat	0.5555
특수	10	1	영웅	후방 공격력	10	20	flat	0.5555
특수	10	1	영웅	PVE 공격력	10	20	flat	0.5555
특수	10	1	영웅	생명력	100	200	flat	0.5555
특수	10	1	영웅	정신력	50	100	flat	0.556
특수	10	2	영웅	추가 공격력	8	16	flat	0.5555
특수	10	2	영웅	최대 공격력	10	20	flat	0.5555
특수	10	2	영웅	관통	80	160	flat	0.5555
특수	10	2	영웅	봉혼석 추가 피해	8	16	flat	0.5555
특수	10	2	영웅	치명타 공격력	10	20	flat	0.5555
특수	10	2	영웅	후방 공격력	10	20	flat	0.5555
특수	10	2	영웅	PVE 공격력	10	20	flat	0.5555
특수	10	2	영웅	생명력	100	200	flat	0.5555
특수	10	2	영웅	정신력	50	100	flat	0.556
특수	10	4	영웅	추가 공격력	8	16	flat	0.5555
특수	10	4	영웅	최대 공격력	10	20	flat	0.5555
특수	10	4	영웅	관통	80	160	flat	0.5555
특수	10	4	영웅	봉혼석 추가 피해	8	16	flat	0.5555
특수	10	4	영웅	치명타 공격력	10	20	flat	0.5555
특수	10	4	영웅	후방 공격력	10	20	flat	0.5555
특수	10	4	영웅	PVE 공격력	10	20	flat	0.5555
특수	10	4	영웅	생명력	100	200	flat	0.5555
특수	10	4	영웅	정신력	50	100	flat	0.556
특수	10	5	영웅	추가 공격력	8	16	flat	0.5555
특수	10	5	영웅	최대 공격력	10	20	flat	0.5555
특수	10	5	영웅	관통	80	160	flat	0.5555
특수	10	5	영웅	봉혼석 추가 피해	8	16	flat	0.5555
특수	10	5	영웅	치명타 공격력	10	20	flat	0.5555
특수	10	5	영웅	후방 공격력	10	20	flat	0.5555
특수	10	5	영웅	PVE 공격력	10	20	flat	0.5555
특수	10	5	영웅	생명력	100	200	flat	0.5555
특수	10	5	영웅	정신력	50	100	flat	0.556
특수	10	7	영웅	추가 공격력	8	16	flat	0.5555
특수	10	7	영웅	최대 공격력	10	20	flat	0.5555
특수	10	7	영웅	관통	80	160	flat	0.5555
특수	10	7	영웅	봉혼석 추가 피해	8	16	flat	0.5555
특수	10	7	영웅	치명타 공격력	10	20	flat	0.5555
특수	10	7	영웅	후방 공격력	10	20	flat	0.5555
특수	10	7	영웅	PVE 공격력	10	20	flat	0.5555
특수	10	7	영웅	생명력	100	200	flat	0.5555
특수	10	7	영웅	정신력	50	100	flat	0.556
특수	10	8	영웅	추가 공격력	8	16	flat	0.5555
특수	10	8	영웅	최대 공격력	10	20	flat	0.5555
특수	10	8	영웅	관통	80	160	flat	0.5555
특수	10	8	영웅	봉혼석 추가 피해	8	16	flat	0.5555
특수	10	8	영웅	치명타 공격력	10	20	flat	0.5555
특수	10	8	영웅	후방 공격력	10	20	flat	0.5555
특수	10	8	영웅	PVE 공격력	10	20	flat	0.5555
특수	10	8	영웅	생명력	100	200	flat	0.5555
특수	10	8	영웅	정신력	50	100	flat	0.556
특수	10	1	유일	추가 공격력	6	12	flat	1.6665
특수	10	1	유일	최대 공격력	8	16	flat	1.6665
특수	10	1	유일	관통	60	120	flat	1.6665
특수	10	1	유일	봉혼석 추가 피해	6	12	flat	1.6665
특수	10	1	유일	치명타 공격력	8	16	flat	1.6665
특수	10	1	유일	후방 공격력	8	16	flat	1.6665
특수	10	1	유일	PVE 공격력	8	16	flat	1.6665
특수	10	1	유일	생명력	70	140	flat	1.6665
특수	10	1	유일	정신력	35	70	flat	1.668
특수	10	2	유일	추가 공격력	6	12	flat	1.6665
특수	10	2	유일	최대 공격력	8	16	flat	1.6665
특수	10	2	유일	관통	60	120	flat	1.6665
특수	10	2	유일	봉혼석 추가 피해	6	12	flat	1.6665
특수	10	2	유일	치명타 공격력	8	16	flat	1.6665
특수	10	2	유일	후방 공격력	8	16	flat	1.6665
특수	10	2	유일	PVE 공격력	8	16	flat	1.6665
특수	10	2	유일	생명력	70	140	flat	1.6665
특수	10	2	유일	정신력	35	70	flat	1.668
특수	10	4	유일	추가 공격력	6	12	flat	1.6665
특수	10	4	유일	최대 공격력	8	16	flat	1.6665
특수	10	4	유일	관통	60	120	flat	1.6665
특수	10	4	유일	봉혼석 추가 피해	6	12	flat	1.6665
특수	10	4	유일	치명타 공격력	8	16	flat	1.6665
특수	10	4	유일	후방 공격력	8	16	flat	1.6665
특수	10	4	유일	PVE 공격력	8	16	flat	1.6665
특수	10	4	유일	생명력	70	140	flat	1.6665
특수	10	4	유일	정신력	35	70	flat	1.668
특수	10	5	유일	추가 공격력	6	12	flat	1.6665
특수	10	5	유일	최대 공격력	8	16	flat	1.6665
특수	10	5	유일	관통	60	120	flat	1.6665
특수	10	5	유일	봉혼석 추가 피해	6	12	flat	1.6665
특수	10	5	유일	치명타 공격력	8	16	flat	1.6665
특수	10	5	유일	후방 공격력	8	16	flat	1.6665
특수	10	5	유일	PVE 공격력	8	16	flat	1.6665
특수	10	5	유일	생명력	70	140	flat	1.6665
특수	10	5	유일	정신력	35	70	flat	1.668
특수	10	7	유일	추가 공격력	6	12	flat	1.6665
특수	10	7	유일	최대 공격력	8	16	flat	1.6665
특수	10	7	유일	관통	60	120	flat	1.6665
특수	10	7	유일	봉혼석 추가 피해	6	12	flat	1.6665
특수	10	7	유일	치명타 공격력	8	16	flat	1.6665
특수	10	7	유일	후방 공격력	8	16	flat	1.6665
특수	10	7	유일	PVE 공격력	8	16	flat	1.6665
특수	10	7	유일	생명력	70	140	flat	1.6665
특수	10	7	유일	정신력	35	70	flat	1.668
특수	10	8	유일	추가 공격력	6	12	flat	1.6665
특수	10	8	유일	최대 공격력	8	16	flat	1.6665
특수	10	8	유일	관통	60	120	flat	1.6665
특수	10	8	유일	봉혼석 추가 피해	6	12	flat	1.6665
특수	10	8	유일	치명타 공격력	8	16	flat	1.6665
특수	10	8	유일	후방 공격력	8	16	flat	1.6665
특수	10	8	유일	PVE 공격력	8	16	flat	1.6665
특수	10	8	유일	생명력	70	140	flat	1.6665
특수	10	8	유일	정신력	35	70	flat	1.668
특수	10	3	영웅	관통	80	160	flat	0.5
특수	10	3	영웅	피해 증폭	1.2	2.4	%	0.5
특수	10	3	영웅	강타	1.2	2.4	%	0.5
특수	10	3	영웅	완벽	1.2	2.4	%	0.5
특수	10	3	영웅	무기 피해 증폭	1.2	2.4	%	0.5
특수	10	3	영웅	치명타 피해 증폭	1.5	3	%	0.5
특수	10	3	영웅	후방 피해 증폭	1.5	3	%	0.5
특수	10	3	영웅	PVE 피해 증폭	1.5	3	%	0.5
특수	10	3	영웅	생명력	100	200	flat	0.5
특수	10	3	영웅	정신력	50	100	flat	0.5
특수	10	9	영웅	관통	80	160	flat	0.5
특수	10	9	영웅	피해 증폭	1.2	2.4	%	0.5
특수	10	9	영웅	강타	1.2	2.4	%	0.5
특수	10	9	영웅	완벽	1.2	2.4	%	0.5
특수	10	9	영웅	무기 피해 증폭	1.2	2.4	%	0.5
특수	10	9	영웅	치명타 피해 증폭	1.5	3	%	0.5
특수	10	9	영웅	후방 피해 증폭	1.5	3	%	0.5
특수	10	9	영웅	PVE 피해 증폭	1.5	3	%	0.5
특수	10	9	영웅	생명력	100	200	flat	0.5
특수	10	9	영웅	정신력	50	100	flat	0.5
특수	10	3	유일	관통	60	120	flat	1.5
특수	10	3	유일	피해 증폭	0.9	1.8	%	1.5
특수	10	3	유일	강타	0.9	1.8	%	1.5
특수	10	3	유일	완벽	0.9	1.8	%	1.5
특수	10	3	유일	무기 피해 증폭	0.9	1.8	%	1.5
특수	10	3	유일	치명타 피해 증폭	1.2	2.4	%	1.5
특수	10	3	유일	후방 피해 증폭	1.2	2.4	%	1.5
특수	10	3	유일	PVE 피해 증폭	1.2	2.4	%	1.5
특수	10	3	유일	생명력	70	140	flat	1.5
특수	10	3	유일	정신력	35	70	flat	1.5
특수	10	9	유일	관통	60	120	flat	1.5
특수	10	9	유일	피해 증폭	0.9	1.8	%	1.5
특수	10	9	유일	강타	0.9	1.8	%	1.5
특수	10	9	유일	완벽	0.9	1.8	%	1.5
특수	10	9	유일	무기 피해 증폭	0.9	1.8	%	1.5
특수	10	9	유일	치명타 피해 증폭	1.2	2.4	%	1.5
특수	10	9	유일	후방 피해 증폭	1.2	2.4	%	1.5
특수	10	9	유일	PVE 피해 증폭	1.2	2.4	%	1.5
특수	10	9	유일	생명력	70	140	flat	1.5
특수	10	9	유일	정신력	35	70	flat	1.5
특수	10	6	영웅	관통	80	160	flat	0.5
특수	10	6	영웅	피해 내성	1.2	2.4	%	0.5
특수	10	6	영웅	철벽	1.2	2.4	%	0.5
특수	10	6	영웅	재생	1.2	2.4	%	0.5
특수	10	6	영웅	무기 피해 내성	1.2	2.4	%	0.5
특수	10	6	영웅	치명타 피해 내성	1.3	2.6	%	0.5
특수	10	6	영웅	후방 피해 내성	1.3	2.6	%	0.5
특수	10	6	영웅	PVE피해 내성	1.5	3	%	0.5
특수	10	6	영웅	생명력	100	200	flat	0.5
특수	10	6	영웅	정신력	50	100	flat	0.5
특수	10	6	유일	관통	60	120	flat	1.5
특수	10	6	유일	피해 내성	0.9	1.8	%	1.5
특수	10	6	유일	철벽	0.9	1.8	%	1.5
특수	10	6	유일	재생	0.9	1.8	%	1.5
특수	10	6	유일	무기 피해 내성	0.9	1.8	%	1.5
특수	10	6	유일	치명타 피해 내성	1	2	%	1.5
특수	10	6	유일	후방 피해 내성	1	2	%	1.5
특수	10	6	유일	PVE피해 내성	1.2	2.4	%	1.5
특수	10	6	유일	생명력	70	140	flat	1.5
특수	10	6	유일	정신력	35	70	flat	1.5
							
`;

   

// =========================================================================
// 🌟 [1] 아이템 JSON DB 전역 로드 (0.01초 최적화 & 더미 장비 차단)
// =========================================================================
let globalItemDB = [];
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('/db.json'); 
        let rawDB = await res.json();
        
        // 🚀 "sources"가 아예 없거나 빈 배열인 미구현/더미 장비를 여기서 완벽하게 쳐냅니다!
        globalItemDB = rawDB.filter(item => item.sources && item.sources.length > 0);
        
        console.log(`✅ 초고속 자체 아이템 DB 로드 완료! (총 ${globalItemDB.length}개 유효 장비 장전됨)`);
    } catch(e) {
        console.error("아이템 DB 파일(db.json)을 찾을 수 없습니다.");
    }
});

async function runAutoOptimization() {
    if (typeof currentEquipData === 'undefined' || currentEquipData.length === 0) return alert("먼저 상단 검색창에서 내 캐릭터를 검색하세요!");
    if (globalItemDB.length === 0) return alert("아이템 DB를 불러오지 못했습니다. (db.json 확인)");

    const checkedSlots = Array.from(document.querySelectorAll('.opt-eq-chk:checked')).map(cb => parseInt(cb.value));
    if (checkedSlots.length === 0) return alert("변경을 허용할 장비 부위를 1개 이상 체크해주세요!");

    const goal = document.getElementById('optGoal').value;
    const targetVal = parseFloat(document.getElementById('optTargetVal').value) || 0;
    const budgetRule = document.getElementById('optBudget').value; 
    
    const fUnique = document.getElementById('optFilterUnique').checked;
    const fHero = document.getElementById('optFilterHero').checked;
    const fAbyss = document.getElementById('optFilterAbyss').checked;
    const fCraft = document.getElementById('optFilterCraft').checked;
    const fDungeon = document.getElementById('optFilterDungeon').checked;

    const resultArea = document.getElementById('optResultArea');
    resultArea.style.display = "block";
    resultArea.innerHTML = `<div style='text-align:center; color:#00e676; padding: 40px 0; font-size:16px; font-weight:bold;'>⚡ 유력한 최적 장비들의 정밀 스탯을 분석 중입니다... ⏳<br><span style='font-size:12px; color:#aaa; font-weight:normal;'>(상위 후보 5개씩 스캔 중.)</span></div>`;

    try {
        let slotCandidatesArray = [];
        let currentCP = parseInt(document.getElementById('baseCp').value) || 0;
        let bAtk = parseFloat(document.getElementById('baseAtk').value)||1600;
        let bAmp = parseFloat(document.getElementById('baseAmp').value)||0;
        let bPveAmp = parseFloat(document.getElementById('basePveAmp').value)||0;
        let bPvpAmp = parseFloat(document.getElementById('basePvpAmp').value)||0;
        let bDef = parseFloat(document.getElementById('baseDef').value)||2000;
        
        let basePveScore = bAtk + (bPveAmp*15) + (bAmp*15);
        let basePvpScore = bAtk + (bPvpAmp*15) + (bAmp*15);
        let baseSurvScore = bDef + (parseFloat(document.getElementById('baseHp').value)||10000)*0.1;

        const apiBaseUrl = typeof API_BASE !== 'undefined' ? API_BASE : '/api';

        for (let slotIdx of checkedSlots) {
            const oldEq = currentEquipData[slotIdx];
            const catObj = getSmartCategory(oldEq);
            if (!catObj) continue;

            // 1차: 10초짜리 내장 DB에서 조건에 맞는 후보를 0.01초 만에 추려냅니다.
            let candidates = globalItemDB.filter(item => {
                let itCat = getSmartCategory(item);
                if (!itCat || itCat.key !== catObj.key) return false;
                let passGrade = (fUnique && item.grade === 'Unique') || (fHero && (item.grade === 'Hero' || item.grade === 'Epic'));
                if (!passGrade) return false;
                
                let itemSources = item.sources || [];
                let passSource = false;
                if (fAbyss && itemSources.includes('교환 상점')) passSource = true;
                if (fCraft && itemSources.includes('제작')) passSource = true;
                if (fDungeon && (itemSources.includes('원정') || itemSources.includes('성역'))) passSource = true;
                if(!fAbyss && !fCraft && !fDungeon) return false; 
                if(itemSources.length > 0 && !passSource) return false; 
                return true;
            });

            let getLv = x => parseInt(x.level || x.itemLevel || x.equipLevel || 0);
            candidates.sort((a, b) => getLv(b) - getLv(a));
            
            // 🔥 핵심: 가장 좋은 상위 5개 후보만 쏙 뽑아냅니다.
            let topCands = candidates.slice(0, 5);

            let oldBaseCp = calculateNewItemCP(oldEq, oldEq.enchantLevel || 0, oldEq.exceedLevel || 0);
            let oldBaseStats = extractBaseStats(oldEq, oldEq.exceedLevel || 0).total;

            let processedCands = [];
            processedCands.push({
                isKeep: true, oldName: oldEq.name, oldEnh: oldEq.enchantLevel||0, grade: oldEq.grade, brk: oldEq.exceedLevel||0,
                cpDiff: 0, pveDiff: 0, pvpDiff: 0, survDiff: 0
            });

            // 2차: 뽑아낸 5개의 후보만 대표님 서버에 물어봐서 진짜 스탯(알맹이)을 채워 넣습니다!
            let detailPromises = topCands.map(cand => {
                let enh = budgetRule === 'inherit' ? (oldEq.enchantLevel || 0) : parseInt(budgetRule);
                let brk = oldEq.exceedLevel || 0; 
                return fetch(`${apiBaseUrl}/getDictItemDetail?id=${cand.id}&enchantLevel=${enh}&exceedLevel=${brk}`)
                    .then(r => r.ok ? r.json() : null)
                    .then(detail => ({ detail, enh, brk, summary: cand }))
                    .catch(e => null);
            });

            let detailResults = await Promise.all(detailPromises);

            for (let res of detailResults) {
                // NC 서버 버그(응룡왕 등)로 스탯이 안 온 아이템은 알아서 쿨하게 버립니다!
                if (!res || !res.detail || !res.detail.mainStats) continue;

                let candDetail = res.detail;
                let enh = res.enh;
                let brk = res.brk;
                let candSum = res.summary;

                let nCp = calculateNewItemCP(candDetail, enh, brk);
                let nStats = extractBaseStats(candDetail, brk).total;

                let cpDiff = nCp - oldBaseCp; 
                let oPveAtk = (oldBaseStats.atk||0) + (oldBaseStats.pveAmp||0)*15 + (oldBaseStats.amp||0)*15;
                let nPveAtk = (nStats.atk||0) + (nStats.pveAmp||0)*15 + (nStats.amp||0)*15;
                let pveDiff = nPveAtk - oPveAtk;

                let oPvpAtk = (oldBaseStats.atk||0) + (oldBaseStats.pvpAmp||0)*15 + (oldBaseStats.amp||0)*15;
                let nPvpAtk = (nStats.atk||0) + (nStats.pvpAmp||0)*15 + (nStats.amp||0)*15;
                let pvpDiff = nPvpAtk - oPvpAtk;

                let oDef = (oldBaseStats.def||0) + (oldBaseStats.hp||0)*0.1;
                let nDef = (nStats.def||0) + (nStats.hp||0)*0.1;
                let survDiff = nDef - oDef;

                if (cpDiff > 0 || pveDiff > 0 || pvpDiff > 0 || survDiff > 0) {
                    processedCands.push({
                        isKeep: false, slotIdx: slotIdx, oldName: oldEq.name, oldEnh: oldEq.enchantLevel || 0,
                        newItem: candSum, newEnh: enh, brk: brk, cpDiff, pveDiff, pvpDiff, survDiff
                    });
                }
            }
            slotCandidatesArray.push(processedCands);
        }

        // 3차: 경우의 수를 모두 따져서 가성비 조합 찾기
        let allCombinations = [];
        function buildCombos(idx, currentCombo) {
            if (idx === slotCandidatesArray.length) {
                allCombinations.push([...currentCombo]);
                return;
            }
            for (let c of slotCandidatesArray[idx]) {
                currentCombo.push(c);
                buildCombos(idx+1, currentCombo);
                currentCombo.pop();
            }
        }
        buildCombos(0, []);

        let validCombos = [];
        let bestMaxCombo = null;
        let bestMaxScore = -999999;

        for (let combo of allCombinations) {
            let tCp = 0, tPve = 0, tPvp = 0, tSurv = 0, changes = 0;
            for (let c of combo) {
                if (!c.isKeep) changes++;
                tCp += c.cpDiff; tPve += c.pveDiff; tPvp += c.pvpDiff; tSurv += c.survDiff;
            }

            let isPass = false;
            let score = 0;

            if (goal === 'cp') {
                score = currentCP + tCp;
                if (score >= targetVal) isPass = true;
            } else if (goal === 'pve') {
                score = tPve;
                let reqDelta = basePveScore * (targetVal / 100); 
                if (tPve >= reqDelta) isPass = true;
            } else if (goal === 'pvp') {
                score = tPvp;
                let reqDelta = basePvpScore * (targetVal / 100);
                if (tPvp >= reqDelta) isPass = true;
            } else if (goal === 'survive') {
                score = tSurv;
                let reqDelta = baseSurvScore * (targetVal / 100);
                if (tSurv >= reqDelta) isPass = true;
            }

            let comboData = { combo, changes, score, tCp, tPve, tPvp, tSurv };
            if (isPass) validCombos.push(comboData);
            
            if (score > bestMaxScore) {
                bestMaxScore = score;
                bestMaxCombo = comboData;
            }
        }

        let winner = null;
        let isForcedMax = false; 
        
        if (validCombos.length > 0) {
            validCombos.sort((a, b) => {
                if (a.changes !== b.changes) return a.changes - b.changes; 
                return a.score - b.score; 
            });
            winner = validCombos[0];
        } else {
            winner = bestMaxCombo; 
            isForcedMax = true;
        }

        // 4차: 화면에 예쁘게 그려주기
        let finalCP = currentCP + winner.tCp;
        let targetAchievedHtml = '';
        if (goal === 'cp') {
            if (!isForcedMax) targetAchievedHtml = `<span style="color:#00e676; font-size:12px; font-weight:bold;">(목표 달성 ✅)</span>`;
            else targetAchievedHtml = `<span style="color:#ff5252; font-size:12px; font-weight:bold;">(달성 실패 ❌ 예산 내 최대치 추천)</span>`;
        } else {
            if (!isForcedMax) targetAchievedHtml = `<span style="color:#00e676; font-size:12px; font-weight:bold;">(상승률 달성 ✅)</span>`;
            else targetAchievedHtml = `<span style="color:#ff5252; font-size:12px; font-weight:bold;">(달성 실패 ❌ 예산 내 최대치 추천)</span>`;
        }

        let html = `
        <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom:1px dashed #333; padding-bottom:15px; margin-bottom:15px;">
            <div>
                <h3 style="color:#00e676; margin:0 0 5px 0;">⚡ ${winner.changes}개 부위 교체 가성비 조합 발견!</h3>
                <div style="font-size:12px; color:#aaa;">상위 후보의 스탯을 직접 비교하여 찾아낸 결과입니다.</div>
            </div>
            <div style="text-align:right; background:#111; padding:10px 15px; border-radius:6px; border:1px solid #444;">
                <div style="font-size:11px; color:#888;">총 전투력 변화 ${targetAchievedHtml}</div>
                <div style="font-size:18px; font-weight:bold;">
                    <span style="color:#ccc;">${currentCP.toLocaleString()}</span> ➡ <span style="color:#00e676;">${finalCP.toLocaleString()}</span> 
                    <span style="font-size:12px; color:#00e676;">(${winner.tCp >= 0 ? '▲' : '▼'} ${Math.abs(winner.tCp)})</span>
                </div>
            </div>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
        `;

        winner.combo.forEach((rec) => {
            if (rec.isKeep) {
                let diamondsHtml = ''; 
                for (let i = 0; i < 5; i++) diamondsHtml += `<span style="display:inline-block; width:6px; height:6px; margin-right:2px; background:${i < rec.brk ? '#ffca28' : '#333'}; transform:rotate(45deg); border:1px solid #555;"></span>`;

                html += `
                <div style="background:#111; padding:15px; border-radius:8px; border:1px solid #333; opacity: 0.8;">
                    <div style="color:#888; font-size:12px; margin-bottom:5px;">기존 착용 장비 유지</div>
                    <div style="color:${getGradeColor(rec.grade)}; font-size:14px; font-weight:bold;">+${rec.oldEnh} ${rec.oldName}</div>
                    <div style="margin-top:5px; font-size:11px; color:#aaa; display:flex; align-items:center;">
                        돌파: ${diamondsHtml}
                    </div>
                    <div style="margin-top:10px; font-size:11px; color:#666;">✔️ 목표 달성을 위해 이 부위는 바꾸지 않아도 충분합니다.</div>
                </div>`;
            } else {
                let badge = '';
                let sources = rec.newItem.sources || [];
                if (sources.includes('교환 상점')) badge = '<span style="font-size:10px; background:#b71c1c; color:#ffcdd2; padding:2px 4px; border-radius:3px; margin-left:4px;">어비스</span>';
                else if (sources.includes('제작')) badge = '<span style="font-size:10px; background:#4a148c; color:#e1bee7; padding:2px 4px; border-radius:3px; margin-left:4px;">제작</span>';
                else if (sources.includes('원정') || sources.includes('성역')) badge = '<span style="font-size:10px; background:#004d40; color:#b2dfdb; padding:2px 4px; border-radius:3px; margin-left:4px;">원정</span>';

                let diamondsHtml = ''; 
                for (let i = 0; i < 5; i++) diamondsHtml += `<span style="display:inline-block; width:6px; height:6px; margin-right:2px; background:${i < rec.brk ? '#ffca28' : '#333'}; transform:rotate(45deg); border:1px solid #555;"></span>`;

                html += `
                <div style="background:#1a1a20; padding:15px; border-radius:8px; border:1px solid #ffca28; position:relative;">
                    <div style="color:#ccc; font-size:12px; text-decoration:line-through; margin-bottom:8px;">
                        기존 착용: +${rec.oldEnh} ${rec.oldName}
                    </div>
                    <div style="color:${getGradeColor(rec.newItem.grade)}; font-size:15px; font-weight:bold; display:flex; align-items:center; flex-wrap:wrap;">
                        ➡ +${rec.newEnh} ${rec.newItem.name} ${badge}
                    </div>
                    <div style="margin-top:8px; font-size:11px; color:#aaa; display:flex; align-items:center;">
                        계승된 돌파: ${diamondsHtml} <span style="margin-left:5px; color:#00e676; font-weight:bold;">(순수 CP ▲${rec.cpDiff})</span>
                    </div>
                </div>`;
            }
        });

        html += `</div>`;
        resultArea.innerHTML = html;

    } catch (e) {
        console.error(e);
        resultArea.innerHTML = `<div style="text-align:center; padding:20px; color:#ff5252;">분석 중 오류가 발생했습니다. 개발자 도구(F12) 콘솔을 확인해주세요.</div>`;
    }
}

// =========================================================================
// 🌟 [3] 실시간 UI 동기화 레이더 & 화면 갱신 복구 패치
// =========================================================================
window.toggleOptGoalInput = function() {
    const goal = document.getElementById('optGoal')?.value;
    const label = document.getElementById('optTargetLabel');
    const unit = document.getElementById('optTargetUnit');
    const input = document.getElementById('optTargetVal');
    const currentCP = parseInt(document.getElementById('baseCp')?.value) || 0;

    if(!label || !unit || !input) return;

    if (goal === 'cp') {
        label.innerHTML = `목표 전투력 <span style="color:#888;">(현재 내 전투력: <b style="color:#fff;">${currentCP}</b>)</span>`;
        unit.innerText = 'CP 달성';
        if(input.value == 10) input.value = currentCP + 100;
    } else if (goal === 'survive') {
        label.innerText = '목표 생존력 향상 (%)';
        unit.innerText = '% 이상 덜 아프게';
        if(input.value > 100) input.value = 10;
    } else {
        label.innerText = '목표 딜 상승률 (%)';
        unit.innerText = '% 이상 상승';
        if(input.value > 100) input.value = 10;
    }
};

window.renderOptEquipList = function() {
    const container = document.getElementById('optEquipSelection');
    if (!container) return;

    if (typeof currentEquipData === 'undefined' || currentEquipData.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:30px 0; color:#555;">캐릭터를 검색하면 내 장비가 나타납니다.</div>`;
        return;
    }

    let html = '';
    currentEquipData.forEach((eq, idx) => {
        const name = eq.name || "장비";
        const enh = eq.enchantLevel || 0;
        const brk = eq.exceedLevel || 0; 
        const img = eq.icon ? `<img src="${eq.icon}" style="width:32px; height:32px; border-radius:4px; border:1px solid #444;">` : `<div style="width:32px; height:32px; background:#222;"></div>`;
        
        let gradeColor = "#fff";
        if (eq.grade === "Unique") gradeColor = "#ffca28"; 
        if (eq.grade === "Hero" || eq.grade === "Epic") gradeColor = "#ff9800"; 
        if (eq.grade === "Legend") gradeColor = "#4fc3f7"; 
        if (eq.grade === "Rare") gradeColor = "#69f0ae"; 

        let diamondsHtml = ''; 
        for (let i = 0; i < 5; i++) {
            diamondsHtml += `<div class="diamond-pip ${i < brk ? 'active' : ''}"></div>`;
        }

        html += `
        <label style="display:flex; align-items:center; gap:10px; background:#0a0a0c; padding:10px; border:1px solid #222; border-radius:6px; cursor:pointer; margin-bottom:8px;">
            <input type="checkbox" class="opt-eq-chk" value="${idx}" style="transform:scale(1.3); margin:0 5px;" checked>
            ${img}
            <div style="flex:1;">
                <div style="color:${gradeColor}; font-size:13px; font-weight:bold;">+${enh} ${name}</div>
                <div style="display:flex; gap:4px; margin-top:5px;">${diamondsHtml}</div>
            </div>
        </label>
        `;
    });
    container.innerHTML = html;
};

// 장비 리스트 화면 0.5초마다 강제 동기화 감시 레이더
setInterval(() => {
    const container = document.getElementById('optEquipSelection');
    if (typeof currentEquipData !== 'undefined' && currentEquipData.length > 0 && container) {
        const currentRenderedCount = container.querySelectorAll('.opt-eq-chk').length;
        if (currentRenderedCount !== currentEquipData.length) {
            window.renderOptEquipList();
            window.toggleOptGoalInput();
        }
    }
}, 500);



    






    

	



