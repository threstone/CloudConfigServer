import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import axios from 'axios';

export class GameMgr {
    games: { [key: string]: string };

    constructor() {
        const gameFilePath = path.join(process.cwd(), './public/game.json');
        if (fs.existsSync(gameFilePath)) {
            this.games = JSON.parse(fs.readFileSync(gameFilePath, 'utf8'));
        } else {
            this.games = {};
        }
    }

    addGame(gameName: string) {
        if (!gameName || this.games[gameName] != null) {
            return false;
        }
        this.games[gameName] = '';
        this.syncConfig();
        return true;
    }

    setGameServerUrl(gameName: string, serverUrl: string) {
        if (!gameName || !serverUrl || this.games[gameName] == null) {
            return false;
        }
        if (this.games[gameName] === serverUrl) { return true; }
        this.games[gameName] = serverUrl;
        this.syncConfig();
        return true;
    }

    private syncConfig() {
        const gameFilePath = path.join(process.cwd(), './public/game.json');
        fs.writeFileSync(gameFilePath, JSON.stringify(this.games), { flag: 'w' });
    }

    async notifyServer(gameName: string) {
        if (!this.games[gameName] || this.games[gameName].length < 5) {
            return;
        }
        const url = this.games[gameName];
        const body: any = { time: Date.now() };
        body.sign = this.getSign(body);
        await axios.post(url, body);
    }

    private getSign(v: any, key: string = 'test') {
        const args = JSON.parse(JSON.stringify(v));
        delete args.sign;
        let keys = Object.keys(args);
        if (keys.length <= 0) {
            return null;
        }
        keys = keys.sort();
        let str = '';
        keys.forEach((k) => {
            str += `&${k}=${v[k]}`;
        });
        str = str.substring(1);
        str += key;
        const sign = crypto.createHash('md5').update(str, 'utf8').digest('hex');
        return sign.toLowerCase();
    }
}
