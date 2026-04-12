import { NextRequest, NextResponse } from 'next/server';
import { CRAIG_SYSTEM_PROMPT } from '@/lib/systemPrompt';

interface GeminiPart {
  text: string;
}

interface GeminiMessage {
  role: string;
  parts: GeminiPart[];
}

interface RequestBody {
  messages: GeminiMessage[];
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { messages } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const models = ['gemini-2.0-flash-lite', 'gemini-1.5-flash', 'gemini-pro'];
    let lastError = '';

    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: CRAIG_SYSTEM_PROMPT }] },
              contents: messages,
              generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
            }),
          }
        );

        const data = await response.json();

        if (data.error) {
          lastError = data.error.message || 'Unknown error';
          continue;
        }

        const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!answer) {
          lastError = 'No answer in response';
          continue;
        }

        return NextResponse.json({ answer });
      } catch (e) {
        lastError = e instanceof Error ? e.message : 'Unknown error';
        continue;
      }
    }

    return NextResponse.json(
      { error: `All models failed: ${lastError}` },
      { status: 500 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 400 }
    );
  }
}
