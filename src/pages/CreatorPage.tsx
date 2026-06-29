import { useParams, Link } from 'react-router-dom'

import { SimulationProvider, useSimulation } from '../context/SimulationContext'

import { Header } from '../components/layout/Header'

import { CreatorWizardProgress } from '../components/layout/CreatorWizardProgress'

import { FooterPanels } from '../components/layout/FooterPanels'

import { DefineSimulationStep } from '../components/steps/DefineSimulationStep'

import { AIGenerateContentStep } from '../components/steps/AIGenerateContentStep'

import { ReviewCustomizeStep } from '../components/steps/ReviewCustomizeStep'

import { AddMediaStep } from '../components/steps/AddMediaStep'

import { ConfigureScoringStep } from '../components/steps/ConfigureScoringStep'

import { PreviewSimulationStep } from '../components/steps/PreviewSimulationStep'

import { PublishSimulationStep } from '../components/steps/PublishSimulationStep'

import { STEPS } from '../data/steps'



function StepContent() {

  const { currentStep } = useSimulation()

  const stepInfo = STEPS.find((s) => s.step === currentStep)



  return (

    <main className="max-w-7xl mx-auto px-4 py-6">

      {stepInfo && (

        <div className="mb-4">

          <p className="text-sm text-slate-500">

            Step {currentStep} of 7 —{' '}

            <span className="font-medium text-slate-700">{stepInfo.label}</span>

          </p>

        </div>

      )}



      {currentStep === 1 && <DefineSimulationStep />}

      {currentStep === 2 && <AIGenerateContentStep />}

      {currentStep === 3 && <ReviewCustomizeStep />}

      {currentStep === 4 && <AddMediaStep />}

      {currentStep === 5 && <ConfigureScoringStep />}

      {currentStep === 6 && <PreviewSimulationStep />}

      {currentStep === 7 && <PublishSimulationStep />}

    </main>

  )

}



function CreatorWizardInner() {

  const { saving } = useSimulation()



  return (

    <div className="min-h-screen flex flex-col">

      <Header />

      {saving && (

        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1 text-center text-xs text-amber-700">

          Saving…

        </div>

      )}

      <CreatorWizardProgress />

      <StepContent />

      <FooterPanels />

    </div>

  )

}



export function CreatorPage() {

  const { id } = useParams<{ id: string }>()



  if (!id) {

    return (

      <div className="p-8 text-center">

        <p>Invalid simulation ID.</p>

        <Link to="/teach" className="text-violet-600">Back to dashboard</Link>

      </div>

    )

  }



  return (

    <SimulationProvider simulationId={id}>

      <CreatorWizardInner />

    </SimulationProvider>

  )

}

