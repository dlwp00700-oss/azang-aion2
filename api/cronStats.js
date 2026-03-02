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

        // 🌟 아이온 직업 ID (대표님 사이트 설정에 맞게 변경 가능)
        // 1:검성, 2:수호성, 4:궁성, 5:살성, 7:마도성, 8:정령성, 10:치유성, 11:호법성
        const classList = [
            { id: 1, name: "검성" }, { id: 2, name: "수호성" }, 
            { id: 4, name: "궁성" }, { id: 5, name: "살성" }, 
            { id: 7, name: "마도성" }, { id: 8, name: "정령성" }, 
            { id: 10, name: "치유성" }, { id: 11, name: "호법성" }
        ];

        let finalAllStats = {}; // 모든 직업 통계가 담길 큰 바구니

        // 각 직업별로 순서대로 수집 (NC 서버 무리 안 가게)
        for (const cls of classList) {
            // 전체 서버(serverId=0 이거나 생략, 여기선 대표님 기존 세팅 참고해 1001 일단 사용하되 필요시 0으로 변경)
            // 전체 랭킹을 보려면 serverId 파라미터를 빼거나 전체 코드를 쓰시면 됩니다.
            const rankUrl = `https://api-aion2.plaync.com/ranking/abyss/total?size=20&classId=${cls.id}`;
            
            const rankRes = await fetch(rankUrl, { headers });
            const rankData = await rankRes.json();
            const rankList = rankData.contents || rankData.list || rankData.rankingList || [];

            let stigmaCounts = {};
            let scannedCount = 0;

            // 10초 컷을 위해 20명 상세 조회를 '동시에' 쏴버림 (Promise.all)
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

                    // 각 캐릭터가 장착한 스티그마 카운트
                    equippedStigmas.forEach(stigma => {
                        const name = stigma.name || "알수없음";
                        if (!stigmaCounts[name]) {
                            stigmaCounts[name] = { name: name, count: 0, icon: stigma.icon || "" };
                        }
                        stigmaCounts[name].count += 1;
                    });
                    scannedCount++;
                } catch (e) {
                    // 에러 나면 조용히 패스
                }
            });

            await Promise.all(detailPromises); // 20명 동시 조회 끝날 때까지 대기

            // 픽률 계산 및 정렬
            let sortedStigmas = Object.values(stigmaCounts).sort((a, b) => b.count - a.count);
            if (scannedCount > 0) {
                sortedStigmas = sortedStigmas.map(st => ({
                    ...st,
                    pickRate: Math.round((st.count / scannedCount) * 100)
                }));
            }

            // 바구니에 직업별 데이터 예쁘게 포장해서 담기
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

        // DB에 'stats_all_classes' 라는 이름표로 전체 데이터 한 방에 저장!
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
