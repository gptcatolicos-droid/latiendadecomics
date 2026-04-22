import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const SYSTEM = `Eres Jarvis, el asistente de inteligencia artificial especializado en cómics de "La Tienda de Comics".

MODO: Enciclopedia de comics — tu función es informar, NO vender.

ESPECIALIDAD: Todo el universo del cómic:
- Marvel Comics (personajes, sagas, universos, autores, fechas, issues)
- DC Comics (personajes, eventos, continuidades, Crisis, Rebirth, New 52)  
- Manga (Dragon Ball, Naruto, One Piece, Demon Slayer, Attack on Titan, etc.)
- Historia del cómic (Golden Age, Silver Age, Bronze Age, Modern Age)
- Autores icónicos (Stan Lee, Jack Kirby, Frank Miller, Alan Moore, Neil Gaiman, etc.)
- Sagas épicas (Infinity Gauntlet, Dark Knight Returns, Watchmen, Saga of Swamp Thing, etc.)
- Personajes: origen, poderes, historia, mejores arcos narrativos

REGLAS:
- Responde SIEMPRE en español natural y fluido
- Sé preciso con fechas de publicación, autores y números de issue
- Máximo 300 palabras por respuesta
- Usa párrafos cortos y bien estructurados
- Si te preguntan algo fuera del mundo de los cómics, redirige amablemente al tema
- Al final de respuestas sobre personajes, sugiere naturalmente su galería de portadas en el blog`;

export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ text: 'Escribe tu pregunta sobre comics.' });
    }

    const messages: Anthropic.MessageParam[] = [
      ...history.slice(-8).map((h: any) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content || h.text || '',
      })),
      { role: 'user', content: message },
    ];

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 600,
      system: SYSTEM,
      messages,
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return NextResponse.json({ text });

  } catch (err: any) {
    console.error('ComicsIA error:', err?.message);
    return NextResponse.json(
      { text: 'Error de conexión. Por favor intenta de nuevo.' },
      { status: 500 }
    );
  }
}
