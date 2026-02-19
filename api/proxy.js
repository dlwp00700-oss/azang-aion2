export default async function handler(req, res) {
    const { endpoint, ...queryParams } = req.query;
    
    // 에러 방지 방어막
    if (!endpoint) {
        return res.status(400).json({ error: "엔드포인트가 없습니다." });
    }

    // 기본 파라미터 세팅 (NC API 필수값)
    queryParams.lang = 'ko';

    // 파라미터 조립 및 최종 URL 생성
    const queryString = new URLSearchParams(queryParams).toString();
    const url = `https://aion2.plaync.com/api/${endpoint}?${queryString}`;

    try {
        // 일반 브라우저로 완벽 위장하여 엔씨 서버 폭격
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://aion2.plaync.com/',
                'Origin': 'https://aion2.plaync.com',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'ko-KR,ko;q=0.9'
            }
        });
        
        const data = await response.text();
        
        // 프론트엔드(index.html)가 오해하지 않도록 JSON 명시
        res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
        res.status(response.status).send(data);
        
    } catch (error) {
        res.status(500).json({ error: "프록시 서버 에러", details: error.message });
    }
}
