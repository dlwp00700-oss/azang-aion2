const express = require('express');
const app = express();
const axios = require('axios');
const cors = require('cors');

app.use(cors());

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://aion2.plaync.com/',
    'Origin': 'https://aion2.plaync.com'
};

app.get('/api/servers', async (req, res) => {
    try { res.json((await axios.get('https://aion2.plaync.com/api/gameinfo/servers?lang=ko', { headers })).data); } 
    catch (e) { res.status(500).json({ error: "서버 목록 실패" }); }
});

app.get('/api/searchList', async (req, res) => {
    const { name, race, serverId } = req.query;
    try { res.json((await axios.get(`https://aion2.plaync.com/ko-kr/api/search/aion2/search/v2/character?keyword=${encodeURIComponent(name)}&race=${race}&serverId=${serverId || ''}&page=1&size=30`, { headers })).data); } 
    catch (e) { res.status(500).json({ error: "검색 실패" }); }
});

app.get('/api/characterDetail', async (req, res) => {
    let { characterId, serverId } = req.query;
    characterId = decodeURIComponent(characterId);
    try {
        const [equipRes, infoRes] = await Promise.all([
            axios.get(`https://aion2.plaync.com/api/character/equipment?lang=ko&characterId=${encodeURIComponent(characterId)}&serverId=${serverId}`, { headers }),
            axios.get(`https://aion2.plaync.com/api/character/info?lang=ko&characterId=${encodeURIComponent(characterId)}&serverId=${serverId}`, { headers })
        ]);
        const eqData = equipRes.data;
        const eqList = eqData.equipment?.equipment?.equipmentList || eqData.equipment?.equipmentList || [];
        const detailPromises = eqList.map(async (eq) => {
            if (!eq.id) return eq;
            try {
                const dRes = await axios.get(`https://aion2.plaync.com/api/character/equipment/item?id=${eq.id}&enchantLevel=${eq.enchantLevel||0}&exceedLevel=${eq.exceedLevel||0}&characterId=${encodeURIComponent(characterId)}&serverId=${serverId}&slotPos=${eq.slotPos||0}&lang=ko`, { headers });
                return { ...eq, ...dRes.data, enchantLevel: eq.enchantLevel, exceedLevel: eq.exceedLevel };
            } catch (err) { return eq; }
        });
        const dEqList = await Promise.all(detailPromises);
        if (eqData.equipment?.equipment?.equipmentList) eqData.equipment.equipment.equipmentList = dEqList;
        else if (eqData.equipment?.equipmentList) eqData.equipment.equipmentList = dEqList;
        res.json({ equipment: eqData, info: infoRes.data });
    } catch (e) { res.status(500).json({ error: "상세 정보 실패" }); }
});

app.get('/api/searchDictItem', async (req, res) => {
    try {
        const keyword = req.query.keyword;
        const url = `https://api-goats.plaync.com/aion2/v2.0/dict/search/item?size=50&page=1&searchKeyword=${encodeURIComponent(keyword)}&locale=ko-KR`;
        const response = await axios.get(url, { headers });
        res.json(response.data);
    } catch (e) { res.status(500).json({ error: "사전 검색 실패" }); }
});

app.get('/api/getDictItemDetail', async (req, res) => {
    const { id, enchantLevel, exceedLevel } = req.query;
    try {
        const url = `https://aion2.plaync.com/api/gameconst/item?id=${id}&enchantLevel=${enchantLevel || 0}&exceedLevel=${exceedLevel || 0}&lang=ko`;
        const response = await axios.get(url, { headers });
        res.json(response.data);
    } catch (e) { res.status(500).json({ error: "사전 상세 조회 실패" }); }
});

// Vercel 환경을 위해 app.listen 대신 app을 내보냅니다.
module.exports = app;
