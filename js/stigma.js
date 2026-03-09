// =========================================================
// 📊 스티그마 통계 데이터 처리 엔진
// =========================================================
let globalStigmaData = null; 

async function loadStigmaStats() {
    const timeLabel = document.getElementById('statsUpdateTime');
    if (globalStigmaData) return;
    
    try {
        const response = await fetch('/api/getStats');
        const dbResult = await response.json();

        if (dbResult.error) {
            timeLabel.innerHTML = `<span style="color:#ff5252;">에러: ${dbResult.error}</span>`;
            return;
        }
        globalStigmaData = dbResult;
        
        const updateDate = new Date(dbResult.updatedAt);
        timeLabel.innerHTML = `마지막 업데이트: <span style="color:#ffca28;">${updateDate.toLocaleString()}</span> (하루 1번 자동 수집)`;

        // 처음에 검성(1번) 보여주기
        renderClassStats(1);
    } catch (error) {
        timeLabel.innerHTML = `<span style="color:#ff5252;">데이터를 불러오는 데 실패했습니다.</span>`;
    }
}

function renderClassStats(classId) {
    const container = document.getElementById('stigmaListContainer');
    
    // 눌린 버튼 색깔 칠하기 로직
    const btns = document.getElementById('stigmaClassButtons').querySelectorAll('.class-btn');
    btns.forEach(btn => btn.classList.remove('active'));
    // 어떤 버튼이 눌렸는지 찾아서 active 붙이기 (간단 처리)
    const btnIndexMap = {1:0, 2:1, 4:2, 5:3, 7:4, 8:5, 10:6, 11:7};
    if (btns[btnIndexMap[classId]]) btns[btnIndexMap[classId]].classList.add('active');

    if (!globalStigmaData || !globalStigmaData.statsByClass[classId]) {
        container.innerHTML = `<p style="text-align:center; color:#888; padding:30px;">아직 수집된 데이터가 없습니다.</p>`;
        return;
    }

    const classData = globalStigmaData.statsByClass[classId];
    
    let htmlContent = `<div style="text-align:right; font-size:12px; color:#aaa; margin-bottom:10px;">(수집 인원: 상위 ${classData.targetCount}명 기준)</div>`;
    htmlContent += `<ul class="stigma-list" style="list-style: none; padding: 0; margin: 0;">`;
    
    if (classData.stigmaRank.length === 0) {
        htmlContent += `<p style="color:#666; text-align:center;">장착 중인 스티그마 정보가 없습니다.</p>`;
    } else {
        classData.stigmaRank.forEach((skill, index) => {
            let rankIcon = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `<b style="color:#aaa;">${index + 1}</b>`;
            
            // 🌟 레벨별 인원수를 예쁜 뱃지로 만들기
            let levelBadges = "";
            if (skill.levels) {
                // 레벨 높은 순서대로 정렬 (예: +15, +10, 기본)
                const sortedLevels = Object.keys(skill.levels).sort((a, b) => Number(b) - Number(a));
                sortedLevels.forEach(lvl => {
                    let displayLvl = lvl === "0" ? "기본" : `+${lvl}`;
                    levelBadges += `<span style="display: inline-block; background: #222; padding: 3px 6px; border-radius: 4px; font-size: 11px; margin-right: 5px; color: #ddd; border: 1px solid #444;">${displayLvl} <b style="color:#ffca28;">${skill.levels[lvl]}명</b></span>`;
                });
            }

            htmlContent += `
                <li style="display: flex; align-items: center; margin-bottom: 12px; background: rgba(255,255,255,0.05); border: 1px solid #333; border-radius: 8px; padding: 12px;">
                    <span style="width: 30px; text-align: center; margin-right: 10px; font-size: 1.2em;">${rankIcon}</span>
                    <img src="${skill.icon}" alt="${skill.name}" style="width: 44px; height: 44px; border-radius: 8px; margin-right: 15px; border: 1px solid #555;" onerror="this.style.display='none'">
                    <div style="flex-grow: 1;">
                        <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 6px;">
                            <strong style="font-size: 15px; color: #fff;">${skill.name}</strong>
                            <div style="display: flex; flex-wrap: wrap;">${levelBadges}</div>
                        </div>
                        <div style="background-color: #222; height: 8px; border-radius: 4px; width: 100%; border: 1px solid #111;">
                            <div style="background: linear-gradient(90deg, #00e676, #69f0ae); height: 100%; border-radius: 4px; width: ${skill.pickRate}%;"></div>
                        </div>
                    </div>
                    <div style="width: 60px; text-align: right; font-weight: bold; color: #00e676; font-size: 17px;">
                        ${skill.pickRate}%
                    </div>
                </li>
            `;
        });
    }
    htmlContent += `</ul>`;
    container.innerHTML = htmlContent;
}

    // ✨ 페이지 처음 접속 시, 빈 화면을 띄워두고 대기합니다.
    window.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.class-btn').forEach(btn => btn.classList.remove('active'));
    });
