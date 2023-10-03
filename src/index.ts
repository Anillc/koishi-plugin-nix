import { Context, Logger, Schema } from 'koishi'
import { platform } from 'os'

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

function apply(ctx: Context) {
  if (platform() !== 'linux') {
    logger.info('nix plugin only works on linux')
    return
  }
}