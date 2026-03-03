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

        // 🌟 핵심: rankingType=1 로 변경! 이제 엔씨가 알아서 '해당 직업'의 상위 랭커만 줍니다.
        const rankUrl = `https://aion2.plaync.com/api/ranking/list?lang=ko&rankingContentsType=1&rankingType=1&serverId=1001&classId=${targetClassId}&size=100`;
        
        const rankRes = await fetch(rankUrl, { headers });
        const rankData = await rankRes.json();
        let rankList = rankData.rankingList || rankData.contents || [];

        // 🌟 Vercel 서버가 10초 안에 끝낼 수 있는 가장 안전하고 꽉 찬 인원인 '50명'으로 자릅니다.
        // (만약 100명을 꽉 채우고 싶으시면 아래 50을 100으로 바꾸시면 되지만, 시간 초과 에러가 날 확률이 있습니다!)
        rankList = rankList.slice(0, 50);

        let stigmaCounts = {};
        let scannedCount = 0;

        // 10명씩 끊어서 스캔 (엔씨 서버 차단 방지)
        for (let i = 0; i < rankList.length; i += 10) {
            const chunk = rankList.slice(i, i + 10);
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
            await new Promise(resolve => setTimeout(resolve, 200)); // 0.2초 휴식
        }

        let sortedStigmas = Object.values(stigmaCounts).sort((a, b) => b.count - a.count);
        if (scannedCount > 0) {
            sortedStigmas = sortedStigmas.map(st => ({
                ...st,
                pickRate: Math.round((st.count / scannedCount) * 100)
            }));
        }

        // DB 덮어쓰기
        const dbGetRes = await fetch(`${KV_URL}/get/stats_all_classes`, { headers: { Authorization: `Bearer ${KV_TOKEN}` } });
        const dbGetData = await dbGetRes.json();
        
        let finalAllStats = {};
        if (dbGetData.result) {
            let parsed = typeof dbGetData.result === 'string' ? JSON.parse(dbGetData.result) : dbGetData.result;
            if (parsed.statsByClass) finalAllStats = parsed.statsByClass;
        }

        finalAllStats[targetClassId] = {
            className: targetClassName,
            targetCount: scannedCount,
            stigmaRank: sortedStigmas
        };

        const dbData = { updatedAt: new Date().toISOString(), statsByClass: finalAllStats };

        await fetch(`${KV_URL}/set/stats_all_classes`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(dbData)
        });

        res.status(200).json({ 
            message: `[${targetClassName} 직업별 랭킹] 총 ${scannedCount}명 통계 수집 성공!`, 
            targetCount: scannedCount
        });

    } catch (error) {
        res.status(500).json({ error: "에러 발생", details: error.message });
    }
};
