import { Context, Logger, Schema, Service } from 'koishi'
import { platform } from 'os'
import { expr, find, flake } from './nix'
import { exec } from './utils'

export * from './nix'

declare module 'koishi' {
  interface Context {
    nix: NixService
  }
}

export interface Config {
  debug: boolean
  substituters: string[]
}

export const Config: Schema<Config> = Schema.object({
  debug: Schema.boolean().default(false),
  substituters: Schema.array(String).default(null),
})

export const name = 'nix'

const logger = new Logger('nix')

export async function apply(ctx: Context) {
  if (platform() !== 'linux') {
    logger.info('nix plugin only works on linux')
    return
  }
  if (!await find()) {
    logger.info('nix is not installed')
    return
  }
  ctx.plugin(NixService)
}

export class NixService extends Service {
  constructor(ctx: Context) {
    super(ctx, 'nix')
  }

  async packages(...packages: string[]) {
    const list = packages.map(pkg => `(${pkg})`).join(' ')
    return await expr(this.ctx, `
      with import <nixpkgs> {}; [ ${list} ]
    `)
  }

  async flake(path: string, attr: string) {
    return await flake(this.ctx, path, attr)
  }

  async patch(bin: string, interpreter: string, rpath: string[]) {
    const [{ outputs: { out: patchelf } }] = await this.packages('patchelf')
    const paths = ['$ORIGIN', ...rpath].join(':')
    await exec(`${patchelf}/bin/patchelf`, ['--set-rpath', paths, '--set-interpreter', interpreter, bin])
  }

  async patchdir(path: string, ...packages: string[]) {
    
  }
}
