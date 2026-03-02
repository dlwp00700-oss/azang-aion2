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

        // NC API 직업 번호 번역기
        const PC_CLASS_MAP = {
            5: "검성", 6: "검성", 7: "검성", 8: "검성",
            9: "수호성", 10: "수호성", 11: "수호성", 12: "수호성",
            13: "궁성", 14: "궁성", 15: "궁성", 16: "궁성",
            17: "살성", 18: "살성", 19: "살성", 20: "살성",
            21: "정령성", 22: "정령성", 23: "정령성", 24: "정령성",
            25: "마도성", 26: "마도성", 27: "마도성", 28: "마도성",
            29: "치유성", 30: "치유성", 31: "치유성", 32: "치유성",
            33: "호법성", 34: "호법성", 35: "호법성", 36: "호법성"
        };

        const classNameToId = {
            "검성": 1, "수호성": 2, "궁성": 4, "살성": 5, 
            "마도성": 7, "정령성": 8, "치유성": 10, "호법성": 11
        };

        let finalAllStats = {
            1: { className: "검성", targetCount: 0, stigmaCounts: {} },
            2: { className: "수호성", targetCount: 0, stigmaCounts: {} },
            4: { className: "궁성", targetCount: 0, stigmaCounts: {} },
            5: { className: "살성", targetCount: 0, stigmaCounts: {} },
            7: { className: "마도성", targetCount: 0, stigmaCounts: {} },
            8: { className: "정령성", targetCount: 0, stigmaCounts: {} },
            10: { className: "치유성", targetCount: 0, stigmaCounts: {} },
            11: { className: "호법성", targetCount: 0, stigmaCounts: {} }
        };

        // 🌟 전체 서버 상위 100명을 한 번에 긁어옴!
        const rankUrl = `https://aion2.plaync.com/api/ranking/list?lang=ko&rankingContentsType=1&rankingType=0&serverId=1001&size=100`;
        const rankRes = await fetch(rankUrl, { headers });
        const rankData = await rankRes.json();
        const rankList = rankData.rankingList || rankData.contents || [];

        // 100명의 장비를 1초 만에 확인하고 직업별 바구니에 담기
        const detailPromises = rankList.map(async (user) => {
            try {
                let cName = user.jobName || user.className || user.class;
                if (!cName && user.pcId) cName = PC_CLASS_MAP[user.pcId];
                if (!cName) return;

                const clsId = classNameToId[cName];
                if (!clsId) return;

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
                    if (!finalAllStats[clsId].stigmaCounts[name]) {
                        finalAllStats[clsId].stigmaCounts[name] = { name: name, count: 0, icon: stigma.icon || "" };
                    }
                    finalAllStats[clsId].stigmaCounts[name].count += 1;
                });
                finalAllStats[clsId].targetCount += 1;
            } catch (e) {}
        });

        await Promise.all(detailPromises);

        let dbFormatStats = {};
        for (let clsId in finalAllStats) {
            let clsData = finalAllStats[clsId];
            let sortedStigmas = Object.values(clsData.stigmaCounts).sort((a, b) => b.count - a.count);
            if (clsData.targetCount > 0) {
                sortedStigmas = sortedStigmas.map(st => ({
                    ...st,
                    pickRate: Math.round((st.count / clsData.targetCount) * 100)
                }));
            }
            dbFormatStats[clsId] = {
                className: clsData.className,
                targetCount: clsData.targetCount,
                stigmaRank: sortedStigmas
            };
        }

        const dbData = { updatedAt: new Date().toISOString(), statsByClass: dbFormatStats };

        await fetch(`${KV_URL}/set/stats_all_classes`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(dbData)
        });

        res.status(200).json({ message: "전 직업 정밀 수집 완료!", data: dbData });
    } catch (error) {
        res.status(500).json({ error: "에러 발생", details: error.message });
    }
};
