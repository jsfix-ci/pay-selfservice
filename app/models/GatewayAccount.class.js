'use strict'

/**
 * @class GatewayAccount
 * @property {string} name - The name of the gateway account
 * @property {string} id - The id of the gateway account
 * @property {string} type - The type of the gateway account (e.g. test/live)
 * @property {string} description - The description of the gateway account
 * @property {string} analyticsId - Google analyticsId of the gateway account
 * @property {boolean} toggle3ds - whether 3DS is enabled or not on this gateway account
 */
class GatewayAccount {
  /**
   * Create an instance of Service
   * @param {Object} gatewayAccountData - raw 'gateway account' object from server
   * @param {string} gatewayAccountData.gateway_account_id - The external ID of the gateway account
   * @param {string} gatewayAccountData.service_name - The name of the gateway account
   * @param {string} gatewayAccountData.type - The type of the gateway account
   * @param {string} gatewayAccountData.payment_provider - The payment provider of the gateway account
   * @param {string} gatewayAccountData.description - The description of the gateway account
   * @param {string} gatewayAccountData.analytics_id - Google analytics_id of the gateway account
   * @param {boolean} gatewayAccountData.toggle_3ds - whether 3DS is enabled or not on this gateway account
   * @param {boolean} gatewayAccountData.requires_additional_kyc_data - whether gateway account requires additional information
   **/
  constructor (gatewayAccountData) {
    this.id = gatewayAccountData.gateway_account_id
    this.external_id = gatewayAccountData.external_id
    this.name = gatewayAccountData.service_name
    this.type = gatewayAccountData.type
    this.paymentProvider = gatewayAccountData.payment_provider
    this.description = gatewayAccountData.description
    this.analyticsId = gatewayAccountData.analytics_id
    this.toggle3ds = gatewayAccountData.toggle_3ds
    this.providerSwitchEnabled = gatewayAccountData.provider_switch_enabled
    this.recurringEnabled = gatewayAccountData.recurring_enabled
    this.requiresAdditionalKycData = gatewayAccountData.requires_additional_kyc_data
  }

  /**
   * @method toJson
   * @returns {Object} A minimal representation of the gateway account
   */
  toMinimalJson () {
    // until we have external ids for card accounts, the external id is the internal one
    return {
      id: this.id,
      external_id: this.external_id,
      payment_provider: this.paymentProvider,
      service_name: this.name,
      type: this.type,
      provider_switch_enabled: this.providerSwitchEnabled,
      recurring_enabled: this.recurringEnabled,
      requiresAdditionalKycData: this.requiresAdditionalKycData
    }
  }
}

module.exports = GatewayAccount
