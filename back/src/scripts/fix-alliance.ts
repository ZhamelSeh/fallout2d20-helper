import { db } from '../db';
import { sql } from 'drizzle-orm';

(async () => {
  const result = await db.execute(sql`
    UPDATE session_participants sp
    SET is_ally = (c.type = 'pc')
    FROM characters c
    WHERE sp.character_id = c.id
  `);
  console.log('Updated session_participants alliance flags:', result);
  process.exit(0);
})();
