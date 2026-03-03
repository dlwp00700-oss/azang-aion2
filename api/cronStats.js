// api/cronStats.js

module.exports = async function handler(req, res) {
    const KV_URL = process.env.azang_db_KV_REST_API_URL;
    const KV_TOKEN = process.env.azang_db_KV_REST_API_TOKEN;

    if (!KV_URL || !KV_TOKEN) return res.status(500).json({ error: "DB 접속 정보 없음" });

    try {
        const targetClassId = req.query.classId || "1";
        const classMap = { "1":"검성", "2":"수호성", "4":"궁성", "5":"살성", "7":"마도성", "8":"정령성", "10":"치유성", "11":"호법성" };
        const targetClassName = classMap[targetClassId];

        if(!targetClassName) return res.status(400).json({ error: "잘못된 직업 ID입니다." });

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Referer': 'https://aion2.plaync.com/',
            'Origin': 'https://aion2.plaync.com'
        };

        // 🌟 무식하지만 가장 확실한 방법: 전체 랭킹 상위 2000명을 0.1초 만에 통째로 긁어옵니다!
        const rankUrl = `https://aion2.plaync.com/api/ranking/list?lang=ko&rankingContentsType=1&rankingType=0&serverId=1001&size=2000`;
        const rankRes = await fetch(rankUrl, { headers });
        const rankData = await rankRes.json();
        let rankList = rankData.rankingList || rankData.contents || [];

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
            "검성": "1", "수호성": "2", "궁성": "4", "살성": "5", 
            "마도성": "7", "정령성": "8", "치유성": "10", "호법성": "11"
        };

        // 🌟 2000명 중에서 타겟 직업(예: 검성)만 빠르게 걸러냅니다.
        let filteredRankList = rankList.filter(user => {
            let cName = user.jobName || user.className || user.class;
            if (!cName && user.pcId) cName = PC_CLASS_MAP[user.pcId];
            return classNameToId[cName] === targetClassId;
        });

        // 🌟 걸러낸 타겟 직업 중 가장 랭킹이 높은 50명만 딱 자릅니다. (시간 초과 절대 안 걸림)
        filteredRankList = filteredRankList.slice(0, 50);

        let stigmaCounts = {};
        let scannedCount = 0;

        // 타겟 50명의 장비만 10명씩 끊어서 스캔!
        for (let i = 0; i < filteredRankList.length; i += 10) {
            const chunk = filteredRankList.slice(i, i + 10);
            const detailPromises = chunk.map(async (user) => {
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
                        // 레벨 완벽 수집
                        const level = stigma.enchant || stigma.enchantLevel || stigma.enchantStep || stigma.level || stigma.skillLevel || 0;

                        if (!stigmaCounts[name]) {
                            stigmaCounts[name] = { name: name, count: 0, icon: stigma.icon || "", levels: {} };
                        }
                        stigmaCounts[name].count += 1;
                        
                        if (!stigmaCounts[name].levels[level]) {
                            stigmaCounts[name].levels[level] = 0;
                        }
                        stigmaCounts[name].levels[level] += 1;
                    });
                    scannedCount++;
                } catch (e) {}
            });
            await Promise.all(detailPromises);
            await new Promise(resolve => setTimeout(resolve, 200)); 
        }

        let sortedStigmas = Object.values(stigmaCounts).sort((a, b) => b.count - a.count);
        if (scannedCount > 0) {
            sortedStigmas = sortedStigmas.map(st => ({
                ...st,
                pickRate: Math.round((st.count / scannedCount) * 100)
            }));
        }

        // DB 기존 데이터 가져와서 업데이트
        const dbGetRes = await fetch(`${KV_URL}/get/stats_all_classes`, { headers: { Authorization: `Bearer ${KV_TOKEN}` } });
        const dbGetData = await dbGetRes.json();
        
        let finalAllStats = {};
        if (dbGetData.result) {
            let parsed = typeof dbGetData.result === 'string' ? JSON.parse(dbGetData.result) : dbGetData.result;
            if (parsed.statsByClass) finalAllStats = parsed.statsByClass;
        }

        finalAllStats[targetClassId] = {
            className: targetClassName,
            targetCount: scannedCount, // (최대 50명)
            stigmaRank: sortedStigmas
        };

        const dbData = { updatedAt: new Date().toISOString(), statsByClass: finalAllStats };

        await fetch(`${KV_URL}/set/stats_all_classes`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(dbData)
        });

        res.status(200).json({ 
            message: `[전체 2000명 중 ${targetClassName} 추출 완료] 총 ${scannedCount}명 통계 수집 성공!`, 
            targetCount: scannedCount
        });

    } catch (error) {
        res.status(500).json({ error: "에러 발생", details: error.message });
    }
};
