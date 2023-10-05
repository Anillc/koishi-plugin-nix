import which from 'which'
import { Context } from 'koishi'
import { exec } from './utils'

let bin: string
export async function find() {
  if (bin) return bin
  return bin = await which('nix', { nothrow: true })
}

let pe: string
export async function patchelf(ctx: Context) {
  if (pe) return pe
  const [{ outputs: { out: patchelf } }] = await expr(ctx, `
    with import <nixpkgs> {}; [ patchelf ]
  `)
  return pe = `${patchelf}/bin/patchelf`
}

export async function nix(ctx: Context, ...args: string[]): Promise<string> {
  args.unshift('--experimental-features', 'flakes nix-command')
  if (ctx.config.debug) {
    args.unshift('-L', '-v')
  }
  if (ctx.config.substituters) {
    args.unshift('--option', 'substituters', ctx.config.substituters.join(' '))
  }
  return await exec(await find(), args)
}

export interface Build {
  drvPath: string
  outputs: Record<string, string>
}

export async function expr(ctx: Context, expr: string): Promise<Build[]> {
  const result = await nix(ctx, 'build', '--no-link', '--json', '--impure', '--expr', expr)
  return JSON.parse(result)
}

export async function flake(ctx: Context, path: string, attr: string): Promise<Build[]> {
  const result = await nix(ctx, 'build', '--no-link', '--json', `${path}#${attr}`)
  return JSON.parse(result)
}
