import React from 'react';
import { Check } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';

interface WizardStepperProps {
  currentStep: number;
  totalSteps: number;
}

const WizardStepper = ({ currentStep, totalSteps }: WizardStepperProps) => {
  const { t } = useLanguage();

  const steps = [
    t('wizard.steps.type'),
    t('wizard.steps.design'),
    t('wizard.steps.editor'),
    t('wizard.steps.info'),
    t('wizard.steps.message'),
    t('wizard.steps.review'),
  ];

  return (
    <div className="mb-8">
      {/* Progress bar */}
      <div className="h-1.5 bg-gray-200 rounded-full mb-4">
        <div
          className="h-full bg-purple-600 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {/* Steps row */}
      <div className="hidden sm:flex items-center justify-between">
        {steps.map((label, index) => (
          <div key={index} className="flex flex-col items-center gap-1">
            <div
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                index < currentStep
                  ? 'bg-purple-600 text-white'
                  : index === currentStep
                  ? 'bg-purple-600 text-white ring-4 ring-purple-100'
                  : 'bg-gray-200 text-gray-500'
              )}
            >
              {index < currentStep ? <Check size={14} /> : index + 1}
            </div>
            <span
              className={cn(
                'text-xs',
                index <= currentStep ? 'text-purple-700 font-medium' : 'text-gray-400'
              )}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Mobile: just show current step name */}
      <div className="sm:hidden text-sm text-purple-700 font-medium text-center">
        {t('wizard.steps.type')} {currentStep + 1} / {totalSteps}: {steps[currentStep]}
      </div>
    </div>
  );
};

export default WizardStepper;
