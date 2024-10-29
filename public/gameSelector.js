document.addEventListener('DOMContentLoaded', function () {
    const gameSelector = document.getElementById('gameSelector');
    // 获取游戏列表
    fetch('/games')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const gameSelect = localStorage.getItem('gameSelect');
                for (let index = 0; index < data.games.length; index++) {
                    const game = data.games[index];
                    const option = document.createElement('option');
                    option.value = game;
                    option.textContent = game;
                    gameSelector.appendChild(option);
                    if (gameSelect === game) {
                        gameSelector.value = game;
                    }
                }
            } else {
                console.error('Failed to load games:', data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching games:', error);
        });
});