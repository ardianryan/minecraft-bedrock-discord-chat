import { Hono } from 'hono';
import { 
  calculateWorldHealth, 
  executeSmartPrune, 
  getProtectedZones, 
  registerProtectedZone, 
  registerBulkProtectedChunks 
} from '../services/bedrockChunkPruner.js';

export const worldMaintenanceRouter = new Hono();

// GET /api/game/world/stats
worldMaintenanceRouter.get('/stats', async (c) => {
  try {
    const stats = await calculateWorldHealth();
    return c.json({ success: true, stats });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// GET /api/game/world/protected-zones
worldMaintenanceRouter.get('/protected-zones', (c) => {
  try {
    const zones = getProtectedZones();
    return c.json({ success: true, zones });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// POST /api/game/world/protected-chunks (Synced from in-game MGC Bridge)
worldMaintenanceRouter.post('/protected-chunks', async (c) => {
  try {
    const body = await c.req.json();
    if (Array.isArray(body.chunks)) {
      registerBulkProtectedChunks(body.chunks);
    }
    if (Array.isArray(body.zones)) {
      for (const z of body.zones) {
        registerProtectedZone(z);
      }
    }
    return c.json({ success: true, message: 'Protected chunks synchronized.' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// POST /api/game/world/prune
worldMaintenanceRouter.post('/prune', async (c) => {
  try {
    const result = await executeSmartPrune();
    return c.json(result);
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
