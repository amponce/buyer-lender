'use client'

import { Dialog } from '@headlessui/react'
import { Quote } from '@/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  quote: Quote
  onAccept: () => void
  onDecline: () => void
}

export default function QuoteDetailsModal({
  isOpen,
  onClose,
  quote,
  onAccept,
  onDecline
}: Props) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl rounded bg-white p-6">
          <Dialog.Title className="text-lg font-semibold mb-4">
            Quote Details
          </Dialog.Title>

          <div className="space-y-6">
            {/* Rate Information */}
            <div>
              <h3 className="text-md font-medium mb-2">Rate Breakdown</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Base Rate:</span>
                  <span className="font-medium">{(quote.interestRate - 0.5).toFixed(3)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Credit Score Adjustment:</span>
                  <span className="font-medium">+0.25%</span>
                </div>
                <div className="flex justify-between">
                  <span>Market Conditions:</span>
                  <span className="font-medium">+0.25%</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Final Rate:</span>
                    <span>{quote.interestRate}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div>
              <h3 className="text-md font-medium mb-2">Payment Details</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Loan Amount:</span>
                  <span className="font-medium">${(quote.monthlyPayment * quote.loanTerm * 12).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Term Length:</span>
                  <span className="font-medium">{quote.loanTerm} years</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Principal & Interest:</span>
                  <span className="font-medium">${quote.monthlyPayment.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Escrow (Taxes & Insurance):</span>
                  <span className="font-medium">${(quote.monthlyPayment * 0.2).toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Monthly Payment:</span>
                    <span>${(quote.monthlyPayment * 1.2).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div>
              <h3 className="text-md font-medium mb-2">Terms & Conditions</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                <p>By accepting this quote, you acknowledge:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>This rate is locked for 30 days from acceptance</li>
                  <li>Final approval is subject to property appraisal</li>
                  <li>Closing costs are estimated at 2-5% of loan amount</li>
                  <li>Rate assumes a minimum down payment of 20%</li>
                  <li>Final terms subject to underwriting approval</li>
                </ul>
              </div>
            </div>

            {quote.additionalNotes && (
              <div>
                <h3 className="text-md font-medium mb-2">Additional Notes</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm">{quote.additionalNotes}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={onDecline}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Decline
              </button>
              <button
                onClick={onAccept}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Accept Quote
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
} 