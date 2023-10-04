import { spawn } from 'child_process'

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