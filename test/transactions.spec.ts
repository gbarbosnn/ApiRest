import { expect, describe, it, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'
import { execSync } from 'node:child_process'
import { get } from 'node:http'

describe('Transactions', () => {
    beforeAll(async () => {
        console.log('Starting the server...')
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    beforeEach(() => {
        execSync('npm run knex migrate:rollback --all')
        execSync('npm run knex migrate:latest')
    })

    it('should be able to create a  new transaction', async () => {
        await request(app.server)
            .post('/transactions')
            .send({
                title: 'Teste1',
                type: 'debit',
                amount: 2000,
            })
            .expect(201)
    })
    it('should be able to list the transactions', async () => {
        const response = await request(app.server).post('/transactions').send({
            title: 'New transaction',
            amount: 5000,
            type: 'credit',
        })

        const cookies = response.get('Set-Cookie')

        const listTransactionsResponse = await request(app.server)
            .get('/transactions')
            .set('Cookie', cookies)
            .expect(200)

        expect(listTransactionsResponse.body.transactions).toEqual([
            expect.objectContaining({
                title: 'New transaction',
                Amount: 5000,
            }),
        ])
    })

    it('should be able to get a specific transaction', async () => {
        const response = await request(app.server).post('/transactions').send({
            title: 'New transaction',
            amount: 5000,
            type: 'credit',
        })

        const cookies = response.get('Set-Cookie')

        const listTransactionsResponse = await request(app.server)
            .get('/transactions')
            .set('Cookie', cookies)
            .expect(200)

        const transactionId = listTransactionsResponse.body.transactions[0].id

        const getTransactionResponse = await request(app.server)
            .get(`/transactions/${transactionId}`)
            .set('Cookie', cookies)
            .expect(200)

        expect(getTransactionResponse.body.transactions).toEqual(
            expect.objectContaining({
                title: 'New transaction',
                Amount: 5000,
            })
        )
    })

    it('should be able get the summary', async () => {
        const response = await request(app.server).post('/transactions').send({
            title: 'New transaction',
            amount: 5000,
            type: 'credit',
        })

        const cookies = response.get('Set-Cookie')

        await request(app.server)
            .post('/transactions')
            .set('Cookie', cookies)
            .send({
                title: 'New debit transaction',
                amount: 2000,
                type: 'debit',
            })

        const summaryResponse = await request(app.server)
            .get('/transactions/summary')
            .set('Cookie', cookies)
            .expect(200)

        expect(summaryResponse.body.summary).toEqual({
            amount: 3000,
        })
    })
})
