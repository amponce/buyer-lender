import React from 'react';
import { useForm } from 'react-hook-form';
import InfoTooltip from '@/components/InfoTooltip';

interface FormData {
  annualIncome: string;
  additionalIncome: string;
}

interface Props {
  data: FormData;
  updateData: (data: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const IncomeInfo: React.FC<Props> = ({ data, updateData, onNext, onBack }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: data
  });

  const onSubmit = (formData: FormData) => {
    updateData(formData);
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Income Information</h2>
        <p className="mt-2 text-gray-600">Tell us about your income sources</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700">
              Annual Income
              <InfoTooltip content="Your gross annual income before taxes and deductions" />
            </label>
            <div className="mt-1 relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
              <input
                type="number"
                {...register('annualIncome', {
                  required: 'Annual income is required',
                  min: {
                    value: 0,
                    message: 'Income cannot be negative'
                  }
                })}
                className={`block w-full pl-8 pr-4 py-3 rounded-lg border ${
                  errors.annualIncome ? 'border-red-500' : 'border-gray-300'
                } focus:ring-primary-500 focus:border-primary-500`}
                placeholder="Enter your annual income"
              />
              {errors.annualIncome && (
                <p className="mt-1 text-sm text-red-600">{errors.annualIncome.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700">
              Additional Annual Income
              <InfoTooltip content="Other income sources like bonuses, rental income, etc." />
            </label>
            <div className="mt-1 relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
              <input
                type="number"
                {...register('additionalIncome', {
                  min: {
                    value: 0,
                    message: 'Additional income cannot be negative'
                  }
                })}
                className="block w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter additional income (optional)"
              />
              {errors.additionalIncome && (
                <p className="mt-1 text-sm text-red-600">{errors.additionalIncome.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Back
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
};

export default IncomeInfo;
