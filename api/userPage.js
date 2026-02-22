module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    const serverReq = req.query.server || '1001';
    const nameReq = req.query.name || '알수없음';

    let sName = "서버";
    let cClass = "직업";
    let pImg = "https://aion2zang.info/flogo.png";
    let equipHtml = "<p style='font-size:13px; color:#888;'>장착 중인 장비를 불러오고 있습니다.</p>";

    try {
        const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };
        
        // 1. 랭킹 API에서 기본 정보(사진, 직업 등) 가져오기
        const rankRes = await fetch(`https://aion2.plaync.com/api/ranking/list?lang=ko&rankingContentsType=1&rankingType=0&serverId=${serverReq}&characterName=${encodeURIComponent(nameReq)}`, { headers });
        const rankData = await rankRes.json();
        const charFromRank = (rankData.rankingList || []).find(c => c.characterName === nameReq);
        if (charFromRank) {
            sName = charFromRank.serverName || "서버";
            cClass = charFromRank.className || "직업";
            pImg = charFromRank.profileImage || pImg;
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
                // 🚀 구글 봇이 환장하는 텍스트 리스트(ul/li) 생성!
                equipHtml = `<ul style="text-align:left; font-size:13px; color:#ddd; padding-left:20px; line-height:1.8; margin:0;">`;
                eqList.forEach(eq => {
                    const eqName = eq.itemName || "알 수 없는 장비";
                    const enchant = eq.enchantLevel > 0 ? `<span style="color:#4fc3f7;">+${eq.enchantLevel}</span> ` : "";
                    equipHtml += `<li>${enchant}${eqName}</li>`;
                });
                equipHtml += `</ul>`;
            } else {
                equipHtml = "<p style='font-size:13px; color:#888;'>장착 중인 장비가 없거나 비공개 상태입니다.</p>";
            }
        }
    } catch(e) {} // 에러가 나도 빈 페이지만 안 뜨게 조용히 넘어감

    // 🚀 완벽한 텍스트 덩어리 HTML 조립
    const html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>[${sName}] ${nameReq} 장비 스펙 분석 - 아이온2 아장(AZANG)</title>
        <meta name="description" content="아이온2 ${sName} 서버 ${nameReq}(${cClass}) 캐릭터의 완벽한 템셋팅과 장비를 아장(AZANG)에서 확인하세요.">
        
        <meta property="og:title" content="[${sName}] ${nameReq} 님의 장비 분석 결과">
        <meta property="og:description" content="${cClass} | 착용 장비 요약 및 실질 딜량/생존 타수 계산">
        <meta property="og:image" content="${pImg}">
        <meta property="og:url" content="https://aion2zang.info/user/${serverReq}/${encodeURIComponent(nameReq)}">
        
        <meta name="robots" content="index, follow">
        <style>
            body { font-family: 'Pretendard', sans-serif; background: #0a0a0c; color: #fff; text-align: center; padding: 50px 20px; line-height: 1.6; }
            .card { background: #141418; border: 1px solid #4fc3f7; border-radius: 12px; max-width: 450px; margin: 0 auto; padding: 40px 20px; box-shadow: 0 0 20px rgba(79,195,247,0.2); }
            img { width: 100px; height: 100px; border-radius: 50%; border: 3px solid #4fc3f7; margin-bottom: 20px; object-fit: cover; }
            .title { font-size: 26px; font-weight: bold; color: #fff; margin-bottom: 5px; }
            .server { color: #4fc3f7; font-size: 18px; font-weight: bold; margin-bottom: 15px; }
            .info { color: #aaa; font-size: 15px; margin-bottom: 20px; }
            
            /* 장비 요약 박스 디자인 */
            .equip-box { background: #1a1a24; border-radius: 8px; padding: 15px 20px; margin-bottom: 30px; border: 1px solid #333; }
            .equip-title { color: #ffca28; font-weight: bold; font-size: 15px; margin-bottom: 12px; border-bottom: 1px solid #333; padding-bottom: 8px; }
            
            .btn { display: inline-block; background: #00e676; color: #000; text-decoration: none; font-weight: bold; padding: 15px 30px; border-radius: 8px; font-size: 16px; transition: 0.2s; }
            .btn:hover { background: #00c853; transform: translateY(-2px); }
        </style>
    </head>
    <body>
        <div class="card">
            <img src="${pImg}" onerror="this.src='https://aion2zang.info/flogo.png'" alt="프로필">
            <div class="server">[${sName}]</div>
            <div class="title">${nameReq}</div>
            <div class="info">${cClass}</div>
            
            <div class="equip-box">
                <div class="equip-title">🔥 착용 중인 장비 요약</div>
                ${equipHtml}
            </div>

            <p style="color:#888; margin-bottom:30px; font-size:13px;">
                위 장비 셋팅을 바탕으로<br>
                실질적인 PVE/PVP 딜량과 생존 타수를 시뮬레이션합니다.
            </p>
            <a href="/?server=${serverReq}&name=${encodeURIComponent(nameReq)}" class="btn">🚀 내 캐릭터 완벽 분석하러 가기</a>
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
