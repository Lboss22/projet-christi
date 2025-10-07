import { neon } from '@netlify/neon';

export default async (req, context) => {
  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    // Créer la table intentions si elle n'existe pas
    await sql`
      CREATE TABLE IF NOT EXISTS intentions (
        id SERIAL PRIMARY KEY,
        author VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        candles INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Créer la table likes si elle n'existe pas
    await sql`
      CREATE TABLE IF NOT EXISTS user_likes (
        id SERIAL PRIMARY KEY,
        intention_id INTEGER REFERENCES intentions(id) ON DELETE CASCADE,
        user_fingerprint VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(intention_id, user_fingerprint)
      )
    `;
    
    // Ajouter quelques intentions initiales si la table est vide
    const count = await sql`SELECT COUNT(*) as count FROM intentions`;
    
    if (count[0].count === '0') {
      await sql`
        INSERT INTO intentions (author, text, candles, created_at) VALUES
        ('Marie', 'Prions pour la paix dans le monde et pour que tous les cœurs s''ouvrent à l''amour de Dieu.', 12, NOW() - INTERVAL '1 day'),
        ('Anonyme', 'Pour la guérison de ma mère qui est malade. Que le Seigneur lui accorde sa miséricorde.', 8, NOW() - INTERVAL '12 hours'),
        ('Jean-Paul', 'Pour tous les jeunes qui cherchent leur voie, que Dieu les guide vers la lumière.', 15, NOW() - INTERVAL '6 hours')
      `;
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Base de données initialisée avec succès' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Erreur init DB:', error);
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
  path: "/api/init-db"
};