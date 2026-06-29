import { Link } from 'react-router-dom'
import { useSimulation } from '../../context/SimulationContext'

export function Header() {
  const { state } = useSimulation()

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/teach" className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm hover:opacity-90">
            SL
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">SimLight 2.0</h1>
            <p className="text-xs text-slate-500">Simulation Creation Process</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-sm text-slate-600 truncate max-w-xs">
            {state.meta.title}
          </span>
          <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-medium">
            Faculty / Content Creator
          </span>
        </div>
      </div>
    </header>
  )
}
