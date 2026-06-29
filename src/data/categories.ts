export const CATALOG_CATEGORIES = [
  { slug: 'all', name: 'All Simulations', icon: '🎮' },
  { slug: 'business-strategy', name: 'Business & Strategy', icon: '♟️' },
  { slug: 'financial-literacy', name: 'Financial Literacy', icon: '💰' },
  { slug: 'operations', name: 'Operations', icon: '🏭' },
  { slug: 'leadership', name: 'Leadership & HR', icon: '👥' },
] as const

export const DIFFICULTY_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'] as const

export const INDUSTRY_FILTER_OPTIONS = [
  'Manufacturing',
  'Retail',
  'Healthcare',
  'Technology',
  'Automotive',
] as const
