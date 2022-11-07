'use strict'

const qrcode = require('qrcode')

const exampleSecretKey = '374WZRIHKV4XIUKXQPOXF3QTO5WSEMAF' // pragma: allowlist secret

function showEmailPage (req, res) {
  res.render('registration/email')
}

function showPasswordPage (req, res) {
  res.render('registration/password')
}

function showChooseSignInMethodPage (req, res) {
  res.render('registration/get-security-codes')
}

async function showAuthenticatorAppPage (req, res) {
  const prettyPrintedSecret = exampleSecretKey.match(/.{4}/g).join(' ')
  const otpUrl = `otpauth://totp/GOV.UK%20Pay:${encodeURIComponent('username')}?secret=${encodeURIComponent(exampleSecretKey)}&issuer=GOV.UK%20Pay&algorithm=SHA1&digits=6&period=30`
  const qrCodeDataUrl = await qrcode.toDataURL(otpUrl)

  res.render('registration/authenticator-app', {
    prettyPrintedSecret,
    qrCodeDataUrl
  })
}

function showPhoneNumberPage (req, res) {
  res.render('registration/phone-number')
}

function showSmsSecurityCodePage (req, res) {
  res.render('registration/sms-code')
}

function showResendSecurityCodePage (req, res) {
  res.render('registration/resend-code')
}

function showSuccessPage (req, res) {
  res.render('registration/success')
}

module.exports = {
  showEmailPage,
  showPasswordPage,
  showChooseSignInMethodPage,
  showAuthenticatorAppPage,
  showPhoneNumberPage,
  showSmsSecurityCodePage,
  showResendSecurityCodePage,
  showSuccessPage
}
