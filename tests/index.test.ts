import { describe, it, expect } from 'vitest';
import { praxys } from '../src';

describe('Praxys Core', () => {
  it('should create a reactive node', () => {
    const data = { name: 'Test' };
    const n = praxys(data);
    
    expect(n.name).toBe('Test');
  });
}); 