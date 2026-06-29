import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { router as simulationsRouter, sessionsRouter, aiRouter, marketplaceRouter, roomsRouter } from './routes.js'
import { platformRouter } from './platform/routes.js'
import { authRouter } from './auth/routes.js'
import { UPLOADS_DIR } from './database.js'
import { initStore, getDbKind } from './store/index.js'
import { getAiStatus } from './config.js'

const app = express()
const PORT = process.env.PORT ?? 3001

await initStore()

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(UPLOADS_DIR))

app.get('/api/health', (_req, res) => {
  const ai = getAiStatus()
  res.json({ status: 'ok', version: '5.0', database: getDbKind(), ai })
})

app.use('/api/auth', authRouter)
app.use('/api/ai', aiRouter)
app.use('/api/marketplace', marketplaceRouter)
app.use('/api/simulations', simulationsRouter)
app.use('/api/sessions', sessionsRouter)
app.use('/api/rooms', roomsRouter)
app.use('/api/platform', platformRouter)

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(400).json({ error: err.message })
})

app.listen(PORT, () => {
  const ai = getAiStatus()
  console.log(`SimLight API v5 running at http://localhost:${PORT}`)
  console.log(`Database: ${getDbKind()}`)
  console.log(`AI: ${ai.message}`)
})
