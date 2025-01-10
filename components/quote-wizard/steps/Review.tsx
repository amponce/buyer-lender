import React from 'react';
import { formatCurrency } from '@/lib/utils';

interface FormData {
  creditScore: string;
  annualIncome: string;
  additionalIncome: string;
  monthlyCarLoan: string;
  monthlyCreditCard: string;
  monthlyOtherExpenses: string;
  purchasePrice: string;
  propertyAddress: string;
  propertyState: string;
  propertyZipCode: string;
}

interface Props {
  data: FormData;
  onSubmit: () => void;
  onBack: () => void;
  onEdit: (step: number) => void;
}

const Review: React.FC<Props> = ({ data, onSubmit, onBack, onEdit }) => {
  // Calculate annual income
  const annualIncome = Number(data.annualIncome) || 0;
  const additionalIncome = Number(data.additionalIncome) || 0;
  const totalAnnualIncome = annualIncome + additionalIncome;
  const monthlyIncome = totalAnnualIncome / 12;

  // Calculate monthly obligations
  const monthlyObligations = 
    Number(data.monthlyCarLoan || 0) + 
    Number(data.monthlyCreditCard || 0) + 
    Number(data.monthlyOtherExpenses || 0);

  // Calculate DTI
  const debtToIncomeRatio = monthlyIncome > 0 
    ? (monthlyObligations / monthlyIncome) * 100 
    : 0;

  const Section = ({ title, children, stepNumber }: { title: string; children: React.ReactNode; stepNumber: number }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button
          onClick={() => onEdit(stepNumber)}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          Edit
        </button>
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Review Your Information</h2>
        <p className="mt-2 text-gray-600">Please review all information before submitting</p>
      </div>

      <div className="space-y-4">
        <Section title="Personal Information" stepNumber={0}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Credit Score</p>
              <p className="font-medium">{data.creditScore}</p>
            </div>
          </div>
        </Section>

        <Section title="Income Information" stepNumber={1}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Annual Income</p>
              <p className="font-medium">{formatCurrency(annualIncome)}/year</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Additional Income</p>
              <p className="font-medium">{formatCurrency(additionalIncome)}/year</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-500">Total Monthly Income</p>
              <p className="font-medium text-green-600">{formatCurrency(monthlyIncome)}/month</p>
            </div>
          </div>
        </Section>

        <Section title="Monthly Obligations" stepNumber={2}>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Car Loan</p>
              <p className="font-medium">{formatCurrency(Number(data.monthlyCarLoan) || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Credit Cards</p>
              <p className="font-medium">{formatCurrency(Number(data.monthlyCreditCard) || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Other Expenses</p>
              <p className="font-medium">{formatCurrency(Number(data.monthlyOtherExpenses) || 0)}</p>
            </div>
            <div className="col-span-3">
              <p className="text-sm text-gray-500">Total Monthly Obligations</p>
              <p className="font-medium text-amber-600">{formatCurrency(monthlyObligations)}</p>
            </div>
            <div className="col-span-3">
              <p className="text-sm text-gray-500">Debt-to-Income Ratio</p>
              <p className={`font-medium ${debtToIncomeRatio > 43 ? 'text-red-600' : 'text-green-600'}`}>
                {debtToIncomeRatio.toFixed(1)}%
              </p>
            </div>
          </div>
        </Section>

        <Section title="Property Information" stepNumber={3}>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Purchase Price</p>
              <p className="font-medium">{formatCurrency(Number(data.purchasePrice))}</p>
            </div>
            {data.propertyAddress && (
              <div>
                <p className="text-sm text-gray-500">Property Address</p>
                <p className="font-medium">{data.propertyAddress}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">State</p>
                <p className="font-medium">{data.propertyState}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ZIP Code</p>
                <p className="font-medium">{data.propertyZipCode}</p>
              </div>
            </div>
          </div>
        </Section>
      </div>

      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Submit Quote Request
        </button>
      </div>
    </div>
  );
};

export default Review;