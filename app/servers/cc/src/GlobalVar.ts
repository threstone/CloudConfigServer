import * as fs from 'fs';
import * as path from 'path';
import { ConfigServer } from './ConfigServer';
import * as serverConfig from '../config/server.json';
import { GameMgr } from './GameMgr';

export class GlobalVar {
    static server: ConfigServer;

    static gameMgr: GameMgr;

    static init() {
        this.gameMgr = new GameMgr();

        this.server = new ConfigServer(serverConfig.port);
        this.initRouter();
    }

    private static initRouter() {
        const pathStr = path.join(__dirname, 'router');
        const files = fs.readdirSync(pathStr);
        files.forEach((fileName) => {
            if (fileName.endsWith('.js')) {
                // eslint-disable-next-line import/no-dynamic-require, global-require
                require(path.join(pathStr, fileName));
            }
        });
    }
}
