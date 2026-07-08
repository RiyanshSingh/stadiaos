
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const TOPOLOGY_EDGES = [
  // Gates -> Concourses
  { fromKey: 'gate_a', toKey: 'north_concourse', distanceMeters: 30, is_accessible: true },
  { fromKey: 'gate_b', toKey: 'south_concourse', distanceMeters: 30, is_accessible: true },
  { fromKey: 'gate_c', toKey: 'east_concourse',  distanceMeters: 30, is_accessible: true },

  // Concourse ring
  { fromKey: 'north_concourse', toKey: 'east_concourse',  distanceMeters: 80, is_accessible: true },
  { fromKey: 'east_concourse',  toKey: 'south_concourse', distanceMeters: 80, is_accessible: true },
  { fromKey: 'south_concourse', toKey: 'west_concourse',  distanceMeters: 80, is_accessible: true },
  { fromKey: 'west_concourse',  toKey: 'north_concourse', distanceMeters: 80, is_accessible: true },

  // Level transitions
  { fromKey: 'north_concourse', toKey: 'escalator_north', distanceMeters: 10, is_accessible: true },
  { fromKey: 'escalator_north', toKey: 'section_214',     distanceMeters: 20, is_accessible: true },
  { fromKey: 'south_concourse', toKey: 'escalator_south', distanceMeters: 10, is_accessible: true },
  { fromKey: 'escalator_south', toKey: 'section_102',     distanceMeters: 20, is_accessible: true },
  { fromKey: 'west_concourse',  toKey: 'section_330',     distanceMeters: 35, is_accessible: false },

  // Elevator route
  { fromKey: 'east_concourse',  toKey: 'elevator_east',   distanceMeters: 15, is_accessible: true },
  { fromKey: 'elevator_east',   toKey: 'section_214',     distanceMeters: 40, is_accessible: true },
  { fromKey: 'elevator_east',   toKey: 'section_102',     distanceMeters: 40, is_accessible: true },
];

async function seedRoutes() {
  console.log('Fetching zones...');
  const { data: zones, error } = await supabase.from('zones').select('id, metadata');
  if (error) {
    console.error('Error fetching zones:', error);
    return;
  }

  const zoneMap = {};
  for (const z of zones) {
    if (z.metadata && z.metadata.routing_key) {
      zoneMap[z.metadata.routing_key] = z.id;
    }
  }

  const TEMPLATE_STADIUM_ID = '11111111-1111-1111-1111-111111111111';

  const routesToInsert = [];
  for (const edge of TOPOLOGY_EDGES) {
    const fromId = zoneMap[edge.fromKey];
    const toId = zoneMap[edge.toKey];
    
    if (fromId && toId) {
      routesToInsert.push({
        stadium_id: TEMPLATE_STADIUM_ID,
        from_zone_id: fromId,
        to_zone_id: toId,
        distance: edge.distanceMeters,
        is_accessible: edge.is_accessible,
        status: 'open'
      });
      // Bidirectional
      routesToInsert.push({
        stadium_id: TEMPLATE_STADIUM_ID,
        from_zone_id: toId,
        to_zone_id: fromId,
        distance: edge.distanceMeters,
        is_accessible: edge.is_accessible,
        status: 'open'
      });
    } else {
      console.warn(`Could not find zone IDs for ${edge.fromKey} -> ${edge.toKey}`);
    }
  }

  console.log(`Inserting ${routesToInsert.length} routes...`);
  
  // Clear existing to avoid duplicates in this script
  await supabase.from('routes').delete().eq('stadium_id', TEMPLATE_STADIUM_ID);

  const { error: insertError } = await supabase.from('routes').insert(routesToInsert);
  if (insertError) {
    console.error('Error inserting routes:', insertError);
  } else {
    console.log('Routes seeded successfully!');
  }
}

seedRoutes();
