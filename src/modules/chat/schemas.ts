import { z } from 'zod';

export const chatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().min(1).max(4000),
  })).min(1).max(30),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
