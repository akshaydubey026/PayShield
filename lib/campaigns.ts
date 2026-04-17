import axios from "axios";
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
  /** Present on GET /api/campaigns list (aggregated server-side). */
  hasBlockedDonations?: boolean;
};

export type Donation = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  stripeSessionId?: string | null;
  campaign?: { id: string; title: string; imageUrl?: string | null; category?: string };
  donor?: { name: string };
};

export type VerifyDonationResult = {
  success: boolean;
  message?: string;
  status?: string;
  alreadyProcessed?: boolean;
  donation?: { id: string; amount: number; campaignId: string; status: string };
};

export async function getAllCampaigns(category?: string) {
  const { data } = await api.get<Campaign[]>("/api/campaigns");
  if (category && category !== "All") {
    return data.filter((c) => c.category === category);
  }
  return data;
}

export async function getCampaignById(id: string) {
  const { data } = await api.get<Campaign & { donations: Donation[] }>(`/api/campaigns/${id}`);
  return data;
}

export async function createDonationOrder(campaignId: string, amount: number) {
  const { data } = await api.post<{ url: string; sessionId: string }>(
    "/api/donations/create-order",
    { campaignId, amount }
  );
  return data;
}

export async function verifyDonation(sessionId: string): Promise<VerifyDonationResult> {
  try {
    const { data } = await api.post<VerifyDonationResult>("/api/donations/verify", { sessionId });
    return data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data && typeof error.response.data === "object") {
      const body = error.response.data as { alreadyProcessed?: boolean; success?: boolean };
      if (body.alreadyProcessed) {
        return { success: true, alreadyProcessed: true };
      }
    }
    throw error;
  }
}

export async function getMyDonations() {
  const { data } = await api.get<{ success: boolean; donations: Donation[] }>(
    "/api/donations/my-donations"
  );
  return data.donations ?? [];
}
