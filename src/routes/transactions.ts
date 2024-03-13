import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'crypto'

export async function transactionsRoutes(app: FastifyInstance) {
    app.post('/', async (request, reply) => {
        const createTransactionSchema = z.object({
            amount: z.number(),
            title: z.string(),
            type: z.enum(['debit', 'credit']),
        })

        const { amount, title, type } = createTransactionSchema.parse(
            request.body
        )

        await knex('transactions').insert({
            id: randomUUID(),

            amount: type === 'debit' ? -amount : amount,
            title,
        })

        return reply.status(201).send()
    })
}
