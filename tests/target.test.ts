import { describe, it, expect, vi } from 'vitest';
import { target } from '../src/target';

describe('Target Plugin', () => {
  // Test args that would be passed to the target plugin
  const testArgs = {
    path: '$.test.path',
    state: { test: 'state' }
  };

  it('should handle boolean options', () => {
    // Create the target function
    const targetFn = target(testArgs);
    
    // Test with true
    expect(targetFn(true)).toBe(true);
    
    // Test with false
    expect(targetFn(false)).toBe(false);
  });

  it('should handle function options', () => {
    // Create the target function
    const targetFn = target(testArgs);
    
    // Mock function that returns true
    const trueOptionFn = vi.fn().mockReturnValue(true);
    expect(targetFn(trueOptionFn)).toBe(true);
    expect(trueOptionFn).toHaveBeenCalledWith({ path: testArgs.path, state: testArgs.state });
    
    // Mock function that returns false
    const falseOptionFn = vi.fn().mockReturnValue(false);
    expect(targetFn(falseOptionFn)).toBe(false);
    expect(falseOptionFn).toHaveBeenCalledWith({ path: testArgs.path, state: testArgs.state });
  });

  it('should handle undefined path', () => {
    // Create args without path
    const argsWithoutPath = {
      state: { test: 'state' }
    };
    
    // Create the target function
    const targetFn = target(argsWithoutPath);
    
    // Mock function to verify the path is undefined
    const optionFn = vi.fn().mockReturnValue(true);
    targetFn(optionFn);
    
    // Verify path is undefined in the context
    expect(optionFn).toHaveBeenCalledWith({ path: undefined, state: argsWithoutPath.state });
  });
}); 