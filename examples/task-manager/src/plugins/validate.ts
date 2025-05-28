/**
 * Validation plugin for Praxys
 * Validates object properties against rules
 */

// Rule types
type ValidationRule = (value: any) => boolean | string;
type ValidationRules = Record<string, ValidationRule | ValidationRule[]>;

// Plugin options type
interface ValidateOptions {
  rules: ValidationRules;
  onValidate?: (errors: Record<string, string[]>) => void;
}

// Plugin function
export function validate({ node, opts }: { node: any; opts: ValidateOptions }) {
  if (!opts.rules || typeof opts.rules !== 'object') {
    throw new Error('validate plugin requires a rules object');
  }

  // Track validation errors
  const errors: Record<string, string[]> = {};
  
  // Validate a specific field
  function validateField(key: string): string[] {
    const rules = opts.rules[key];
    const fieldErrors: string[] = [];
    
    if (!rules) return fieldErrors;
    
    // Convert single rule to array
    const ruleArray = Array.isArray(rules) ? rules : [rules];
    
    // Run each rule
    for (const rule of ruleArray) {
      const result = rule(node[key]);
      
      if (result === false) {
        fieldErrors.push(`${key} is invalid`);
      } else if (typeof result === 'string') {
        fieldErrors.push(result);
      }
    }
    
    return fieldErrors;
  }
  
  // Validate all fields
  function validateAll(): Record<string, string[]> {
    const newErrors: Record<string, string[]> = {};
    
    for (const key of Object.keys(opts.rules)) {
      const fieldErrors = validateField(key);
      if (fieldErrors.length > 0) {
        newErrors[key] = fieldErrors;
      }
    }
    
    // Store errors for external access
    Object.assign(errors, newErrors);
    
    // Call onValidate callback if provided
    if (opts.onValidate) {
      opts.onValidate(newErrors);
    }
    
    return newErrors;
  }
  
  // Return validation methods
  return {
    // Validate all fields
    validateAll,
    
    // Validate a specific field
    validateField,
    
    // Check if there are any errors
    get isValid(): boolean {
      return Object.keys(errors).length === 0;
    },
    
    // Get all errors
    get errors(): Record<string, string[]> {
      return { ...errors };
    }
  };
} 