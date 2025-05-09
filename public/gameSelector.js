const gameFilterInput = document.getElementById('gameFilter');
function initGame(filter) {
    const gameSelector = document.getElementById('gameSelector');
    gameSelector.replaceChildren();
    const gameServerUrlInput = document.getElementById('gameServerUrlInput');
    gameServerUrlInput.value = '';
    Object.keys(games).forEach((game) => {
        if (filter?.length > 0 && !game.startsWith(filter)) {
            return;
        }
        const gameSelect = localStorage.getItem('gameSelect');
        const option = document.createElement('option');
        option.value = game;
        option.textContent = game;
        gameSelector.appendChild(option);
        if (!gameSelect || gameSelect === game) {
            gameSelector.value = game;
            gameServerUrlInput.value = games[game];
        }
    });
}


document.addEventListener('DOMContentLoaded', function () {
    // 获取游戏列表
    fetch('/games')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.games = data.games;
                const filter = localStorage.getItem('gameFilter');
                if (filter?.length > 0) {
                    gameFilterInput.value = filter;
                }
                initGame(filter);
            } else {
                console.error('Failed to load games:', data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching games:', error);
        });
});

document.getElementById('gameFilterBtn').addEventListener('click', function (event) {
    const value = gameFilterInput.value.trim();
    localStorage.setItem('gameFilter', value);
    initGame(value);
});