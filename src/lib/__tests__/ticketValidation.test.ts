import { describe, it, expect } from 'vitest';
import { validateTicketData } from '../ticketValidation';

describe('ticketValidation', () => {
  it('should validate correct ticket data successfully', () => {
    // According to DEFAULT_STADIUM_TEMPLATE:
    // N101 is lower tier north. 
    // Lower tier rows are A-V. 
    // Row A has 24 seats.
    expect(validateTicketData('Luzhniki Stadium', 'N101', 'A', '12')).toBe(true);
  });

  it('should throw an error for unsupported stadiums', () => {
    expect(() => validateTicketData('Fake Stadium', 'N101', 'A', '12'))
      .toThrow('Invalid stadium: Fake Stadium. Please select a supported stadium.');
  });

  it('should throw an error for invalid sections', () => {
    expect(() => validateTicketData('Luzhniki Stadium', 'Z999', 'A', '12'))
      .toThrow('Invalid section: Z999. Section not found in stadium layout.');
  });

  it('should throw an error for invalid rows in a tier', () => {
    // N101 is lower tier, which only has rows A-V (Z is invalid)
    expect(() => validateTicketData('Luzhniki Stadium', 'N101', 'Z', '12'))
      .toThrow('Invalid row: Z. Row not found in lower tier.');
  });

  it('should throw an error for seat numbers exceeding capacity', () => {
    // Row A only has 24 seats.
    expect(() => validateTicketData('Luzhniki Stadium', 'N101', 'A', '30'))
      .toThrow('Invalid seat: 30. Row A only has 24 seats.');
  });

  it('should throw an error for invalid seat string', () => {
    expect(() => validateTicketData('Luzhniki Stadium', 'N101', 'A', 'abc'))
      .toThrow('Invalid seat number: abc. Must be a positive integer.');
  });

  it('fails validation on negative seat numbers', () => {
    expect(() => validateTicketData('Wembley Stadium', 'N101', 'A', '-5')).toThrow('Invalid seat number');
  });

  it('fails validation on empty inputs', () => {
    expect(() => validateTicketData('Wembley Stadium', '', '', '')).toThrow('Invalid section');
  });
});
