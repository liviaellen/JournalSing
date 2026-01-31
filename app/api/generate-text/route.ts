import { NextRequest, NextResponse } from 'next/server';
import { minimax } from '@/lib/api/minimax';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, systemPrompt, model } = body;
    console.log('Generating text for prompt:', prompt?.slice(0, 50));

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const data = await minimax.generateText({
      model: model || 'M2-her',
      messages: [
        { role: 'system', name: 'MiniMax AI', content: systemPrompt || 'You are a helpful assistant.' },
        { role: 'user', name: 'User', content: prompt }
      ],
    }) as any;

    const content = data.choices?.[0]?.message?.content || '';

    return NextResponse.json({ text: content });
  } catch (error: any) {
    console.error('SERVER-SIDE TEXT GENERATION ERROR:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate text',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
