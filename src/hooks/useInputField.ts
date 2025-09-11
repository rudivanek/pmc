import { useState, useCallback } from 'react';

interface UseInputFieldProps {
  value: string;
  onChange: (value: string) => void;
}

interface UseInputFieldReturn {
  inputValue: string;
  setInputValue: (value: string) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleBlur: () => void;
}

/**
 * Custom hook for managing input field state with local state and parent callback
 */
export function useInputField({ value, onChange }: UseInputFieldProps): UseInputFieldReturn {
  const [inputValue, setInputValue] = useState(value || '');

  // Update local state when parent value changes
  React.useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  }, [onChange]);

  const handleBlur = useCallback(() => {
    // Call onChange on blur to ensure parent state is updated
    onChange(inputValue);
  }, [inputValue, onChange]);

  return {
    inputValue,
    setInputValue,
    handleChange,
    handleBlur
  };
}