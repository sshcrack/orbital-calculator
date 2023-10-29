import { Context } from "koa";
import { currRunning, getPaths } from '../consts';
import { exists, isLocked, isProcessing, readError } from '../util';
import { createReadStream } from 'fs';
import { startCalculation } from '../calculation';
import { send } from "koa-range-static";
import path = require('path');

export async function calculateOrbitalAction(ctx: Context) {
    const download = ctx.search.includes("download")

    const idStr = ctx.params.id;
    if (isNaN(idStr) || typeof idStr !== "string")
        return ctx.assert(false, 400, "Invalid id given.")

    const cid = parseInt(idStr)
    const paths = getPaths(cid)

    const locked = await isLocked(cid)
    const processing = isProcessing(cid)
    const orcaExists = await exists(paths.orca)

    const invalidState = locked && orcaExists
    const error = await readError(cid)

    console.log(currRunning)
    ctx.assert(!invalidState, 500, "Could not calculate, a error ocurred")
    if (error) {
        ctx.status = 500
        ctx.body = error
        return
    }

    const relative = path.relative(path.resolve(), paths.orca)

    ctx.type = "text/plain"
    console.log(locked, processing, orcaExists, download)
    if (orcaExists && !processing) {
        if(download) {
            ctx.type = "application/octet-stream"
            ctx.attachment(`${cid}-orbitals.out`)
        }

        await send(ctx, relative, { immutable: false })
        return;
    }

    ctx.status = 202
    if (!orcaExists && !locked && !processing) {
        ctx.status = 201
        ctx.set("x-processing", "true")
        await startCalculation(cid)
    }

    if (orcaExists) {
        ctx.set("x-processing", "true")
        await send(ctx, relative, { immutable: false })
        return
    }

    ctx.set("x-processing", "true")
    ctx.body = "No calculation results yet."
}