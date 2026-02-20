export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const raceReq = req.query.race || '0'; 
    const serverReq = req.query.server || ''; 
    const jobReq = req.query.job || '';       

    // 🚀 신규: NC 서버에 특정 직업 랭킹만 따로 달라고 요청하기 위한 직업 고유 번호
    const CLASS_MAP = {
        "검성": 2, "수호성": 3, "궁성": 4, "살성": 5, 
        "정령성": 6, "마도성": 7, "치유성": 8, "호법성": 9
    };

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
            if (serverReq && serverId !== serverReq) continue;

            if (raceReq === '0' || parseInt(raceReq) === info.race) {
                // 넉넉하게 200명어치 데이터를 요구합니다 (NC 서버 허용 범위 내)
                let url = `https://aion2.plaync.com/api/ranking/list?lang=ko&rankingContentsType=1&rankingType=0&serverId=${serverId}&size=200`;
                
                // 🚀 직업이 선택되었다면 NC 서버에 해당 직업 랭킹만 달라고 파라미터 추가
                if (jobReq && CLASS_MAP[jobReq]) {
                    url += `&classId=${CLASS_MAP[jobReq]}`;
                }

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
                            race: info.race
                        }));
                        allPlayers.push(...listWithServer);
                    }
                }).catch(e => {});
                
                fetchPromises.push(p);
            }
        }

        await Promise.all(fetchPromises);

        // 만약을 대비한 이중 필터 (NC 서버가 직업 파라미터를 무시했을 경우)
        if (jobReq) {
            allPlayers = allPlayers.filter(user => user.className === jobReq);
        }

        if (allPlayers.length === 0) {
            return res.status(200).json({ list: [] });
        }

        allPlayers.sort((a, b) => (b.point || 0) - (a.point || 0));

        // 🚀 최종 출력 인원: 기존 50명 -> 100명으로 시원하게 확장
        const topRanking = allPlayers.slice(0, 100);

        res.status(200).json({ list: topRanking });

    } catch (error) {
        res.status(500).json({ error: "랭킹 서버 오류" });
    }
}
