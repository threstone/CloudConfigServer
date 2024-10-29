import * as fs from 'fs';
import * as path from 'path';
import { configure, getLogger } from 'log4js';
import { ConfigServer } from './ConfigServer';
import * as log4jsConfig from '../config/log4js.json';
import * as serverConfig from '../config/server.json';
import { GameMgr } from './GameMgr';

export class GlobalVar {
    static server: ConfigServer;

    static gameMgr: GameMgr;

    static init() {
        configure(log4jsConfig);
        global.logger = getLogger();

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
