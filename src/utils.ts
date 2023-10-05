import { spawn } from 'child_process'
import { promises as fsp } from 'fs'
import { isAbsolute, normalize, relative, resolve } from 'path'

export async function exec(program: string, args: string[]): Promise<string> {
  const child = spawn(program, args, { stdio: ['pipe', 'pipe', process.stderr] })
  return new Promise(async (resolve, reject) => {
    child.on('exit', (code) => code === 0
      ? resolve(Buffer.concat(buffers).toString())
      : reject())
    const buffers = []
    for await (const data of child.stdout) {
      buffers.push(data)
      process.stdout.write(data)
    }
  })
}

export async function findExecuables(path: string, base: string, visited: string[] = []): Promise<string[]> {
  try {
    const stat = await fsp.lstat(path)
    if (stat.isSymbolicLink()) {
      const real = await fsp.realpath(path)
      const rel = relative(base, real)
      if (rel.startsWith('..') || isAbsolute(rel)) {
        return []
      } else {
        return await findExecuables(real, base, visited)
      }
    }
    if (stat.isDirectory()) {
      if (visited.includes(normalize(path))) return []
      visited.push(path)
      const files = await fsp.readdir(path)
      const result = await Promise.all(files.map(file =>
        findExecuables(resolve(path, file), base, visited)))
      return result.flat()
    } else {
      const { mode } = stat
      if (mode & 0o001 || mode & 0o010 || mode & 0o100) {
        return [path]
      } else {
        return []
      }
    }
  } catch (e) {
    return []
  }
}
