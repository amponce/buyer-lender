'use client'

import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { useForm } from 'react-hook-form'
import { QuoteRequest } from '@/lib/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  quoteRequest: QuoteRequest
}

export default function QuoteModal({ isOpen, onClose, onSubmit, quoteRequest }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm()

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded bg-white p-6">
          <Dialog.Title className="text-lg font-medium mb-4">
            Submit Quote for Request #{quoteRequest.id}
          </Dialog.Title>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Interest Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                {...register('interestRate', {
                  required: 'Interest rate is required',
                  min: { value: 0.01, message: 'Must be greater than 0' },
                  max: { value: 15, message: 'Must be less than 15%' }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
              {errors.interestRate && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.interestRate.message as string}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Loan Term (years)
              </label>
              <select
                {...register('loanTerm', { required: 'Loan term is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="15">15 years</option>
                <option value="20">20 years</option>
                <option value="30">30 years</option>
              </select>
              {errors.loanTerm && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.loanTerm.message as string}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Additional Notes
              </label>
              <textarea
                {...register('additionalNotes')}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div className="mt-6 flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
              >
                Submit Quote
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
} 