import React, { useState, useEffect, useRef } from 'react';
import { X, Tag, GripVertical, Plus, Check } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';
import { StructuredOutputElement } from '../../types';
import { OUTPUT_STRUCTURE_OPTIONS } from '../../constants';

interface DraggableStructuredInputProps {
  value: StructuredOutputElement[];
  onChange: (value: StructuredOutputElement[]) => void;
  options?: { value: string, label: string }[];
  placeholder?: string;
  className?: string;
}

const DraggableStructuredInput: React.FC<DraggableStructuredInputProps> = ({
  value = [],
  onChange,
  options = OUTPUT_STRUCTURE_OPTIONS,
  placeholder = "Select structure elements and assign word counts...",
  className = ""
}) => {
  // Ensure all elements have string IDs for react-beautiful-dnd
  const normalizedValue = value.map(element => ({
    ...element,
    id: typeof element.id === 'string' ? element.id : uuidv4()
  }));

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');
  const [customWordCount, setCustomWordCount] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setShowCustomInput(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle removing an element
  const handleRemoveElement = (index: number) => {
    const newElements = [...normalizedValue];
    newElements.splice(index, 1);
    onChange(newElements);
  };
  
  // Handle adding an element from dropdown
  const handleAddElement = (option: { value: string, label: string }) => {
    console.log('🔥 handleAddElement called with:', option);
    console.log('🔥 Current value array:', normalizedValue);
    
    // Don't add if already selected
    if (normalizedValue.some(el => el.value === option.value)) {
      console.log('Element already exists:', option.value);
      return;
    }
    
    console.log('🔥 Adding new element:', option);
    
    const newElement: StructuredOutputElement = {
      id: uuidv4(),
      value: option.value,
      label: option.label,
      wordCount: null
    };
    
    console.log('🔥 Created new element:', newElement);
    
    const newValue = [...normalizedValue, newElement];
    console.log('🔥 New value array:', newValue);
    console.log('🔥 Calling onChange with:', newValue);
    
    onChange(newValue);
    setIsDropdownOpen(false);
    
    console.log('🔥 onChange called, dropdown closed');
  };
  
  // Handle adding a custom element
  const handleAddCustomElement = () => {
    if (!customTagInput.trim()) return;
    
    const customValue = customTagInput.trim();
    const wordCount = customWordCount ? parseInt(customWordCount, 10) : null;
    
    // Don't add if already selected
    if (normalizedValue.some(el => el.value === customValue)) {
      setCustomTagInput('');
      setCustomWordCount('');
      return;
    }
    
    const newElement: StructuredOutputElement = {
      id: uuidv4(),
      value: customValue,
      label: customValue,
      wordCount: isNaN(wordCount as number) ? null : wordCount
    };
    
    onChange([...normalizedValue, newElement]);
    setCustomTagInput('');
    setCustomWordCount('');
    setShowCustomInput(false);
  };
  
  // Handle word count change
  const handleWordCountChange = (index: number, newWordCount: string) => {
    const parsedCount = parseInt(newWordCount, 10);
    const newElements = [...normalizedValue];
    newElements[index] = {
      ...newElements[index],
      wordCount: isNaN(parsedCount) ? null : parsedCount
    };
    onChange(newElements);
  };
  
  // Handle drag end
  const onDragEnd = (result: any) => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }
    
    const items = Array.from(normalizedValue);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    onChange(items);
  };
  
  // Filter options that haven't been selected yet
  const availableOptions = options.filter(
    option => !normalizedValue.some(el => el.value === option.value)
  );

  // Calculate total word count from elements with word counts
  const totalWordCount = normalizedValue.reduce((sum, element) => {
    return sum + (element.wordCount || 0);
  }, 0);

  return (
    <div ref={containerRef} className="relative">
      <div 
        className={`min-h-[60px] w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-black px-3 py-2 focus-within:ring-1 focus-within:ring-primary-500 cursor-pointer ${className}`}
        onClick={() => {
          if (!showCustomInput) {
            setIsDropdownOpen(!isDropdownOpen);
          }
        }}
      >
        {normalizedValue.length > 0 ? (
          <div className="w-full">
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="sections">
                {(provided) => (
                  <div 
                    className="w-full space-y-2"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {normalizedValue.map((element, index) => (
                      <Draggable key={element.id} draggableId={String(element.id)} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-center gap-2 rounded-md bg-gray-100 dark:bg-gray-800 p-2 text-sm text-gray-700 dark:text-gray-300"
                          >
                            <div 
                              {...provided.dragHandleProps}
                              className="cursor-grab text-gray-400"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <GripVertical size={16} />
                            </div>
                            
                            <Tag size={14} className="text-primary-500" />
                            <span className="flex-grow">{element.label || element.value}</span>
                            
                            <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="number"
                                min="0"
                                placeholder="Words"
                                value={element.wordCount || ''}
                                onChange={(e) => handleWordCountChange(index, e.target.value)}
                                className="w-20 h-7 px-2 py-1 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md"
                                aria-label={`Word count for ${element.label || element.value}`}
                              />
                              <button 
                                type="button" 
                                onClick={() => handleRemoveElement(index)}
                                className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {/* Show total word count if any sections have word counts */}
                    {totalWordCount > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-200 dark:border-gray-700 mt-2">
                        Total allocated: <span className="font-medium">{totalWordCount}</span> words
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        ) : (
          <div className="text-gray-500 text-sm w-full py-4 text-center">{placeholder}</div>
        )}
        
        {/* Custom input section */}
        {showCustomInput && (
          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Add Custom Structure Element
            </div>
            
            <div className="space-y-3">
              <div>
                <label htmlFor="customElement" className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                  Element Name
                </label>
                <input
                  id="customElement"
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  placeholder="e.g., Problem Statement"
                  className="w-full text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5"
                  autoFocus
                />
              </div>
              
              <div>
                <label htmlFor="customWordCount" className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                  Word Count (optional)
                </label>
                <input
                  id="customWordCount"
                  type="number"
                  min="0"
                  value={customWordCount}
                  onChange={(e) => setCustomWordCount(e.target.value)}
                  placeholder="e.g., 200"
                  className="w-full text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5"
                />
              </div>
              
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomTagInput('');
                    setCustomWordCount('');
                    setIsDropdownOpen(true);
                  }}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomElement}
                  disabled={!customTagInput.trim()}
                  className={`px-3 py-1.5 text-sm rounded-md ${
                    customTagInput.trim() 
                      ? 'bg-primary-600 hover:bg-primary-500 text-white' 
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Check size={14} className="inline mr-1.5" />
                  Add Element
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Dropdown */}
      {isDropdownOpen && !showCustomInput && (
        <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg custom-scrollbar">
          <div className="p-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
            Select structure elements
          </div>
          
          {/* Add custom element option */}
          <div
            className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-primary-500 flex items-center text-sm font-medium border-b border-gray-200 dark:border-gray-800"
            onClick={(e) => {
              e.stopPropagation();
              setIsDropdownOpen(false);
              setShowCustomInput(true);
            }}
          >
            <Plus size={16} className="mr-2" />
            Add custom structure element
          </div>
          
          {/* Available predefined options */}
          {availableOptions.length > 0 ? (
            availableOptions.map((option) => (
              <div
                key={option.value}
                className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-gray-700 dark:text-gray-300 flex items-center text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Dropdown option clicked:', option);
                  handleAddElement(option);
                }}
              >
                <Tag size={14} className="text-primary-500 mr-2" />
                {option.label}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-500 text-sm italic">
              All options have been selected
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Add display name for better debugging
DraggableStructuredInput.displayName = "DraggableStructuredInput";

export default DraggableStructuredInput;