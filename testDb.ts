import { prisma } from './src/lib/prisma.js';
import * as stripeService from './src/services/stripe.service.js';

async function testCreateOrder() {
  try {
    const campaignId = 'test-campaign';
    const amount = 500;
    
    // Create a dummy campaign and user to satisfy foreign keys
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({ data: { email: 'test@example.com', password: 'pwd', name: 'tester' } });
    }
    
    let campaign = await prisma.campaign.findFirst();
    if (!campaign) {
      campaign = await prisma.campaign.create({ data: { id: campaignId, title: 'Test', description: 'Test', goalAmount: 1000, category: 'education', creatorId: user.id } });
    }

    const donation = await prisma.donation.create({
      data: {
        amount,
        donorId: user.id,
        campaignId: campaign.id,
        status: "PENDING",
        riskScore: 0,
        fraudFlags: [],
      },
    });
    console.log("Donation created:", donation.id);

    const session = await stripeService.createCheckoutSession(amount, "inr", donation.id, campaign.title);
    console.log("Stripe session returned URL:", session.url);

    await prisma.donation.update({
      where: { id: donation.id },
      data: { stripeSessionId: session.id },
    });
    console.log("Donation updated successfully with stripe session id.");
    
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testCreateOrder();
