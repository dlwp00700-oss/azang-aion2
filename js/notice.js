// 🚀 신규: 링크 복사 기능
    function copyShareLink() {
        if(!currentLoadedChar) return alert("캐릭터를 먼저 불러오세요!");
        const url = `https://aion2zang.info/user/${currentLoadedChar.serverId}/${encodeURIComponent(currentLoadedChar.characterName)}`;
        navigator.clipboard.writeText(url).then(() => {
            alert(`🔗 공유 링크가 복사되었습니다!\n\n${url}\n\n커뮤니티나 단톡방에 내 템셋팅을 자랑해보세요!`);
        });
    }

 // 🚀 구글 스프레드시트에서 공지사항 불러오기 (최신글이 위로 오도록 역순 정렬 적용!)
    async function loadGoogleSheetNotices() {
        if (!document.getElementById('patchNoteList')) return;
        const tsvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS7KVEKjGV3ccGMUSWxOor2AIyNx8TQRY6xU0cvCQP7SJqZC9-Q9sDdVll-YYffrzIe3KR9hIO75LA-/pub?output=tsv'; 
        try {
            const response = await fetch(tsvUrl);
            const data = await response.text();
            const rows = data.split('\n'); 
            let patchHtml = ''; let updateHtml = '';
            
            // 🚀 핵심: i를 배열 끝(최신 글)부터 시작해서 거꾸로(-1) 내려가며 읽어옵니다.
            for(let i = rows.length - 1; i >= 1; i--) {
                if(!rows[i].trim()) continue; 
                const cols = rows[i].split('\t'); 
                const type = (cols[0] || '').trim(); 
                const date = (cols[1] || '').trim(); 
                const title = (cols[2] || '').trim(); 
                const content = (cols[3] || '').trim(); 
                const linkUrl = (cols[4] || '').trim(); 
                
                let linkButtonHtml = '';
                if (linkUrl) {
                    linkButtonHtml = `<div style="margin-top:12px;"><a href="${linkUrl}" target="_blank" style="display:inline-block; padding:6px 12px; background:#1a1a24; border:1px solid #4fc3f7; color:#4fc3f7; text-decoration:none; border-radius:4px; font-size:11px; font-weight:bold; transition:0.2s;" onmouseover="this.style.background='#4fc3f7'; this.style.color='#000'" onmouseout="this.style.background='#1a1a24'; this.style.color='#4fc3f7'">🔗 공식 홈페이지 원문 보기</a></div>`;
                }

                const itemHtml = `
                <li style="padding: 0; border-bottom: 1px solid #222;">
                    <details class="news-details">
                        <summary>
                            <span style="color:#4fc3f7; min-width:75px; font-weight:bold;">${date}</span> 
                            <span style="flex:1;">${title}</span>
                            <span style="color:#888; font-size:10px;">▼</span>
                        </summary>
                        <div class="news-content">
                            ${content}
                            ${linkButtonHtml}
                        </div>
                    </details>
                </li>`;
                
                if(type === '패치') patchHtml += itemHtml;
                else if(type === '업데이트') updateHtml += itemHtml;
            }
            document.getElementById('patchNoteList').innerHTML = patchHtml || '<li style="padding:15px; text-align:center; color:#888;">등록된 내용이 없습니다.</li>';
            document.getElementById('updateNoteList').innerHTML = updateHtml || '<li style="padding:15px; text-align:center; color:#888;">등록된 내용이 없습니다.</li>';
        } catch (error) {
            document.getElementById('patchNoteList').innerHTML = '<li style="padding:15px; text-align:center; color:#ff5252;">데이터를 불러오지 못했습니다.</li>';
            document.getElementById('updateNoteList').innerHTML = '<li style="padding:15px; text-align:center; color:#ff5252;">데이터를 불러오지 못했습니다.</li>';
        }
    }
