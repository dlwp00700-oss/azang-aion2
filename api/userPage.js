export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    const serverReq = req.query.server || '1001';
    const nameReq = req.query.name || '알수없음';

    // 기본값 세팅
    let sName = "서버";
    let cClass = "직업";
    let cLevel = "??";
    let pImg = "https://aion2zang.info/flogo.png"; // 기본 로고

    // 🚀 서버단에서 NC API를 몰래 찔러서 캐릭터 레벨, 직업, 사진을 가져옴
    try {
        const fetchRes = await fetch(`https://aion2.plaync.com/api/ranking/list?lang=ko&rankingContentsType=1&rankingType=0&serverId=${serverReq}&characterName=${encodeURIComponent(nameReq)}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const data = await fetchRes.json();
        const list = data.rankingList || [];
        
        // 검색된 캐릭터가 있다면 정보 업데이트
        const char = list.find(c => c.characterName === nameReq);
        if (char) {
            sName = char.serverName || "서버";
            cClass = char.className || "직업";
            pImg = char.profileImage || pImg;
        }
    } catch(e) {}

    // 🚀 구글 봇과 디스코드/카톡 공유용 썸네일을 위한 완벽한 HTML 뼈대
    const html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>[${sName}] ${nameReq} - 아이온2 장비 분석 | 아장(AZANG)</title>
        <meta name="description" content="아이온2 ${sName} 서버 ${nameReq} 캐릭터의 완벽한 장비 셋팅, 딜량, 방어력을 확인하세요.">
        
        <meta property="og:title" content="[${sName}] ${nameReq} 님의 스펙 분석 결과">
        <meta property="og:description" content="${cClass} | 내 캐릭터의 실질 딜량과 생존력을 아장(AZANG)에서 분석해보세요!">
        <meta property="og:image" content="${pImg}">
        <meta property="og:url" content="https://aion2zang.info/user/${serverReq}/${encodeURIComponent(nameReq)}">
        
        <meta name="robots" content="index, follow">
        <style>
            body { font-family: 'Pretendard', sans-serif; background: #0a0a0c; color: #fff; text-align: center; padding: 50px 20px; line-height: 1.6; }
            .card { background: #141418; border: 1px solid #4fc3f7; border-radius: 12px; max-width: 400px; margin: 0 auto; padding: 40px 20px; box-shadow: 0 0 20px rgba(79,195,247,0.2); }
            img { width: 100px; height: 100px; border-radius: 50%; border: 3px solid #4fc3f7; margin-bottom: 20px; object-fit: cover; }
            .title { font-size: 26px; font-weight: bold; color: #fff; margin-bottom: 5px; }
            .server { color: #4fc3f7; font-size: 18px; font-weight: bold; margin-bottom: 15px; }
            .info { color: #aaa; font-size: 15px; margin-bottom: 30px; }
            .btn { display: inline-block; background: #00e676; color: #000; text-decoration: none; font-weight: bold; padding: 15px 30px; border-radius: 8px; font-size: 16px; transition: 0.2s; box-shadow: 0 4px 15px rgba(0,230,118,0.3); }
            .btn:hover { background: #00c853; transform: translateY(-2px); }
        </style>
    </head>
    <body>
        <div class="card">
            <img src="${pImg}" onerror="this.src='https://aion2zang.info/flogo.png'" alt="프로필">
            <div class="server">[${sName}]</div>
            <div class="title">${nameReq}</div>
            <div class="info">${cClass}</div>
            <p style="color:#888; margin-bottom:30px; font-size:13px;">
                해당 캐릭터의 장비 셋팅을 스캔하고<br>
                실질적인 PVE/PVP 딜량과 생존 타수를 계산합니다.
            </p>
            <a href="/?server=${serverReq}&name=${encodeURIComponent(nameReq)}" class="btn">🚀 내 캐릭터 분석하러 가기</a>
        </div>
        
        <div style="display:none;">
            아이온2 전투력 계산기, AION2 어비스 파밍, 펫작 시뮬레이터, 장비 분석, 영혼각인 계산, 아이온2 ${cClass} 템셋팅 가이드, ${sName} 서버 ${nameReq} 랭커 스펙
        </div>
    </body>
    </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
}
