'use strict'

const lodash = require('lodash')
const utils = require('../../utils/request-to-go-live-utils')
const variables = utils.variables
const gatewayAccountStubs = require('../../utils/gateway-account-stubs')
const userStubs = require('../../utils/user-stubs')

describe('Request to go live: choose how to process payments', () => {
  const userExternalId = variables.userExternalId
  const gatewayAccountId = variables.gatewayAccountId
  const serviceExternalId = variables.serviceExternalId

  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId, gatewayAccountId)
  })

  describe('Service has wrong go live stage', () => {
    beforeEach(() => {
      utils.setupGetUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('NOT_STARTED'))
    })

    it('should redirect to "Request to go live: index" page when in wrong stage', () => {
      const requestToGoLiveChooseHowToProcessPaymentUrl = `/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`
      cy.visit(requestToGoLiveChooseHowToProcessPaymentUrl)

      cy.get('h1').should('contain', 'Request a live account')

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live`)
      })
    })
  })

  describe('Service has correct go live stage and user selects Stripe account', () => {
    const repeatGetUserSuccessStub = [
      userStubs.getUserSuccessRepeatFirstResponseNTimes([
        { userExternalId, serviceRoles: utils.buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_ADDRESS') },
        { userExternalId, serviceRoles: utils.buildServiceRoleForGoLiveStage('CHOSEN_PSP_STRIPE') }
      ]),
      gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId })
    ]

    const stubPayload = lodash.concat(repeatGetUserSuccessStub,
      utils.patchUpdateGoLiveStageSuccessStub('CHOSEN_PSP_STRIPE'))
    beforeEach(() => {
      cy.task('setupStubs', stubPayload)
    })

    it('should patch adminusers then redirect to agreement when chosen Stripe', () => {
      const requestToGoLiveChooseHowToProcessPaymentUrl = `/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`
      cy.visit(requestToGoLiveChooseHowToProcessPaymentUrl)

      cy.get('h1').should('contain', 'How will you process payments?')
      cy.get('#request-to-go-live-current-step').should('exist')
      cy.get('#request-to-go-live-choose-how-to-process-payments-form').should('exist')
      cy.get('#choose-how-to-process-payments-mode').should('exist')
      cy.get('#choose-how-to-process-payments-mode-2').should('exist')

      cy.get('#conditional-choose-how-to-process-payments-mode-3').should('exist')
      cy.get('#conditional-choose-how-to-process-payments-mode-3').should('not.be.visible')

      cy.get('#choose-how-to-process-payments-mode').click()

      cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').should('exist')
      cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').should('contain', 'Continue')
      cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').click()
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/agreement`)
      })
    })
  })

  describe('Service has correct go live stage and user selects non Stripe account', () => {
    const repeatGetUserSuccessStub = [
      userStubs.getUserSuccessRepeatFirstResponseNTimes([
        { userExternalId, serviceRoles: utils.buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_ADDRESS') },
        { userExternalId, serviceRoles: utils.buildServiceRoleForGoLiveStage('CHOSEN_PSP_EPDQ') }
      ]),
      gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId })]

    const stubPayload = lodash.concat(repeatGetUserSuccessStub,
      utils.patchUpdateGoLiveStageSuccessStub('CHOSEN_PSP_EPDQ'))
    beforeEach(() => {
      cy.task('setupStubs', stubPayload)
    })

    it('should patch choice and then redirect to agreement when chosen ePDQ', () => {
      const requestToGoLiveChooseHowToProcessPaymentUrl = `/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`
      cy.visit(requestToGoLiveChooseHowToProcessPaymentUrl)

      cy.get('h1').should('contain', 'How will you process payments?')
      cy.get('#request-to-go-live-current-step').should('exist')
      cy.get('#request-to-go-live-choose-how-to-process-payments-form').should('exist')
      cy.get('#choose-how-to-process-payments-mode').should('exist')
      cy.get('#choose-how-to-process-payments-mode-2').should('exist')

      cy.get('#conditional-choose-how-to-process-payments-mode-3').should('exist')
      cy.get('#conditional-choose-how-to-process-payments-mode-3').should('not.be.visible')

      cy.get('#choose-how-to-process-payments-mode-3').click()
      cy.get('#conditional-choose-how-to-process-payments-mode-3').should('be.visible')

      cy.get('#choose-how-to-process-payments-mode-other').should('exist')
      cy.get('#conditional-choose-how-to-process-payments-mode-3 label[for=choose-how-to-process-payments-mode-other]').should('contain', 'Worldpay')

      cy.get('#choose-how-to-process-payments-mode-other-2').should('exist')
      cy.get('#conditional-choose-how-to-process-payments-mode-3 label[for=choose-how-to-process-payments-mode-other-2]').should('contain', 'Smartpay')

      cy.get('#choose-how-to-process-payments-mode-other-3').should('exist')
      cy.get('#conditional-choose-how-to-process-payments-mode-3 label[for=choose-how-to-process-payments-mode-other-3]').should('contain', 'ePDQ')

      cy.get('#choose-how-to-process-payments-mode-other-3').click()
      cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').should('exist')
      cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').should('contain', 'Continue')
      cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').click()
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/agreement`)
      })
    })
  })

  describe('Service has correct go live stage and user selects government banking account', () => {
    const repeatGetUserSuccessStub = [
      userStubs.getUserSuccessRepeatFirstResponseNTimes([
        { userExternalId, serviceRoles: utils.buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_ADDRESS') },
        { userExternalId, serviceRoles: utils.buildServiceRoleForGoLiveStage('CHOSEN_PSP_GOV_BANKING_WORLDPAY') }
      ]),
      gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId })]

    const stubPayload = lodash.concat(repeatGetUserSuccessStub,
      utils.patchUpdateGoLiveStageSuccessStub('CHOSEN_PSP_GOV_BANKING_WORLDPAY'))
    beforeEach(() => {
      cy.task('setupStubs', stubPayload)
    })

    it('should patch choice and then redirect to agreement when chosen government banking', () => {
      const requestToGoLiveChooseHowToProcessPaymentUrl = `/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`
      cy.visit(requestToGoLiveChooseHowToProcessPaymentUrl)
      cy.get('#choose-how-to-process-payments-mode-2').click()
      cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').click()
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/agreement`)
      })
    })
  })

  describe('User does not have the correct permissions', () => {
    beforeEach(() => {
      const serviceRole = utils.buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_ADDRESS')
      serviceRole.role = {
        permissions: []
      }
      utils.setupGetUserAndGatewayAccountStubs(serviceRole)
    })

    it('should show an error when the user does not have enough permissions', () => {
      const requestToGoLivePageOrganisationNameUrl = `/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`
      cy.visit(requestToGoLivePageOrganisationNameUrl, { failOnStatusCode: false })
      cy.get('h1').should('contain', 'An error occurred:')
      cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
    })
  })

  describe('other tests', () => {
    beforeEach(() => {
      utils.setupGetUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_ADDRESS'))
    })
    describe('should show an error when no option selected', () => {
      it('should show "You need to select an option" error msg', () => {
        const requestToGoLiveChooseHowToProcessPaymentUrl = `/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`
        cy.visit(requestToGoLiveChooseHowToProcessPaymentUrl)

        cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').click()
        cy.get('.error-summary').should('contain', 'You need to select an option')

        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`)
        })
      })
    })

    describe('should show an error when no other psp option selected', () => {
      it('should show "You need to select one of Worldpay, Smartpay or ePDQ" error msg', () => {
        const requestToGoLiveChooseHowToProcessPaymentUrl = `/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`
        cy.visit(requestToGoLiveChooseHowToProcessPaymentUrl)

        cy.get('#choose-how-to-process-payments-mode-3').click()
        cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').click()
        cy.get('.error-summary').should('contain', 'You need to select one of Worldpay, Smartpay or ePDQ')

        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`)
        })
      })
    })
  })

  describe('adminusers error handlings', () => {
    const stubPayload = lodash.concat(utils.getUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_ADDRESS')),
      utils.patchUpdateGoLiveStageErrorStub('CHOSEN_PSP_STRIPE'))
    beforeEach(() => {
      cy.task('setupStubs', stubPayload)
    })
    it('should show "An error occurred: There is a problem with the payments platform"', () => {
      const requestToGoLiveChooseHowToProcessPaymentUrl = `/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`
      cy.visit(requestToGoLiveChooseHowToProcessPaymentUrl)

      cy.get('#choose-how-to-process-payments-mode').click()
      cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').click()

      cy.get('h1').should('contain', 'An error occurred:')
      cy.get('#errorMsg').should('contain', 'There is a problem with the payments platform')
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`)
      })
    })
  })
})