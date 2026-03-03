import { Scenes, session } from 'telegraf';

export interface BotSession extends Scenes.SceneSession {
  broadcastData?: {
    name?: string;
    text?: string;
    mediaFileId?: string;
    mediaType?: 'VIDEO' | 'IMAGE' | 'DOCUMENT';
    selectedAccountIds?: string[];
    selectedGroupIds?: string[];
  };
  currentAccountId?: string;
  currentPage?: number;
}

export interface BotContext extends Scenes.SceneContext {
  session: BotSession;
}

export const sessionMiddleware = session<BotSession>();