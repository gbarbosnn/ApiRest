import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'crypto'

export async function transactionsRoutes(app: FastifyInstance) {
    app.get('/', async () => {
        const transactions = await knex('transactions').select('*')
        return { transactions }
    })

    app.get('/:id', async (request) => {
        const getTransactionSchema = z.object({
            id: z.string().uuid(),
        })

        const { id } = getTransactionSchema.parse(request.params)

        const transactions = await knex('transactions')
            .select('*')
            .where({ id })
            .first()
        return { transactions }
    })

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
