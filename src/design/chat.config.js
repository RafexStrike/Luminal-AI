import theme from './theme.config';

export const chat = {
  sidebarTitleTruncate: 'truncate',
  bubble: {
    // User messages: solid accent background with white text; include dark variants
    user: `${theme.colors.accentBgSolid} ${theme.radius.base} text-white ${theme.colors.accentBgSolidDark}`,
    // Assistant messages: light gray background in light mode, darker in dark mode
    assistant: `bg-gray-100 ${theme.radius.base} text-gray-900 dark:bg-gray-800 dark:text-gray-100`,
    system: `bg-red-50 ${theme.radius.base} text-red-700 dark:bg-red-900 dark:text-red-200`,
  },
  messageMaxWidth: 'max-w-md',
};

export default chat;
