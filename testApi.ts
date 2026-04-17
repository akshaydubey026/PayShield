import jwt from 'jsonwebtoken';

import { prisma } from './src/lib/prisma.js';

async function testEndpoint() {
  try {
    const user = await prisma.user.findFirst();
    const campaign = await prisma.campaign.findFirst();
    
    if (!user || !campaign) {
      console.log("No user or campaign found in DB.");
      return;
    }

    const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, "payshield_dev_access_secret_min_32_chars!!");

    const res = await fetch('http://localhost:5000/api/donations/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        campaignId: campaign.id,
        amount: 500
      })
    });

    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Payload:", data);

  } catch (err) {
    console.error(err);
  }
}

testEndpoint();
