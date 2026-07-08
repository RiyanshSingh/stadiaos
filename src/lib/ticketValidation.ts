import { GLOBAL_FOOTBALL_STADIUMS, DEFAULT_STADIUM_TEMPLATE } from '@/lib/constants/stadiumData';

export function validateTicketData(stadiumName: string, section: string, row: string, seat: string) {
  if (!GLOBAL_FOOTBALL_STADIUMS.includes(stadiumName)) {
    throw new Error(`Invalid stadium: ${stadiumName}. Please select a supported stadium.`);
  }

  // Find section in template
  let tier: 'lower' | 'middle' | 'upper' | null = null;
  const sides = ['north', 'east', 'south', 'west'] as const;
  
  for (const side of sides) {
    if (DEFAULT_STADIUM_TEMPLATE.sections[side].lower.includes(section)) tier = 'lower';
    else if (DEFAULT_STADIUM_TEMPLATE.sections[side].middle.includes(section)) tier = 'middle';
    else if (DEFAULT_STADIUM_TEMPLATE.sections[side].upper.includes(section)) tier = 'upper';
    
    if (tier) break;
  }

  if (!tier) {
    throw new Error(`Invalid section: ${section}. Section not found in stadium layout.`);
  }

  if (!DEFAULT_STADIUM_TEMPLATE.rowsByTier[tier].includes(row)) {
    throw new Error(`Invalid row: ${row}. Row not found in ${tier} tier.`);
  }

  // Seat validation
  const seatNum = parseInt(seat, 10);
  if (isNaN(seatNum) || seatNum < 1) {
    throw new Error(`Invalid seat number: ${seat}. Must be a positive integer.`);
  }

  const seatRule = DEFAULT_STADIUM_TEMPLATE.seatRules[tier].find(rule => rule.rows.includes(row));
  if (!seatRule) {
    throw new Error(`Invalid seat rule for row: ${row}. Cannot determine max capacity.`);
  }

  if (seatNum > seatRule.seatCount) {
    throw new Error(`Invalid seat: ${seat}. Row ${row} only has ${seatRule.seatCount} seats.`);
  }

  return true;
}
