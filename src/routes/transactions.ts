import { knex } from '../database'

export async function transactionsRoutes(app) {
    app.get('/transactions', async () => {
        const transactions = await knex('transactions')
            .where('amount', 3000)
            .select('*')
        return transactions
    })
}
