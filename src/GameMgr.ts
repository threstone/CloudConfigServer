import * as fs from 'fs';
import * as path from 'path';

export class GameMgr {
    games: string[];

    constructor() {
        const gameFilePath = path.join(__dirname, '../../public/game.json');
        if (fs.existsSync(gameFilePath)) {
            this.games = JSON.parse(fs.readFileSync(gameFilePath, 'utf8'));
        } else {
            this.games = [];
        }
    }

    addGame(gameName: string) {
        if (!gameName || this.games.indexOf(gameName) !== -1) {
            return false;
        }
        this.games.push(gameName);
        const gameFilePath = path.join(__dirname, '../../public/game.json');
        fs.writeFileSync(gameFilePath, JSON.stringify(this.games), { flag: 'w' });
        return true;
    }
}
