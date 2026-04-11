/**
 * Centralized application configuration and constants.
 * Use this file to manage UI strings and global settings without hardcoding them in components.
 */

export const APP_CONFIG = {
  TITLE: 'Aequitas',
  SUBTITLE: 'Your Autonomous Legal Intelligence Companion',
  STORAGE_KEYS: {
    THEME: 'vite-ui-theme',
    AUTH_TOKEN: 'auth-token',
  },
  DEFAULT_THEME: 'light' as const,
  LAYOUT: {
    SIDEBAR_WIDTH: '280px',
    DRAWER_WIDTH: '100%',
  },
  ANIMATIONS: {
    TRANSITION_SPEED: '300ms',
  }
};
