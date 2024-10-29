import * as Koa from 'koa';
import * as path from 'path';
import * as Router from 'koa-router';
import * as BodyParser from 'koa-bodyparser';
import * as KoaStatic from 'koa-static';

export class ConfigServer {
    private _router: Router;

    constructor(port: number) {
        const app = new Koa();
        const router = new Router();

        app.use(this.addCrossOrigin.bind(this));
        app.use(BodyParser());
        app.use(router.routes()).use(router.allowedMethods());
        app.use(KoaStatic(path.join(__dirname, '../../public')));

        this._router = router;
        app.listen(port, () => {
            logger.info(`http 启动完成, port:${port}`);
        });
    }

    public getRouter() {
        return this._router;
    }

    private async addCrossOrigin(ctx: Koa.Context, next: Function) {
        ctx.set('Access-Control-Allow-Origin', '*');
        ctx.set('Access-Control-Allow-Methods', '*');
        // console.log("添加跨域头")
        await next();
    }
}
