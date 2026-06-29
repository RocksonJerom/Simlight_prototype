import type { SimulationMeta } from '../types/simulation'

export const defaultMeta: SimulationMeta = {
  title: 'Supplier Selection Simulation',
  domain: 'Supply Chain Management',
  industry: 'Manufacturing',
  difficulty: 'Intermediate',
  duration: '30 Minutes',
  learningObjectives: [
    'Evaluate supplier options',
    'Negotiate effectively',
    'Manage supply chain risks',
  ],
  contentMode: 'ai',
  playMode: 'single',
  maxPlayers: 4,
}

export const DOMAIN_OPTIONS = [
  'Supply Chain Management',
  'Operations Management',
  'Business Strategy',
  'Finance',
  'Human Resources',
]

export const INDUSTRY_OPTIONS = [
  'Manufacturing',
  'Retail',
  'Healthcare',
  'Technology',
  'Automotive',
]

export const DURATION_OPTIONS = ['15 Minutes', '30 Minutes', '45 Minutes', '60 Minutes', '90 Minutes']

export const LEARNING_OBJECTIVES = [
  'Evaluate supplier options',
  'Negotiate effectively',
  'Manage supply chain risks',
  'Optimize procurement costs',
  'Apply decision frameworks',
  'Balance quality vs. cost trade-offs',
]
