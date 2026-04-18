import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const campaignsData = [
  {
    title: "Flood Relief Kerala",
    description: "Provide immediate emergency kits and shelter to families devastated by recent monsoons in Kerala. Every contribution goes toward water filtration, medicines, and temporary housing materials.",
    goalAmount: 500000,
    raisedAmount: 120000,
    category: "Relief",
  },
  {
    title: "Child Education Punjab",
    description: "Sponsor educational supplies and digital learning tools for underprivileged children in rural Punjab. Your donation provides tablets, winter uniforms, and textbook access for a full academic year.",
    goalAmount: 250000,
    raisedAmount: 80000,
    category: "Education",
  },
  {
    title: "Cancer Research Mumbai",
    description: "Support pediatric oncology research and treatment subsidies at the Tata Memorial Hospital. Help families cover the cost of life-saving chemotherapy sessions and long-term care.",
    goalAmount: 1000000,
    raisedAmount: 340000,
    category: "Health",
  },
  {
    title: "Clean Water Rajasthan",
    description: "Help install sustainable solar-powered water purification plants in desert communities facing acute water scarcity. Ensures safe drinking water for 500+ households per installation.",
    goalAmount: 150000,
    raisedAmount: 90000,
    category: "Environment",
  },
  {
    title: "Old Age Home Delhi",
    description: "Fund meals, medical checkups, and critical infrastructure repairs for the elderly living in underfunded care homes across the capital. Provide dignity and comfort to forgotten citizens.",
    goalAmount: 300000,
    raisedAmount: 110000,
    category: "Elderly",
  },
  {
    title: "Tree Plantation Uttarakhand",
    description: "Join the eco-drive to plant 10,000 native saplings on deforested Himalayan slopes. Restoring the local ecosystem prevents landslides and creates employment for local caretakers.",
    goalAmount: 50000,
    raisedAmount: 15000,
    category: "Environment",
  }
];

async function main() {
  console.log("Seeding database...");

  // Clean old data to prevent generic duplicates
  await prisma.donation.deleteMany({});
  await prisma.campaign.deleteMany({});
  
  // Look for a creator to own the campaigns
  let creator = await prisma.user.findFirst({ where: { role: "CREATOR" } });
  
  if (!creator) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    creator = await prisma.user.create({
      data: {
        name: "PayShield Admin",
        email: "admin@payshield.com",
        password: passwordHash,
        role: "CREATOR"
      }
    });
  }

  for (const c of campaignsData) {
    await prisma.campaign.create({
      data: {
        ...c,
        creatorId: creator.id,
      }
    });
  }

  console.log("Seeding complete. 6 campaigns created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
