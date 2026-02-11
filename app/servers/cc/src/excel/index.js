const fs = require('fs').promises;
const crypto = require('crypto')
const path = require('path');
const Xls2json = require('./Xls2json');
const existsSync = require('fs').existsSync;

let serverConfigOutputPath;
let clientConfigOutputPath;

export async function gen(excelPath, gameName, files) {
    const targetDir = path.join(process.cwd(), `./public/${gameName}`);
    await mkdirIfNotExist(targetDir);
    serverConfigOutputPath = path.join(targetDir, '/server/');
    clientConfigOutputPath = path.join(targetDir, '/client/');
    await mkdirIfNotExist(serverConfigOutputPath);
    await mkdirIfNotExist(clientConfigOutputPath);

    // 将当前GameJsonCfg.json备份
    await backupGameJsonCfg(
        clientConfigOutputPath,
        serverConfigOutputPath,
        path.join(process.cwd(), `./public/${gameName}/backup/`)
    );

    const tasks = [];
    for (let index = 0; index < files.length; index++) {
        const filename = files[index];
        if (filename.startsWith('~') || filename.endsWith('.xlsx') === false) {
            continue
        }

        tasks.push(writeExcel(excelPath + filename));
    }
    await Promise.all(tasks);

    // 合并所有配置在一起
    mergeAllConfig(serverConfigOutputPath);
    mergeAllConfig(clientConfigOutputPath);
}

