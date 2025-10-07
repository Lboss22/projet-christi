import { neon } from '@netlify/neon';

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    const { intentionId } = await req.json();
    const fingerprint = req.headers.get('x-user-fingerprint') || 'anonymous';
    
    // Vérifier si l'utilisateur a déjà liké
    const existing = await sql`
      SELECT id FROM user_likes 
      WHERE intention_id = ${intentionId} 
      AND user_fingerprint = ${fingerprint}
    `;
    
    let liked;
    
    if (existing.length > 0) {
      // Enlever le like
      await sql`
        DELETE FROM user_likes 
        WHERE intention_id = ${intentionId} 
        AND user_fingerprint = ${fingerprint}
      `;
      
      await sql`
        UPDATE intentions 
        SET candles = GREATEST(candles - 1, 0)
        WHERE id = ${intentionId}
      `;
      
      liked = false;
    } else {
      // Ajouter le like
      await sql`
        INSERT INTO user_likes (intention_id, user_fingerprint)
        VALUES (${intentionId}, ${fingerprint})
      `;
      
      await sql`
        UPDATE intentions 
        SET candles = candles + 1
        WHERE id = ${intentionId}
      `;
      
      liked = true;
    }
    
    // Récupérer l'intention mise à jour
    const intention = await sql`
      SELECT id, candles FROM intentions WHERE id = ${intentionId}
    `;
    
    return new Response(JSON.stringify({ 
      success: true, 
      liked,
      intention: intention[0]
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('Erreur toggle like:', error);
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
  path: "/api/toggle-like"
};