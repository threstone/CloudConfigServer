const fs = require('fs').promises;
const crypto = require('crypto')
const path = require('path');
const Xls2json = require('./Xls2json');

let serverConfigOutputPath;
let clientConfigOutputPath;

export async function gen(excelPath, gameName, files) {
    const targetDir = path.join(process.cwd(), `./public/${gameName}`);
    await mkdirIfNotExist(targetDir);
    serverConfigOutputPath = path.join(targetDir, '/server/');
    clientConfigOutputPath = path.join(targetDir, '/client/');
    await mkdirIfNotExist(serverConfigOutputPath);
    await mkdirIfNotExist(clientConfigOutputPath);

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

async function mergeAllConfig(dirPath) {
    const mergeTarget = path.join(dirPath, '/GameJsonCfg.json');
    if (require('fs').existsSync(mergeTarget)) {
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
        for (const key in config.dataList) {
            const value = config.dataList[key];
            if (isNaN(value.id)) { continue; }
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
                if (csData.isS) {
                    tempS[keyOfObj] = value[keyOfObj];
                    hasS = true;
                }
            }

            if (hasC) {
                c[key] = tempC;
            }
            if (hasS) {
                s[key] = tempS;
            }
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
