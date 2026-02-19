export default async function handler(req, res) {
    // 1. 프론트엔드가 요청한 주소 파악
    const pathArr = req.query.path || [];
    const endpoint = pathArr.join('/');
    
    // 2. 파라미터 조립
    const queryParams = { ...req.query };
    delete queryParams.path;
    const queryString = new URLSearchParams(queryParams).toString();
    
    // 3. 엔씨소프트 최종 목적지
    const url = `https://aion2.plaync.com/api/${endpoint}${queryString ? '?' + queryString : ''}`;

    try {
        // ★ 여기가 핵심! 로봇이 아니라 '일반 크롬 브라우저'인 척 신분증(Headers)을 달고 요청
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://aion2.plaync.com/',
                'Origin': 'https://aion2.plaync.com',
                'Accept': 'application/json'
            }
        });
        
        // 4. 받아온 데이터를 내 사이트로 토스
        const data = await response.text();
        res.status(response.status).send(data);
    } catch (error) {
        res.status(500).json({ error: "프록시 에러", details: error.message });
    }
}
