import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { checkSessionIdExists } from '../middlewares/check-sessio-id-exists'

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

        let sessionId = request.cookies.sessionId

        if (!sessionId) {
            sessionId = randomUUID()

            reply.setCookie('sessionId', sessionId, {
                path: '/',
                maxAge: 60 * 60 * 24 * 7, // 1 days
            })
        }

        await knex('transactions').insert({
            id: randomUUID(),

            amount: type === 'debit' ? -amount : amount,
            title,
            session_id: sessionId,
        })

        return reply.status(201).send()
    })

    app.get(
        '/',
        {
            preHandler: [checkSessionIdExists],
        },
        async (request) => {
            const { sessionId } = request.cookies

            const transactions = await knex('transactions')
                .where('session_id', sessionId)
                .select()
            return { transactions }
        }
    )

    app.get(
        '/:id',
        {
            preHandler: [checkSessionIdExists],
        },
        async (request) => {
            const { sessionId } = request.cookies
            const getTransactionSchema = z.object({
                id: z.string().uuid(),
            })

            const { id } = getTransactionSchema.parse(request.params)

            const transactions = await knex('transactions')
                .select('*')
                .where({ id, session_id: sessionId })
                .first()
            return { transactions }
        }
    )

    app.get(
        '/summary',
        {
            preHandler: [checkSessionIdExists],
        },
        async (request) => {
            const { sessionId } = request.cookies
            const summary = await knex('transactions')
                .where('session_id', sessionId)
                .sum('amount', { as: 'amount' })
                .first()

            return { summary }
        }
    )
}
