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
  console.log('🔍 isFieldPopulated called with:', { value, type: typeof value, stringValue: typeof value === 'string' ? `"${value}"` : 'not string' });
  
  if (value === null || value === undefined) return false;
  
  if (typeof value === 'string') {
    const isPopulated = value.trim().length > 0;
    console.log('🔍 String field populated result:', isPopulated, 'for value:', `"${value}"`, 'trimmed length:', value.trim().length);
    return isPopulated;
  }
  
  if (Array.isArray(value)) {
    // Special handling for StructuredOutputElement arrays (like outputStructure)
    if (value.length > 0 && value.every(item => 
      typeof item === 'object' && 
      item !== null && 
      typeof item.value === 'string'
    )) {
      // This looks like a StructuredOutputElement array
      // Consider it populated if it has any elements at all
      return value.length > 0;
    }
    
    // For regular arrays, check if there are any non-empty string items
    return value.length > 0 && value.some(item => {
      if (typeof item === 'string') {
        return item.trim().length > 0;
      }
      return Boolean(item); // For non-string items, check if truthy
    });
  }
  
  if (typeof value === 'boolean') {
    return value === true;
  }
  
  if (typeof value === 'number') {
    return value !== 0;
  }
  
  if (typeof value === 'object' && value !== null) {
    // For objects, check if they have any properties with meaningful values
    return Object.keys(value).length > 0;
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
  
  // Handle null/undefined cases
  if (currentValue === null || currentValue === undefined) {
    return defaultValue !== null && defaultValue !== undefined;
  }
  
  if (defaultValue === null || defaultValue === undefined) {
    return currentValue !== null && currentValue !== undefined;
  }
  
  // Handle arrays
  if (Array.isArray(currentValue) && Array.isArray(defaultValue)) {
    // For arrays, check if length differs or if any elements are populated
    if (currentValue.length !== defaultValue.length) return true;
    
    // Check if any elements are different or populated
    return currentValue.some((item, index) => {
      if (typeof item === 'string') {
        return item.trim() !== (defaultValue[index] || '').trim();
      }
      return item !== defaultValue[index];
    });
  }
  
  // Handle strings
  if (typeof currentValue === 'string' && typeof defaultValue === 'string') {
    return currentValue.trim() !== defaultValue.trim();
  }
  
  // Handle numbers
  if (typeof currentValue === 'number' && typeof defaultValue === 'number') {
    return currentValue !== defaultValue;
  }
  
  // Handle booleans
  if (typeof currentValue === 'boolean' && typeof defaultValue === 'boolean') {
    return currentValue !== defaultValue;
  }
  
  // Handle objects (like outputStructure)
  if (typeof currentValue === 'object' && typeof defaultValue === 'object') {
    return JSON.stringify(currentValue) !== JSON.stringify(defaultValue);
  }
  
  // For other types, do direct comparison
  return currentValue !== defaultValue;
}