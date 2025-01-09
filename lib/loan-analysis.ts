import { BuyerProfile, LoanOption, RateSheet } from '@/types'

export function analyzeBuyerProfile(
  creditScore: number,
  annualIncome: number,
  monthlyDebts: number,
  downPaymentAmount: number,
  purchasePrice: number
): BuyerProfile {
  const monthlyIncome = annualIncome / 12
  const dti = (monthlyDebts / monthlyIncome) * 100
  const ltv = ((purchasePrice - downPaymentAmount) / purchasePrice) * 100
  const maxLoanAmount = monthlyIncome * 48 // 4x annual income

  return {
    creditScore,
    monthlyIncome,
    dti,
    ltv,
    maxLoanAmount,
    hasStrongCredit: creditScore >= 720,
    hasAdequateIncome: dti <= 43,
    hasDownPayment: downPaymentAmount >= purchasePrice * 0.03,
    purchasePrice
  }
}

export function analyzeLoanOptions(
  purchasePrice: number,
  creditScore: number,
  monthlyIncome: number,
  monthlyDebts: number,
  downPaymentAmount: number,
  rateSheet: RateSheet
): LoanOption[] {
  const options: LoanOption[] = []
  const loanAmount = purchasePrice - downPaymentAmount
  const downPaymentPercent = (downPaymentAmount / purchasePrice) * 100

  // Helper function to calculate monthly P&I payment
  function calculateMonthlyPI(principal: number, rate: number, years: number): number {
    const monthlyRate = rate / 100 / 12
    const numPayments = years * 12
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
  }

  // Helper function to calculate PMI/MIP
  function calculateMI(loanAmount: number, type: 'conventional' | 'fha'): number {
    if (type === 'conventional') {
      if (downPaymentPercent >= 20) return 0
      // Rough PMI estimate based on LTV and credit score
      const pmiRate = creditScore >= 740 ? 0.5 : creditScore >= 700 ? 0.75 : 1.0
      return (loanAmount * (pmiRate / 100)) / 12
    } else {
      // FHA MIP calculation
      return (loanAmount * (rateSheet.fha.mip_annual / 100)) / 12
    }
  }

  // 30-year fixed
  if (creditScore >= rateSheet['30_year_fixed'].min_credit_score) {
    let rate = rateSheet['30_year_fixed'].base_rate
    // Apply credit score adjustments
    if (creditScore >= 760) rate += rateSheet['30_year_fixed'].credit_adjustments['760+']
    else if (creditScore >= 740) rate += rateSheet['30_year_fixed'].credit_adjustments['740-759']
    else if (creditScore >= 720) rate += rateSheet['30_year_fixed'].credit_adjustments['720-739']
    else if (creditScore >= 700) rate += rateSheet['30_year_fixed'].credit_adjustments['700-719']
    else if (creditScore >= 680) rate += rateSheet['30_year_fixed'].credit_adjustments['680-699']
    else if (creditScore >= 660) rate += rateSheet['30_year_fixed'].credit_adjustments['660-679']
    else rate += rateSheet['30_year_fixed'].credit_adjustments['<660']

    const monthlyPI = calculateMonthlyPI(loanAmount, rate, 30)
    const monthlyMI = calculateMI(loanAmount, 'conventional')

    options.push({
      type: 'Conventional 30-Year Fixed',
      rate,
      term: 30,
      monthlyPI,
      monthlyMI,
      monthlyTotal: monthlyPI + monthlyMI,
      downPayment: downPaymentAmount,
      downPaymentPercent,
      totalCashNeeded: downPaymentAmount + (purchasePrice * 0.03) // Closing costs estimated at 3%
    })
  }

  // 15-year fixed
  if (creditScore >= rateSheet['15_year_fixed'].min_credit_score) {
    const rate = rateSheet['15_year_fixed'].base_rate
    const monthlyPI = calculateMonthlyPI(loanAmount, rate, 15)
    const monthlyMI = calculateMI(loanAmount, 'conventional')

    options.push({
      type: 'Conventional 15-Year Fixed',
      rate,
      term: 15,
      monthlyPI,
      monthlyMI,
      monthlyTotal: monthlyPI + monthlyMI,
      downPayment: downPaymentAmount,
      downPaymentPercent,
      totalCashNeeded: downPaymentAmount + (purchasePrice * 0.03)
    })
  }

  // FHA loan
  if (creditScore >= rateSheet.fha.min_credit_score) {
    const rate = rateSheet.fha.base_rate
    const monthlyPI = calculateMonthlyPI(loanAmount, rate, 30)
    const monthlyMI = calculateMI(loanAmount, 'fha')

    options.push({
      type: 'FHA 30-Year Fixed',
      rate,
      term: 30,
      monthlyPI,
      monthlyMI,
      monthlyTotal: monthlyPI + monthlyMI,
      downPayment: downPaymentAmount,
      downPaymentPercent,
      totalCashNeeded: downPaymentAmount + (loanAmount * (rateSheet.fha.mip_upfront / 100)) + (purchasePrice * 0.03)
    })
  }

  return options
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function generatePersonalizedMessage(profile: BuyerProfile, options: LoanOption[]): string {
  const challenges = []
  if (!profile.hasStrongCredit) challenges.push('credit score')
  if (!profile.hasAdequateIncome) challenges.push('debt-to-income ratio')
  if (!profile.hasDownPayment) challenges.push('down payment')

  let message = `Thank you for your quote request! I've analyzed your profile and found ${options.length} potential financing options for your ${formatCurrency(profile.purchasePrice)} home purchase.\n\n`

  if (challenges.length > 0) {
    message += `While we have some options available, there are a few areas we should discuss to ensure you get the best possible terms: ${challenges.join(', ')}.\n\n`
  } else {
    message += `Great news! Your profile looks strong with a good credit score, manageable debt levels, and sufficient down payment.\n\n`
  }

  message += `Here are your options:\n\n`

  options.forEach((option, index) => {
    message += `${index + 1}. ${option.type}\n`
    message += `• Rate: ${option.rate.toFixed(3)}%\n`
    message += `• Monthly Principal & Interest: ${formatCurrency(option.monthlyPI)}\n`
    if (option.monthlyMI > 0) {
      message += `• Monthly Mortgage Insurance: ${formatCurrency(option.monthlyMI)}\n`
    }
    message += `• Total Monthly Payment: ${formatCurrency(option.monthlyTotal)}\n`
    message += `• Down Payment: ${formatCurrency(option.downPayment)} (${option.downPaymentPercent.toFixed(1)}%)\n`
    message += `• Total Cash Needed: ${formatCurrency(option.totalCashNeeded)}\n\n`
  })

  message += `Would you like to:\n`
  message += `• Discuss these options in more detail?\n`
  message += `• Learn about down payment assistance programs?\n`
  message += `• Start the pre-approval process?\n\n`

  if (challenges.length > 0) {
    message += `I can also provide guidance on improving your ${challenges.join(', ')} to qualify for better rates and terms.`
  }

  return message
} 