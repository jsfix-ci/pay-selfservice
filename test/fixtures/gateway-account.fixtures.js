'use strict'

function validCredentials (opts = {}) {
  const credentials = {}

  if (opts.merchant_id) {
    credentials.merchant_id = opts.merchant_id
  }

  if (opts.username) {
    credentials.username = opts.username
  }

  if (opts.sha_in_passphrase) {
    credentials.sha_in_passphrase = opts.sha_in_passphrase
  }
  if (opts.sha_out_passphrase) {
    credentials.sha_out_passphrase = opts.sha_out_passphrase
  }

  if (opts.stripe_account_id) {
    credentials.stripe_account_id = opts.stripe_account_id
  }
  return credentials
}

function validGatewayAccountCredential (credentialOpts = {}, gatewayAccountOpts = {}) {
  const gatewayAccountCredential = {
    gateway_account_credential_id: credentialOpts.id || 1,
    external_id: credentialOpts.external_id || 'a-valid-external-id',
    payment_provider: credentialOpts.payment_provider || 'sandbox',
    state: credentialOpts.state || 'ACTIVE',
    gateway_account_id: gatewayAccountOpts.gateway_account_id || 31,
    active_start_date: credentialOpts.active_start_date || null,
    active_end_date: credentialOpts.active_end_date || null,
    created_date: credentialOpts.created_date || '2021-05-09T01:00:00.000Z'
  }

  gatewayAccountCredential.credentials = validCredentials(credentialOpts.credentials || gatewayAccountOpts.credentials)
  return gatewayAccountCredential
}

function validNotificationCredentials (opts = {}) {
  return {
    userName: opts.username || 'username'
  }
}

function validWorldpay3dsFlexCredentials (opts = {}) {
  return {
    organisational_unit_id: opts.organisational_unit_id || '5bd9b55e4444761ac0af1c80',
    issuer: opts.issuer || '5bd9e0e4444dce153428c940', // pragma: allowlist secret
    exemption_engine_enabled: opts.exemption_engine_enabled || false
  }
}

function validGatewayAccount (opts) {
  const gatewayAccount = {
    payment_provider: opts.payment_provider || 'sandbox',
    gateway_account_id: opts.gateway_account_id || 31,
    external_id: opts.external_id || 'a-valid-external-id',
    allow_apple_pay: opts.allow_apple_pay || false,
    allow_google_pay: opts.allow_google_pay || false,
    service_name: opts.service_name || 'A fabulous service',
    type: opts.type || 'test',
    email_collection_mode: opts.email_collection_mode || 'MANDATORY',
    email_notifications: opts.email_notifications || {
      PAYMENT_CONFIRMED: {
        version: 1,
        enabled: true,
        template_body: 'template here'
      },
      REFUND_ISSUED: {
        version: 1,
        enabled: true
      }
    },
    allow_moto: opts.allow_moto || false,
    moto_mask_card_number_input: opts.moto_mask_card_number_input || false,
    moto_mask_card_security_code_input: opts.moto_mask_card_security_code_input || false,
    requires3ds: opts.requires3ds || false,
    integration_version_3ds: opts.integrationVersion3ds || 1,
    requires_additional_kyc_data: opts.requiresAdditionalKycData || false,
    disabled: opts.disabled || false
  }

  if (opts.recurring_enabled !== undefined) {
    gatewayAccount.recurring_enabled = opts.recurring_enabled
  }

  if (opts.description) {
    gatewayAccount.description = opts.description
  }
  if (opts.analytics_id) {
    gatewayAccount.analytics_id = opts.analytics_id
  }
  if (opts.credentials) {
    gatewayAccount.credentials = validCredentials(opts.credentials)

    if (!opts.gateway_account_credentials) {
      gatewayAccount.gateway_account_credentials = [validGatewayAccountCredential(opts)]
    }
  }
  if (opts.gateway_account_credentials) {
    gatewayAccount.gateway_account_credentials = opts.gateway_account_credentials
      .map((gatewayAccountCredentialOpt) => validGatewayAccountCredential(gatewayAccountCredentialOpt, opts))
  }
  if (opts.notificationCredentials) {
    gatewayAccount.notificationCredentials = validNotificationCredentials(opts.notificationCredentials)
  }
  if (opts.worldpay_3ds_flex) {
    gatewayAccount.worldpay_3ds_flex = validWorldpay3dsFlexCredentials(opts.worldpay_3ds_flex)
  }

  // provider switch enabled is only available to the frontend resource, it isn't always guaranteed
  if (opts.provider_switch_enabled !== undefined) {
    gatewayAccount.provider_switch_enabled = opts.provider_switch_enabled
  }

  if (opts.service_id) {
    gatewayAccount.service_id = opts.service_id
  }

  if (opts.requires_additional_kyc_data !== undefined) {
    gatewayAccount.requires_additional_kyc_data = opts.requires_additional_kyc_data
  }

  return gatewayAccount
}

