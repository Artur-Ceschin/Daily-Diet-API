// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Knex } from 'knex'

interface UserProps {
  id: string
  email: string
  created_at: string
  session_id?: string
}

declare module 'knex/types/tables' {
  export interface Tables {
    users: UserProps
    meals: {
      id: string
      user_id: string
      title: string
      description: string
      is_in_diet: boolean
      created_at: string
    }
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    user: UserProps
  }
}
