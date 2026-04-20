import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { CHARACTERS, searchCharacters } from '@/lib/characters-data';

const client = new Anthropic();

export async function POST(req: Request) {
  try {
    const { message, character, history = [], mode = 'character' } = await req.json();

    const isEncyclopediaMode = mode === 'encyclopedia' || !character;

    // ── Detect if user is asking about a different character (redirect logic) ──
    if (character) {
      const otherChars = CHARACTERS.filter(c => c.slug !== character.slug);
      const mentioned = otherChars.find(c => {
        const msgLow = message.toLowerCase();
        return msgLow.includes(c.name.toLowerCase()) || msgLow.includes(c.realName.toLowerCase());
      });

      if (mentioned) {
        return NextResponse.json({
          response: `Parece que preguntas sobre **${mentioned.name}** (${mentioned.realName}). Aquí estamos viendo a ${character.name}, pero te puedo redirigir al perfil completo de ${mentioned.name}.`,
          redirectTo: `/personajes/${mentioned.universe}/${mentioned.slug}`,
          redirectLabel: `Ver perfil de ${mentioned.name} →`,
        });
      }
    }

    // ── Build system prompt based on mode ──
    let systemPrompt: string;

    if (isEncyclopediaMode) {
      systemPrompt = `Eres Jarvis IA, la enciclopedia de cómics más completa en español. Tu especialidad es el universo de los cómics: Marvel, DC, Manga, Dark Horse, Image y editoriales independientes.

MODO: Enciclopedia Wikipedia de comics — NO vendes productos.

REGLAS:
- Responde SOLO sobre cómics, personajes, sagas, autores y universos ficticios
- Si preguntan sobre algo ajeno a los cómics, redirígelos amablemente
- Usa datos reales y precisos sobre historia de publicación, autores, arcos narrativos
- Respuestas detalladas pero estructuradas — usa párrafos cortos
- Cuando menciones personajes, SIEMPRE incluye su primera aparición y editorial
- Sugiere galerías de portadas relevantes cuando sea apropiado
- Idioma: Español siempre
- Máximo 350 palabras por respuesta
- Si el usuario menciona un personaje que tiene perfil en el sitio, al final incluye un JSON con: {"redirectTo": "/personajes/universe/slug", "redirectLabel": "Ver perfil de X"}`;
    } else {
      systemPrompt = `Eres Jarvis IA, experto en el personaje **${character.name}** (${character.realName}).

CONTEXTO DEL PERSONAJE:
- Universo: ${character.universe.toUpperCase()}
- Primera aparición: ${character.firstAppearance}
- Poderes: ${character.powers?.join(', ')}
- Equipos: ${character.teams?.join(', ')}
- Descripción: ${character.description}

MODO: Enciclopedia de personaje — NO vendes productos.

REGLAS CRÍTICAS:
- Responde SOLO preguntas relacionadas con ${character.name}, sus cómics, historia y universo
- Si el usuario pregunta sobre OTRO personaje, dile que le puedes mostrar el perfil de ese personaje
- Usa datos reales de la historia publicada de los cómics
- Idioma: Español siempre
- Máximo 300 palabras
- Sé preciso con fechas, autores y números de issue`;
    }

    const messages = [
      ...history.map((h: any) => ({ role: h.role, content: h.content })),
      { role: 'user' as const, content: message },
    ];

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 600,
      system: systemPrompt,
      messages,
    });

    let responseText = response.content[0].type === 'text' ? response.content[0].text : '';

    // Check if response contains a redirect JSON
    let redirectTo: string | undefined;
    let redirectLabel: string | undefined;

    const jsonMatch = responseText.match(/\{[^}]*"redirectTo"[^}]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        redirectTo = parsed.redirectTo;
        redirectLabel = parsed.redirectLabel;
        responseText = responseText.replace(jsonMatch[0], '').trim();
      } catch {}
    }

    // Also check if message references a character we know and auto-suggest
    if (!redirectTo && isEncyclopediaMode) {
      const matched = searchCharacters(message);
      if (matched.length > 0 && matched[0].slug) {
        redirectTo = `/personajes/${matched[0].universe}/${matched[0].slug}`;
        redirectLabel = `Ver perfil completo de ${matched[0].name}`;
      }
    }

    return NextResponse.json({ response: responseText, redirectTo, redirectLabel });
  } catch (err: any) {
    console.error('Jarvis wiki error:', err);
    return NextResponse.json({ response: 'Error procesando tu pregunta. Por favor intenta de nuevo.' }, { status: 500 });
  }
}