function validGatewayAccountPatchRequest (opts = {}) {
  return {
    op: 'replace',
    path: opts.path,
    value: opts.value
  }
}

function validGatewayAccountEmailRefundToggleRequest (enabled = true) {
  return {
    op: 'replace',
    path: '/refund/enabled',
    value: enabled
  }
}

function validGatewayAccountEmailConfirmationToggleRequest (enabled = true) {
  return {
    op: 'replace',
    path: '/confirmation/enabled',
    value: enabled
  }
}

function validGatewayAccountEmailCollectionModeRequest (collectionMode = 'MANDATORY') {
  return {
    op: 'replace',
    path: 'email_collection_mode',
    value: collectionMode
  }
}

function validGatewayAccountPatchRequiresAdditionalKycDataRequest (opts = {}) {
  return {
    op: 'replace',
    path: 'requires_additional_kyc_data',
    value: opts.value || false
  }
}

function validGatewayAccountTokensResponse (opts = {}) {
  return {
    tokens:
      [{
        issued_date: opts.issued_date || '03 Sep 2018 - 10:05',
        last_used: opts.last_used || null,
        token_link: opts.token_link || '32fa3cdd-23c8-4602-a415-b48ede66b5e4',
        description: opts.description || 'Created from command line',
        token_type: opts.token_type || 'CARD',
        created_by: opts.created_by || 'System generated'
      }]
  }
}

function validGatewayAccountResponse (opts = {}) {
  return validGatewayAccount(opts)
}

function validGatewayAccountsResponse (opts = {}) {
  const accounts = opts.accounts.map(validGatewayAccount)
  return {
    accounts: accounts
  }
}

function validDirectDebitGatewayAccountResponse (opts = {}) {
  return {
    gateway_account_id: opts.gateway_account_id || 73,
    gateway_account_external_id: opts.gateway_account_external_id || 'DIRECT_DEBIT:' + 'a9c797ab271448bdba21359e15672076',
    payment_provider: opts.payment_provider || 'sandbox',
    type: opts.type || 'test',
    analytics_id: opts.analytics_id || 'd82dae5bcb024828bb686574a932b5a5',
    is_connected: opts.is_connected || false
  }
}

function validCreateGatewayAccountRequest (opts = {}) {
  const data = {
    payment_provider: opts.payment_provider || 'sandbox',
    service_name: opts.service_name || 'This is an account for the GOV.UK Pay team',
    type: opts.type || 'test'
  }

  if (opts.analytics_id) {
    data.analytics_id = opts.analytics_id
  }
  if (opts.service_id) {
    data.service_id = opts.service_id
  }
  return data
}

function validUpdateGatewayAccountCredentialsRequest (opts = {}) {
  const defaultCredentials = {
    username: 'a-username',
    password: 'a-password', // pragma: allowlist secret
    merchant_id: 'a-merchant-id'
  }
  return [
    {
      op: 'replace',
      path: 'credentials',
      value: opts.credentials || defaultCredentials
    },
    {
      op: 'replace',
      path: 'last_updated_by_user_external_id',
      value: opts.userExternalId || 'a-user-external-id'
    }
  ]
}

