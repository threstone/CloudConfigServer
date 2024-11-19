import * as Koa from 'koa';
import { GlobalVar } from '../GlobalVar';

async function games(ctx: Koa.Context) {
    ctx.body = { success: true, games: GlobalVar.gameMgr.games };
}

async function addGame(ctx: Koa.Context) {
    const { game } = ctx.request.body as any;
    ctx.body = { success: GlobalVar.gameMgr.addGame(game) };
}

GlobalVar.server.getRouter().get('/games', games);
GlobalVar.server.getRouter().post('/games', addGame);
