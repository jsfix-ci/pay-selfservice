const Ledger = require('../../services/clients/ledger.client')
const Paginator = require('../../utils/paginator')

const PAGE_SIZE = 20
const MAX_PAGES = 2

function formatAgreementPages (agreementSearchResponse) {
  const { total, page, results } = agreementSearchResponse
  const paginator = new Paginator(total, PAGE_SIZE, page)
  const hasMultiplePages = paginator.getLast() > 1
  const links = hasMultiplePages && paginator.getNamedCentredRange(MAX_PAGES, true, true)
  return { total, page, links, results }
}

async function agreements (serviceId, live, page = 1, filters = {}) {
  const agreementSearchResponse = await Ledger.agreements(serviceId, live, page, { filters })
  return formatAgreementPages(agreementSearchResponse)
}

function agreement (id, serviceId) {
  return Ledger.agreement(id, serviceId)
}

module.exports = {
  agreement,
  agreements
}
