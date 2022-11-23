const { expect } = require('chai')
const { getCurrentCredential } = require('../../utils/credentials')
const { getNewStripeTaskList, stripeTaskListisComplete } = require('./yourpsp-tasks.service')
const gatewayAccountFixtures = require('../../../test/fixtures/gateway-account.fixtures')

describe('Progress of Stripe Psp tasklist page', () => {
  it('correctly calculates all conditions being met for Stripe', () => {
    const account = gatewayAccountFixtures.validGatewayAccount({
      gateway_account_credentials: [
        { state: 'ACTIVE', payment_provider: 'stripe', id: 100 }
      ]
    })

    account.connectorGatewayAccountStripeProgress = {
      bankAccount: true,
      director: true,
      vatNumber: true,
      companyNumber: true,
      responsiblePerson: true,
      organisationDetails: true,
      governmentEntityDocument: true
    }
    const activeCredential = getCurrentCredential(account)
    const taskList = getNewStripeTaskList(activeCredential, account)
    expect(stripeTaskListisComplete(taskList)).to.equal(true)
  })

  it('correctly calculates progress required for Stripe tasks when non of the conditions are met', () => {
    const account = gatewayAccountFixtures.validGatewayAccount({
      gateway_account_credentials: [
        { state: 'ACTIVE', payment_provider: 'stripe', id: 100 }
      ]
    })
  
    account.connectorGatewayAccountStripeProgress = {
      bankAccount: false,
      director: false,
      vatNumber: false,
      companyNumber: false,
      responsiblePerson: false,
      organisationDetails: false,
      governmentEntityDocument: false
    }
    const activeCredential = getCurrentCredential(account)
    const taskList = getNewStripeTaskList(activeCredential, account)
    expect(stripeTaskListisComplete(taskList)).to.equal(false)
  })

  it('correctly calculates progress required for Stripe tasks when one of the conditions is not met', () => {
    const account = gatewayAccountFixtures.validGatewayAccount({
      gateway_account_credentials: [
        { state: 'ACTIVE', payment_provider: 'stripe', id: 100 }
      ]
    })
  
    account.connectorGatewayAccountStripeProgress = {
      bankAccount: true,
      director: true,
      vatNumber: true,
      companyNumber: true,
      responsiblePerson: true,
      organisationDetails: true,
      governmentEntityDocument: false
    }
    const activeCredential = getCurrentCredential(account)
    const taskList = getNewStripeTaskList(activeCredential, account)
    expect(stripeTaskListisComplete(taskList)).to.equal(false)
  })
})