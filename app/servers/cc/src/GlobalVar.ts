import * as fs from 'fs';
import * as path from 'path';
import { ConfigServer } from './ConfigServer';
import { GameMgr } from './GameMgr';
import * as service from '../../../../config/service.json';

export class GlobalVar {
    static server: ConfigServer;

    static gameMgr: GameMgr;

    static init() {
        global.serviceConfig = service[env];
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
