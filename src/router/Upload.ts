import * as Koa from 'koa';
import * as path from 'path';
import * as fs from 'fs';
import * as multer from '@koa/multer';
import { GlobalVar } from '../GlobalVar';
import { gen } from '../excel/index';

const excelPath = path.join(__dirname, '../../../resource/');
if (!fs.existsSync(excelPath)) {
    fs.mkdirSync(excelPath);
}

const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, cb) {
            const { game } = req.body;
            const filePath = path.join(excelPath, game);
            if (!fs.existsSync(filePath)) {
                fs.mkdirSync(filePath);
            }
            cb(null, filePath);
        },
        filename(req, file, cb) {
            file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf-8');
            cb(null, file.originalname);
        },
    }),
});

async function uploadFiles(ctx: Koa.Context) {
    const { game } = ctx.request.body as any;
    if (game.length < 1) {
        ctx.body = { success: false, error: 'No game selected.' };
        return;
    }
    const upFiles = (ctx.request as any).files;
    for (let index = 0; index < upFiles.length; index++) {
        logger.info(`[${game}] 上传文件:${upFiles[index].originalname}`);
    }

    const files = upFiles.map((v) => v.originalname);
    if (upFiles) {
        ctx.body = { success: true, files };
    } else {
        ctx.body = { success: false, error: 'No file uploaded.' };
    }
    await gen(path.join(excelPath, game, '/'), game, files);
}

async function deleteAll(ctx: Koa.Context) {
    const { game } = ctx.request.body as any;
    if (game.length < 1) {
        ctx.body = { success: false, error: 'No game selected.' };
        return;
    }
    logger.info('清空游戏配置', game);
    fs.rmSync(path.join(excelPath, game, '/'), { recursive: true });
    fs.rmSync(path.join(__dirname, `../../../public/${game}`), { recursive: true });
    ctx.body = { success: true };
}

GlobalVar.server.getRouter().post('/upload', upload.array('files'), uploadFiles);
GlobalVar.server.getRouter().delete('/deleteAll', deleteAll);
