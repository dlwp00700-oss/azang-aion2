// api/getStats.js

module.exports = async function handler(req, res) {
    // DB 접속 정보 (cronStats와 동일하게 유지)
    const KV_URL = process.env.azang_db_KV_REST_API_URL;
    const KV_TOKEN = process.env.azang_db_KV_REST_API_TOKEN;

    if (!KV_URL || !KV_TOKEN) {
        return res.status(500).json({ error: "DB 접속 정보가 없습니다." });
    }

    try {
        // Vercel KV(Upstash)에서 'stats_assassin' 데이터 꺼내오기
        const response = await fetch(`${KV_URL}/get/stats_assassin`, {
            headers: { 
                Authorization: `Bearer ${KV_TOKEN}`
            }
        });
        
        const data = await response.json();
        
        // DB에서 꺼낸 데이터가 문자열(String)이면 JSON으로 변환
        let resultData = data.result;
        if (typeof resultData === 'string') {
            resultData = JSON.parse(resultData);
        }

        // 성공적으로 꺼냈다면 프론트엔드(웹사이트)로 전달!
        res.status(200).json(resultData || { error: "아직 수집된 데이터가 없습니다." });

    } catch (error) {
        console.error("DB 조회 에러:", error);
        res.status(500).json({ error: "통계 데이터를 불러오지 못했습니다.", details: error.message });
    }
};
