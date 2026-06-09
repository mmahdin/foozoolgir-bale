import axios from "axios";

const BASE_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

export interface BaleLink {
  name: string;
  label: string;
  created_at: string;
  click_count: number;
  visitors: number[];
  deep_link: string;
  user_id?: number;
  user?: BaleUser | null;
}

export interface BaleUser {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  is_bot: boolean;
  first_seen: string;
  last_seen: string;
  profile_photo_path: string;
  source_links: string[];
  message_count: number;
}

export interface BaleMessage {
  message_id: number;
  text: string;
  date: string;
  type: string;
  user_id?: number;
  user?: BaleUser;
}

export interface SentMessage {
  id: string;
  user_id: number;
  message_id: number;
  text: string;
  sent_at: string;
  deleted: boolean;
}

export interface Stats {
  total_users: number;
  total_links: number;
  total_messages: number;
  total_clicks: number;
  total_sent_messages: number;
  bot_username: string;
  bot_token_set: boolean;
}

export interface BotMessage {
  key: string;
  title: string;
  description: string;
  variables: string[];
  text: string;
}

export interface SpecialMessageEntry {
  user_id: number;
  user: BaleUser | null;
  messages: Record<string, string>;
}

// ─────────────────────────────────────────────────────────
// Links API
// ─────────────────────────────────────────────────────────

export const fetchLinks = async (): Promise<BaleLink[]> => {
  const res = await api.get("/api/links");
  return res.data.links;
};

export const createLink = async (name: string, label: string): Promise<BaleLink> => {
  const res = await api.post("/api/links", { name, label });
  return res.data;
};

export const deleteLink = async (name: string): Promise<void> => {
  await api.delete(`/api/links/${name}`);
};

export const fetchLinkVisitors = async (name: string) => {
  const res = await api.get(`/api/links/${name}/visitors`);
  return res.data;
};

// ─────────────────────────────────────────────────────────
// Users API
// ─────────────────────────────────────────────────────────

export const fetchUsers = async (): Promise<BaleUser[]> => {
  const res = await api.get("/api/users");
  return res.data.users;
};

export const fetchUser = async (userId: number): Promise<BaleUser> => {
  const res = await api.get(`/api/users/${userId}`);
  return res.data;
};

export const fetchUserMessages = async (userId: number) => {
  const res = await api.get(`/api/users/${userId}/messages`);
  return res.data;
};

export const fetchUserSentMessages = async (userId: number): Promise<SentMessage[]> => {
  const res = await api.get(`/api/users/${userId}/sent-messages`);
  return res.data.sent_messages;
};

export const sendMessageToUser = async (userId: number, text: string): Promise<SentMessage> => {
  const res = await api.post(`/api/users/${userId}/send-message`, { text });
  return res.data.sent_message;
};

export const deleteSentMessage = async (entryId: string): Promise<void> => {
  await api.delete(`/api/sent-messages/${entryId}`);
};

export const getUserPhotoUrl = (userId: number) =>
  `${BASE_URL}/api/users/${userId}/photo`;

// ─────────────────────────────────────────────────────────
// Stats API
// ─────────────────────────────────────────────────────────

export const fetchStats = async (): Promise<Stats> => {
  const res = await api.get("/api/stats");
  return res.data;
};

export const fetchBotInfo = async () => {
  const res = await api.get("/api/bot/info");
  return res.data;
};

// ─────────────────────────────────────────────────────────
// Bot Messages API
// ─────────────────────────────────────────────────────────

export const fetchBotMessages = async (): Promise<BotMessage[]> => {
  const res = await api.get("/api/bot-messages");
  return res.data.messages;
};

export const updateBotMessage = async (key: string, text: string): Promise<BotMessage> => {
  const res = await api.put(`/api/bot-messages/${key}`, { text });
  return res.data;
};

export const resetBotMessage = async (key: string): Promise<BotMessage> => {
  const res = await api.delete(`/api/bot-messages/${key}`);
  return res.data;
};

// ─────────────────────────────────────────────────────────
// Special Messages API
// ─────────────────────────────────────────────────────────

export const fetchSpecialMessages = async (): Promise<SpecialMessageEntry[]> => {
  const res = await api.get("/api/special-messages");
  return res.data.entries;
};

export const setSpecialMessage = async (
  userId: number,
  key: string,
  text: string
): Promise<void> => {
  await api.post("/api/special-messages", { user_id: userId, key, text });
};

export const deleteSpecialMessage = async (userId: number, key: string): Promise<void> => {
  await api.delete(`/api/special-messages/${userId}/${key}`);
};

// ─────────────────────────────────────────────────────────
// Settings API
// ─────────────────────────────────────────────────────────

export const fetchSettings = async () => {
  const res = await api.get("/api/settings");
  return res.data;
};

export const updateSettings = async (data: Record<string, string>): Promise<void> => {
  await api.post("/api/settings", data);
};

export const setWebhook = async (webhookUrl: string): Promise<void> => {
  await api.post("/api/bot/webhook", { webhook_url: webhookUrl });
};

export const getUserLink = async (userId: number): Promise<{ token: string; deep_link: string }> => {
  const res = await api.get(`/api/users/${userId}/link`);
  return res.data;
};
