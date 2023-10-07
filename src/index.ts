import { Context, Logger, Schema, Service } from 'koishi'
import { platform } from 'os'
import { expr, find, flake, patchelf } from './nix'
import { exec, findExecuables } from './utils'

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
  let avaliable = true
  if (platform() !== 'linux') {
    logger.info('nix plugin only works on linux')
    avaliable = false
  }
  if (!await find()) {
    logger.info('nix is not installed')
    avaliable = false
  }
  ctx.plugin(NixService, avaliable)
}

export class NixService extends Service {
  constructor(ctx: Context, public avaliable: boolean) {
    super(ctx, 'nix')
  }

  async packages(...packages: (string | [name: string, output: string])[]) {
    const results: string[] = []
    for (const pkg of packages) {
      const name = typeof pkg === 'string' ? pkg : pkg.join('.')
      const [build] = await expr(this.ctx, `with import <nixpkgs> {}; (${name})`)
      results.push(build.outputs[typeof pkg === 'string' ? 'out' : pkg[1]])
    }
    return results
  }

  async flake(path: string, attr: string) {
    return await flake(this.ctx, path, attr)
  }

  async patch(bin: string, rpath: string[]) {
    const pe = await patchelf(this.ctx)
    const paths = ['$ORIGIN', ...rpath].join(':')
    await exec(pe, ['--set-rpath', paths, bin])
  }

  async patchdir(path: string, rpath: string[]) {
    const execuables = await findExecuables(path)
    for (const execuable of execuables) {
      try {
        await this.patch(execuable, rpath)
      } catch (e) {
        logger.error(e)
      }
    }
  }
}
