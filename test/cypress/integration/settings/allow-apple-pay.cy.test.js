const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')

const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
const gatewayAccountId = 42
const gatewayAccountExternalId = 'a-valid-external-id'
const serviceName = 'My Awesome Service'

function setupStubs (allowApplePay) {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName }),
    gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
      gatewayAccountId,
      gatewayAccountExternalId,
      paymentProvider: 'worldpay',
      allowApplePay: allowApplePay
    })
  ])
}

describe('Apple Pay', () => {
  beforeEach(() => {
    Cypress.Cookies.preserveOnce('session', 'gateway_account')
  })

  describe('is disabled when unsupported', () => {
    beforeEach(() => {
      setupStubs(false)
    })

    it('should show it is disabled', () => {
      cy.setEncryptedCookies(userExternalId)
      cy.visit(`/account/${gatewayAccountExternalId}/settings`)
      cy.get('.govuk-summary-list__value').first().should('contain', 'Off')
      cy.get('a').contains('Change Apple Pay settings').click()
      cy.get('input[type="radio"]').should('have.length', 2)
      cy.get('input[value="on"]').should('not.be.checked')
      cy.get('input[value="off"]').should('be.checked')
      cy.get('#navigation-menu-settings').click()
      cy.get('.govuk-summary-list__value').first().should('contain', 'Off')
    })
  })

  describe('but allow us to enable when supported', () => {
    beforeEach(() => {
      setupStubs(false)
    })

    it('Show that is is disabled', () => {
      cy.setEncryptedCookies(userExternalId)
      cy.visit(`/account/${gatewayAccountExternalId}/settings`)
      cy.get('.govuk-summary-list__value').first().should('contain', 'Off')
      cy.get('a').contains('Change Apple Pay settings').click()
    })
  })

  describe('Show enabled after turning on', () => {
    beforeEach(() => {
      setupStubs(true)
    })

    it('should allow us to enable', () => {
      cy.get('input[value="on"]').click()
      cy.get('input[value="on"]').should('be.checked')
      cy.get('.govuk-button').contains('Save changes').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/settings`)
      })
      cy.get('.govuk-notification-banner--success').should('contain', 'Apple Pay successfully enabled')

      cy.get('.govuk-summary-list__value').first().should('contain', 'On')
    })
  })
})
