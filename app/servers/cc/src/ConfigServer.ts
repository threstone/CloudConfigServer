import * as Koa from 'koa';
import * as path from 'path';
import * as Router from 'koa-router';
import * as BodyParser from 'koa-bodyparser';
import * as KoaStatic from 'koa-static';
import * as Compress from 'koa-compress';
import * as fs from 'fs';
import * as https from 'https';

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
        if (serviceConfig?.ssl) {
            const cert = fs.readFileSync(serviceConfig.ssl.cert);
            const key = fs.readFileSync(serviceConfig.ssl.key);
            const server = https.createServer({ cert, key }, app.callback());
            server.listen(port, () => {
                logger.info(`https rank服务器启动完成, port:${port}`);
            });
        } else {
            app.listen(port, () => {
                logger.info(`http rank服务器启动完成, port:${port}`);
            });
        }
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
