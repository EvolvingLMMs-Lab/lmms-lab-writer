import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: google('gemini-2.5-flash'),
      messages,
      system: `You are the Alexandrie Librairie Copilot, an expert AI integrated into the Agora platform. 
Your purpose is to help mathematicians, physicists, and engineers understand "Alien Mathematics", 
Lean 4 formal proofs, and complex scientific documents. Be precise, pedagogical, and reference 
the generated mathematical artifacts (like the Pathological Lyapunov Functional for Kuramoto-Sivashinsky) 
when asked.`,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return new Response(JSON.stringify({ error: "Failed to communicate with AI model" }), { status: 500 });
  }
}
