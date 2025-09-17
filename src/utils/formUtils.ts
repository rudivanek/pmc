/**
 * Utility functions for form field validation and helpers
 */

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
    // For arrays, check if there are any non-empty string items
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