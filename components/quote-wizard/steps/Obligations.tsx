'use client'
import React from 'react';
import { useForm } from 'react-hook-form';
import InfoTooltip from '@/components/InfoTooltip';

interface FormData {
  monthlyCarLoan: string;
  monthlyCreditCard: string;
  monthlyOtherExpenses: string;
}

interface Props {
  data: FormData;
  updateData: (data: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const Obligations: React.FC<Props> = ({ data, updateData, onNext, onBack }) => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: data
  });

  const watchAllFields = watch(['monthlyCarLoan', 'monthlyCreditCard', 'monthlyOtherExpenses']);
  const totalMonthlyObligations = watchAllFields.reduce(
    (sum, value) => sum + (parseFloat(value) || 0), 
    0
  );

  const onSubmit = (formData: FormData) => {
    updateData(formData);
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Monthly Obligations</h2>
        <p className="mt-2 text-gray-600">Tell us about your monthly expenses</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700">
              Car Loan Payment
              <InfoTooltip content="Your total monthly car loan payments" />
            </label>
            <div className="mt-1 relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
              <input
                type="number"
                {...register('monthlyCarLoan', {
                  min: {
                    value: 0,
                    message: 'Amount cannot be negative'
                  }
                })}
                className="block w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter monthly car payment (if any)"
              />
              {errors.monthlyCarLoan && (
                <p className="mt-1 text-sm text-red-600">{errors.monthlyCarLoan.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700">
              Credit Card Payments
              <InfoTooltip content="Minimum monthly payments across all credit cards" />
            </label>
            <div className="mt-1 relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
              <input
                type="number"
                {...register('monthlyCreditCard', {
                  min: {
                    value: 0,
                    message: 'Amount cannot be negative'
                  }
                })}
                className="block w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter monthly credit card payments"
              />
              {errors.monthlyCreditCard && (
                <p className="mt-1 text-sm text-red-600">{errors.monthlyCreditCard.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700">
              Other Monthly Expenses
              <InfoTooltip content="Include student loans, personal loans, etc." />
            </label>
            <div className="mt-1 relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
              <input
                type="number"
                {...register('monthlyOtherExpenses', {
                  min: {
                    value: 0,
                    message: 'Amount cannot be negative'
                  }
                })}
                className="block w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter other monthly obligations"
              />
              {errors.monthlyOtherExpenses && (
                <p className="mt-1 text-sm text-red-600">{errors.monthlyOtherExpenses.message}</p>
              )}
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Monthly Obligations:</span>
              <span className="text-lg font-semibold text-gray-900">
                ${totalMonthlyObligations.toLocaleString(undefined,{
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
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

export default Obligations;