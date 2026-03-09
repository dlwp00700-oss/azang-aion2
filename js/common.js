// 검색창 숨김/표시 처리
const originSwitchTab = window.switchTab;
window.switchTab = function(id, el) {
    if (originSwitchTab) {
        try { originSwitchTab(id, el); } catch(e) {}
    }
    const searchUI = document.getElementById('globalSearchUI');
    if (searchUI) {
        searchUI.style.display = (id === 'equip' || id === 'autoOpt') ? 'block' : 'none';
    }
    if (id === 'autoOpt') {
        window.renderOptEquipList();
        window.toggleOptGoalInput();
    }
};
	// =========================================================================
// 🌟 [UI 마법] 검색창을 모든 탭에서 볼 수 있게 맨 위로 꺼내기
// =========================================================================
window.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('.top-nav');
    let searchArea = document.getElementById('globalSearchUI');
    if (!searchArea) {
        searchArea = document.createElement('div');
        searchArea.id = 'globalSearchUI';
        // 네비게이션 메뉴 바로 아래에 전용 구역 생성
        nav.parentNode.insertBefore(searchArea, nav.nextSibling);
    }
    
    // 장비 탭 안에 갇혀있던 요소들을 밖으로 이사시킵니다!
    const searchBar = document.querySelector('.search-bar');
    const favBar = document.getElementById('favoritesBar');
    const charSel = document.getElementById('characterSelection');
    
    if(searchBar) searchArea.appendChild(searchBar);
    if(favBar) searchArea.appendChild(favBar);
    if(charSel) searchArea.appendChild(charSel);
});

// 복사 중 발생한 치명적인 에러를 화면에 띄워주는 안전장치
    window.onerror = function(msg, url, lineNo) {
        alert("🚨 데이터를 붙여넣는 과정에서 문법 오류가 발생했습니다!\n\n오류 내용: " + msg + "\n오류 발생 줄: " + lineNo + "번째 줄 주변\n\n각 직업이 끝나는 '}' 뒤에 쉼표(,)가 잘 있는지 확인해 주세요!");
    };

    let currentClass = ""; // 처음 시작할 땐 아무것도 선택되지 않음

    function selectClass(className) {
        currentClass = className;
        document.querySelectorAll('.class-btn').forEach(btn => {
            btn.classList.toggle('active', btn.innerText === className);
        });
        loadClassData();
    }
