import { randomUUID } from 'crypto'

export interface PlayRoom {
  id: string
  code: string
  simulationId: string
  hostName: string
  maxPlayers: number
  players: { id: string; name: string; sessionId?: string }[]
  status: 'waiting' | 'playing' | 'finished'
  createdAt: string
}

const rooms = new Map<string, PlayRoom>()

function genCode(): string {
  return randomUUID().slice(0, 6).toUpperCase()
}

export function createRoom(simulationId: string, hostName: string, maxPlayers = 4): PlayRoom {
  const code = genCode()
  const room: PlayRoom = {
    id: randomUUID(),
    code,
    simulationId,
    hostName,
    maxPlayers,
    players: [{ id: randomUUID(), name: hostName }],
    status: 'waiting',
    createdAt: new Date().toISOString(),
  }
  rooms.set(code, room)
  return room
}

export function getRoom(code: string): PlayRoom | null {
  return rooms.get(code.toUpperCase()) ?? null
}

export function joinRoom(code: string, playerName: string): PlayRoom | null {
  const room = rooms.get(code.toUpperCase())
  if (!room || room.status !== 'waiting') return null
  if (room.players.length >= room.maxPlayers) return null
  if (room.players.some((p) => p.name.toLowerCase() === playerName.toLowerCase())) return room
  room.players.push({ id: randomUUID(), name: playerName })
  return room
}

export function linkPlayerSession(code: string, playerName: string, sessionId: string) {
  const room = rooms.get(code.toUpperCase())
  if (!room) return null
  const player = room.players.find((p) => p.name === playerName)
  if (player) player.sessionId = sessionId
  return room
}
