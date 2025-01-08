import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.message.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.quoteRequest.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  const password = await hash('password123', 12);

  // Create buyers
  const buyer1 = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'aaron.m.ponce+buyer1@gmail.com',
      password,
      role: 'BUYER'
    }
  });

  const buyer2 = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'aaron.m.ponce+buyer2@gmail.com',
      password,
      role: 'BUYER'
    }
  });

  // Create lenders
  const lender1 = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'aaron.m.ponce+lender1@gmail.com',
      password,
      role: 'LENDER'
    }
  });

  const lender2 = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'aaron.m.ponce+lender2@gmail.com',
      password,
      role: 'LENDER'
    }
  });

  // Create quote requests
  const request1 = await prisma.quoteRequest.create({
    data: {
      userId: buyer1.id,
      creditScore: 750,
      annualIncome: 120000,
      additionalIncome: 10000,
      monthlyCarLoan: 400,
      monthlyCreditCard: 200,
      monthlyOtherExpenses: 300,
      purchasePrice: 450000,
      propertyAddress: '123 Main St',
      propertyState: 'CA',
      propertyZipCode: '94105',
      status: 'QUOTED',
      quotes: {
        create: [
          {
            lenderId: lender1.id,
            interestRate: 6.25,
            loanTerm: 30,
            monthlyPayment: 2771,
            additionalNotes: 'Great credit score! We can offer competitive rates.',
            status: 'PENDING'
          },
          {
            lenderId: lender2.id,
            interestRate: 6.5,
            loanTerm: 30,
            monthlyPayment: 2844,
            additionalNotes: 'We can close this loan in 21 days!',
            status: 'PENDING'
          }
        ]
      },
      messages: {
        create: [
          {
            senderId: buyer1.id,
            lenderId: lender1.id,
            content: 'Hi, I have some questions about your quote.'
          },
          {
            senderId: lender1.id,
            lenderId: lender1.id,
            content: 'Of course! Happy to help. What would you like to know?'
          },
          {
            senderId: buyer1.id,
            lenderId: lender2.id,
            content: 'Can you tell me more about your 21-day closing process?'
          },
          {
            senderId: lender2.id,
            lenderId: lender2.id,
            content: 'We have a streamlined process and work closely with local title companies to ensure quick closings.'
          }
        ]
      }
    }
  });

  const request2 = await prisma.quoteRequest.create({
    data: {
      userId: buyer2.id,
      creditScore: 680,
      annualIncome: 85000,
      additionalIncome: 5000,
      monthlyCarLoan: 350,
      monthlyCreditCard: 150,
      monthlyOtherExpenses: 200,
      purchasePrice: 350000,
      propertyAddress: '456 Oak Ave',
      propertyState: 'TX',
      propertyZipCode: '75001',
      status: 'PENDING',
      quotes: {
        create: [
          {
            lenderId: lender1.id,
            interestRate: 6.75,
            loanTerm: 30,
            monthlyPayment: 2271,
            additionalNotes: 'We can work with your credit score.',
            status: 'PENDING'
          }
        ]
      }
    }
  });

  const request3 = await prisma.quoteRequest.create({
    data: {
      userId: buyer1.id,
      creditScore: 760,
      annualIncome: 130000,
      additionalIncome: 15000,
      monthlyCarLoan: 500,
      monthlyCreditCard: 300,
      monthlyOtherExpenses: 400,
      purchasePrice: 550000,
      propertyAddress: '789 Pine St',
      propertyState: 'FL',
      propertyZipCode: '33101',
      status: 'QUOTED',
      quotes: {
        create: [
          {
            lenderId: lender1.id,
            interestRate: 6.375,
            loanTerm: 30,
            monthlyPayment: 3432,
            status: 'ACCEPTED'
          }
        ]
      }
    }
  });

  // Create messages
  await prisma.message.createMany({
    data: [
      {
        requestId: request1.id,
        senderId: lender1.id,
        lenderId: lender1.id,
        content: "Hi! I've submitted a quote for your request. Let me know if you have any questions!"
      },
      {
        requestId: request1.id,
        senderId: buyer1.id,
        lenderId: lender1.id,
        content: "Thanks! Could you explain the closing timeline?"
      },
      {
        requestId: request1.id,
        senderId: lender1.id,
        lenderId: lender1.id,
        content: "We typically close in 30 days, but can expedite if needed."
      },
      {
        requestId: request2.id,
        senderId: lender2.id,
        lenderId: lender2.id,
        content: "Hello! I've reviewed your application and provided a quote. Happy to discuss the terms."
      },
      {
        requestId: request2.id,
        senderId: buyer1.id,
        lenderId: lender2.id,
        content: "Thank you! The interest rate seems a bit high. Is there any flexibility?"
      }
    ]
  });

  console.log({
    buyer1: { id: buyer1.id, email: buyer1.email },
    buyer2: { id: buyer2.id, email: buyer2.email },
    lender1: { id: lender1.id, email: lender1.email },
    lender2: { id: lender2.id, email: lender2.email },
  });
  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 