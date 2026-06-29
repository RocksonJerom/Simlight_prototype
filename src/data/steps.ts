import type { WizardStep } from '../types/simulation'

export const STEPS: {
  step: WizardStep
  label: string
  shortLabel: string
  color: string
  icon: string
}[] = [
  { step: 1, label: 'Define Simulation', shortLabel: 'Define', color: '#7c3aed', icon: '📝' },
  { step: 2, label: 'AI Generate Content', shortLabel: 'AI Generate', color: '#2563eb', icon: '🤖' },
  { step: 3, label: 'Review & Customize', shortLabel: 'Review', color: '#0d9488', icon: '✏️' },
  { step: 4, label: 'Add Media & Assets', shortLabel: 'Media', color: '#ea580c', icon: '🖼️' },
  { step: 5, label: 'Configure Scoring', shortLabel: 'Scoring', color: '#db2777', icon: '📊' },
  { step: 6, label: 'Preview Simulation', shortLabel: 'Preview', color: '#1e3a5f', icon: '👁️' },
  { step: 7, label: 'Publish Simulation', shortLabel: 'Publish', color: '#16a34a', icon: '🚀' },
]