function validGatewayAccountCredentialsResponse (opts = {}) {
  const defaultCredentials = {
    username: 'a-username',
    password: 'a-password' // pragma: allowlist secret
  }
  const data = {
    external_id: opts.externalId || 'an-external-id',
    gateway_account_id: opts.gatewayAccountId || 42,
    gateway_account_credential_id: opts.gatewayAccountCredentialId || 888,
    payment_provider: opts.paymentProvider || 'worldpay',
    credentials: opts.credentials || defaultCredentials,
    state: opts.state || 'ACTIVE',
    created_date: opts.createdDate || '2021-06-11T13:43:51.464Z'
  }
  if (opts.lastUpdatedByUserExternalId !== undefined) {
    data.last_updated_by_user_external_id = opts.lastUpdatedByUserExternalId
  }
  if (opts.activeStartDate !== undefined) {
    data.active_start_date = opts.activeStartDate
  }
  if (opts.activeEndDate !== undefined) {
    data.active_end_date = opts.activeEndDate
  }
  return data
}

function validPatchGatewayMerchantIdRequest (opts = {}) {
  return [
    {
      op: 'replace',
      path: 'credentials/gateway_merchant_id',
      value: opts.gatewayMerchantId || 'abcdef123abcdef'
    },
    {
      op: 'replace',
      path: 'last_updated_by_user_external_id',
      value: opts.userExternalId || 'a-user-external-id'
    }
  ]
}

function validPatchAccountGatewayAccountCredentialsStateRequest (opts = {}) {
  return [
    {
      op: 'replace',
      path: 'state',
      value: opts.state || 'VERIFIED_WITH_LIVE_PAYMENT'
    },
    {
      op: 'replace',
      path: 'last_updated_by_user_external_id',
      value: opts.userExternalId
    }
  ]
}

function validPatchGatewayCredentialsResponse (opts = {}) {
  const defaultCredentials = {
    username: 'a-username',
    merchant_id: 'a-merchant-id'
  }
  if (opts.gatewayMerchantId !== undefined) {
    defaultCredentials.gateway_merchant_id = opts.gatewayMerchantId
  }
  const data = {
    external_id: opts.externalId || 'an-external-id',
    gateway_account_id: opts.gatewayAccountId || 42,
    gateway_account_credential_id: opts.gatewayAccountCredentialId || 888,
    payment_provider: opts.paymentProvider || 'worldpay',
    credentials: opts.credentials || defaultCredentials,
    state: opts.state || 'ACTIVE',
    created_date: opts.createdDate || '2021-06-11T13:43:51.464Z'
  }
  if (opts.lastUpdatedByUserExternalId !== undefined) {
    data.last_updated_by_user_external_id = opts.lastUpdatedByUserExternalId
  }
  if (opts.activeStartDate !== undefined) {
    data.active_start_date = opts.activeStartDate
  }
  if (opts.activeEndDate !== undefined) {
    data.active_end_date = opts.activeEndDate
  }
  return data
}

function validPostAccountSwitchPSPRequest (opts = {}) {
  return {
    user_external_id: opts.userExternalId || 'a-user-external-id',
    gateway_account_credential_external_id: opts.gatewayAccountCredentialExternalId
  }
}

module.exports = {
  validGatewayAccount,
  validGatewayAccountPatchRequest,
  validGatewayAccountEmailRefundToggleRequest,
  validGatewayAccountEmailConfirmationToggleRequest,
  validGatewayAccountEmailCollectionModeRequest,
  validGatewayAccountPatchRequiresAdditionalKycDataRequest,
  validGatewayAccountTokensResponse,
  validGatewayAccountResponse,
  validGatewayAccountsResponse,
  validDirectDebitGatewayAccountResponse,
  validCreateGatewayAccountRequest,
  validUpdateGatewayAccountCredentialsRequest,
  validGatewayAccountCredentialsResponse,
  validPatchGatewayMerchantIdRequest,
  validPatchGatewayCredentialsResponse,
  validPatchAccountGatewayAccountCredentialsStateRequest,
  validPostAccountSwitchPSPRequest
}
