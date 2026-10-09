import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { V2PlayerCockpit } from '../../components/v2/player/V2PlayerCockpit.js'
import {
  V2_SUPPLY_CHAIN_SIMULATION,
  V2_MARKETING_BUDGET_SIMULATION,
  ALL_V2_TEMPLATES,
} from '../../data/v2Templates.js'
import { api } from '../../api/client.js'
import { useAuth } from '../../context/AuthContext.js'
import type { V2Simulation, V2Scorecard, RoundSimulationResult } from '../../types/v2.js'

export function V2PlayPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const assignmentId = searchParams.get('assignment') || undefined
  const learnerName = searchParams.get('name') || user?.name || 'Student Executive'
  const regNumber = searchParams.get('regNumber') || (user as any)?.regNumber || ''

  const [simulation, setSimulation] = useState<V2Simulation | null>(null)
  const [sessionId, setSessionId] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const sessionStartedRef = useRef(false)

  // 1. Resolve Simulation
  useEffect(() => {
    let active = true

    async function loadSimulation() {
      // Check templates first
      const template = ALL_V2_TEMPLATES.find((t) => t.id === id)
      if (template) {
        if (active) {
          setSimulation(template)
          setLoading(false)
        }
        return
      }

      // Check backend API
      if (id) {
        try {
          const remote = await api.getV2Simulation(id)
          if (remote?.simulation && active) {
            setSimulation(remote.simulation)
            setLoading(false)
            return
          } else if (remote?.record?.v2Data && active) {
            setSimulation(remote.record.v2Data)
            setLoading(false)
            return
          }
        } catch {
          // Continue to fallback
        }

        // Check localStorage
        try {
          const stored = localStorage.getItem(`simlight-v2-${id}`)
          if (stored && active) {
            setSimulation(JSON.parse(stored))
            setLoading(false)
            return
          }
        } catch {
          // ignore
        }
      }

      // Fallback
      if (active) {
        setSimulation(
          id?.includes('marketing')
            ? V2_MARKETING_BUDGET_SIMULATION
            : V2_SUPPLY_CHAIN_SIMULATION
        )
        setLoading(false)
      }
    }

    loadSimulation()

    return () => {
      active = false
    }
  }, [id])

  // 2. Start / Connect Session in Backend
  useEffect(() => {
    if (!simulation || sessionStartedRef.current) return
    sessionStartedRef.current = true

    api
      .startSession(simulation.id, learnerName, {
        assignmentId,
        regNumber,
      })
      .then((session) => {
        setSessionId(session.id)
      })
      .catch((err) => {
        console.warn('Could not register live session in backend:', err)
      })
  }, [simulation, learnerName, assignmentId, regNumber])

  // 3. Handle Simulation Completion
  const handleComplete = async (
    scorecard: V2Scorecard,
    history: RoundSimulationResult[],
    finalVariables: Record<string, number>
  ) => {
    if (!sessionId) return

    try {
      await api.completeV2Session(sessionId, {
        score: scorecard.overallScore ?? 75,
        history,
        scorecard,
        variables: finalVariables,
      })
    } catch (err) {
      console.error('Failed to record completed session:', err)
    }
  }

  const handleExit = () => {
    if (assignmentId || user?.role === 'learner') {
      navigate('/learn')
    } else {
      navigate('/teach')
    }
  }

  if (loading || !simulation) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-3">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading business simulation cockpit…</p>
      </div>
    )
  }

  return (
    <V2PlayerCockpit
      simulation={simulation}
      learnerName={learnerName}
      sessionId={sessionId}
      onComplete={handleComplete}
      onExit={handleExit}
    />
  )
}
