import path = require('path')


export const storageDir = "storage"
export const orcaBin = "./bin/orca"
export const currRunning = new Map<number, Promise<void>>()

export function getSubDir(cid: number) {
    return path.resolve(
        path.join(storageDir, cid.toString())
    )
}

export function getPaths(cid: number) {
    const subDir = getSubDir(cid)

    return {
        root: subDir,
        orca: path.join(subDir, "orca.out"),
        error: path.join(subDir, "orca.error"),
        sdf: path.join(subDir, "molecule.sdf"),
        inp: path.join(subDir, "input.orcainp"),
        lock: path.join(subDir, ".lock")
    }
}