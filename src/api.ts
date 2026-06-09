import axios from "axios";

const BASE_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface BaleLink {
  name: string;
  label: string;
  created_at: string;
  click_count: number;
  visitors: number[];
  deep_link: string;
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
  total_personal_links: number;
  total_personal_visitors: number;
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

export interface PersonalLink {
  token: string;
  user_id: number;
  user: BaleUser | null;
  deep_link: string;
}

export interface SpecialMessageEntry {
  identifier: string;
  user: BaleUser | null;
  messages: Record<string, string>;
}

// ─────────────────────────────────────────────
// Links API
// ─────────────────────────────────────────────

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

export const fetchLinkUsers = async (name: string) => {
  const res = await api.get(`/api/links/${name}/users`);
  return res.data;
};

// ─────────────────────────────────────────────
// Personal Links API
// ─────────────────────────────────────────────

export const fetchPersonalLinks = async (): Promise<PersonalLink[]> => {
  const res = await api.get("/api/personal-links");
  return res.data.personal_links;
};

export const fetchPersonalLinkVisitors = async (token: string) => {
  const res = await api.get(`/api/personal-links/${token}/visitors`);
  return res.data;
};

// ─────────────────────────────────────────────
// Users API
// ─────────────────────────────────────────────

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

export const getUserPhotoUrl = (userId: number) => `${BASE_URL}/api/users/${userId}/photo`;

// ─────────────────────────────────────────────
// Stats API
// ─────────────────────────────────────────────

export const fetchStats = async (): Promise<Stats> => {
  const res = await api.get("/api/stats");
  return res.data;
};

export const fetchBotInfo = async () => {
  const res = await api.get("/api/bot/info");
  return res.data;
};

// ─────────────────────────────────────────────
// Bot Messages API
// ─────────────────────────────────────────────

export const fetchBotMessages = async (): Promise<BotMessage[]> => {
  const res = await api.get("/api/bot-messages");
  return res.data.messages;
};

export const updateBotMessage = async (key: string, text: string): Promise<void> => {
  await api.put(`/api/bot-messages/${key}`, { text });
};

export const resetBotMessage = async (key: string): Promise<BotMessage> => {
  const res = await api.post(`/api/bot-messages/${key}/reset`);
  return res.data.message;
};

// ─────────────────────────────────────────────
// Special Messages API
// ─────────────────────────────────────────────

export const fetchSpecialMessages = async (): Promise<SpecialMessageEntry[]> => {
  const res = await api.get("/api/special-messages");
  return res.data.special_messages;
};

export const setSpecialMessage = async (
  identifier: string,
  key: string,
  text: string
): Promise<void> => {
  await api.post("/api/special-messages", { identifier, key, text });
};

export const deleteSpecialMessage = async (
  identifier: string,
  key: string
): Promise<void> => {
  await api.delete(`/api/special-messages/${identifier}/${key}`);
};

// ─────────────────────────────────────────────
// Messages API
// ─────────────────────────────────────────────

export const fetchAllMessages = async () => {
  const res = await api.get("/api/messages");
  return res.data;
};
