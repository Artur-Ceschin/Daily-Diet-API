import { randomUUID } from 'node:crypto'
import { FastifyInstance } from 'fastify'

import { z } from 'zod'
import { knex } from '../database'

export async function usersRoutes(app: FastifyInstance) {
  app.get('/', async (reply) => {
    const users = await knex('users').select()

    return users
  })
  app.post('/', async (request, reply) => {
    const createUserBodySchema = z.object({
      email: z.string().email(),
    })

    const { email } = createUserBodySchema.parse(request.body)

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7,
      })
    }

    await knex('users').insert({
      id: randomUUID(),
      email,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })
}
