import { renameSync, unlinkSync, writeFileSync } from 'fs'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { currRunning, getPaths, orcaBin } from './consts'
import { exists, fetchSdf, isLocked } from './util'

export async function startCalculation(cid: number) {
    if (currRunning.has(cid))
        throw new Error(`Already calculating ${cid}`)

    if (await isLocked(cid))
        throw new Error(`${cid} is locked.`)

    const paths = getPaths(cid)
    const innerRun = async () => {
        const execa: typeof import("execa")["execa"] = (await eval('import("execa")')).execa

        console.log("Fetching", cid)
        const sdfRaw = await fetchSdf(cid)

        await writeFile(paths.sdf, sdfRaw)
        console.log("Converting...")

        await execa("obabel", [paths.sdf, "-O", paths.inp])
            .catch(e => {
                writeFileSync(paths.error, JSON.stringify(e, null, 2))
                unlinkSync(paths.lock)
                throw e
            })

        await addOrcaCommands(paths.inp);

        await execa(orcaBin, [paths.inp])
            .pipeStdout(paths.orca)
            .then(() => console.log("Orca finished calculating", cid))
            .catch(e => {
                console.error("ERROR: Calculating", e)
                try {
                    renameSync(paths.orca, paths.error)
                } catch (e) { }
            })
    }


    const prom = (async () => {
            if (!(await exists(paths.root)))
                await mkdir(paths.root, { recursive: true })
            await writeFile(paths.lock, "")
        })()
        .then(() => innerRun())

    currRunning.set(cid, prom)
    prom.finally(() => {
        currRunning.delete(cid)
        try {
            unlinkSync(paths.lock)
        } catch(e) {}
    })
}

export async function addOrcaCommands(inp: string) {
    let f = await readFile(inp, "utf-8")
    const commands = [
        "! RHF SP def2-SVP",
        "!  Normalprint Printbasis PrintMOs"
    ]

    f = f.replace("! insert inline commands here", commands.join("\n"))

    await writeFile(inp, f)
}