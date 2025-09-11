import { useState, useEffect, useCallback } from 'react';

interface UseInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  suggestions?: string[];
}

export function useInputField({ value, onChange, suggestions = [] }: UseInputFieldProps) {
  // Local state for the input value
  const [inputValue, setInputValue] = useState(value);
  
  // Sync with parent state when it changes externally
  useEffect(() => {
    setInputValue(value || ''); // Ensure we handle null/undefined values
  }, [value]);
  
  // Handle input change (updates local state only)
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
  }, []);
  
  // Update parent state on blur
  const handleBlur = useCallback(() => {
    if (inputValue !== value) {
      onChange(inputValue);
    }
  }, [inputValue, onChange]);

  return {
    inputValue,
    setInputValue,
    setInputValue,
    handleChange,
    handleBlur, 
    suggestions
  };
}