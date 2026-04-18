import { createOrder } from './src/controllers/donation.controller.js';
import { prisma } from './src/lib/prisma.js';

async function test() {
  const user = await prisma.user.findFirst();
  const campaign = await prisma.campaign.findFirst();
  
  const req: any = {
    user: { id: user!.id },
    body: {
      campaignId: campaign!.id,
      amount: 500
    },
    fraudResult: {
      riskScore: 10,
      flags: []
    }
  };

  const res: any = {
    status(code: number) {
      console.log("Status:", code);
      return this;
    },
    json(data: any) {
      console.log("Response:", data);
      return this;
    }
  };

  try {
    await createOrder(req, res);
  } catch (err) {
    console.error("Uncaught:", err);
  }
}

test();
