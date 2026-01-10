import theme from './theme.config';

export const layout = {
  sidebar: {
    width: {
      collapsed: 'w-16',
      expanded: 'w-64',
    },
    headerHeight: 'h-12',
    footerHeight: 'h-12',
    gap: 'gap-4',
    padding: theme.spacing.base,
  },
  topHero: {
    height: 'h-24',
    padding: theme.spacing.base,
  },
  content: {
    padding: theme.spacing.base,
  },
};

export default layout;
