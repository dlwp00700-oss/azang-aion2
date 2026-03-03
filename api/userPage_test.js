module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    const serverReq = req.query.server || '1001';
    const nameReq = req.query.name || '알수없음';

    let sName = "서버";
    let cClass = "직업";
    let pImg = "https://aion2zang.info/flogo.png";
    let cLevel = "?"; // 레벨 추가
    let cLegion = "소속 없음"; // 레기온 추가
    let equipHtml = "<div style='padding:50px 0; color:#888; text-align:center;'>장착 중인 장비를 불러오고 있습니다.</div>";
    let seoTextHtml = ""; // 검색엔진용 숨김 텍스트

    try {
        const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };
        
        // 1. 랭킹 API에서 기본 정보(사진, 직업, 레벨, 레기온 등) 가져오기
        const rankRes = await fetch(`https://aion2.plaync.com/api/ranking/list?lang=ko&rankingContentsType=1&rankingType=0&serverId=${serverReq}&characterName=${encodeURIComponent(nameReq)}`, { headers });
        const rankData = await rankRes.json();
        const charFromRank = (rankData.rankingList || []).find(c => c.characterName === nameReq);
        
        if (charFromRank) {
            sName = charFromRank.serverName || "서버";
            cClass = charFromRank.className || "직업";
            pImg = charFromRank.profileImage || pImg;
            cLevel = charFromRank.level || "?";
            cLegion = charFromRank.legionName || "소속 없음";
        }

        // 2. 검색 API를 찔러서 고유 ID(characterId) 훔쳐오기
        const searchRes = await fetch(`https://aion2.plaync.com/ko-kr/api/search/aion2/search/v2/character?keyword=${encodeURIComponent(nameReq)}&race=0&serverId=${serverReq}&page=1&size=30`, { headers });
        const searchData = await searchRes.json();
        const charFromSearch = (searchData.data || []).find(c => c.characterName === nameReq);
        
        if (charFromSearch && charFromSearch.characterId) {
            // 3. 고유 ID로 장비 API 찔러서 착용 템 목록 가져오기
            const equipRes = await fetch(`https://aion2.plaync.com/api/gameinfo/character/equipment?characterId=${charFromSearch.characterId}`, { headers });
            const equipData = await equipRes.json();
            
            if (equipData && equipData.equipment && equipData.equipment.equipmentList) {
                const eqList = equipData.equipment.equipmentList;
                
                // 🚀 시각적인 그리드 UI 생성
                equipHtml = `<div class="equip-grid">`;
                seoTextHtml = `<ul style="display:none;">`; // SEO용
                
                eqList.forEach(eq => {
                    const eqName = eq.itemName || "알 수 없는 장비";
                    const enchant = eq.enchantLevel > 0 ? `<span class="enh">+${eq.enchantLevel}</span>` : "";
                    
                    // API 응답에 따라 icon, grade 필드명 대응
                    const iconUrl = eq.itemIcon || eq.icon || "https://aion2zang.info/flogo.png";
                    const g = (eq.grade || eq.itemGrade || "").toLowerCase();
                    const category = eq.categoryName || eq.slotName || "장비";
                    
                    // 아이템 등급에 따른 테두리/배경색 설정
                    let gradeColor = "#333";
                    let gradeBg = "#111";
                    
                    if(g.includes("epic") || g === "영웅") { gradeColor = "#ce93d8"; gradeBg = "rgba(206,147,216,0.08)"; } // 영웅(보라)
                    else if(g.includes("unique") || g === "유일") { gradeColor = "#ffb74d"; gradeBg = "rgba(255,183,77,0.08)"; } // 유일(주황)
                    else if(g.includes("legend") || g === "전승") { gradeColor = "#4fc3f7"; gradeBg = "rgba(79,195,247,0.08)"; } // 전승(파랑)
                    else if(g.includes("rare") || g === "희귀") { gradeColor = "#81c784"; gradeBg = "rgba(129,199,132,0.08)"; } // 희귀(초록)

                    equipHtml += `
                    <div class="eq-item" style="border-color: ${gradeColor}; background: ${gradeBg};">
                        <img src="${iconUrl}" onerror="this.src='https://aion2zang.info/flogo.png'">
                        <div class="eq-info">
                            <div class="eq-name" style="color: ${gradeColor};">${enchant} ${eqName}</div>
                            <div class="eq-type">${category}</div>
                        </div>
                    </div>`;
                    
                    seoTextHtml += `<li>+${eq.enchantLevel || 0} ${eqName}</li>`;
                });
                
                equipHtml += `</div>`;
                seoTextHtml += `</ul>`;
                equipHtml += seoTextHtml; // 숨긴 리스트를 DOM에 추가

            } else {
                equipHtml = "<div style='padding:50px 0; color:#888; text-align:center;'>장착 중인 장비가 없거나 비공개 상태입니다.</div>";
            }
        }
    } catch(e) {
        equipHtml = "<div style='padding:50px 0; color:#ff5252; text-align:center;'>데이터를 불러오는 중 오류가 발생했습니다.</div>";
    } 

    // 🚀 완벽한 대시보드 HTML 조립
    const html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>[${sName}] ${nameReq} 장비 스펙 분석 - 아이온2 아장(AZANG)</title>
        <meta name="description" content="아이온2 ${sName} 서버 ${nameReq}(${cClass}) 캐릭터의 완벽한 템셋팅과 장비를 아장(AZANG)에서 확인하세요.">
        
        <meta property="og:title" content="[${sName}] ${nameReq} 님의 장비 분석 결과">
        <meta property="og:description" content="Lv.${cLevel} ${cClass} | 착용 장비 요약 및 실질 딜량/생존 타수 계산">
        <meta property="og:image" content="${pImg}">
        <meta property="og:url" content="https://aion2zang.info/user/${serverReq}/${encodeURIComponent(nameReq)}">
        
        <meta name="robots" content="index, follow">
        <style>
            body { font-family: 'Pretendard', sans-serif; background: #0a0a0c; color: #fff; padding: 50px 20px; line-height: 1.6; display: flex; justify-content: center; margin: 0; }
            
            /* 대시보드 컨테이너 */
            .profile-container { display: flex; flex-direction: row; gap: 20px; max-width: 1000px; width: 100%; align-items: stretch; }
            @media (max-width: 768px) { .profile-container { flex-direction: column; } }
            
            /* 좌측: 프로필 사이드바 */
            .profile-sidebar { background: #141418; border: 1px solid #4fc3f7; border-radius: 12px; padding: 30px 20px; text-align: center; box-shadow: 0 0 20px rgba(79,195,247,0.15); flex: 1; min-width: 260px; display: flex; flex-direction: column; align-items: center; }
            .profile-img { width: 110px; height: 110px; border-radius: 50%; border: 3px solid #4fc3f7; margin-bottom: 10px; object-fit: cover; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
            .profile-level { font-size: 14px; font-weight: bold; color: #ffca28; margin-bottom: 5px; }
            .profile-name { font-size: 26px; font-weight: bold; color: #fff; margin-bottom: 5px; }
            .profile-server { color: #4fc3f7; font-size: 16px; font-weight: bold; margin-bottom: 15px; }
            
            .profile-badges { display: flex; gap: 8px; justify-content: center; margin-bottom: 20px; flex-wrap: wrap; }
            .badge { padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .class-badge { background: rgba(79,195,247,0.1); color: #4fc3f7; border: 1px solid rgba(79,195,247,0.3); }
            .legion-badge { background: rgba(255,202,40,0.1); color: #ffca28; border: 1px solid rgba(255,202,40,0.3); }
            
            .desc-text { color:#888; font-size:13px; margin-bottom: auto; padding: 20px 0; }
            
            .btn { display: inline-block; background: #00e676; color: #000; text-decoration: none; font-weight: bold; padding: 16px 20px; border-radius: 8px; font-size: 15px; transition: 0.2s; width: 100%; box-sizing: border-box; margin-top: 15px;}
            .btn:hover { background: #00c853; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,230,118,0.3); }
            
            /* 우측: 장비 영역 */
            .equip-content { background: #141418; border: 1px solid #2a2a35; border-radius: 12px; padding: 25px; flex: 2.2; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
            .equip-title { color: #ffca28; font-weight: bold; font-size: 17px; margin-bottom: 20px; border-bottom: 1px solid #333; padding-bottom: 12px; display: flex; align-items: center; gap: 10px; }
            
            /* 장비 아이콘 그리드 */
            .equip-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 12px; }
            .eq-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; border: 1px solid #333; transition: 0.2s; }
            .eq-item:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
            .eq-item img { width: 44px; height: 44px; border-radius: 6px; background: #000; object-fit: cover; border: 1px solid #222; }
            .eq-info { text-align: left; display: flex; flex-direction: column; gap: 4px; overflow: hidden; }
            .eq-name { font-size: 13px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 1px 1px 2px rgba(0,0,0,0.8); }
            .eq-name .enh { color: #fff; margin-right: 4px; }
            .eq-type { font-size: 11px; color: #888; }
        </style>
    </head>
    <body>
        
        <div class="profile-container">
            <div class="profile-sidebar">
                <img class="profile-img" src="${pImg}" onerror="this.src='https://aion2zang.info/flogo.png'" alt="프로필">
                <div class="profile-level">Lv. ${cLevel}</div>
                <div class="profile-name">${nameReq}</div>
                <div class="profile-server">[${sName}]</div>
                
                <div class="profile-badges">
                    <span class="badge class-badge">${cClass}</span>
                    <span class="badge legion-badge">🛡️ ${cLegion}</span>
                </div>
                
                <p class="desc-text">
                    위 장비 셋팅을 바탕으로<br>실질적인 PVE/PVP 딜량과<br>생존 타수를 시뮬레이션합니다.
                </p>
                
                <a href="/?server=${serverReq}&name=${encodeURIComponent(nameReq)}" class="btn">🚀 내 캐릭터 완벽 분석하러 가기</a>
            </div>

            <div class="equip-content">
                <div class="equip-title">🔥 착용 중인 장비 요약</div>
                ${equipHtml}
            </div>
        </div>

        <div style="display:none;">
            아이온2 전투력 계산기, AION2 어비스 파밍, 펫작 시뮬레이터, 장비 분석, 아이온2 ${cClass} 템셋팅 가이드, ${sName} 서버 ${nameReq} 랭커 스펙
        </div>
    </body>
    </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
}
