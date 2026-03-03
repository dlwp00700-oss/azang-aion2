// api/cronStats.js

module.exports = async function handler(req, res) {
    const KV_URL = process.env.azang_db_KV_REST_API_URL;
    const KV_TOKEN = process.env.azang_db_KV_REST_API_TOKEN;

    if (!KV_URL || !KV_TOKEN) return res.status(500).json({ error: "DB 접속 정보 없음" });

    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Referer': 'https://aion2.plaync.com/',
            'Origin': 'https://aion2.plaync.com'
        };

        const classList = [
            { id: 1, name: "검성" }, { id: 2, name: "수호성" }, 
            { id: 4, name: "궁성" }, { id: 5, name: "살성" }, 
            { id: 7, name: "마도성" }, { id: 8, name: "정령성" }, 
            { id: 10, name: "치유성" }, { id: 11, name: "호법성" }
        ];

        let finalAllStats = {}; 

        for (const cls of classList) {
            // 🌟 NC 서버 차단 방지를 위해 상위 30명으로 세팅
            const rankUrl = `https://aion2.plaync.com/api/ranking/list?lang=ko&rankingContentsType=1&rankingType=0&serverId=1001&classId=${cls.id}&size=30`;
            
            const rankRes = await fetch(rankUrl, { headers });
            const rankData = await rankRes.json();
            let rankList = rankData.rankingList || rankData.contents || [];
            
            let stigmaCounts = {};
            let scannedCount = 0;

            const detailPromises = rankList.map(async (user) => {
                try {
                    const charId = user.characterId || user.id;
                    const srvId = user.serverId || 1001; 
                    const detailUrl = `https://aion2.plaync.com/api/character/equipment?lang=ko&characterId=${encodeURIComponent(charId)}&serverId=${srvId}`;
                    
                    const detailRes = await fetch(detailUrl, { headers });
                    if (!detailRes.ok) return;
                    
                    const detailData = await detailRes.json();
                    const skillList = detailData.skill?.skillList || [];
                    const equippedStigmas = skillList.filter(s => s.category === 'Dp' && s.equip === 1);

                    equippedStigmas.forEach(stigma => {
                        const name = stigma.name || "알수없음";
                        // 🌟 스티그마 강화(레벨) 수치 가져오기
                        const level = stigma.enchant || stigma.level || 0; 

                        if (!stigmaCounts[name]) {
                            stigmaCounts[name] = { name: name, count: 0, icon: stigma.icon || "", levels: {} };
                        }
                        stigmaCounts[name].count += 1;
                        
                        // 레벨별 인원 기록
                        if (!stigmaCounts[name].levels[level]) {
                            stigmaCounts[name].levels[level] = 0;
                        }
                        stigmaCounts[name].levels[level] += 1;
                    });
                    scannedCount++;
                } catch (e) {}
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

        const dbData = { updatedAt: new Date().toISOString(), statsByClass: finalAllStats };

        await fetch(`${KV_URL}/set/stats_all_classes`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(dbData)
        });

        res.status(200).json({ message: "상위 30명, 레벨 상세 통계 수집 완료!", data: dbData });
    } catch (error) {
        res.status(500).json({ error: "에러 발생", details: error.message });
    }
};
