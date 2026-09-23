import { vi } from "vitest";

/**
 * Mock OpenAI client (used for Gemini API).
 */
const mockOpenAI = {
    chat: {
        completions: {
            create: vi.fn().mockResolvedValue({
                id: "chatcmpl_mock123",
                choices: [
                    {
                        message: {
                            role: "assistant",
                            content: "Generated AI content for testing",
                        },
                        finish_reason: "stop",
                    },
                ],
                usage: {
                    prompt_tokens: 10,
                    completion_tokens: 20,
                    total_tokens: 30,
                },
            }),
        },
    },
};

export default vi.fn(() => mockOpenAI);
