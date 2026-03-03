// api/cronStats.js

module.exports = async function handler(req, res) {
    const KV_URL = process.env.azang_db_KV_REST_API_URL;
    const KV_TOKEN = process.env.azang_db_KV_REST_API_TOKEN;

    if (!KV_URL || !KV_TOKEN) return res.status(500).json({ error: "DB 접속 정보 없음" });

    try {
        // 🌟 핵심 1: URL 뒤에 ?classId=5 를 붙이면 그 직업만 100명 수집합니다! (기본값은 1번 검성)
        const targetClassId = req.query.classId || "1";
        const classMap = { "1":"검성", "2":"수호성", "4":"궁성", "5":"살성", "7":"마도성", "8":"정령성", "10":"치유성", "11":"호법성" };
        const targetClassName = classMap[targetClassId];

        if(!targetClassName) return res.status(400).json({ error: "잘못된 직업 ID입니다." });

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Referer': 'https://aion2.plaync.com/',
            'Origin': 'https://aion2.plaync.com'
        };

        // 🌟 한 직업만 타겟으로 잡고 상위 100명을 여유롭게 불러옵니다.
        const rankUrl = `https://aion2.plaync.com/api/ranking/list?lang=ko&rankingContentsType=1&rankingType=0&serverId=1001&classId=${targetClassId}&size=100`;
        const rankRes = await fetch(rankUrl, { headers });
        const rankData = await rankRes.json();
        const rankList = rankData.rankingList || rankData.contents || [];

        let stigmaCounts = {};
        let scannedCount = 0;
        let debugStigmaRaw = null; // 🚨 레벨 이름표(Key)를 훔쳐보기 위한 CCTV

        // 🌟 핵심 2: 엔씨 방어막 안 걸리게 10명씩 조심조심 끊어서 스캔합니다!
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
                        // 첫 번째 스티그마 원본 데이터를 CCTV에 복사해둡니다.
                        if (!debugStigmaRaw) debugStigmaRaw = stigma; 

                        const name = stigma.name || "알수없음";
                        // 🌟 레벨 정보가 있을만한 모든 이름을 다 뒤집니다!
                        const level = stigma.enchant || stigma.enchantLevel || stigma.enchantStep || stigma.level || stigma.skillLevel || 0;

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
            
            // 10명 스캔 후 0.2초 휴식 (엔씨 서버 화내지 않게)
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        let sortedStigmas = Object.values(stigmaCounts).sort((a, b) => b.count - a.count);
        if (scannedCount > 0) {
            sortedStigmas = sortedStigmas.map(st => ({
                ...st,
                pickRate: Math.round((st.count / scannedCount) * 100)
            }));
        }

        // 🌟 핵심 3: DB에 있는 기존 다른 직업 통계는 살리고, 방금 수집한 직업만 쏙 갈아끼웁니다!
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

        // 다시 DB에 완벽 저장!
        await fetch(`${KV_URL}/set/stats_all_classes`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(dbData)
        });

        res.status(200).json({ 
            message: `${targetClassName} 상위 100명 통계 수집 완료!`, 
            targetCount: scannedCount,
            debug_stigma_raw: debugStigmaRaw  // 🚨 화면에 레벨 안 뜨면 이거 확인!
        });

    } catch (error) {
        res.status(500).json({ error: "에러 발생", details: error.message });
    }
};
