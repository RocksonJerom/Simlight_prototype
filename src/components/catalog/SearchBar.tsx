import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function SearchBar({ defaultValue = '' }: { defaultValue?: string }) {
  const [q, setQ] = useState(defaultValue)
  const navigate = useNavigate()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const term = q.trim()
    navigate(term ? `/browse?q=${encodeURIComponent(term)}` : '/browse')
  }

  return (
    <form onSubmit={submit} className="relative">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search simulations…"
        className="w-full pl-4 pr-10 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white px-2"
        aria-label="Search"
      >
        🔍
      </button>
    </form>
  )
}
