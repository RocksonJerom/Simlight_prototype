import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { api, type PlayRoom } from '../api/client'

export function PlayLandingPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const assignmentId = searchParams.get('assignment') ?? undefined
  const playToken = searchParams.get('token') ?? undefined
  const prefillName = searchParams.get('name') ?? ''
  const [name, setName] = useState(prefillName)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resumeId, setResumeId] = useState<string | null>(null)
  const [playMode, setPlayMode] = useState<'single' | 'multiplayer'>('single')
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [simTitle, setSimTitle] = useState('')
  const [room, setRoom] = useState<PlayRoom | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [multiTab, setMultiTab] = useState<'create' | 'join'>('create')

  useEffect(() => {
    if (id) {
      const stored = localStorage.getItem(`simlight-session-${id}`)
      if (stored) setResumeId(stored)
      api
        .getPlayMeta(id, { token: playToken, assignment: assignmentId })
        .then((meta) => {
          setSimTitle(meta.title)
          setPlayMode(meta.playMode)
          setMaxPlayers(meta.maxPlayers)
        })
        .catch(() => {
          api
            .getPublicSimulation(id)
            .then((sim) => {
              setSimTitle(sim.title)
              setPlayMode(sim.playMode ?? 'single')
              setMaxPlayers(sim.maxPlayers ?? 4)
            })
            .catch(() => {})
        })
    }
  }, [id, playToken, assignmentId])

  useEffect(() => {
    if (!room?.code) return
    const interval = setInterval(() => {
      api.getRoom(room.code).then(setRoom).catch(() => {})
    }, 3000)
    return () => clearInterval(interval)
  }, [room?.code])

  const startSession = async (roomCode?: string) => {
    if (!id || !name.trim()) return
    const session = await api.startSession(id, name.trim(), {
      assignmentId,
      playToken,
      roomCode,
    })
    localStorage.setItem(`simlight-session-${id}`, session.id)
    navigate(`/session/${session.id}`)
  }

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !name.trim()) return
    setLoading(true)
    setError('')
    try {
      await startSession()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session')
    } finally {
      setLoading(false)
    }
  }

  const handleResume = async () => {
    if (!id || !resumeId || !name.trim()) return
    setLoading(true)
    setError('')
    try {
      const session = await api.startSession(id, name.trim(), {
        assignmentId,
        playToken,
        resumeSessionId: resumeId,
      })
      navigate(`/session/${session.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRoom = async () => {
    if (!id || !name.trim()) return
    setLoading(true)
    setError('')
    try {
      const newRoom = await api.createRoom(id, name.trim(), maxPlayers)
      setRoom(newRoom)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinRoom = async () => {
    if (!joinCode.trim() || !name.trim()) return
    setLoading(true)
    setError('')
    try {
      const joined = await api.joinRoom(joinCode.trim(), name.trim())
      setRoom(joined)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room')
    } finally {
      setLoading(false)
    }
  }

  const handleMultiplayerStart = async () => {
    if (!room) return
    setLoading(true)
    setError('')
    try {
      await startSession(room.code)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session')
    } finally {
      setLoading(false)
    }
  }

  const isMultiplayer = playMode === 'multiplayer'

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{isMultiplayer ? '👥' : '🎮'}</div>
          <h1 className="text-2xl font-bold text-slate-900">
            {simTitle || 'Start Simulation'}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {isMultiplayer
              ? 'Create or join a room, then start when everyone is ready'
              : assignmentId
                ? 'You have been assigned this simulation'
                : 'Enter your name to begin'}
          </p>
          {isMultiplayer && (
            <span className="inline-block mt-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              Multiplayer · up to {maxPlayers} players
            </span>
          )}
        </div>

        <label className="block mb-4">
          <span className="text-sm font-medium text-slate-700">Your Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex Johnson"
            className="mt-1 w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </label>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {isMultiplayer ? (
          <div className="space-y-4">
            {!room ? (
              <>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setMultiTab('create')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md ${
                      multiTab === 'create' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
                    }`}
                  >
                    Host room
                  </button>
                  <button
                    type="button"
                    onClick={() => setMultiTab('join')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md ${
                      multiTab === 'join' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
                    }`}
                  >
                    Join room
                  </button>
                </div>

                {multiTab === 'create' ? (
                  <button
                    type="button"
                    onClick={handleCreateRoom}
                    disabled={loading || !name.trim()}
                    className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating…' : 'Create room'}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="Room code"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl uppercase tracking-widest text-center font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleJoinRoom}
                      disabled={loading || !name.trim() || !joinCode.trim()}
                      className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'Joining…' : 'Join room'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Room code</p>
                  <p className="text-3xl font-mono font-bold text-blue-600 tracking-widest mt-1">
                    {room.code}
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Share this code with teammates
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                    Players ({room.players.length}/{room.maxPlayers})
                  </p>
                  <ul className="space-y-1">
                    {room.players.map((p) => (
                      <li
                        key={p.id}
                        className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-700 flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        {p.name}
                        {p.name === room.hostName && (
                          <span className="text-xs text-slate-400">(host)</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={handleMultiplayerStart}
                  disabled={loading || !name.trim()}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Starting…' : 'Start my session'}
                </button>
                <p className="text-xs text-center text-slate-400">
                  Each player runs their own session; scores are tracked individually.
                </p>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleStart} className="space-y-4">
            {resumeId && (
              <button
                type="button"
                onClick={handleResume}
                disabled={loading || !name.trim()}
                className="w-full py-3 border border-blue-600 text-blue-700 font-semibold rounded-xl hover:bg-blue-50 disabled:opacity-50"
              >
                Resume previous session
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Starting…' : resumeId ? 'Start new session' : 'Begin Simulation'}
            </button>
          </form>
        )}

        <p className="text-center mt-4">
          <Link to="/browse" className="text-sm text-slate-500 hover:text-slate-700">
            Browse more simulations
          </Link>
        </p>
      </div>
    </div>
  )
}
