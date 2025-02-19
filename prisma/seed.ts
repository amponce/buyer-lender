import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data in the correct order
  await prisma.message.deleteMany();
  await prisma.aIConversation.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.quoteRequest.deleteMany();
  await prisma.lenderAIProfile.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  const buyers = await Promise.all([
    prisma.user.create({
      data: {
        id: uuidv4(),
        email: 'aaron.m.ponce+buyer1@gmail.com',
        password: await hash('password123', 12),
        role: 'BUYER'
      }
    }),
    prisma.user.create({
      data: {
        id: uuidv4(),
        email: 'aaron.m.ponce+buyer2@gmail.com',
        password: await hash('password123', 12),
        role: 'BUYER'
      }
    }),
    prisma.user.create({
      data: {
        id: uuidv4(),
        email: 'aaron.m.ponce+buyer3@gmail.com',
        password: await hash('password123', 12),
        role: 'BUYER'
      }
    })
  ]);

  const lenders = await Promise.all([
    prisma.user.create({
      data: {
        id: uuidv4(),
        email: 'aaron.m.ponce+lender1@gmail.com',
        password: await hash('password123', 12),
        role: 'LENDER'
      }
    }),
    prisma.user.create({
      data: {
        id: uuidv4(),
        email: 'aaron.m.ponce+lender2@gmail.com',
        password: await hash('password123', 12),
        role: 'LENDER'
      }
    }),
    prisma.user.create({
      data: {
        id: uuidv4(),
        email: 'aaron.m.ponce+lender3@gmail.com',
        password: await hash('password123', 12),
        role: 'LENDER'
      }
    })
  ]);

  // Create AI profiles for lenders with rate sheets
  const lenderAIProfiles = await Promise.all(lenders.map(lender => 
    prisma.lenderAIProfile.create({
      data: {
        id: uuidv4(),
        lenderId: lender.id,
        isAutopilotActive: true,
        rateSheet: JSON.stringify({
          '30_year_fixed': {
            base_rate: 6.875,
            min_credit_score: 620,
            points: 0,
            credit_adjustments: {
              '760+': -0.5,
              '740-759': -0.375,
              '720-739': -0.25,
              '700-719': -0.125,
              '680-699': 0,
              '660-679': 0.25,
              '<660': 0.5
            }
          },
          '15_year_fixed': {
            base_rate: 6.125,
            min_credit_score: 620,
            points: 0
          },
          'fha': {
            base_rate: 6.75,
            min_credit_score: 580,
            points: 0,
            mip_annual: 0.85,
            mip_upfront: 1.75
          }
        }),
        guidelines: JSON.stringify({
          min_credit_score: 620,
          max_dti: 43,
          max_ltv: 97,
          income_requirements: [
            'Two years of employment history required',
            'Stable or increasing income preferred',
            'All income sources must be verifiable'
          ]
        }),
        productInfo: JSON.stringify({
          conventional: {
            terms: [15, 30],
            min_down: 3,
            pmi_required: true,
            pmi_removal: 'At 20% equity'
          },
          fha: {
            terms: [30],
            min_down: 3.5,
            mip_required: true,
            mip_removal: 'Must refinance'
          }
        }),
        faqResponses: JSON.stringify([
          {
            question: 'What documents do I need?',
            answer: 'You will need: Pay stubs, W-2s, tax returns, bank statements, and employment verification.'
          },
          {
            question: 'How long does the process take?',
            answer: 'Typically 30-45 days from application to closing.'
          }
        ])
      },
      include: {
        lender: true
      }
    })
  ));

  // Create quote requests for testing the lender dashboard
  for (const buyer of buyers) {
    // Create multiple requests in different states
    const states = ['CA', 'NY', 'TX', 'FL'];
    const statuses = ['PENDING', 'QUOTED', 'ACCEPTED', 'DECLINED'];
    
    for (let i = 0; i < 3; i++) {
      const requestId = uuidv4();
      const state = states[Math.floor(Math.random() * states.length)];
      const status = statuses[Math.floor(Math.random() * (i === 0 ? 1 : statuses.length))]; // First one always PENDING
      
      await prisma.quoteRequest.create({
        data: {
          id: requestId,
          buyerId: buyer.id,
          propertyAddress: `${Math.floor(Math.random() * 9999)} ${['Main', 'Oak', 'Maple', 'Cedar'][Math.floor(Math.random() * 4)]} St`,
          propertyCity: ['San Francisco', 'New York', 'Austin', 'Miami'][Math.floor(Math.random() * 4)],
          propertyState: state,
          propertyZipCode: String(Math.floor(Math.random() * 90000) + 10000),
          purchasePrice: Math.floor(Math.random() * (1000000 - 200000) + 200000),
          downPaymentAmount: Math.floor(Math.random() * 200000) + 50000,
          creditScore: Math.floor(Math.random() * (800 - 650) + 650),
          annualIncome: Math.floor(Math.random() * (200000 - 50000) + 50000),
          monthlyCarLoan: Math.floor(Math.random() * 500),
          monthlyCreditCard: Math.floor(Math.random() * 1000),
          monthlyOtherExpenses: Math.floor(Math.random() * 1000),
          employmentStatus: 'EMPLOYED',
          employmentYears: Math.floor(Math.random() * 20) + 1,
          status
        }
      });

      // Add quotes for non-pending requests
      if (status !== 'PENDING') {
        const isAI = Math.random() > 0.5;
        const loanTerm = [15, 30][Math.floor(Math.random() * 2)];
        const interestRate = loanTerm === 30 ? 6.875 : 6.125;
        const loanAmount = Math.floor(Math.random() * (1000000 - 200000) + 200000);
        const monthlyRate = interestRate / 100 / 12;
        const numPayments = loanTerm * 12;
        const monthlyPI = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
        
        await prisma.quote.create({
          data: {
            id: uuidv4(),
            quoteRequestId: requestId,
            lenderId: lenders[Math.floor(Math.random() * lenders.length)].id,
            interestRate,
            loanTerm,
            monthlyPayment: Math.round(monthlyPI),
            status: status === 'ACCEPTED' ? 'ACCEPTED' : 'PENDING',
            isAIGenerated: isAI,
            additionalNotes: `${loanTerm}-Year Fixed\n` +
              `Down Payment: $${(loanAmount * 0.2).toLocaleString()} (20%)\n` +
              `Monthly P&I: $${monthlyPI.toFixed(2)}\n` +
              `Monthly MI: $0\n` +
              `Total Cash Needed: $${(loanAmount * 0.23).toLocaleString()}`
          }
        });
      }
    }
  }

  // Create a quote request for the first buyer (keeping your existing detailed quote request)
  const quoteRequest = await prisma.quoteRequest.create({
    data: {
      id: uuidv4(),
      buyerId: buyers[0].id,
      propertyAddress: '123 Main St',
      propertyCity: 'San Francisco',
      propertyState: 'CA',
      propertyZipCode: '94105',
      purchasePrice: 750000,
      downPaymentAmount: 150000,
      creditScore: 740,
      annualIncome: 175000,
      monthlyCarLoan: 500,
      monthlyCreditCard: 200,
      monthlyOtherExpenses: 300,
      employmentStatus: 'EMPLOYED',
      employmentYears: 5
    }
  });

  // Keep your existing AI conversations and quotes creation
  for (const lenderProfile of lenderAIProfiles) {
    const conversation = await prisma.aIConversation.create({
      data: {
        id: uuidv4(),
        aiProfileId: lenderProfile.id,
        quoteRequestId: quoteRequest.id,
        status: 'ACTIVE',
        summary: JSON.stringify({
          profile: {
            creditScore: 740,
            monthlyIncome: 14583.33,
            dti: '6.9%',
            ltv: '80.0%',
            maxLoanAmount: 700000
          },
          challenges: [],
          recommendedPrograms: [
            'Conventional 30-Year Fixed',
            'Conventional 15-Year Fixed'
          ],
          nextSteps: [
            'Review available loan options',
            'Discuss qualification requirements'
          ]
        }),
        nextSteps: 'Ready to proceed with pre-approval'
      }
    });

    const quotes = [
      {
        type: 'Conventional 30-Year Fixed',
        rate: 6.5,
        term: 30,
        monthlyPI: 3791.68,
        monthlyMI: 0,
        monthlyTotal: 3791.68
      },
      {
        type: 'Conventional 15-Year Fixed',
        rate: 5.875,
        term: 15,
        monthlyPI: 5012.45,
        monthlyMI: 0,
        monthlyTotal: 5012.45
      }
    ];

    const quotePromises = quotes.map((quote, index) => 
      new Promise(resolve => setTimeout(async () => {
        const createdQuote = await prisma.quote.create({
          data: {
            id: uuidv4(),
            quoteRequestId: quoteRequest.id,
            lenderId: lenderProfile.lenderId,
            interestRate: quote.rate,
            loanTerm: quote.term,
            monthlyPayment: quote.monthlyTotal,
            isAIGenerated: true,
            additionalNotes: `${quote.type}\n` +
              `Down Payment: $150,000 (20%)\n` +
              `Monthly P&I: $${quote.monthlyPI.toFixed(2)}\n` +
              `Monthly MI: $${quote.monthlyMI.toFixed(2)}\n` +
              `Total Cash Needed: $165,000`
          }
        });
        resolve(createdQuote);
      }, index * 2000))
    );

    // Create quotes for each viable option with staggered timing
    await Promise.all(quotePromises);

    // Create initial message
    await prisma.message.create({
      data: {
        id: uuidv4(),
        requestId: quoteRequest.id,
        senderId: lenderProfile.lenderId,
        lenderId: lenderProfile.lenderId,
        content: `Great news! Based on your strong profile, you have several excellent financing options available.\n\n` +
          `With your solid credit score of 740 and 20% down payment, you qualify for our best rates and most flexible terms.\n\n` +
          `I've prepared two options for you to consider:\n\n` +
          `1. Conventional 30-Year Fixed\n` +
          `• Rate: 6.5%\n` +
          `• Monthly Payment: $3,791.68\n` +
          `• No PMI required\n\n` +
          `2. Conventional 15-Year Fixed\n` +
          `• Rate: 5.875%\n` +
          `• Monthly Payment: $5,012.45\n` +
          `• Build equity faster\n\n` +
          `Would you like to:\n` +
          `• Compare these options in more detail?\n` +
          `• Calculate payments with different down payment amounts?\n` +
          `• Start the pre-approval process?`,
        isAIGenerated: true,
        aiConversationId: conversation.id
      }
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
