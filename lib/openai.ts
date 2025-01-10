import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function OpenAIStream(messages: { role: 'system' | 'user' | 'assistant'; content: string }[]): Promise<Response> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 500
  })

  // Transform the response into a readable stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of response) {
        const text = chunk.choices[0]?.delta?.content || ''
        if (text) {
          controller.enqueue(encoder.encode(text))
        }
      }
      controller.close()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
} 