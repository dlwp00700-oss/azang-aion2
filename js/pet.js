    // 🐾 펫 계산기 데이터 및 로직
    const PET_CATS = [{n:'지성',c:'#1a5de4'}, {n:'야성',c:'#d1485d'}, {n:'자연',c:'#69f0ae'}, {n:'변형',c:'#e2ce49'}, {n:'특수',c:'#71dce2'}];
    const PET_EXP = [0, 1000, 3000, 6000, 10000, 20000, 40000, 80000, 140000, 200000];
    const PET_PENALTY = [{c:0,k:0},{c:5,k:1000},{c:5,k:1000},{c:20,k:4000},{c:45,k:9000},{c:95,k:19000},{c:95,k:19000},{c:95,k:19000},{c:95,k:19000},{c:95,k:19000},{c:95,k:19000}];

    function initPetCalc() {
        let html = '';
        PET_CATS.forEach((cat, i) => {
            html += `<tr style="background:#0a0a0c; border-bottom:1px solid #1a1a20;">
                <td style="padding:10px; text-align:center; font-weight:bold; color:${cat.c}">${cat.n}</td>
                <td><input type="number" id="curLv_${i}" value="1" min="1" max="10" style="width:80%; background:#111; border:1px solid #333; color:#fff; padding:5px; text-align:center;" oninput="if(this.value>10)this.value=10; runPetCalc()"></td>
                <td><input type="number" id="curExp_${i}" value="0" style="width:80%; background:#111; border:1px solid #333; color:#fff; padding:5px; text-align:center;" oninput="runPetCalc()"></td>
                <td><input type="number" id="tarLv_${i}" value="1" style="width:80%; background:#111; border:1px solid #333; color:#fff; padding:5px; text-align:center;" oninput="runPetCalc()"></td>
                <td><select id="lock_${i}" style="width:90%; background:#111; border:1px solid #333; color:#fff; padding:5px;" onchange="runPetCalc()"><option value="0">0개</option><option value="1">1개</option><option value="2">2개</option><option value="3">3개</option><option value="4">4개</option><option value="5">5개</option><option value="6">6개</option><option value="7">7개</option><option value="8">8개</option></select></td>
            </tr>`;
        });
        document.getElementById('petTableBody').innerHTML = html;
    }

    function runPetCalc() {
        let tC = 0, tCry = 0, tK = 0;
        for(let i=0; i<5; i++) {
            let clv = parseInt(document.getElementById(`curLv_${i}`).value) || 1;
            let cex = parseInt(document.getElementById(`curExp_${i}`).value) || 0;
            let tlv = parseInt(document.getElementById(`tarLv_${i}`).value) || 1;
            let lock = parseInt(document.getElementById(`lock_${i}`).value) || 0;
            if(clv >= tlv) continue;
            for(let v = clv; v < tlv; v++) {
                let req = (v === clv) ? (PET_EXP[v] - cex) : PET_EXP[v];
                if(req <= 0) continue;
                let slot = v - lock;
                if(slot <= 0) continue;
                let click = Math.ceil(req / (slot * 100));
                tC += click;
                tCry += click * (v * 5 + PET_PENALTY[lock].c);
                tK += click * (v * 1000 + PET_PENALTY[lock].k);
            }
        }
        document.getElementById('res_clicks').innerText = tC.toLocaleString() + '회';
        document.getElementById('res_crystal').innerText = tCry.toLocaleString() + '개';
        document.getElementById('res_kinah').innerText = tK.toLocaleString();
        document.getElementById('res_mobs').innerText = tCry.toLocaleString() + '마리';
    }


     let parsedPetDict = {};
    let currentSimCategory = '지성';

    // 🚀 종족별 고유 컬러 설정 (가독성을 위해 글자색 fg도 함께 지정)
    const PET_COLORS = { 
        '지성': {bg:'#1a5de4', fg:'#fff'}, 
        '야성': {bg:'#d1485d', fg:'#fff'}, 
        '자연': {bg:'#69f0ae', fg:'#000'}, 
        '변형': {bg:'#e2ce49', fg:'#000'}, 
        '특수': {bg:'#71dce2', fg:'#000'} 
    };

    // 종족 카테고리 변경 (색상 이펙트 추가)
    function changeSimCat(catName, btnEl) {
        currentSimCategory = catName;
        const btns = document.querySelectorAll('.sim-cat-btn');
        btns.forEach(btn => {
            btn.style.background = '#111';
            btn.style.color = '#888';
            btn.style.border = '1px solid #333';
        });
        
        // 선택한 버튼에 고유 컬러 적용
        if (PET_COLORS[catName]) {
            btnEl.style.background = PET_COLORS[catName].bg;
            btnEl.style.color = PET_COLORS[catName].fg;
        } else {
            btnEl.style.background = '#ffca28';
            btnEl.style.color = '#000';
        }
        btnEl.style.border = 'none';

        buildSimSlots();
    }

    // 🚀 9레벨 <-> 10레벨 변경 버튼 애니메이션 및 데이터 연동 로직
    function changeSimLvlBtn(lvl, btnEl) {
        // 1. 내부적으로 사용할 실제 데이터(Lv) 변경
        document.getElementById('simPetLevel').value = lvl; 
        
        // 2. 모든 버튼의 불을 끄기 (비활성화 스타일)
        const btns = document.querySelectorAll('.sim-lvl-btn');
        btns.forEach(btn => {
            btn.style.background = 'transparent';
            btn.style.color = '#888';
        });
        
        // 3. 내가 클릭한 버튼만 불 켜기 (활성화 스타일)
        btnEl.style.background = '#e0e0e0';
        btnEl.style.color = '#000';
        
        // 4. 바뀐 레벨에 맞춰 아래 테이블 옵션 싹 다 새로고침!
        buildSimSlots(); 
    }

    // CSV 및 엑셀(탭) 데이터를 파싱하여 [종족][레벨][슬롯번호] 구조로 완벽하게 정리
    function initPetData() {
        try {
            const rows = RAW_PET_DATA.trim().split('\n');
            for(let i=1; i<rows.length; i++) {
                if(!rows[i].trim()) continue;
                
                const isTab = rows[i].includes('\t');
                const cols = isTab ? rows[i].split('\t') : rows[i].split(',');
                
                if(cols[0].trim().toLowerCase() === 'category') continue;

                const catRaw = cols[0].trim();
                const level = parseInt(cols[1].trim());
                const slot = parseInt(cols[2].trim()) || 1;
                const grade = cols[3].trim(); 
                const optName = cols[4].trim();
                const min = parseFloat(cols[5].trim());
                const max = parseFloat(cols[6].trim());
                const unit = cols[7] ? cols[7].trim() : '';
                const prob = parseFloat(cols[8].trim());

                const categories = catRaw.includes('/') ? catRaw.split('/') : [catRaw];
                categories.forEach(cat => {
                    if(!parsedPetDict[cat]) parsedPetDict[cat] = {};
                    if(!parsedPetDict[cat][level]) parsedPetDict[cat][level] = {};
                    if(!parsedPetDict[cat][level][slot]) parsedPetDict[cat][level][slot] = [];
                    
                    parsedPetDict[cat][level][slot].push({ name: optName, min: min, max: max, unit: unit, prob: prob, grade: grade });
                });
            }
            buildSimSlots();
        } catch(e) { console.error("펫 데이터 로드 에러:", e); }
    }

    // 🚀 슬롯 1~9 UI 그리기 (확률 표기 칸 추가)
    // 🚀 슬롯 1~9 UI 그리기 (옵션 등급별 색상 적용)
    function buildSimSlots() {
        const cat = currentSimCategory;
        const lvl = parseInt(document.getElementById('simPetLevel').value) || 9;
        const container = document.getElementById('simSlotsContainer');
        if(!container) return;
        container.innerHTML = '';

        for(let s=1; s<=9; s++) {
            let slotData = parsedPetDict[cat]?.[lvl]?.[s] || [];
            
            let optionsHtml = `<option value="none" style="color:#888;">설정 안 함 (선택 시 드롭다운)</option>`;
            slotData.forEach(opt => {
                let jStr = JSON.stringify(opt).replace(/"/g, '&quot;');
                let u = opt.unit === 'flat' ? '' : '%';
                let gradeLabel = opt.grade ? `[${opt.grade}] ` : '';
                
                // 🚀 등급별 색상 스타일 적용
                let gradeStyle = 'color:#fff;'; // 기본 흰색
                if(opt.grade === '영웅') gradeStyle = 'color:#ff9800; font-weight:bold;'; // 주황색
                else if(opt.grade === '유일') gradeStyle = 'color:#ffca28; font-weight:bold;'; // 노란색
                
                optionsHtml += `<option value="${jStr}" style="${gradeStyle}">${gradeLabel}${opt.name} (${opt.min}${u} ~ ${opt.max}${u})</option>`;
            });

            // (아래 tr 생성 코드는 기존과 동일합니다)
            container.innerHTML += `
            <tr id="simRow_${s}" style="border-bottom:1px solid #222; background:#0f0f11; transition:0.2s;">
                <td style="padding:12px 10px; text-align:center; font-weight:bold; color:#ce93d8; font-size:14px;">${s}</td>
                <td style="padding:12px 10px; text-align:center;">
                    <label style="cursor:pointer; display:flex; align-items:center; justify-content:center;">
                        <input type="checkbox" id="simLock_${s}" style="display:none;" onchange="toggleSimLock(${s})">
                        <span id="lockIcon_${s}" style="font-size:20px; filter: grayscale(100%); opacity: 0.4; transition:0.2s;">🔓</span>
                    </label>
                </td>
                <td style="padding:12px 10px;">
                    <select id="simOpt_${s}" style="width:100%; padding:8px; background:#1a1a24; color:#fff; border:1px solid #333; border-radius:4px; font-size:12px; outline:none;" onchange="updateSimTargetUI(${s})">
                        ${optionsHtml}
                    </select>
                </td>
                <td id="simProb_${s}" style="padding:12px 10px; text-align:center; font-size:12px; color:#4fc3f7; font-weight:bold; transition:0.2s;">-</td>
                <td style="padding:12px 10px; text-align:center;">
                    <div id="simValWrap_${s}" style="display:none; justify-content:center;">
                        <input type="number" id="simVal_${s}" value="0" step="0.1" style="width:100%; max-width:70px; padding:6px; background:#111; color:#69f0ae; border:1px solid #444; border-radius:4px; text-align:center; font-weight:bold; font-size:12px; outline:none;">
                    </div>
                    <span id="simLockText_${s}" style="display:none; color:#ff5252; font-size:12px; font-weight:bold;">🔒 잠김</span>
                </td>
            </tr>`;
        }
    }

    // 🚀 잠금(자물쇠) 시각적 이펙트 강화
    function toggleSimLock(slotId) {
        const isLocked = document.getElementById(`simLock_${slotId}`).checked;
        const row = document.getElementById(`simRow_${slotId}`);
        const optSel = document.getElementById(`simOpt_${slotId}`);
        const wrap = document.getElementById(`simValWrap_${slotId}`);
        const icon = document.getElementById(`lockIcon_${slotId}`);
        const lockText = document.getElementById(`simLockText_${slotId}`);
        const probLabel = document.getElementById(`simProb_${slotId}`);
        
        if(isLocked) {
            icon.innerText = "🔒";
            icon.style.filter = "none";
            icon.style.opacity = "1";
            row.style.background = "rgba(255, 82, 82, 0.08)"; // 붉은색 경고 배경
            
            optSel.value = "none";
            optSel.disabled = true;
            optSel.style.opacity = "0.4";
            wrap.style.display = 'none';
            probLabel.innerText = '-';
            probLabel.style.opacity = "0.4";
            lockText.style.display = 'block';
        } else {
            icon.innerText = "🔓";
            icon.style.filter = "grayscale(100%)";
            icon.style.opacity = "0.4";
            row.style.background = "#0f0f11"; // 원래 배경으로 복구
            
            optSel.disabled = false;
            optSel.style.opacity = "1";
            probLabel.style.opacity = "1";
            lockText.style.display = 'none';
            updateSimTargetUI(slotId); 
        }
    }

    // 🚀 옵션 선택 시 확률 표기 로직 추가
    function updateSimTargetUI(slotId) {
        const optVal = document.getElementById(`simOpt_${slotId}`).value;
        const wrap = document.getElementById(`simValWrap_${slotId}`);
        const input = document.getElementById(`simVal_${slotId}`);
        const probLabel = document.getElementById(`simProb_${slotId}`);
        
        if(optVal === "none" || document.getElementById(`simLock_${slotId}`).checked) {
            wrap.style.display = 'none';
            probLabel.innerText = '-';
        } else {
            const data = JSON.parse(optVal.replace(/&quot;/g, '"'));
            input.value = data.min; 
            probLabel.innerText = data.prob ? `${data.prob.toFixed(2)}%` : '-';
            wrap.style.display = 'flex';
        }
    }

    function runSimulatedReroll() {
        const category = currentSimCategory;
        const level = parseInt(document.getElementById('simPetLevel').value) || 9;
        
        let targets = []; 
        let hasTarget = false;
        let manualLocks = 0; 

        for(let s=1; s<=9; s++) {
            const isLocked = document.getElementById(`simLock_${s}`).checked;
            if(isLocked) {
                manualLocks++;
                targets.push(null);
                continue;
            }

            const optSel = document.getElementById(`simOpt_${s}`);
            const valInp = document.getElementById(`simVal_${s}`);

            if(optSel && optSel.value !== "none" && !optSel.disabled) {
                const optData = JSON.parse(optSel.value.replace(/&quot;/g, '"'));
                const targetVal = parseFloat(valInp.value) || 0;

                let valProb = 1.0;
                if(optData.min !== optData.max) {
                    if(targetVal >= optData.max) valProb = 0.0;
                    else if(targetVal > optData.min) {
                        valProb = (optData.max - targetVal) / (optData.max - optData.min);
                    }
                } else {
                    if(targetVal > optData.max) valProb = 0.0;
                }

                let finalP = (optData.prob / 100) * valProb; 
                if(finalP <= 0) {
                    alert(`${s}번 슬롯의 목표치가 시스템상 뽑을 수 없는 수치입니다!`);
                    return;
                }
                targets.push({ slot: s, p: finalP });
                hasTarget = true;
            } else {
                targets.push(null);
            }
        }

        if(!hasTarget) return alert("최소 1개 이상의 슬롯에 목표 옵션을 설정해주세요.\\n(잠금(🔒)만 설정하고 돌릴 수는 없습니다.)");

        document.getElementById('simResText').innerHTML = "⏳ 수만 가지의 경우의 수를 시뮬레이션 중... (잠시만 대기)";

        setTimeout(() => {
            const iterations = 10000;
            let totalRolls = 0, totalCrystals = 0, totalKinah = 0;
            const PENALTY = [{c:0,k:0},{c:5,k:1000},{c:5,k:1000},{c:20,k:4000},{c:45,k:9000},{c:95,k:19000},{c:95,k:19000},{c:95,k:19000},{c:95,k:19000},{c:95,k:19000}];
            let targetCount = targets.filter(t => t !== null).length;

            for(let i=0; i<iterations; i++) {
                let locked = [false, false, false, false, false, false, false, false, false];
                let currentLocks = manualLocks; 
                let rollingLocks = 0; 

                while(rollingLocks < targetCount) {
                    let penalty = PENALTY[currentLocks] || {c:95, k:19000};
                    totalRolls++;
                    totalCrystals += (level * 5) + penalty.c;
                    totalKinah += (level * 1000) + penalty.k;

                    for(let s=0; s<9; s++) {
                        if(targets[s] !== null && !locked[s]) {
                            if(Math.random() < targets[s].p) {
                                locked[s] = true;
                                rollingLocks++;
                                currentLocks++; 
                            }
                        }
                    }
                }
            }

            const avgRolls = Math.ceil(totalRolls / iterations);
            const avgCrys = Math.ceil(totalCrystals / iterations);
            const avgKinah = Math.ceil(totalKinah / iterations);

            document.getElementById('simResRolls').innerText = avgRolls.toLocaleString() + "회";
            document.getElementById('simResCrys').innerText = avgCrys.toLocaleString() + "개";
            document.getElementById('simResKinah').innerText = avgKinah.toLocaleString();
            document.getElementById('simResText').innerHTML = "✅ 시뮬레이션 완료 (수동 잠금 비용 반영 완료)";
        }, 100);
    }

    setTimeout(initPetData, 500);
