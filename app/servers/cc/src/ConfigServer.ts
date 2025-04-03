import * as Koa from 'koa';
import * as path from 'path';
import * as Router from 'koa-router';
import * as BodyParser from 'koa-bodyparser';
import * as KoaStatic from 'koa-static';
import * as Compress from 'koa-compress';

export class ConfigServer {
    private _router: Router;

    constructor(port: number) {
        const app = new Koa();
        const router = new Router();

        app.use(this.addCrossOrigin.bind(this));
        app.use(BodyParser());
        app.use(router.routes()).use(router.allowedMethods());
        app.use(Compress());
        app.use(KoaStatic(path.join(process.cwd(), './public')));

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
