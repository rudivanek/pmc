/**
 * Utility functions for handling Markdown formatting
 */

/**
 * Removes Markdown formatting from a string
 * Currently handles:
 * - Bold (**text**)
 * - Italics (*text*)
 * - Headers (#, ##, ###, etc.)
 * - List markers (-, *, +)
 * - Code blocks (```)
 */
export const stripMarkdown = (text: string): string => {
  if (!text) return '';
  
  // Remove code blocks
  let cleanedText = text.replace(/```[\s\S]*?```/g, '');
  
  // Remove inline code
  cleanedText = cleanedText.replace(/`([^`]+)`/g, '$1');
  
  // Remove bold (**text**)
  cleanedText = cleanedText.replace(/\*\*(.*?)\*\*/g, '$1');
  
  // Remove italics (*text*)
  cleanedText = cleanedText.replace(/\*(.*?)\*/g, '$1');
  
  // Remove headers (# text, ## text, etc.)
  cleanedText = cleanedText.replace(/^#{1,6}\s+/gm, '');
  
  // Remove list markers
  cleanedText = cleanedText.replace(/^[-*+]\s+/gm, '');
  
  // Remove link syntax [text](url) - keep the text only
  cleanedText = cleanedText.replace(/\[(.*?)\]\(.*?\)/g, '$1');
  
  // Remove HTML tags
  cleanedText = cleanedText.replace(/<[^>]*>/g, '');
  
  return cleanedText;
};

/**
 * Count words in a string
 */
export const countWords = (text: string): number => {
  if (!text) return 0;
  // Normalize whitespace and split by spaces to count words
  return text.trim().split(/\s+/).length;
};

/**
 * Calculate word count accuracy score (0-100)
 * @param actualCount - The actual word count
 * @param targetCount - The target word count
 * @returns A score from 0-100 representing accuracy
 */
export const calculateWordCountAccuracy = (actualCount: number, targetCount: number): number => {
  if (targetCount <= 0) return 100; // No target means perfect accuracy
  
  const difference = Math.abs(actualCount - targetCount);
  const percentDifference = (difference / targetCount) * 100;
  
  // Scale the score based on percentage difference
  if (percentDifference <= 2) return 100; // Perfect accuracy (within 2%)
  if (percentDifference <= 5) return 95;  // Excellent (within 5%)
  if (percentDifference <= 10) return 85; // Good (within 10%)
  if (percentDifference <= 15) return 75; // Acceptable (within 15%)
  if (percentDifference <= 20) return 65; // Fair (within 20%)
  if (percentDifference <= 30) return 50; // Poor (within 30%)
  if (percentDifference <= 50) return 30; // Very poor (within 50%)
  return 0; // Completely off target (more than 50% difference)
};