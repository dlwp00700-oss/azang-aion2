// api/cronStats.js

export default async function handler(req, res) {
    // Vercel KV DB 접속 정보 (연결 시 자동 생성됨)
    const KV_URL = process.env.azang_db_KV_REST_API_URL;
    const KV_TOKEN = process.env.azang_db_KV_REST_API_TOKEN;

    if (!KV_URL || !KV_TOKEN) {
        return res.status(500).json({ error: "DB 접속 정보가 없습니다. Vercel Storage를 확인하세요." });
    }

    try {
        console.log("통계 수집 시작...");
        
        // 1. 살성(5번)의 시엘 서버(1001) 상위 50명만 테스트로 가져와 봅시다.
        // 나중에는 직업별로 반복문(for)을 돌려서 다 수집하게 만들 겁니다.
        const rankRes = await fetch(`https://api-aion2.plaync.com/ranking/abyss/total?size=50&classId=5&serverId=1001`);
        const rankData = await rankRes.json();
        const rankList = rankData.contents || rankData.list || [];

        let stigmaCounts = {};
        let scannedCount = 0;

        // 2. 50명의 상세 정보를 조회 (아까 대표님이 찾은 핵심 로직 적용!)
        for (const user of rankList) {
            try {
                const detailRes = await fetch(`https://api-aion2.plaync.com/character/detail?characterId=${user.characterId}&serverId=${user.serverId}`);
                const detailData = await detailRes.json();
                
                const skillList = detailData.skill?.skillList || [];
                // 'Dp'(스티그마) 이면서 장착 중('equip': 1)인 것만 필터링
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
                console.error(`조회 에러: ${user.characterName}`);
            }
        }

        // 3. 통계 계산 (내림차순 정렬 및 픽률 계산)
        let sortedStigmas = Object.values(stigmaCounts).sort((a, b) => b.count - a.count);
        sortedStigmas = sortedStigmas.map(st => ({
            ...st,
            pickRate: Math.round((st.count / scannedCount) * 100)
        }));

        const finalData = {
            updatedAt: new Date().toISOString(),
            targetCount: scannedCount,
            stigmaRank: sortedStigmas
        };

        // 4. 계산된 결과를 Vercel KV DB에 'stats_assassin' 이라는 이름으로 저장!
        await fetch(`${KV_URL}/set/stats_assassin`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${KV_TOKEN}` },
            body: JSON.stringify(finalData)
        });

        console.log("통계 수집 및 DB 저장 완료!");
        res.status(200).json({ message: "DB 저장 성공", data: finalData });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "통계 수집 실패" });
    }
}
