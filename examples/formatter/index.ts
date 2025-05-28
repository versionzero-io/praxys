import { praxys, config, register } from '../../src/index';

// Define target context interface
interface TargetContext {
  path?: string;
  node?: any;
}

// Plugin config interface extensions
declare global {
  namespace Praxys {
    interface Config {
      formatCurrency(opts: {
        key: string;
        currency?: string;
        locale?: string;
      }): Config;
      
      formatDate(opts: {
        key: string;
        locale?: string;
        dateStyle?: 'full' | 'long' | 'medium' | 'short';
      }): Config;
    }
  }
}

// Product data types
interface Product {
  id: number;
  name: string;
  price: number;
  releaseDate: string;
  description?: string;
}

// Enhanced product with formatted properties
interface EnhancedProduct extends Product {
  formattedPrice: string;
  formattedReleaseDate: string;
}

// Application state
interface AppState {
  products: Product[];
}

// Define currency formatter plugin
function currency({ node, opts = {} }: { node: any; opts?: any }) {
  if (!opts.key) {
    throw new Error('currency plugin requires a key');
  }
  
  const currency = opts.currency || 'USD';
  const locale = opts.locale || 'en-US';
  const prop = `formatted${opts.key.charAt(0).toUpperCase() + opts.key.slice(1)}`;
  
  return {
    get [prop]() {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
      }).format(node[opts.key]);
    }
  };
}

// Define date formatter plugin
function dateFormat({ node, opts = {} }: { node: any; opts?: any }) {
  if (!opts.key) {
    throw new Error('dateFormat plugin requires a key');
  }
  
  const locale = opts.locale || 'en-US';
  const dateStyle = opts.dateStyle || 'medium';
  const prop = `formatted${opts.key.charAt(0).toUpperCase() + opts.key.slice(1)}`;
  
  return {
    get [prop]() {
      const value = node[opts.key];
      const date = value instanceof Date ? value : new Date(value);
      return new Intl.DateTimeFormat(locale, {
        dateStyle: dateStyle as any
      }).format(date);
    }
  };
}

// Register the plugins
register('formatCurrency', currency);
register('formatDate', dateFormat);

// Create configuration
const $ = config();

// Define initial state with proper typing
const initialState: AppState = {
  products: [
    { 
      id: 1,
      name: 'Laptop Pro', 
      price: 1299.99, 
      releaseDate: '2023-06-15', 
      description: 'Powerful laptop for professionals' 
    },
    { 
      id: 2,
      name: 'Smartphone X', 
      price: 899.5, 
      releaseDate: '2023-08-22', 
      description: 'Next-gen smartphone with amazing camera' 
    },
    { 
      id: 3,
      name: 'Wireless Headphones', 
      price: 249.99, 
      releaseDate: '2023-09-10', 
      description: 'Premium wireless noise-cancelling headphones' 
    }
  ]
};

// Apply formatters to each product
// TypeScript will type-check these options
$.target((context: TargetContext): boolean => {
  return !!context.path && !!context.path.match(/^\$\.products\[\d+\]$/);
})
  .formatCurrency({
    key: 'price',
    currency: 'USD'
    // If we tried to pass an invalid option, TypeScript would catch it:
    // invalidOption: true // Error: Object literal may only specify known properties
  })
  .formatDate({
    key: 'releaseDate',
    dateStyle: 'medium'
    // If we tried to use an invalid dateStyle, TypeScript would catch it:
    // dateStyle: 'invalid' // Error: Type '"invalid"' is not assignable to type...
  });

// Initialize Praxys
const store = praxys(initialState, $);

/**
 * Display the product list in the specified container
 * @param containerId - The ID of the container element
 */
export function displayProducts(containerId: string): void {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container element with ID "${containerId}" not found`);
    return;
  }
  
  // Add products
  store.products.forEach((product: EnhancedProduct) => {
    const productEl = document.createElement('div');
    productEl.className = 'product';
    
    // Product name
    const name = document.createElement('h3');
    name.textContent = product.name;
    
    // Price with currency formatting
    const price = document.createElement('div');
    price.className = 'price';
    price.textContent = product.formattedPrice;
    
    // Release date with date formatting
    const date = document.createElement('div');
    date.className = 'date';
    date.textContent = `Released: ${product.formattedReleaseDate}`;
    
    // Description
    const desc = document.createElement('p');
    desc.textContent = product.description || '';
    
    // Add elements to product
    productEl.appendChild(name);
    productEl.appendChild(price);
    productEl.appendChild(date);
    productEl.appendChild(desc);
    
    // Add product to container
    container.appendChild(productEl);
  });
  
  // Log type safety check for demonstration
  console.log('TypeScript Type Safety Working:');
  console.log('- Accessing formattedPrice:', typeof store.products[0].formattedPrice);
  console.log('- Accessing formattedReleaseDate:', typeof store.products[0].formattedReleaseDate);
}

// Example of using the store directly in TypeScript
// (Not called from HTML, just for demonstration)
function logProductDetails(): void {
  // We can also strongly type individual products
  const firstProduct = store.products[0] as EnhancedProduct;
  console.log(firstProduct.formattedPrice); // TypeScript knows this exists
  console.log(firstProduct.formattedReleaseDate); // TypeScript knows this exists

  // Example of error TypeScript would catch:
  // console.log(firstProduct.formattedDescription); // Error: Property 'formattedDescription' does not exist
}

// Export enhanced types for other modules to use
export type { Product, EnhancedProduct, AppState }; 