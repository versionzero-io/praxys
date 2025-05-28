/**
 * Date formatter plugin for Praxys
 * Adds formatted date properties to objects
 */

// Plugin options type
interface FormatDateOptions {
  key: string;
  locale?: string;
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
}

// Plugin function
export function formatDate({ node, opts }: { node: any; opts: FormatDateOptions }) {
  if (!opts.key) {
    throw new Error('formatDate plugin requires a key parameter');
  }
  
  const locale = opts.locale || 'en-US';
  const dateStyle = opts.dateStyle || 'medium';
  const timeStyle = opts.timeStyle;
  const prop = `formatted${opts.key.charAt(0).toUpperCase() + opts.key.slice(1)}`;
  
  // Return computed property
  return {
    get [prop]() {
      const value = node[opts.key];
      if (!value) return '';
      
      const date = value instanceof Date ? value : new Date(value);
      
      // Configure formatting options
      const options: Intl.DateTimeFormatOptions = { 
        dateStyle: dateStyle as any
      };
      
      if (timeStyle) {
        options.timeStyle = timeStyle as any;
      }
      
      return new Intl.DateTimeFormat(locale, options).format(date);
    }
  };
} 