import { register } from '../../../../src/index';
import { formatDate } from './formatDate';
import { validate } from './validate';

// Declare plugin global interfaces
declare global {
  namespace Praxys {
    interface Config {
      // Date formatter plugin
      formatDate(opts: {
        key: string;
        locale?: string;
        dateStyle?: 'full' | 'long' | 'medium' | 'short';
        timeStyle?: 'full' | 'long' | 'medium' | 'short';
      }): Config;
      
      // Validation plugin
      validate(opts: {
        rules: Record<string, ((value: any) => boolean | string) | ((value: any) => boolean | string)[]>;
        onValidate?: (errors: Record<string, string[]>) => void;
      }): Config;
    }
  }
}

// Register plugins immediately instead of exporting a function
register('formatDate', formatDate);
register('validate', validate); 