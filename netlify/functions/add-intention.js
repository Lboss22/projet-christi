import { neon } from '@netlify/neon';

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    const { author, text } = await req.json();
    
    if (!text || text.trim() === '') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Le texte de l\'intention est requis' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = await sql`
      INSERT INTO intentions (author, text, candles)
      VALUES (${author || 'Anonyme'}, ${text}, 0)
      RETURNING 
        id, 
        author, 
        text, 
        candles,
        TO_CHAR(created_at, 'DD Month YYYY à HH24:MI') as date
    `;
    
    return new Response(JSON.stringify({ 
      success: true, 
      intention: result[0]
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('Erreur add intention:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = {
  path: "/api/add-intention"
};