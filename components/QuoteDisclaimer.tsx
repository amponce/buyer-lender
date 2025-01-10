'use client'

export default function QuoteDisclaimer({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">Important Information About This Quote</h3>
          <div className="mt-2 text-sm text-yellow-700">
            <ul className="list-disc pl-5 space-y-1">
              <li>All quotes are subject to final verification of income, credit, and financial information</li>
              <li>Rates and terms may change based on market conditions and final verification</li>
              <li>A conversation with the lender is required before accepting any quote</li>
              <li>This is not a loan commitment or guarantee of approval</li>
              <li>Additional documentation may be required for final approval</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 