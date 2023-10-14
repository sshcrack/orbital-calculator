let got: typeof import("got")
import { readFile, stat} from "fs/promises"
import { currRunning, getPaths } from './consts'


export async function fetchSdf(cid: number) {
    if(!got)
        got = (await eval('import("got")')).got

    const res = await got(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/CID/${cid}/record/SDF?record_type=3d`)
    return res.body;
}

export async function exists(path: string) {
    return stat(path).then(() => true).catch(() => false)
}

export async function isLocked(cid: number) {
    const paths = getPaths(cid)

    if (!(await exists(paths.lock)))
        return false;

    currRunning.has(cid)
}

export function isProcessing(cid: number) {
    return currRunning.has(cid)
}

export async function readError(cid: number): Promise<string | null> {
    const { error } = getPaths(cid)
    if(!(await exists(error)))
        return null

    return await readFile(error, "utf-8")
}