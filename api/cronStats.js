// api/cronStats.js

module.exports = async function handler(req, res) {
    const KV_URL = process.env.azang_db_KV_REST_API_URL;
    const KV_TOKEN = process.env.azang_db_KV_REST_API_TOKEN;

    if (!KV_URL || !KV_TOKEN) return res.status(500).json({ error: "DB 접속 정보 없음" });

    try {
        // 🌟 완벽하게 작동했던 헤더 (신분증)
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://aion2.plaync.com/',
            'Origin': 'https://aion2.plaync.com'
        };

        // 아이온 직업 ID
        const classList = [
            { id: 1, name: "검성" }, { id: 2, name: "수호성" }, 
            { id: 4, name: "궁성" }, { id: 5, name: "살성" }, 
            { id: 7, name: "마도성" }, { id: 8, name: "정령성" }, 
            { id: 10, name: "치유성" }, { id: 11, name: "호법성" }
        ];

        let finalAllStats = {}; 

        for (const cls of classList) {
            // 🌟 수정: 아까 성공했던 '진짜' 랭킹 API 주소로 복구! (전체 서버 기준)
            const rankUrl = `https://aion2.plaync.com/api/ranking/list?lang=ko&rankingContentsType=1&rankingType=0&classId=${cls.id}`;
            
            const rankRes = await fetch(rankUrl, { headers });
            const rankData = await rankRes.json();
            
            // 데이터 배열 꺼내서 상위 20명만 자르기 (10초 타임아웃 방지)
            let rankList = rankData.rankingList || rankData.contents || [];
            rankList = rankList.slice(0, 20); 

            let stigmaCounts = {};
            let scannedCount = 0;

            const detailPromises = rankList.map(async (user) => {
                try {
                    const charId = user.characterId || user.id;
                    const srvId = user.serverId || 1001; 
                    
                    // 🌟 수정: 아까 성공했던 '진짜' 장비 상세조회 주소!
                    const detailUrl = `https://aion2.plaync.com/api/character/equipment?lang=ko&characterId=${encodeURIComponent(charId)}&serverId=${srvId}`;
                    
                    const detailRes = await fetch(detailUrl, { headers });
                    if (!detailRes.ok) return;
                    
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
                } catch (e) {
                    // 에러 패스
                }
            });

            await Promise.all(detailPromises);

            let sortedStigmas = Object.values(stigmaCounts).sort((a, b) => b.count - a.count);
            if (scannedCount > 0) {
                sortedStigmas = sortedStigmas.map(st => ({
                    ...st,
                    pickRate: Math.round((st.count / scannedCount) * 100)
                }));
            }

            finalAllStats[cls.id] = {
                className: cls.name,
                targetCount: scannedCount,
                stigmaRank: sortedStigmas
            };
        }

        const dbData = {
            updatedAt: new Date().toISOString(),
            statsByClass: finalAllStats
        };

        await fetch(`${KV_URL}/set/stats_all_classes`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(dbData)
        });

        res.status(200).json({ message: "전 직업 수집 완료!", data: dbData });
    } catch (error) {
        res.status(500).json({ error: "에러 발생", details: error.message });
    }
};
