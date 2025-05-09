import * as Koa from 'koa';
import { GlobalVar } from '../GlobalVar';

async function games(ctx: Koa.Context) {
    ctx.body = { success: true, games: GlobalVar.gameMgr.games };
}

async function addGame(ctx: Koa.Context) {
    const { game } = ctx.request.body as any;
    ctx.body = { success: GlobalVar.gameMgr.addGame(game) };
}

async function setServerNotifyUrl(ctx: Koa.Context) {
    const { game, url } = ctx.request.body as any;
    ctx.body = { success: GlobalVar.gameMgr.setGameServerUrl(game, url) };
    GlobalVar.gameMgr.notifyServer(game);
}

GlobalVar.server.getRouter().get('/games', games);
GlobalVar.server.getRouter().post('/games', addGame);
GlobalVar.server.getRouter().post('/setServerNotifyUrl', setServerNotifyUrl);
