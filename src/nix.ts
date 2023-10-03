import { spawn } from 'child_process'
import which from 'which'
import { Context } from 'koishi'

let bin: string
export async function find() {
  if (bin) return bin
  return bin = await which('nix', { nothrow: true })
}

export async function nix(ctx: Context, args: string[]): Promise<number> {
  args.unshift('--experimental-features', 'flakes nix-command')
  if (ctx.config.debug) {
    args.unshift('-L', '-v')
  }
  if (ctx.config.substituters) {
    args.unshift('--option', 'substituters', ctx.config.substituters.join(' '))
  }
  const child = spawn(await find(), args, { stdio: ['pipe', process.stdout, process.stderr] })
  return new Promise((resolve) => {
    child.on('exit', (code) => resolve(code))
  })
}
