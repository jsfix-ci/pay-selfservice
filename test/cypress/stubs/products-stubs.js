'use strict'

const productFixtures = require('../../fixtures/product.fixtures')
const { stubBuilder } = require('./stub-builder')

function getProductsByGatewayAccountIdAndTypeStub (products, gatewayAccountId, productType) {
  const path = `/v1/api/gateway-account/${gatewayAccountId}/products`
  return stubBuilder('GET', path, 200, {
    query: {
      type: productType
    },
    response: products.map(product =>
      productFixtures.validProductResponse(product))
  })
}

function getProductByExternalIdStub (product, gatewayAccountId) {
  const path = `/v1/api/gateway-account/${gatewayAccountId}/products/${product.external_id}`
  return stubBuilder('GET', path, 200, {
    response: productFixtures.validProductResponse(product)
  })
}

function deleteProductStub (product, gatewayAccountId, verifyCalledTimes) {
  const path = `/v1/api/gateway-account/${gatewayAccountId}/products/${product.external_id}`
  return stubBuilder('DELETE', path, 200, {
    verifyCalledTimes: verifyCalledTimes
  })
}

function getProductsByGatewayAccountIdAndTypeFailure (gatewayAccountId, productType) {
  const path = `/v1/api/gateway-account/${gatewayAccountId}/products`
  return stubBuilder('GET', path, 500, {
    query: {
      type: productType
    }
  })
}

function postCreateProductSuccess () {
  const path = '/v1/api/products'
  return stubBuilder('POST', path, 200, {
    response: productFixtures.validProductResponse()
  })
}

module.exports = {
  getProductsByGatewayAccountIdAndTypeStub,
  getProductByExternalIdStub,
  deleteProductStub,
  getProductsByGatewayAccountIdAndTypeFailure,
  postCreateProductSuccess
}
