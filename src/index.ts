import { Context, Logger, Schema } from 'koishi'
import { platform } from 'os'
import { build, find } from './nix'

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
}