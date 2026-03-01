// api/stigmaStats.js

export default async function handler(req, res) {
    const { job, race, server } = req.query; // 직업, 종족, 서버 필터 받기

    try {
        // 1. 엔씨소프트 랭킹 API에서 랭커 목록 가져오기 (상위 10명만! Vercel 타임아웃 방지)
        let rankUrl = `https://api-aion2.plaync.com/ranking/abyss/total?size=10`;
        if (race) rankUrl += `&race=${race}`;
        if (server) rankUrl += `&serverId=${server}`;
        if (job) rankUrl += `&classId=${encodeURIComponent(job)}`; // 실제 NC API 직업 파라미터에 맞게 수정 필요

        const rankRes = await fetch(rankUrl);
        const rankData = await rankRes.json();
        const rankList = rankData.contents || rankData.list || [];

        if (rankList.length === 0) {
            return res.status(200).json({ list: [] });
        }

        // 2. 랭커들의 스티그마를 담을 통계 통(Object) 준비
        let stigmaCounts = {};

       // 3. 상위 10명의 상세 정보를 차례대로 조회
        for (const user of rankList) {
            try {
                const detailUrl = `https://api-aion2.plaync.com/character/detail?characterId=${user.characterId}&serverId=${user.serverId}`;
                const detailRes = await fetch(detailUrl);
                const detailData = await detailRes.json();

                // 🌟 수정된 부분: skillList에서 가져옵니다.
                const skillList = detailData.skill?.skillList || [];

                // 카테고리가 'Dp'(스티그마) 이면서 장착 중('equip': 1)인 것만 필터링!
                const equippedStigmas = skillList.filter(s => s.category === 'Dp' && s.equip === 1);

                // 장착 중인 스티그마 이름과 아이콘으로 통계 카운트 증가
                equippedStigmas.forEach(stigma => {
                    const name = stigma.name || "알 수 없는 스티그마";
                    if (!stigmaCounts[name]) {
                        stigmaCounts[name] = { name: name, count: 0, icon: stigma.icon || "" };
                    }
                    stigmaCounts[name].count += 1;
                });
            } catch (err) {
                console.error(`[${user.characterName}] 상세 조회 실패:`, err);
                continue; 
            }
        }

        // 4. 통계 결과를 배열로 바꾸고 가장 많이 쓴 순서대로 정렬 (내림차순)
        let sortedStigmas = Object.values(stigmaCounts).sort((a, b) => b.count - a.count);

        // 상위 10명 기준이므로, 퍼센트(픽률) 계산 (예: 10명 중 8명이 썼으면 80%)
        let totalUsers = rankList.length;
        sortedStigmas = sortedStigmas.map(st => ({
            ...st,
            pickRate: Math.round((st.count / totalUsers) * 100)
        }));

        // 5. 프론트로 결과 던져주기
        res.status(200).json({ list: sortedStigmas, scannedUsers: totalUsers });

    } catch (error) {
        console.error("스티그마 통계 분석 중 오류:", error);
        res.status(500).json({ error: "통계 분석 실패" });
    }
}
