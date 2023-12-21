import { randomUUID } from 'node:crypto'
import { FastifyInstance } from 'fastify'
import { checkSessionIdExists } from '../middlewares/check-sessionId-exists'
import { z } from 'zod'
import { knex } from '../database'

export async function mealsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request, reply) => {
    await checkSessionIdExists(request, reply)
  })

  app.get('/', async (request) => {
    const user = request.user

    const meals = await knex('meals').where('user_id', user.id).select()

    return {
      meals,
    }
  })

  app.get('/metrics', async (request) => {
    const user = request.user

    const meals = await knex('meals').where('user_id', user.id).select()

    const totalMeals = meals.length
    const mealsInDiet = meals.filter((meal) => meal.is_in_diet).length
    const mealsNotInDiet = meals.filter((meal) => !meal.is_in_diet).length

    let bestMealsSequency = []
    let currentSequence = []

    for (let i = 0; i <= meals.length; i++) {
      const meal = meals[i]
      const nextMeal = meals[i + 1]

      if (meal && meal.is_in_diet && (!nextMeal || nextMeal.is_in_diet)) {
        currentSequence.push(meal)
      } else {
        if (currentSequence.length > bestMealsSequency.length) {
          bestMealsSequency = [...currentSequence]
        }
        currentSequence = []
      }
    }

    const bestMealsSequencyTotal = bestMealsSequency.length

    return {
      totalMeals,
      mealsInDiet,
      mealsNotInDiet,
      bestMealsSequencyTotal,
    }
  })

  app.get('/:id', async (request, reply) => {
    const mealIdParamsSchema = z.object({
      id: z.string().uuid(),
    })
    const { id } = mealIdParamsSchema.parse(request.params)

    const user = request.user

    const meals = await knex('meals')
      .where('user_id', user.id)
      .andWhere('id', id)
      .select()

    return {
      meals,
    }
  })

  app.put('/:id', async (request, reply) => {
    try {
      const updateMealParamsSchema = z.object({
        id: z.string().uuid(),
      })
      const { id } = updateMealParamsSchema.parse(request.params)

      const updateMealsBodySchema = z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        isInDiet: z.boolean().optional(),
      })

      const { title, description, isInDiet } = updateMealsBodySchema.parse(
        request.body,
      )

      const user = request.user

      const updatedMeal = await knex('meals')
        .where('user_id', user.id)
        .andWhere('id', id)
        .update({ description, title, is_in_diet: isInDiet })

      if (!updatedMeal) {
        return reply.status(404).send({ message: 'Meal not found' })
      }

      return reply.status(201).send()
    } catch (error) {
      if (error instanceof Error) {
        return reply
          .status(400)
          .send({ message: 'Bad request', error: error.message })
      }
    }
  })

  app.delete('/:id', async (request, reply) => {
    const deleteMealParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = deleteMealParamsSchema.parse(request.params)

    const user = request.user

    await knex('meals').where('user_id', user.id).andWhere('id', id).delete()

    return reply.status(204).send()
  })

  app.post('/', async (request, reply) => {
    const createMealsBodySchema = z.object({
      title: z.string(),
      description: z.string(),
      isInDiet: z.boolean(),
    })

    const { title, description, isInDiet } = createMealsBodySchema.parse(
      request.body,
    )

    const user = request.user

    await knex('meals').insert({
      id: randomUUID(),
      user_id: user.id,
      title,
      description,
      is_in_diet: isInDiet,
    })

    return reply.status(201).send()
  })
}