async function backupGameJsonCfg(clientConfigOutputPath, serverConfigOutputPath, dirPath) {
    await mkdirIfNotExist(dirPath);
    const timestamp = formatDate(new Date());

    const clientTarget = path.join(clientConfigOutputPath, '/GameJsonCfg.json');
    if (existsSync(clientTarget)) {
        await fs.copyFile(clientTarget, path.join(dirPath, `client_${timestamp}.json`));
    }

    const serverTarget = path.join(serverConfigOutputPath, '/GameJsonCfg.json');
    if (existsSync(serverTarget)) {
        await fs.copyFile(serverTarget, path.join(dirPath, `server_${timestamp}.json`));
    }

    // 备份完成后清空备份目录,只保留最新的20个备份
    const backupFiles = await fs.readdir(dirPath);
    const jsonFiles = backupFiles.filter(f => f.endsWith('.json'));
    const maxCount = 20;
    if (jsonFiles.length > maxCount) {
        // 按修改时间降序排列
        const fileStats = await Promise.all(
            jsonFiles.map(async (f) => {
                const filePath = path.join(dirPath, f);
                const stat = await fs.stat(filePath);
                return { name: f, mtime: stat.mtimeMs };
            })
        );
        fileStats.sort((a, b) => b.mtime - a.mtime);
        // 删除最旧的文件，只保留最新的maxCount个
        const toDelete = fileStats.slice(maxCount);
        await Promise.all(toDelete.map(f => fs.rm(path.join(dirPath, f.name))));
    }
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

async function mergeAllConfig(dirPath) {
    const mergeTarget = path.join(dirPath, '/GameJsonCfg.json');
    if (existsSync(mergeTarget)) {
        await fs.rm(mergeTarget);
    }
    const gameJsonCfg = {};
    const files = await fs.readdir(dirPath);
    const tasks = [];
    files.forEach((fileName) => {
        if (!fileName.endsWith('.json')) {
            return;
        }
        tasks.push(new Promise(async (resolve) => {
            const json = JSON.parse(await fs.readFile(path.join(dirPath, fileName), 'utf8'));
            gameJsonCfg[fileName.substring(0, fileName.indexOf('.json'))] = json;
            resolve();
        }));
    });

    await Promise.all(tasks);
    await fs.writeFile(mergeTarget, JSON.stringify(gameJsonCfg));
}

async function writeExcel(xlsxPath) {
    const data = new Xls2json(xlsxPath, 1, 2, 3, 4, 5);
    const sheetConfigs = await data.fromFileAsync()
    const tasks = [];
    const sheetKeys = Object.keys(sheetConfigs);
    for (let index = 0; index < sheetKeys.length; index++) {
        const sheetName = sheetKeys[index];
        tasks.push(writeSheet(sheetName, sheetConfigs[sheetName]));
    }
    await Promise.all(tasks);
    console.log('完成', xlsxPath);
}

async function writeSheet(sheetName, config) {
    let c, s;
    if (config.isMap) {
        c = config.dataList;
        s = config.dataList;
    } else {
        c = [];
        s = [];
        config.csMap = {};
        for (let index = 0; index < config.varList?.length; index++) {
            const key = config.varList[index];
            config.csMap[key] = {
                isC: config.csList[index].indexOf('c') !== -1,
                isS: config.csList[index].indexOf('s') !== -1
            }
        }

        let vIndex = 0;
        for (const key in config.dataList) {
            const value = config.dataList[key];
            if (!value.id) { continue; }
            const tempC = {};
            let hasC = false;
            const tempS = {};
            let hasS = false;

            for (let index = 0; index < config.varList.length; index++) {
                const keyOfObj = config.varList[index];
                const csData = config.csMap[keyOfObj];
                if (csData.isC) {
                    tempC[keyOfObj] = value[keyOfObj];
                    hasC = true;
                }
                // 服务端需要所有配置,因为服务端计算战力的时候需要用到客户端配置
                if (csData.isC || csData.isS) {
                    tempS[keyOfObj] = value[keyOfObj];
                    hasS = true;
                }
            }

            if (hasC) {
                c[vIndex] = tempC;
            }
            if (hasS) {
                s[vIndex] = tempS;
            }
            vIndex += 1;
        }
    }
    await fs.writeFile(path.join(serverConfigOutputPath, sheetName + '.json'), stringify(s, { indent: 2, maxLength: 260 }));
    await fs.writeFile(path.join(clientConfigOutputPath, sheetName + '.json'), stringify(c, { indent: 2, maxLength: 260 }));
}


async function mkdirIfNotExist(dirPath) {
    try {
        await fs.stat(dirPath);
    } catch (error) {
        await fs.mkdir(dirPath);
    }
}

function stringify(passedObj, options) {
    var stringOrChar = /("(?:[^\\"]|\\.)*")|[:,]/g;
    var arrayAndObject = /\[\{/g;
    var indent, maxLength, replacer;
    options = options || {};
    indent = JSON.stringify([1], undefined, options.indent === undefined ? 2 : options.indent).slice(2, -3);
    maxLength = indent === "" ? Infinity : options.maxLength === undefined ? 150 : options.maxLength;
    replacer = options.replacer;
    return (function _stringify(obj, currentIndent, reserved) {
        var end, index, items, key, keyPart, keys, length, nextIndent, prettified, start, string, value;
        if (obj && typeof obj.toJSON === "function") {
            obj = obj.toJSON();
        }
        string = JSON.stringify(obj, replacer);
        if (string === undefined) {
            return string;
        }
        length = maxLength - currentIndent.length - reserved;
        if (string.length <= length && string.search(arrayAndObject)) {
            prettified = string.replace(stringOrChar, function (match, stringLiteral) {
                return stringLiteral || match + " ";
            });
            if (prettified.length <= length) {
                prettified = prettified.replace(/: /g, ":");
                prettified = prettified.replace(/, /g, ",");
                return prettified;
            }
        }
        if (replacer != null) {
            obj = JSON.parse(string);
            replacer = undefined;
        }
        if (typeof obj === "object" && obj !== null) {
            nextIndent = currentIndent + indent;
            items = [];
            index = 0;
            if (Array.isArray(obj)) {
                start = "[";
                end = "]";
                length = obj.length;
                for (; index < length; index++) {
                    items.push(_stringify(obj[index], nextIndent, index === length - 1 ? 0 : 1) || "null");
                }
            } else {
                start = "{";
                end = "}";
                keys = Object.keys(obj);
                length = keys.length;
                for (; index < length; index++) {
                    key = keys[index];
                    keyPart = JSON.stringify(key) + ":";
                    value = _stringify(obj[key], nextIndent, keyPart.length + (index === length - 1 ? 0 : 1));
                    if (value !== undefined) {
                        items.push(keyPart + value);
                    }
                }
            }
            if (items.length > 0) {
                return [start, indent + items.join(",\n" + nextIndent), end].join("\n" + currentIndent);
            }
        }
        return string;
    })(passedObj, "", 0);
};
function getIntHash(name) {
    // 创建一个哈希实例，这里使用'md5'
    const hash = crypto.createHash('md5');
    // 更新哈希实例的数据，这里是要哈希的字符串
    hash.update(name);
    // 计算哈希值，返回一个十六进制的字符串
    const hexHash = hash.digest('hex');
    return parseInt(hexHash.substring(0, 8), 16);
}
