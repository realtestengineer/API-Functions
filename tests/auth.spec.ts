import { expect, test } from '@playwright/test'
import { Login } from '../dto/login-dto'
import { test, expect, APIRequestContext } from '@playwright/test'
import { Login } from '../models/Login'

const BASE_URL = 'https://backend.tallinn-learning.ee'

const ENDPOINTS = {
  login: '/login/student',
  orders: '/orders',
}

// --- Test credentials ---
const VALID_USERNAME = process.env['DL_USERNAME']!
const VALID_PASSWORD = process.env['DL_PASSWORD']!

const INVALID_LOGIN = new Login('bENNY', 'J9087YH098')

// --- Helper function ---
async function getAuthToken(
  request: APIRequestContext,
  username: string,
  password: string,
): Promise<string> {
  const response = await request.post(BASE_URL + ENDPOINTS.login, {
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    data: new Login(username, password),
  })

  expect(response.status()).toBe(200)

  const token = await response.text()
  expect(token).toBeTruthy()

  return token
}

test.describe('Authorization flow', () => {
  test('should login and receive authorization token', async ({ request }) => {
    const token = await getAuthToken(request, VALID_USERNAME, VALID_PASSWORD)

    console.log('Received token:', token)
    expect(token).toBeDefined()
  })

  test('should get orders with authorization token', async ({ request }) => {
    const token = await getAuthToken(request, VALID_USERNAME, VALID_PASSWORD)

    const response = await request.get(BASE_URL + ENDPOINTS.orders, {
      headers: {
        accept: '*/*',
        Authorization: `Bearer ${token}`,
      },
    })

    expect(response.status()).toBe(200)

    const orders = await response.json()
    console.log('Orders:', JSON.stringify(orders, null, 2))

    expect(orders).toBeTruthy()
  })

  test('should not get orders with invalid login', async ({ request }) => {
    const loginResponse = await request.post(BASE_URL + ENDPOINTS.login, {
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      data: INVALID_LOGIN,
    })

    expect(loginResponse.status()).toBe(401)
  })

  test('should not get orders without authorization token', async ({ request }) => {
    const response = await request.get(BASE_URL + ENDPOINTS.orders, {
      headers: {
        accept: '*/*',
      },
    })

    expect(response.status()).toBe(401)
  })
})