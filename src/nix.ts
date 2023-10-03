import { spawn } from 'child_process'
import which from 'which'
import { Context } from 'koishi'

let bin: string
export async function find() {
  if (bin) return bin
  return bin = await which('nix', { nothrow: true })
}

export async function nix(ctx: Context, ...args: string[]): Promise<string> {
  args.unshift('--experimental-features', 'flakes nix-command')
  if (ctx.config.debug) {
    args.unshift('-L', '-v')
  }
  if (ctx.config.substituters) {
    args.unshift('--option', 'substituters', ctx.config.substituters.join(' '))
  }
  const child = spawn(await find(), args, { stdio: ['pipe', 'pipe', process.stderr] })
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

export async function build(ctx: Context, expr: string): Promise<Record<string, string>> {
  const result = await nix(ctx, 'build', '--no-link', '--json', '--impure', '--expr', expr)
  return JSON.parse(result)[0].outputs
}
