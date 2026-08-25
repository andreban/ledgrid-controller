import { useWebMCP, type WebMCPState } from 'use-webmcp-tool';
import {
  searchEmojiCatalog,
  isValidEmoji,
  type EmojiSearchParams,
  type EmojiSearchResponse,
} from '../services/emojiCatalog.js';

export interface UseEmojiWebMCPOptions {
  onSelectEmoji: (emoji: string) => void | Promise<void>;
  enabled?: boolean;
}

export interface EmojiDisplayResponse {
  success: boolean;
  emoji?: string;
  message?: string;
  error_code?: string;
}

export interface UseEmojiWebMCPReturn {
  supported: boolean;
  searchToolState: WebMCPState;
  displayToolState: WebMCPState;
}

export function useEmojiWebMCP({
  onSelectEmoji,
  enabled = true,
}: UseEmojiWebMCPOptions): UseEmojiWebMCPReturn {
  const searchToolState = useWebMCP<EmojiSearchParams, EmojiSearchResponse>({
    name: 'search_emojis',
    description: 'Searches the emoji catalog by keyword or category with pagination support.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: "Search term or keyword (e.g. 'space', 'rocket', 'smile', 'cat')",
        },
        category: {
          type: 'string',
          description:
            "Optional category filter (e.g. 'travel_places', 'smileys_people', 'animals_nature', 'food_drink', 'activities', 'objects', 'symbols', 'flags')",
        },
        page: {
          type: 'number',
          description: 'Page number (default: 1)',
        },
        page_size: {
          type: 'number',
          description: 'Number of results per page (default: 6, max: 12)',
        },
      },
      required: ['query'],
    },
    annotations: {
      readOnlyHint: true,
    },
    enabled,
    execute: (args) => {
      return searchEmojiCatalog(args);
    },
  });

  const displayToolState = useWebMCP<{ emoji: string }, EmojiDisplayResponse>({
    name: 'display_emoji',
    description:
      'Sets the active emoji on the LED grid controller, updating the display preview and syncing to Firebase.',
    inputSchema: {
      type: 'object',
      properties: {
        emoji: {
          type: 'string',
          description: "Single emoji character to display (e.g. '🚀')",
        },
      },
      required: ['emoji'],
    },
    enabled,
    execute: async ({ emoji }) => {
      if (!isValidEmoji(emoji)) {
        return {
          success: false,
          error_code: 'INVALID_EMOJI',
          message: 'Input must be a valid single emoji character.',
        };
      }

      await onSelectEmoji(emoji);

      return {
        success: true,
        emoji,
        message: `Emoji ${emoji} is now displayed and synced.`,
      };
    },
  });

  const supported = searchToolState.supported || displayToolState.supported;

  return {
    supported,
    searchToolState,
    displayToolState,
  };
}
