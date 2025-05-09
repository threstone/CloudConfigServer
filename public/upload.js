const gameSelector = document.getElementById('gameSelector');
const uploadResultEle = document.getElementById('uploadResult');
const gameServerUrlInput = document.getElementById('gameServerUrlInput');
const filesEle = document.getElementById('files');
gameSelector.addEventListener('change', function () {
    uploadResultEle.innerHTML = '';
    filesEle.value = '';
    gameServerUrlInput.value = games[gameSelector.value] || '';
    const selectedGame = gameSelector.value;
    localStorage.setItem('gameSelect', selectedGame);
});

document.getElementById('uploadForm').addEventListener('submit', function (event) {
    event.preventDefault(); // 阻止表单默认提交
    uploadResultEle.innerHTML = '';
    const files = filesEle.files;
    if (files.length < 1) {
        displayErrorMessage('未选中配置');
        return;
    }
    const formData = new FormData();
    const selectedGame = gameSelector.value;
    if (selectedGame.length < 1) {
        displayErrorMessage('未选中游戏');
        return;
    }
    formData.append('game', selectedGame);

    // 循环添加所有选中的文件到 formData
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }

    const startTime = Date.now();
    fetch('/upload', {
        method: 'POST',
        body: formData,
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                uploadResultEle.innerHTML = '';
                filesEle.value = '';
                displayUploadedFiles(data.files, startTime); // 显示上传成功的文件列表
            } else {
                displayErrorMessage('Upload failed: ' + data.error); // 显示错误消息
            }
        })
        .catch(error => {
            console.error('Error:', error);
            displayErrorMessage('Upload failed due to network error.'); // 显示网络错误消息
        });
});

document.getElementById('clearConfig').addEventListener('click', function (event) {
    event.preventDefault(); // 阻止表单默认提交
    const selectedGame = gameSelector.value;
    if (selectedGame.length < 1) {
        displayErrorMessage('未选中游戏');
        return;
    }
    fetch('/deleteAll', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ game: selectedGame }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                uploadResultEle.innerHTML = `<h2>清空成功</h2>`; // 显示成功消息
            } else {
                displayErrorMessage('清空失败:' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
});

document.getElementById('createGame').addEventListener('click', function (event) {
    const createGameInput = document.getElementById('createGameInput');
    const gameName = createGameInput.value;
    createGameInput.value = '';
    if (gameName.length < 1) { return displayErrorMessage('请输入游戏名称'); }
    fetch('/games', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ game: gameName }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('createResLable').innerHTML = '<p style="color: red">创建成功</p>';
                const gameSelector = document.getElementById('gameSelector');
                const option = document.createElement('option');
                option.value = gameName;
                option.textContent = gameName;
                gameSelector.appendChild(option);
            } else {
                document.getElementById('createResLable').innerHTML = '<p style="color: red">创建失败</p>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
});

document.getElementById('setGameServerUrl').addEventListener('click', function (event) {
    const selectedGame = gameSelector.value;
    if (selectedGame.length < 1) {
        displayErrorMessage('未选中游戏');
        return;
    }
    const gameServerUrlInput = document.getElementById('gameServerUrlInput');
    const serverUrl = gameServerUrlInput.value;
    if (serverUrl === '未配置' || serverUrl.length < 1) {
        return document.getElementById('setServerUrlResLable').innerHTML = '<p style="color: red">请先设置服务器地址</p>';
    }
    fetch('/setServerNotifyUrl', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ game: selectedGame, url: serverUrl }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('setServerUrlResLable').innerHTML = '<p style="color: red">设置成功</p>';
            } else {
                document.getElementById('setServerUrlResLable').innerHTML = '<p style="color: red">设置成功</p>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
});

function displayUploadedFiles(fileNames, startTime) {
    const resultDiv = uploadResultEle;
    resultDiv.innerHTML = `<h2>Files uploaded successfully:${Date.now() - startTime}ms</h2>`; // 显示成功消息
    const ul = document.createElement('ul');
    fileNames.forEach(fileName => {
        const li = document.createElement('li');
        li.textContent = fileName;
        ul.appendChild(li);
    });
    resultDiv.appendChild(ul); // 将文件列表添加到结果区域
}

function displayErrorMessage(message) {
    const resultDiv = uploadResultEle;
    resultDiv.innerHTML = `<p style="color: red">${message}</p>`; // 显示错误消息
}