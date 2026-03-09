// ==========================================
    // 💾 전체 데이터 원버튼 통합 저장/불러오기 (체크박스 완벽 보존)
    // ==========================================
    function saveGlobalState() {
        let abyssCheckStates = [];
        document.querySelectorAll('.abyss-chk').forEach(chk => abyssCheckStates.push(chk.checked));

        const state = {
            stats: {
                baseAtk: document.getElementById('baseAtk').value, baseAmp: document.getElementById('baseAmp').value, basePveAmp: document.getElementById('basePveAmp').value, basePvpAmp: document.getElementById('basePvpAmp').value, baseWAmp: document.getElementById('baseWAmp').value, baseCritDmg: document.getElementById('baseCritDmg').value, baseDef: document.getElementById('baseDef').value, baseHp: document.getElementById('baseHp').value, baseGenRes: document.getElementById('baseGenRes').value, basePveRes: document.getElementById('basePveRes').value, basePvpRes: document.getElementById('basePvpRes').value, enemyAtk: document.getElementById('enemyAtk').value, enemyAmp: document.getElementById('enemyAmp').value, enemyPvpAmp: document.getElementById('enemyPvpAmp').value, enemyGenRes: document.getElementById('enemyGenRes').value, enemyPvpRes: document.getElementById('enemyPvpRes').value,
                basePower: document.getElementById('basePower').value, baseAgi: document.getElementById('baseAgi').value, baseAccStat: document.getElementById('baseAccStat').value, baseWill: document.getElementById('baseWill').value, baseKnow: document.getElementById('baseKnow').value, baseVit: document.getElementById('baseVit').value, baseDest: document.getElementById('baseDest').value, baseDeath: document.getElementById('baseDeath').value, baseWis: document.getElementById('baseWis').value, baseDestiny: document.getElementById('baseDestiny').value, baseSpace: document.getElementById('baseSpace').value, baseTime: document.getElementById('baseTime').value, baseLife: document.getElementById('baseLife').value, baseIllusion: document.getElementById('baseIllusion').value, baseFreedom: document.getElementById('baseFreedom').value, baseJustice: document.getElementById('baseJustice').value
            },
            charInfo: currentLoadedChar, 
            charName: document.getElementById('charNameInput').value,
            equipData: currentEquipData,
            simState: simulationState,
            abyss: {
                myAp: document.getElementById('my_ap').value, 
                seasonAp: document.getElementById('season_ap') ? document.getElementById('season_ap').value : "0", // 🚀 추가됨
                s: document.getElementById('my_medal_silver').value, 
                g: document.getElementById('my_medal_gold').value, 
                p: document.getElementById('my_medal_plat').value, 
                wAp: document.getElementById('week_ap').value, 
                cart: abyCart,
                checks: abyssCheckStates 
            },
            pet: []
        };
        
        for(let i=0; i<5; i++) {
            if(document.getElementById(`curLv_${i}`)) {
                state.pet.push({ clv: document.getElementById(`curLv_${i}`).value, cex: document.getElementById(`curExp_${i}`).value, tlv: document.getElementById(`tarLv_${i}`).value, lock: document.getElementById(`lock_${i}`).value });
            }
        }
        
        localStorage.setItem('aion2_global_save', JSON.stringify(state));
        alert("💾 [통합 저장 완료]\n\n현재 로드된 캐릭터의 장비 시뮬레이션 상태, 어비스 체크리스트 및 장바구니, 펫작 진행 상황 등 모든 데이터가 완벽하게 저장되었습니다!");
    }

    function loadGlobalState() {
        const raw = localStorage.getItem('aion2_global_save');
        if(!raw) { alert("❌ 저장된 전체 데이터가 없습니다."); return; }
        if(!confirm("저장된 데이터를 불러오시겠습니까?\n현재 체크리스트와 입력된 수치는 덮어씌워집니다.")) return;

        try {
            const state = JSON.parse(raw);
            
            if(state.stats) {
                for(let k in state.stats) {
                    let el = document.getElementById(k); if(el) el.value = state.stats[k];
                    let rangeEl = document.getElementById(k+'Range'); if(rangeEl) rangeEl.value = state.stats[k];
                }
            }
            
            if(state.equipData && state.equipData.length > 0) {
                currentEquipData = state.equipData;
                simulationState = state.simState || {};
                
                if (state.charInfo) {
                    currentLoadedChar = state.charInfo;
                    document.getElementById('searchServer').value = currentLoadedChar.serverId;
                    document.getElementById('charNameInput').value = currentLoadedChar.characterName;
                    document.getElementById('statusMsg').innerHTML = `<span style="color:var(--pos)">✅ [${currentLoadedChar.characterName}] 로드 완료!</span>`;
                } else {
                    document.getElementById('charNameInput').value = state.charName || '';
                    document.getElementById('statusMsg').innerHTML = `<span style="color:var(--pos)">✅ [${state.charName||'저장된 캐릭터'}] 로드 완료!</span>`;
                }
                
                document.getElementById('appBody').className = 'dash-mode';
                renderEquipGrid();
                updateDeltaDashboard();
            }

            if(state.abyss) {
                document.getElementById('my_ap').value = state.abyss.myAp; 
                if(state.abyss.seasonAp && document.getElementById('season_ap')) {
                    document.getElementById('season_ap').value = state.abyss.seasonAp; // 🚀 추가됨
                }
                document.getElementById('my_medal_silver').value = state.abyss.s; 
                document.getElementById('my_medal_gold').value = state.abyss.g; 
                document.getElementById('my_medal_plat').value = state.abyss.p; 
                document.getElementById('week_ap').value = state.abyss.wAp; 
                
                // ... (아래 코드는 기존과 동일하게 유지) ...
                
                abyCart = state.abyss.cart || [];
                renderAbyCart();
                calcAbyss();
            }

            if(state.pet && state.pet.length > 0) {
                state.pet.forEach((p, i) => {
                    if(document.getElementById(`curLv_${i}`)) {
                        document.getElementById(`curLv_${i}`).value = p.clv; document.getElementById(`curExp_${i}`).value = p.cex; document.getElementById(`tarLv_${i}`).value = p.tlv; document.getElementById(`lock_${i}`).value = p.lock;
                    }
                });
                runPetCalc();
            }

            alert("📂 [불러오기 완료]\n\n성공적으로 체크리스트와 장비 데이터를 복구했습니다.");
        } catch(e) { alert("❌ 데이터를 불러오는 중 오류가 발생했습니다."); }
    }
