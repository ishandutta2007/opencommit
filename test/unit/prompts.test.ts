import { jest } from '@jest/globals';

type PromptOptions = {
  description: boolean;
  emoji: boolean;
  fullGitMojiSpec?: boolean;
  positionBeforeDescription: boolean;
};

const originalEnv = { ...process.env };

const resetEnv = () => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
};

const loadPrompt = async ({
  description,
  emoji,
  fullGitMojiSpec = false,
  positionBeforeDescription
}: PromptOptions) => {
  resetEnv();
  Object.assign(process.env, {
    OCO_DESCRIPTION: String(description),
    OCO_EMOJI: String(emoji),
    OCO_EMOJI_POSITION_BEFORE_DESCRIPTION: String(positionBeforeDescription),
    OCO_LANGUAGE: 'en',
    OCO_OMIT_SCOPE: 'false',
    OCO_ONE_LINE_COMMIT: 'false',
    OCO_PROMPT_MODULE: 'conventional-commit'
  });

  jest.resetModules();
  const { getMainCommitPrompt } = await import('../../src/prompts');
  const prompt = await getMainCommitPrompt(fullGitMojiSpec, '');

  return {
    assistant: prompt[2].content as string,
    system: prompt[0].content as string
  };
};

afterAll(() => {
  resetEnv();
});

describe.each([
  { description: false, emoji: false },
  { description: false, emoji: true },
  { description: true, emoji: false },
  { description: true, emoji: true }
])(
  'GitMoji prompt with OCO_EMOJI=$emoji and OCO_DESCRIPTION=$description',
  ({ description, emoji }) => {
    it.each([false, true])(
      'uses positionBeforeDescription=%s consistently',
      async (positionBeforeDescription) => {
        const prompt = await loadPrompt({
          description,
          emoji,
          positionBeforeDescription
        });

        if (!emoji) {
          expect(prompt.system).not.toContain('Place the GitMoji');
          expect(prompt.assistant).toContain(
            'fix(server.ts): change port variable case'
          );
          expect(prompt.assistant).not.toContain('🐛');
        } else if (positionBeforeDescription) {
          expect(prompt.system).toContain(
            'Place the GitMoji immediately before the commit subject'
          );
          expect(prompt.assistant).toContain(
            'fix(server.ts): 🐛 change port variable case'
          );
          expect(prompt.assistant).toContain(
            'feat(server.ts): ✨ add support for process.env.PORT'
          );
        } else {
          expect(prompt.system).toContain(
            'Place the GitMoji at the start of the commit header'
          );
          expect(prompt.assistant).toContain(
            '🐛 (server.ts): change port variable case'
          );
          expect(prompt.assistant).toContain(
            '✨ (server.ts): add support for process.env.PORT'
          );
        }

        if (description) {
          expect(prompt.assistant).toContain('The port variable is now named');
        } else {
          expect(prompt.assistant).not.toContain(
            'The port variable is now named'
          );
        }
      }
    );
  }
);

it('applies the configured position when --fgm enables GitMoji', async () => {
  const prompt = await loadPrompt({
    description: false,
    emoji: false,
    fullGitMojiSpec: true,
    positionBeforeDescription: true
  });

  expect(prompt.system).toContain('GitMoji specification');
  expect(prompt.system).toContain(
    'Place the GitMoji immediately before the commit subject'
  );
  expect(prompt.assistant).toContain(
    'fix(server.ts): 🐛 change port variable case'
  );
});
