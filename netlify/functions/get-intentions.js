import { neon } from '@netlify/neon';

export default async (req, context) => {
  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    // Récupérer toutes les intentions triées par nombre de bougies
    const intentions = await sql`
      SELECT 
        id, 
        author, 
        text, 
        candles,
        TO_CHAR(created_at, 'DD Month YYYY à HH24:MI') as date
      FROM intentions 
      ORDER BY candles DESC, created_at DESC
    `;
    
    // Récupérer les likes de l'utilisateur
    const fingerprint = req.headers.get('x-user-fingerprint') || 'anonymous';
    const userLikes = await sql`
      SELECT intention_id 
      FROM user_likes 
      WHERE user_fingerprint = ${fingerprint}
    `;
    
    const likes = {};
    userLikes.forEach(like => {
      likes[like.intention_id] = true;
    });
    
    return new Response(JSON.stringify({ 
      success: true, 
      intentions,
      userLikes: likes
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('Erreur get intentions:', error);
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
  path: "/api/get-intentions"
};