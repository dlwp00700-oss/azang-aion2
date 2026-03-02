// api/cronStats.js

module.exports = async function handler(req, res) {
    const KV_URL = process.env.azang_db_KV_REST_API_URL;
    const KV_TOKEN = process.env.azang_db_KV_REST_API_TOKEN;

    if (!KV_URL || !KV_TOKEN) {
        return res.status(500).json({ error: "DB 접속 정보가 없습니다." });
    }

    try {
        // 대표님 코드를 참고한 NC소프트 봇 차단 방지용 완벽한 헤더
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Referer': 'https://aion2.plaync.com/',
            'Origin': 'https://aion2.plaync.com'
        };
        
        // 🌟 성공했던 오리지널 랭킹 API 주소
        const rankUrl = `https://aion2.plaync.com/api/ranking/list?lang=ko&rankingContentsType=1&rankingType=0&serverId=1001&classId=5`;
        
        const rankRes = await fetch(rankUrl, { headers });
        const rankData = await rankRes.json();
        const rankList = rankData.rankingList || rankData.contents || [];

        // 랭커가 한 명도 안 불러와졌으면 바로 보고
        if (rankList.length === 0) {
            return res.status(200).json({ message: "랭커 명단을 아예 못 가져왔습니다.", nc_data: rankData });
        }

        // 🌟 NC 서버가 매크로로 차단하지 못하게 상위 10명만 가볍게 테스트!
        const top10 = rankList.slice(0, 10);

        let stigmaCounts = {};
        let scannedCount = 0;
        let errorLogs = []; // 무슨 에러가 나는지 기록해두는 CCTV

        for (const user of top10) {
            try {
                const charId = user.characterId || user.id;
                const srvId = user.serverId || 1001;
                
                // 성공했던 캐릭터 상세조회 오리지널 주소
                const detailUrl = `https://aion2.plaync.com/api/gameinfo/character/detail?characterId=${charId}&serverId=${srvId}`;
                
                const detailRes = await fetch(detailUrl, { headers });
                
                if (!detailRes.ok) {
                    errorLogs.push(`[${user.characterName}] 상세 조회 차단됨: HTTP ${detailRes.status}`);
                    continue; // 차단당해도 다음 사람 계속 조회
                }
                
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
                errorLogs.push(`[${user.characterName}] 에러: ${err.message}`);
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
            foundTotal: rankList.length,
            targetCount: scannedCount, // 성공적으로 스티그마를 깐 인원수
            stigmaRank: sortedStigmas,
            errors: errorLogs // 만약 0명이면 왜 0명인지 에러 이유가 여기에 찍힘!
        };

        await fetch(`${KV_URL}/set/stats_assassin`, {
            method: 'POST',
            headers: { 
                Authorization: `Bearer ${KV_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(finalData)
        });

        res.status(200).json({ message: "수집 완료!", data: finalData });

    } catch (error) {
        res.status(500).json({ error: "코드 자체 에러 발생", details: error.message });
    }
};
