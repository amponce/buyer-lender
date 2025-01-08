import React from 'react';

interface Step {
  title: string;
  description: string;
}

interface Props {
  steps: Step[];
  currentStep: number;
}

const ProgressBar: React.FC<Props> = ({ steps, currentStep }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between">
        {steps.map((step, index) => (
          <div key={step.title} className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                index <= currentStep ? 'bg-primary-600 text-white' : 'bg-gray-200'
              }`}
            >
              {index + 1}
            </div>
            <div className="text-sm mt-2">{step.title}</div>
          </div>
        ))}
      </div>
      <div className="relative mt-4">
        <div className="absolute top-0 h-1 bg-gray-200 w-full" />
        <div
          className="absolute top-0 h-1 bg-primary-600 transition-all duration-300"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
