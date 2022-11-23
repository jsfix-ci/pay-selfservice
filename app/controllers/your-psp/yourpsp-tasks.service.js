'use strict'

function stripeSetupStageComplete (account, stage) {
  if (account.connectorGatewayAccountStripeProgress) {
    return account.connectorGatewayAccountStripeProgress[stage]
  }
  return false
}

function getNewStripeTaskList (targetCredential, account) {
   if (targetCredential.payment_provider === 'stripe') {
    return {
      'ENTER_BANK_DETAILS': {
        enabled: !stripeSetupStageComplete(account, 'bankAccount'),
        complete: stripeSetupStageComplete(account, 'bankAccount')
      },
      'ENTER_RESPONSIBLE_PERSON': {
        enabled: !stripeSetupStageComplete(account, 'responsiblePerson'),
        complete: stripeSetupStageComplete(account, 'responsiblePerson')
      },
      'ENTER_DIRECTOR': {
        enabled: !stripeSetupStageComplete(account, 'director'),
        complete: stripeSetupStageComplete(account, 'director')
      },
      'ENTER_VAT_NUMBER': {
        enabled: !stripeSetupStageComplete(account, 'vatNumber'),
        complete: stripeSetupStageComplete(account, 'vatNumber')
      },
      'ENTER_COMPANY_NUMBER': {
        enabled: !stripeSetupStageComplete(account, 'companyNumber'),
        complete: stripeSetupStageComplete(account, 'companyNumber')
      },
      'CONFIRM_ORGANISATION_DETAILS': {
        enabled: !stripeSetupStageComplete(account, 'organisationDetails'),
        complete: stripeSetupStageComplete(account, 'organisationDetails')
      },
      'UPLOAD_GOVERNMENT_ENTITY_DOCUMENT': {
        enabled:  !stripeSetupStageComplete(account, 'governmentEntityDocument'),
        complete: stripeSetupStageComplete(account, 'governmentEntityDocument')
      }
    }
  }
  throw new Error('Unsupported payment provider')
}

function stripeTaskListisComplete (taskList) {
  return Object.values(taskList).every(task => task.complete)
}

module.exports = { getNewStripeTaskList, stripeTaskListisComplete }
