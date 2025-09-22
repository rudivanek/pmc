/**
 * Utility functions for form field validation and helpers
 */
import { DEFAULT_FORM_STATE } from '../constants';
import { FormState } from '../types';

/**
 * Check if a field value is considered populated (not empty)
 * @param value - The value to check
 * @returns true if the field has meaningful content, false otherwise
 */
export function isFieldPopulated(value: any): boolean {
  if (value === null || value === undefined) return false;
  
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  
  if (Array.isArray(value)) {
    // Special handling for StructuredOutputElement arrays (like outputStructure)
    if (value.length > 0 && value.every(item => 
      typeof item === 'object' && 
      item !== null && 
      'value' in item &&
      typeof item.value === 'string'
    )) {
      // This is a StructuredOutputElement array
      // Consider it populated if it has any elements, regardless of wordCount
      return value.length > 0;
    }
    
    // For regular arrays, check if there are any non-empty string items
    return value.length > 0 && value.some(item => {
      if (typeof item === 'string') {
        return item.trim().length > 0;
      }
      // For non-string items, recursively check if populated
      return isFieldPopulated(item);
    });
  }
  
  if (typeof value === 'boolean') {
    return value === true;
  }
  
  if (typeof value === 'number') {
    return value !== 0;
  }
  
  if (typeof value === 'object' && value !== null) {
    // For objects, recursively check if any properties are populated
    return Object.keys(value).length > 0 && 
           Object.values(value).some(val => isFieldPopulated(val));
  }
  
  return false;
}

/**
 * Check if a competitor URLs array has any populated URLs
 * @param urls - Array of competitor URL strings
 * @returns true if at least one URL is not empty
 */
export function hasPopulatedCompetitorUrls(urls: string[]): boolean {
  if (!Array.isArray(urls)) return false;
  return urls.some(url => typeof url === 'string' && url.trim().length > 0);
}

/**
 * Check if a field has been modified by the user (differs from default value)
 * @param fieldName - The name of the field in FormState
 * @param currentValue - The current value of the field
 * @returns true if the field has been modified from its default value
 */
export function isFieldUserModified(fieldName: keyof FormState, currentValue: any): boolean {
  const defaultValue = DEFAULT_FORM_STATE[fieldName];
  
  return !deepEqual(currentValue, defaultValue);
}

/**
 * Deep equality comparison for any two values
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns true if values are deeply equal, false otherwise
 */
function deepEqual(a: any, b: any): boolean {
  // Handle primitive types and null/undefined
  if (a === b) return true;
  
  // Handle null/undefined cases
  if (a == null || b == null) return a === b;
  
  // Handle different types
  if (typeof a !== typeof b) return false;
  
  // Handle strings with trimming
  if (typeof a === 'string' && typeof b === 'string') {
    return a.trim() === b.trim();
  }
  
  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  
  // Handle objects
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => 
      keysB.includes(key) && deepEqual(a[key], b[key])
    );
  }
  
  return false;
}