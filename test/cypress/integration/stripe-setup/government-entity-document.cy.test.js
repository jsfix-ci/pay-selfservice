'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionSummaryStubs = require('../../stubs/transaction-summary-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')
const stripeAccountStubs = require('../../stubs/stripe-account-stubs')

const gatewayAccountId = '42'
const userExternalId = 'userExternalId'
const gatewayAccountExternalId = 'a-valid-external-id'
const gatewayAccountCredentialExternalId = 'a-valid-credential-external-id'
const governmentEntityDocumentUrl = `/account/${gatewayAccountExternalId}/your-psp/${gatewayAccountCredentialExternalId}/government-entity-document`
const dashboardUrl = `/account/${gatewayAccountExternalId}/dashboard`

function setupStubs (governmentEntityDocument, type = 'live', paymentProvider = 'stripe') {
  let stripeSetupStub

  if (Array.isArray(governmentEntityDocument)) {
    stripeSetupStub = stripeAccountSetupStubs.getGatewayAccountStripeSetupFlagForMultipleCalls({
      gatewayAccountId,
      governmentEntityDocument: governmentEntityDocument
    })
  } else {
    stripeSetupStub = stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({
      gatewayAccountId,
      governmentEntityDocument
    })
  }

  const gatewayAccountCredentials = [{
    gateway_account_id: gatewayAccountId,
    payment_provider: paymentProvider,
    external_id: gatewayAccountCredentialExternalId
  }]

  cy.task('setupStubs', [
    userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
    gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
      gatewayAccountId,
      gatewayAccountExternalId: gatewayAccountExternalId,
      type,
      paymentProvider,
      gatewayAccountCredentials
    }),
    stripeSetupStub,
    stripeAccountStubs.getStripeAccountSuccess(gatewayAccountId, 'acct_123example123'),
    transactionSummaryStubs.getDashboardStatistics()
  ])
}

describe('Stripe setup: Government entity document', () => {
  describe('when user is admin, account is Stripe and "Government entity document" is not already submitted', () => {
    beforeEach(() => {
      setupStubs(false)

      cy.setEncryptedCookies(userExternalId, {})

      cy.visit(governmentEntityDocumentUrl)
    })

    it('should display page correctly', () => {
      cy.get('h1').should('contain', 'Proof of Government Entity document')

      cy.get('#government-entity-document-form').should('exist')
        .within(() => {
          cy.get('input#government-entity-document').should('exist')
          cy.get('button').should('exist')
          cy.get('button').should('contain', 'Submit and continue')

          cy.get('#navigation-menu-switch-psp').should('not.exist')
        })
    })
  })

  describe('when user is admin, account is Stripe and "Government entity document" is already submitted', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId)
    })

    it('should display an error when displaying the page', () => {
      setupStubs(true)

      cy.visit(governmentEntityDocumentUrl)

      cy.get('h1').should('contain', 'An error occurred')
      cy.get('#back-link').should('contain', 'Back to dashboard')
      cy.get('#back-link').should('have.attr', 'href', dashboardUrl)
      cy.get('#error-message').should('contain', 'You’ve already provided proof of government entity document. Contact GOV.UK Pay support if you need to update it.')
    })
  })

  describe('when it is not a Stripe gateway account', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId)
    })

    it('should show a 404 error when gateway account is not Stripe', () => {
      setupStubs(false, 'live', 'sandbox')

      cy.visit(governmentEntityDocumentUrl, {
        failOnStatusCode: false
      })
      cy.get('h1').should('contain', 'Page not found')
    })
  })

  describe('when it is not a live gateway account', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId)
    })

    it('should show a 404 error when gateway account is not live', () => {
      setupStubs(false, 'test', 'stripe')

      cy.visit(governmentEntityDocumentUrl, {
        failOnStatusCode: false
      })
      cy.get('h1').should('contain', 'Page not found')
    })
  })

  describe('when the user does not have the correct permissions', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId)
    })

    it('should show a permission error when the user does not have enough permissions', () => {
      cy.task('setupStubs', [
        userStubs.getUserWithNoPermissions(userExternalId, gatewayAccountId),
        gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
          gatewayAccountId,
          gatewayAccountExternalId: gatewayAccountExternalId,
          type: 'live',
          paymentProvider: 'stripe'
        }),
        stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({ gatewayAccountId, vatNumber: true })
      ])

      cy.visit(governmentEntityDocumentUrl, { failOnStatusCode: false })
      cy.get('h1').should('contain', 'An error occurred')
      cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
    })
  })
})