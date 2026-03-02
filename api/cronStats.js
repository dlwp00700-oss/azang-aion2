// api/cronStats.js

module.exports = async function handler(req, res) {
    const KV_URL = process.env.azang_db_KV_REST_API_URL;
    const KV_TOKEN = process.env.azang_db_KV_REST_API_TOKEN;

    if (!KV_URL || !KV_TOKEN) {
        return res.status(500).json({ error: "DB 접속 정보가 없습니다." });
    }

    try {
        console.log("통계 수집 시작...");

        // 🌟 해결책 1: NC소프트 차단을 뚫기 위한 '사람 신분증' (헤더) 추가
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://aion2.plaync.com/',
            'Origin': 'https://aion2.plaync.com'
        };
        
        // 🌟 해결책 2: 진짜 랭킹 API 주소로 변경 (아래 주소는 totalRanking.js를 참고한 예시입니다. 맞는지 확인해 주세요!)
        const rankUrl = `https://aion2.plaync.com/api/ranking/list?lang=ko&rankingContentsType=1&rankingType=0&serverId=1001&classId=5`;
        
        const rankRes = await fetch(rankUrl, { headers });
        const rankData = await rankRes.json();
        
        // 데이터 배열 이름이 contents가 아니라 rankingList일 수 있으니 확인!
        const rankList = rankData.rankingList || rankData.contents || [];

        let stigmaCounts = {};
        let scannedCount = 0;

        for (const user of rankList) {
            try {
                // 🌟 중요: 캐릭터의 스킬/스티그마 정보를 가져오는 '진짜 상세조회 주소'를 넣으셔야 합니다!
                // (아래는 임시 주소입니다. 대표님이 아시는 주소로 꼭 바꿔주세요.)
                const detailUrl = `https://aion2.plaync.com/api/gameinfo/character/detail?characterId=${user.characterId || user.id}&serverId=1001`;
                
                const detailRes = await fetch(detailUrl, { headers });
                const detailData = await detailRes.json();
                
                const skillList = detailData.skill?.skillList || [];
                const equippedStigmas = skillList.filter(s => s.category === 'Dp' && s.equip === 1);

                equippedStigmas.forEach(stigma => {
                    const name = stigma.name || "알수없음";
                    if (!stigmaCounts[name]) {
                        stigmaCounts[name] = { name: name, count: 0, icon: stigma.icon || "" };
                    }
                    stigmaCounts[name].count += 1;
                });
                scannedCount++;
            } catch (err) {
                console.error(`조회 에러 (스킵됨)`);
            }
        }

        let sortedStigmas = Object.values(stigmaCounts).sort((a, b) => b.count - a.count);
        // 0으로 나누는 에러 방지
        if (scannedCount > 0) {
            sortedStigmas = sortedStigmas.map(st => ({
                ...st,
                pickRate: Math.round((st.count / scannedCount) * 100)
            }));
        }

        const finalData = {
            updatedAt: new Date().toISOString(),
            targetCount: scannedCount,
            stigmaRank: sortedStigmas
        };

        // 수집한 통계를 DB에 저장
        await fetch(`${KV_URL}/set/stats_assassin`, {
            method: 'POST',
            headers: { 
                Authorization: `Bearer ${KV_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(finalData)
        });

        res.status(200).json({ message: "DB 저장 성공", data: finalData });

    } catch (error) {
        res.status(500).json({ error: "통계 수집 실패", details: error.message });
    }
};
