export default async function handler(req, res) {
    // CORS 설정 (통신 허용)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 프론트에서 보낸 종족값 (0: 전체, 1: 천족, 2: 마족)
    const raceId = req.query.race || '0'; 

    // 대표님이 직접 작성하신 완벽한 서버 리스트
    const SERVER_LIST = {
        1001: "시엘", 1002: "네자칸", 1003: "바이젤", 1004: "카이시넬", 1005: "유스티엘",
        1006: "아리엘", 1007: "프레기온", 1008: "메스람타에다", 1009: "히타니에", 1010: "나니아",
        1011: "타하바타", 1012: "루터스", 1013: "페르노스", 1014: "다미누", 1015: "카사카",
        1016: "바카르마", 1017: "챈가룽", 1018: "코치룽", 1019: "이슈타르", 1020: "티아마트",
        1021: "라비린토스", 1022: "수마이", 1023: "에레슈키갈", 1024: "무닌", 1025: "지그프리드",
        2001: "파시메데스", 2002: "스파탈로스", 2003: "테레마쿠스", 2004: "크로메데", 2005: "보탄",
        2006: "텔레마쿠스", 2007: "아스칼론", 2008: "네르투스", 2009: "제켈", 2010: "우르툼",
        2011: "이루미엘", 2012: "젠카카", 2013: "아누하르트", 2014: "마르쿠탄", 2015: "브리트라",
        2016: "수누아", 2017: "타라니스", 2018: "카룬", 2019: "크루갈", 2020: "인드나흐",
        2021: "이스할겐"
    };

    try {
        let allPlayers = [];
        const fetchPromises = [];

        // 40여 개의 서버에 일제히 요청
        for (const [serverId, serverName] of Object.entries(SERVER_LIST)) {
            // raceId (0, 1, 2)를 rankingType에 삽입
            const url = `https://aion2.plaync.com/api/ranking/list?lang=ko&rankingContentsType=1&rankingType=${raceId}&serverId=${serverId}`;
            
            // 🚀 핵심 수정: NC 보안벽에 막히지 않도록 크롬 브라우저(사람)로 위장하는 헤더 추가
            const p = fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json'
                }
            })
                .then(r => {
                    if (!r.ok) throw new Error(`HTTP ${r.status}`);
                    return r.json();
                })
                .then(data => {
                    if (data && data.rankingList) {
                        const listWithServer = data.rankingList.map(user => ({
                            ...user,
                            serverId: serverId,
                            serverName: serverName 
                        }));
                        allPlayers.push(...listWithServer);
                    }
                })
                .catch(e => {
                    // 특정 서버가 점검 중이거나 막히더라도 전체 서버가 멈추지 않도록 무시하고 진행
                    // console.error(`${serverName} 실패:`, e.message); 
                });
            
            fetchPromises.push(p);
        }

        // 모든 서버 데이터가 도착할 때까지 기다림
        await Promise.all(fetchPromises);

        if (allPlayers.length === 0) {
            // 차단당했거나 게임 점검 중일 경우 빈 리스트 반환
            return res.status(200).json({ list: [] });
        }

        // 어포(point) 순으로 전체 내림차순 정렬 (합치기)
        allPlayers.sort((a, b) => (b.point || 0) - (a.point || 0));

        // 1등부터 50등까지만 자르기
        const topRanking = allPlayers.slice(0, 50);

        res.status(200).json({ list: topRanking });

    } catch (error) {
        res.status(500).json({ error: "랭킹 서버 오류" });
    }
}
