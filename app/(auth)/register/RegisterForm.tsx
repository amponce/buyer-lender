'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type UserType = 'BUYER' | 'LENDER' | 'LENDER_TEAM'

export default function RegisterForm() {
  const [error, setError] = useState<string>('')
  const [userType, setUserType] = useState<UserType>('BUYER')
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  const getRegistrationCodeLabel = () => {
    switch (userType) {
      case 'LENDER_TEAM':
        return 'Team Registration Code'
      case 'LENDER':
        return 'Lender Registration Code'
      default:
        return 'Registration Code'
    }
  }

  const getRegistrationCodeHelp = () => {
    switch (userType) {
      case 'LENDER_TEAM':
        return 'Enter your team registration code provided by the administrator'
      case 'LENDER':
        return 'Enter the registration code provided by your team manager'
      default:
        return ''
    }
  }

  const onSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          role: userType,
          isManager: userType === 'LENDER_TEAM'
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message)
      }

      router.push('/login?registered=true')
    } catch (error) {
      setError(error.message || 'An error occurred during registration')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
      {error && (
        <div className="text-red-600 text-center text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Account Type
          </label>
          <select
            value={userType}
            onChange={(e) => setUserType(e.target.value as UserType)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
          >
            <option value="BUYER">Home Buyer</option>
            <option value="LENDER">Individual Lender</option>
            <option value="LENDER_TEAM">Lending Team Account</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            {userType === 'LENDER_TEAM' 
              ? 'Team accounts can manage multiple lenders and track their performance'
              : userType === 'LENDER'
              ? 'Individual lenders can submit quotes and communicate with buyers'
              : 'Home buyers can request and receive mortgage quotes'}
          </p>
        </div>

        {(userType === 'LENDER' || userType === 'LENDER_TEAM') && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {getRegistrationCodeLabel()}
            </label>
            <input
              {...register('registrationCode', {
                required: 'Registration code is required'
              })}
              type="text"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              placeholder="Enter your registration code"
            />
            <p className="mt-1 text-sm text-gray-500">
              {getRegistrationCodeHelp()}
            </p>
            {errors.registrationCode && (
              <p className="mt-1 text-sm text-red-600">
                {errors.registrationCode.message as string}
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            type="email"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">
              {errors.email.message as string}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters'
              }
            })}
            type="password"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">
              {errors.password.message as string}
            </p>
          )}
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </div>

      <div className="text-sm text-center">
        <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
          Already have an account? Sign in
        </Link>
      </div>
    </form>
  )
} 