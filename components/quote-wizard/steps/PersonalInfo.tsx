import React from 'react';
import { useForm } from 'react-hook-form';
import InfoTooltip from '../../InfoTooltip';

interface Props {
  data: {
    creditScore: string;
  };
  updateData: (data: {creditScore: string }) => void;
  onNext: () => void;
}

const PersonalInfo: React.FC<Props> = ({ data, updateData, onNext }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: data
  });

  const onSubmit = (formData: typeof data) => {
    updateData(formData);
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
        <p className="mt-2 text-gray-600">Let's start with some basic information</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700">
              Credit Score
              <InfoTooltip content="You can find this on Credit Karma or your credit card statement" />
            </label>
            <div className="mt-1 relative">
              <input
                type="number"
                {...register('creditScore', {
                  required: 'Credit score is required',
                  min: {
                    value: 300,
                    message: 'Credit score must be at least 300'
                  },
                  max: {
                    value: 850,
                    message: 'Credit score cannot exceed 850'
                  }
                })}
                className={`block w-full px-4 py-3 rounded-lg border ${
                  errors.creditScore ? 'border-red-500' : 'border-gray-300'
                } focus:ring-primary-500 focus:border-primary-500`}
                placeholder="Enter your credit score (300-850)"
              />
              {errors.creditScore && (
                <p className="mt-1 text-sm text-red-600">{errors.creditScore.message}</p>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Don't know your credit score?{' '}
              <a 
                href="https://www.creditkarma.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700"
              >
                Check it for free on Credit Karma
              </a>
            </p>
          </div>
        </div>

        <div className="flex justify-end">
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

export default PersonalInfo;
