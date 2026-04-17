import { prisma } from './src/lib/prisma.js';
import jwt from 'jsonwebtoken';

async function run() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return;

    const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, "payshield_dev_access_secret_min_32_chars!!");

    console.log("Fetching health via next proxy...");
    const resH = await fetch("http://localhost:3000/api/health");
    console.log("Health proxy status:", resH.status);
    console.log("Health proxy data:", await resH.text());
  } catch(e) {
    console.error(e);
  }
}
run();
