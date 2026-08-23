import { OpenAiEngine, OpenAiConfig } from './openAi';

export interface OrcaRouterConfig extends OpenAiConfig {}

export class OrcaRouterEngine extends OpenAiEngine {
  protected providerName = 'orcarouter';

  constructor(config: OrcaRouterConfig) {
    // Call OpenAIEngine constructor with forced OrcaRouter baseURL
    // Put baseURL first so user config can override it
    super({
      baseURL: 'https://api.orcarouter.ai/v1',
      ...config
    });
  }
}
