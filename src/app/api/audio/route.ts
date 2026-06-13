import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { audioData, mimeType } = await req.json();

    if (!audioData) {
      return NextResponse.json({ error: 'No audio data provided' }, { status: 400 });
    }

    // Convert base64 audio string to Blob for FormData
    const base64Data = audioData.replace(/^data:audio\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob([buffer], { type: mimeType || 'audio/webm' });

    const formData = new FormData();
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-large-v3');
    formData.append('prompt', 'Transcribe this audio recording accurately. This is a business meeting or requirements discussion.');
    formData.append('response_format', 'text'); // Return raw text instead of JSON payload

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq Whisper Error: ${errorText}`);
    }

    const transcribedText = await response.text();
    return NextResponse.json({ content: transcribedText });

  } catch (error: any) {
    console.error('Audio transcription error:', error);
    return NextResponse.json(
      { error: `Audio transcription failed: ${error.message}` },
      { status: 500 }
    );
  }
}
