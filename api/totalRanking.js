export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 0: 전체, 1: 천족, 2: 마족
    const raceId = req.query.race || '0'; 

    const SERVER_LIST = {
        1001: "시엘",
        1002: "네자칸",
        1003: "바이젤",
        1004: "카이시넬",
        1005: "유스티엘",
        1006: "아리엘",
        1007: "프레기온",
        1008: "메스람타에다",
        1009: "히타니에",
        1010: "나니아",
        1011: "타하바타",
        1012: "루터스",
        1013: "페르노스",
        1014: "다미누",
        1015: "카사카",
        1016: "바카르마",
        1017: "챈가룽",
        1018: "코치룽",
        1019: "이슈타르",
        1020: "티아마트",
        1021: "포에타",
        2001: "이스라펠",
        2002: "지켈",
        2003: "트리니엘",
        2004: "루미엘",
        2005: "마르쿠탄",
        2006: "아스펠",
        2007: "에레슈키갈",
        2008: "브리트라",
        2009: "네몬",
        2010: "하달",
        2011: "루드라",
        2012: "울고른",
        2013: "무닌",
        2014: "오다르",
        2015: "젠카카",
        2016: "크로메데",
        2017: "콰이링",
        2018: "바바룽",
        2019: "파프니르",
        2020: "인드나흐",
        2021: "이스할겐"
        // 예: 1006: "바이젤", 1007: "루미엘" ... 
    };

    // 🚨 [수정 필요 2] 종족별 파라미터 처리
    // 임시로 천족=0, 마족=1 로 설정해 두었습니다. 
    // 공식 홈페이지에서 '마족' 탭을 눌렀을 때 URL의 rankingType 숫자가 뭘로 변하는지 꼭 확인해서 맞춰주세요!
    

    try {
        let allPlayers = [];
        const fetchPromises = [];

        for (const [serverId, serverName] of Object.entries(SERVER_LIST)) {
            // raceId (0, 1, 2) 를 그대로 rankingType에 적용합니다
            const url = `https://aion2.plaync.com/api/ranking/list?lang=ko&rankingContentsType=1&rankingType=${raceId}&serverId=${serverId}`;
            
            const p = fetch(url)
                .then(r => r.json())
                .then(data => {
                    if (data && data.rankingList) {
                        const listWithServer = data.rankingList.map(user => ({
                            ...user,
                            serverId: serverId,
                            serverName: serverName 
                        }));
                        allPlayers.push(...listWithServer);
                    }
                }).catch(e => console.error(`${serverName} 랭킹 로드 오류`));
            
            fetchPromises.push(p);
        }

        await Promise.all(fetchPromises);
        allPlayers.sort((a, b) => (b.point || 0) - (a.point || 0));

        const topRanking = allPlayers.slice(0, 50);
        res.status(200).json({ list: topRanking });

    } catch (error) {
        res.status(500).json({ error: "랭킹 서버 오류" });
    }
