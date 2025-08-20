import { z } from 'zod';

export const JsonRpcRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  method: z.string(),
  params: z.record(z.any()),
  id: z.string(),
});

export const MessagePartSchema = z.object({
  kind: z.literal('text'),
  text: z.string(),
  metadata: z.any().nullable().optional(),
});

export const MessageSchema = z.object({
  role: z.enum(['user', 'agent']),
  parts: z.array(MessagePartSchema),
  message_id: z.string(),
  kind: z.literal('message'),
  contextId: z.string().optional(),
  extensions: z.any().nullable().optional(),
  referenceTaskIds: z.array(z.string()).nullable().optional(),
  taskId: z.string().optional(),
  metadata: z.any().nullable().optional(),
});

export const MessageStreamParamsSchema = z.object({
  message: MessageSchema,
  contextId: z.string().optional(),
});

export const TaskStatusSchema = z.object({
  message: MessageSchema.nullable().optional(),
  state: z.enum(['submitted', 'working', 'completed']),
  timestamp: z.string().nullable().optional(),
});

export const ArtifactSchema = z.object({
  artifactId: z.string(),
  description: z.string().nullable().optional(),
  extensions: z.any().nullable().optional(),
  metadata: z.any().nullable().optional(),
  name: z.string(),
  parts: z.array(MessagePartSchema),
});

export const StreamResponseSchema = z.object({
  id: z.string(),
  jsonrpc: z.literal('2.0'),
  result: z.union([
    z.object({
      artifacts: z.any().nullable().optional(),
      contextId: z.string(),
      history: z.array(MessageSchema),
      id: z.string(),
      kind: z.literal('task'),
      metadata: z.any().nullable().optional(),
      status: TaskStatusSchema,
    }),
    z.object({
      contextId: z.string(),
      final: z.boolean(),
      kind: z.literal('status-update'),
      metadata: z.any().nullable().optional(),
      status: TaskStatusSchema,
      taskId: z.string(),
    }),
    z.object({
      append: z.boolean().nullable().optional(),
      artifact: ArtifactSchema,
      contextId: z.string(),
      kind: z.literal('artifact-update'),
      lastChunk: z.boolean().nullable().optional(),
      metadata: z.any().nullable().optional(),
      taskId: z.string(),
    }),
  ]),
});

export type JsonRpcRequest = z.infer<typeof JsonRpcRequestSchema>;
export type MessagePart = z.infer<typeof MessagePartSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type MessageStreamParams = z.infer<typeof MessageStreamParamsSchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type Artifact = z.infer<typeof ArtifactSchema>;
export type StreamResponse = z.infer<typeof StreamResponseSchema>;