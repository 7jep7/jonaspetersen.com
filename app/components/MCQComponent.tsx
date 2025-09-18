import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";

interface MCQComponentProps {
  question: string;
  options: string[];
  onAnswer: (selectedOption: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function MCQComponent({ 
  question, 
  options, 
  onAnswer, 
  isLoading = false, 
  disabled = false 
}: MCQComponentProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleOptionSelect = (option: string) => {
    if (disabled || isLoading) return;
    setSelectedOption(option);
  };

  const handleSubmit = () => {
    if (selectedOption && !disabled && !isLoading) {
      onAnswer(selectedOption);
      setSelectedOption(null); // Reset selection after submission
    }
  };

  // Handle Enter key submission
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && selectedOption && !disabled && !isLoading) {
        event.preventDefault();
        handleSubmit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedOption, disabled, isLoading]);

  const handleOptionKeyDown = (event: React.KeyboardEvent, option: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOptionSelect(option);
      // If this is Enter and we just selected an option, submit immediately
      if (event.key === 'Enter' && !selectedOption) {
        setTimeout(() => handleSubmit(), 0);
      }
    }
  };

  return (
    <Card className="p-6 border-2 border-blue-200 bg-blue-50/50">
      <div className="space-y-4">
        {/* Question */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {question}
          </h3>
          <p className="text-sm text-gray-600">
            Please select the option that best describes your requirement:
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionSelect(option)}
              onKeyDown={(e) => handleOptionKeyDown(e, option)}
              disabled={disabled || isLoading}
              className={`
                w-full text-left p-4 rounded-lg border-2 transition-all duration-200
                ${selectedOption === option
                  ? 'border-blue-500 bg-blue-100 text-blue-900'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                }
                ${disabled || isLoading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer hover:shadow-sm'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              `}
            >
              <div className="flex items-start space-x-3">
                <div className={`
                  flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center
                  ${selectedOption === option
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                  }
                `}>
                  {selectedOption === option && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    {String.fromCharCode(65 + index)}) {option}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            onClick={handleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
              }
            }}
            disabled={!selectedOption || disabled || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              'Submit Answer'
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}