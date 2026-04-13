import { api } from "./api";

export type Campaign = {
  id: string;
  title: string;
  description: string;
  goalAmount: number;
  raisedAmount: number;
  imageUrl: string | null;
  category: string;
  creatorId: string;
  isActive: boolean;
  createdAt: string;
  creator?: { name: string; email?: string };
  _count?: { donations: number };
};

export type Donation = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  campaign?: { title: string };
  donor?: { name: string };
};

export async function getAllCampaigns(category?: string) {
  const { data } = await api.get<Campaign[]>("/api/campaigns");
  if (category && category !== "All") {
    return data.filter(c => c.category === category);
  }
  return data;
}

export async function getCampaignById(id: string) {
  const { data } = await api.get<Campaign & { donations: Donation[] }>(`/api/campaigns/${id}`);
  return data;
}

export async function createDonationOrder(campaignId: string, amount: number) {
  const { data } = await api.post<{ orderId: string; amount: number; currency: string; keyId: string }>(
    "/api/donations/create-order",
    { campaignId, amount }
  );
  return data;
}

export async function verifyDonation(orderId: string, paymentId: string, signature: string) {
  const { data } = await api.post("/api/donations/verify", {
    orderId,
    paymentId,
    signature,
  });
  return data;
}

export async function getMyDonations() {
  const { data } = await api.get<Donation[]>("/api/donations/my");
  return data;
}
