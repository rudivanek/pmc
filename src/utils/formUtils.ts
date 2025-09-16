/**
 * Form utility functions for field validation and display logic
 */

/**
 * Helper function to check if a field is populated with meaningful data
 */
export const isFieldPopulated = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  
  if (typeof value === 'number') {
    return value > 0;
  }
  
  if (typeof value === 'boolean') {
    return value === true;
  }
  
  if (Array.isArray(value)) {
    return value.length > 0 && value.some(item => {
      if (typeof item === 'string') {
        return item.trim().length > 0;
      }
      return item != null;
    });
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length > 0;
  }
  
  return false;
};