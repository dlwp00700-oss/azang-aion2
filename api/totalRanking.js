export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const raceReq = req.query.race || '0'; // 0: 전체, 1: 천족, 2: 마족

    // 공식 홈페이지 기준 완벽한 서버 매핑 (종족값 포함)
    const SERVER_LIST = {
        // 천족 (race: 1)
        1001: { name: "시엘", race: 1 }, 1002: { name: "네자칸", race: 1 }, 1003: { name: "바이젤", race: 1 },
        1004: { name: "카이시넬", race: 1 }, 1005: { name: "유스티엘", race: 1 }, 1006: { name: "아리엘", race: 1 },
        1007: { name: "프레기온", race: 1 }, 1008: { name: "메스람타에다", race: 1 }, 1009: { name: "히타니에", race: 1 },
        1010: { name: "나니아", race: 1 }, 1011: { name: "타하바타", race: 1 }, 1012: { name: "루터스", race: 1 },
        1013: { name: "페르노스", race: 1 }, 1014: { name: "다미누", race: 1 }, 1015: { name: "카사카", race: 1 },
        1016: { name: "바카르마", race: 1 }, 1017: { name: "챈가룽", race: 1 }, 1018: { name: "코치룽", race: 1 },
        1019: { name: "이슈타르", race: 1 }, 1020: { name: "티아마트", race: 1 }, 1021: { name: "포에타", race: 1 },
        
        // 마족 (race: 2)
        2001: { name: "이스라펠", race: 2 }, 2002: { name: "지켈", race: 2 }, 2003: { name: "트리니엘", race: 2 },
        2004: { name: "루미엘", race: 2 }, 2005: { name: "마르쿠탄", race: 2 }, 2006: { name: "아스펠", race: 2 },
        2007: { name: "에레슈키갈", race: 2 }, 2008: { name: "브리트라", race: 2 }, 2009: { name: "네몬", race: 2 },
        2010: { name: "하달", race: 2 }, 2011: { name: "루드라", race: 2 }, 2012: { name: "울고른", race: 2 },
        2013: { name: "무닌", race: 2 }, 2014: { name: "오다르", race: 2 }, 2015: { name: "젠카카", race: 2 },
        2016: { name: "크로메데", race: 2 }, 2017: { name: "콰이링", race: 2 }, 2018: { name: "바바룽", race: 2 },
        2019: { name: "파프니르", race: 2 }, 2020: { name: "인드나흐", race: 2 }, 2021: { name: "이스할겐", race: 2 }
    };

    try {
        let allPlayers = [];
        const fetchPromises = [];

        for (const [serverId, info] of Object.entries(SERVER_LIST)) {
            // 요청받은 종족(raceReq)이 '0(전체)'이거나, 현재 서버의 종족(info.race)과 일치할 때만 긁어옴
            if (raceReq === '0' || parseInt(raceReq) === info.race) {
                // 랭킹 타입은 무조건 전체(0)로 고정하여 해당 서버의 랭킹을 가져옴
                const url = `https://aion2.plaync.com/api/ranking/list?lang=ko&rankingContentsType=1&rankingType=0&serverId=${serverId}`;
                
                const p = fetch(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
                })
                .then(r => r.json())
                .then(data => {
                    if (data && data.rankingList) {
                        const listWithServer = data.rankingList.map(user => ({
                            ...user,
                            serverId: serverId,
                            serverName: info.name,
                            race: info.race // 프론트엔드에서 색상을 구분하기 위해 종족값 같이 전송
                        }));
                        allPlayers.push(...listWithServer);
                    }
                }).catch(e => {});
                
                fetchPromises.push(p);
            }
        }

        await Promise.all(fetchPromises);

        if (allPlayers.length === 0) {
            return res.status(200).json({ list: [] });
        }

        // 어포(point) 순으로 전체 내림차순 정렬
        allPlayers.sort((a, b) => (b.point || 0) - (a.point || 0));

        // 상위 50명만 잘라서 프론트엔드로 전송
        const topRanking = allPlayers.slice(0, 50);

        res.status(200).json({ list: topRanking });

    } catch (error) {
        res.status(500).json({ error: "랭킹 서버 오류" });
    }
}
