'use client'
import React from 'react';
import { useForm } from 'react-hook-form';
import InfoTooltip from '@/components/InfoTooltip';
import { US_STATES } from '@/app/constants/states';

interface FormData {
  purchasePrice: string;
  propertyAddress: string;
  propertyState: string;
  propertyZipCode: string;
}

interface Props {
  data: FormData;
  updateData: (data: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const PropertyInfo: React.FC<Props> = ({ data, updateData, onNext, onBack }) => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: data
  });

  const purchasePrice = watch('purchasePrice');
  const formattedPrice = Number(purchasePrice).toLocaleString();

  const onSubmit = (formData: FormData) => {
    updateData(formData);
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Property Information</h2>
        <p className="mt-2 text-gray-600">Tell us about the property you're interested in</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700">
              Purchase Price
              <InfoTooltip content="The price you plan to offer for the property" />
            </label>
            <div className="mt-1 relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
              <input
                type="number"
                {...register('purchasePrice', {
                  required: 'Purchase price is required',
                  min: {
                    value: 1,
                    message: 'Price must be greater than 0'
                  }
                })}
                className={`block w-full pl-8 pr-4 py-3 rounded-lg border ${
                  errors.purchasePrice ? 'border-red-500' : 'border-gray-300'
                } focus:ring-primary-500 focus:border-primary-500`}
                placeholder="Enter property price"
              />
              {errors.purchasePrice && (
                <p className="mt-1 text-sm text-red-600">{errors.purchasePrice.message}</p>
              )}
            </div>
            {purchasePrice && (
              <p className="mt-2 text-sm text-gray-500">
                Formatted: ${formattedPrice}
              </p>
            )}
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700">
              Property Address
              <InfoTooltip content="The full address of the property you're interested in" />
            </label>
            <input
              type="text"
              {...register('propertyAddress')}
              className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter property address (optional)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700">
                State
                <InfoTooltip content="Select the state where the property is located" />
              </label>
              <select
                {...register('propertyState', { required: 'State is required' })}
                className={`mt-1 block w-full px-4 py-3 rounded-lg border ${
                  errors.propertyState ? 'border-red-500' : 'border-gray-300'
                } focus:ring-primary-500 focus:border-primary-500`}
              >
                <option value="">Select a state</option>
                {US_STATES.map(state => (
                  <option key={state.code} value={state.code}>
                    {state.name}
                  </option>
                ))}
              </select>
              {errors.propertyState && (
                <p className="mt-1 text-sm text-red-600">{errors.propertyState.message}</p>
              )}
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700">
                ZIP Code
                <InfoTooltip content="Enter the property's ZIP code" />
              </label>
              <input
                type="text"
                {...register('propertyZipCode', {
                  required: 'ZIP code is required',
                  pattern: {
                    value: /^\d{5}(-\d{4})?$/,
                    message: 'Enter a valid ZIP code'
                  }
                })}
                className={`mt-1 block w-full px-4 py-3 rounded-lg border ${
                  errors.propertyZipCode ? 'border-red-500' : 'border-gray-300'
                } focus:ring-primary-500 focus:border-primary-500`}
                placeholder="Enter ZIP code"
              />
              {errors.propertyZipCode && (
                <p className="mt-1 text-sm text-red-600">{errors.propertyZipCode.message}</p>
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

export default PropertyInfo;