import { Context } from "koa";
import { getPaths } from '../consts';
import { exists, isLocked, isProcessing, readError } from '../util';
import { createGunzip } from 'zlib';
import { createReadStream } from 'fs';
import { startCalculation } from '../calculation';
import { CountQueuingStrategy } from 'stream/web';

export async function calculateOrbitalAction(context: Context) {
    const download = context.search.includes("download")

    const idStr = context.params.id;
    if (isNaN(idStr) || typeof idStr !== "string")
        return context.assert(false, 400, "Invalid id given.")

    const cid = parseInt(idStr)
    const paths = getPaths(cid)

    const locked = await isLocked(cid)
    const processing = isProcessing(cid)
    const orcaExists = await exists(paths.orca)

    const invalidState = locked && orcaExists
    const error = await readError(cid)

    context.assert(!invalidState, 500, "Could not calculate, a error ocurred")
    if (error) {
        context.status = 500
        context.body = error
        return
    }

    context.type = "text/plain"
    if (orcaExists && !processing) {
        if(download) {
            context.type = "application/octet-stream"
            context.attachment(`${cid}-orbitals.out`)
        }
        context.body = createReadStream(paths.orca)

        return;
    }

    context.status = 202
    if (!orcaExists && !locked && !processing) {
        context.status = 201
        await startCalculation(cid)
    }

    if (orcaExists)
        return context.body = createReadStream(paths.orca)

    context.body = "No calculation results yet."
}