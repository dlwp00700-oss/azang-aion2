// api/cronStats.js

module.exports = async function handler(req, res) {
    const KV_URL = process.env.azang_db_KV_REST_API_URL;
    const KV_TOKEN = process.env.azang_db_KV_REST_API_TOKEN;

    if (!KV_URL || !KV_TOKEN) {
        return res.status(500).json({ error: "DB 접속 정보가 없습니다." });
    }

    try {
        // NC소프트 봇 차단 방지용 신분증
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://aion2.plaync.com/',
            'Origin': 'https://aion2.plaync.com'
        };
        
        // 🌟 수정: 이전에 대표님이 알려주셨던 오리지널 API 주소로 복구했습니다. (상위 20명만 테스트)
        const rankUrl = `https://api-aion2.plaync.com/ranking/abyss/total?size=20&classId=5&serverId=1001`;
        
        const rankRes = await fetch(rankUrl, { headers });
        const rankData = await rankRes.json();
        
        const rankList = rankData.contents || rankData.list || rankData.rankingList || [];

        // 🚨 [탐지기 작동] 만약 랭커 명단이 0명이면, NC 서버가 보낸 원본 메시지를 그대로 화면에 출력합니다!
        if (rankList.length === 0) {
            return res.status(200).json({ 
                message: "DB는 완벽한데, NC 서버가 랭킹을 안 줍니다. 아래 이유를 확인해주세요!", 
                nc_response: rankData 
            });
        }

        let stigmaCounts = {};
        let scannedCount = 0;

        for (const user of rankList) {
            try {
                // 🌟 수정: 상세 조회도 오리지널 API 주소로 복구
                const charId = user.characterId || user.id;
                const srvId = user.serverId || 1001;
                const detailUrl = `https://api-aion2.plaync.com/character/detail?characterId=${charId}&serverId=${srvId}`;
                
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
                console.error(`상세조회 에러 스킵`);
            }
        }

        let sortedStigmas = Object.values(stigmaCounts).sort((a, b) => b.count - a.count);
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

        res.status(200).json({ message: "DB 저장 성공 및 데이터 수집 완료!", data: finalData });

    } catch (error) {
        res.status(500).json({ error: "통계 수집 에러", details: error.message });
    }
};
