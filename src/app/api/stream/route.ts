import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { JsonRpcRequestSchema, MessageStreamParamsSchema } from '@/types/jsonrpc';

const conversations = new Map<string, unknown[]>();

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const parseResult = JsonRpcRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return Response.json({
      jsonrpc: '2.0',
      error: {
        code: -32600,
        message: 'Invalid Request'
      },
      id: body.id || null
    });
  }

  const { method, params, id } = parseResult.data;

  if (method !== 'message/stream') {
    return Response.json({
      jsonrpc: '2.0',
      error: {
        code: -32601,
        message: 'Method not found'
      },
      id
    });
  }

  const paramsResult = MessageStreamParamsSchema.safeParse(params);
  if (!paramsResult.success) {
    return Response.json({
      jsonrpc: '2.0',
      error: {
        code: -32602,
        message: 'Invalid params'
      },
      id
    });
  }

  const { message, contextId: existingContextId } = paramsResult.data;
  
  const contextId = existingContextId || uuidv4();
  const taskId = uuidv4();
  
  if (!conversations.has(contextId)) {
    conversations.set(contextId, []);
  }
  
  const history = conversations.get(contextId)!;
  const userMessage = {
    ...message,
    contextId,
    taskId,
  };
  history.push(userMessage);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const initialResponse = {
        id,
        jsonrpc: '2.0',
        result: {
          artifacts: null,
          contextId,
          history: [userMessage],
          id: taskId,
          kind: 'task',
          metadata: null,
          status: {
            message: null,
            state: 'submitted',
            timestamp: null
          }
        }
      };
      
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialResponse)}\n\n`));
      
      setTimeout(() => {
        const workingResponse = {
          id,
          jsonrpc: '2.0',
          result: {
            contextId,
            final: false,
            kind: 'status-update',
            metadata: null,
            status: {
              message: {
                contextId,
                extensions: null,
                kind: 'message',
                messageId: uuidv4(),
                metadata: null,
                parts: [{
                  kind: 'text',
                  metadata: null,
                  text: `Processing your request: "${message.parts[0].text}"`
                }],
                referenceTaskIds: null,
                role: 'agent',
                taskId
              },
              state: 'working',
              timestamp: new Date().toISOString()
            },
            taskId
          }
        };
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(workingResponse)}\n\n`));
        
        setTimeout(() => {
          const artifactResponse = {
            id,
            jsonrpc: '2.0',
            result: {
              append: null,
              artifact: {
                artifactId: uuidv4(),
                description: null,
                extensions: null,
                metadata: null,
                name: 'Response',
                parts: [{
                  kind: 'text',
                  metadata: null,
                  text: `I received your message: "${message.parts[0].text}"\n\nThis is a simulated response from the streaming chat API. In a real implementation, this would connect to your AI service to generate appropriate responses.`
                }]
              },
              contextId,
              kind: 'artifact-update',
              lastChunk: null,
              metadata: null,
              taskId
            }
          };
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(artifactResponse)}\n\n`));
          
          setTimeout(() => {
            const finalResponse = {
              id,
              jsonrpc: '2.0',
              result: {
                contextId,
                final: true,
                kind: 'status-update',
                metadata: null,
                status: {
                  message: null,
                  state: 'completed',
                  timestamp: new Date().toISOString()
                },
                taskId
              }
            };
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalResponse)}\n\n`));
            controller.close();
          }, 500);
        }, 1000);
      }, 500);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}