'use strict'

const qrcode = require('qrcode')
const lodash = require('lodash')

const { RESTClientError, ExpiredInviteError } = require('../../errors')
const adminusersClient = require('../../services/clients/adminusers.client')()
const paths = require('../../paths')
const {
  validatePassword,
  validateOtp,
  validatePhoneNumber
} = require('../../utils/validation/server-side-form-validations')
const { isEmpty } = require('../../utils/validation/field-validation-checks')
const { sanitiseSecurityCode } = require('../../utils/security-code-utils')
const { validationErrors } = require('../../utils/validation/field-validation-checks')
const { INVITE_SESSION_COOKIE_NAME } = require('../../utils/constants')

const PASSWORD_INPUT_FIELD_NAME = 'password'
const REPEAT_PASSWORD_INPUT_FIELD_NAME = 'repeat-password'
const PHONE_NUMBER_INPUT_FIELD_NAME = 'phone'
const OTP_CODE_FIELD_NAME = 'code'

async function showPasswordPage (req, res, next) {
  const sessionData = req[INVITE_SESSION_COOKIE_NAME]

  try {
    const invite = await adminusersClient.getValidatedInvite(sessionData.code)
    if (invite.password_set) {
      return res.redirect(paths.register.securityCodes)
    }

    res.render('registration/password')
  } catch (err) {
    next(err)
  }
}

async function submitPasswordPage (req, res, next) {
  const sessionData = req[INVITE_SESSION_COOKIE_NAME]
  const password = req.body[PASSWORD_INPUT_FIELD_NAME]
  const repeatPassword = req.body[REPEAT_PASSWORD_INPUT_FIELD_NAME]

  const errors = {}

  const passwordValidationResult = validatePassword(password)
  if (!passwordValidationResult.valid) {
    errors[PASSWORD_INPUT_FIELD_NAME] = passwordValidationResult.message
  }
  if (isEmpty(repeatPassword)) {
    errors[REPEAT_PASSWORD_INPUT_FIELD_NAME] = 'Re-type your password'
  } else if (!errors[PASSWORD_INPUT_FIELD_NAME] && password !== repeatPassword) {
    errors[PASSWORD_INPUT_FIELD_NAME] = errors[REPEAT_PASSWORD_INPUT_FIELD_NAME] = 'Enter same password in both fields'
  }

  if (!lodash.isEmpty(errors)) {
    return res.render('registration/password', { errors })
  }

  try {
    await adminusersClient.updateInvitePassword(sessionData.code, password)
    res.redirect(paths.register.securityCodes)
  } catch (err) {
    next(err)
  }
}

function showChooseSignInMethodPage (req, res) {
  res.render('registration/get-security-codes')
}

function submitChooseSignInMethodPage (req, res) {
  const signInMethod = req.body['sign-in-method']
  if (!signInMethod) {
    return res.render('registration/get-security-codes', {
      errors: {
        'sign-in-method': 'You need to select an option'
      }
    })
  }

  if (signInMethod === 'SMS') {
    res.redirect(paths.register.phoneNumber)
  } else {
    res.redirect(paths.register.authenticatorApp)
  }
}

async function showAuthenticatorAppPage (req, res, next) {
  const sessionData = req[INVITE_SESSION_COOKIE_NAME]

  try {
    const invite = await adminusersClient.getValidatedInvite(sessionData.code)
    const secretKey = invite.otp_key

    const prettyPrintedSecret = secretKey.match(/.{4}/g).join(' ')
    const otpUrl = `otpauth://totp/GOV.UK%20Pay:${encodeURIComponent('username')}?secret=${encodeURIComponent(secretKey)}&issuer=GOV.UK%20Pay&algorithm=SHA1&digits=6&period=30`
    const qrCodeDataUrl = await qrcode.toDataURL(otpUrl)

    const recovered = sessionData.recovered || {}
    delete sessionData.recovered

    res.render('registration/authenticator-app', {
      prettyPrintedSecret,
      qrCodeDataUrl,
      errors: recovered.errors
    })
  } catch (err) {
    next(err)
  }
}

async function submitAuthenticatorAppPage (req, res, next) {
  const sessionData = req[INVITE_SESSION_COOKIE_NAME]
  const otpCode = sanitiseSecurityCode(req.body[OTP_CODE_FIELD_NAME])
  const validationResult = validateOtp(otpCode)

  const errors = {}
  if (!validationResult.valid) {
    errors[OTP_CODE_FIELD_NAME] = validationResult.message
    sessionData.recovered = { errors }
    return res.redirect(paths.register.authenticatorApp)
  }

  try {
    await adminusersClient.verifyOtpForInvite(sessionData.code, otpCode)
    const completeInviteResponse = await adminusersClient.completeInvite(sessionData.code)
    // set user external ID on the session so the user is logged in upon redirect
    sessionData.userExternalId = completeInviteResponse.user_external_id
    return res.redirect(paths.registerUser.logUserIn)
  } catch (err) {
    if (err instanceof RESTClientError) {
      if (err.errorCode === 401) {
        errors[OTP_CODE_FIELD_NAME] = validationErrors.invalidOrExpiredSecurityCodeApp
        sessionData.recovered = { errors }
        return res.redirect(paths.register.authenticatorApp)
      } else if (err.errorCode === 410) {
        return next(new ExpiredInviteError(`Invite with code ${sessionData.code} has expired`))
      }
    }
    next(err)
  }
}

function showPhoneNumberPage (req, res, next) {
  res.render('registration/phone-number')
}

async function submitPhoneNumberPage (req, res, next) {
  const sessionData = req[INVITE_SESSION_COOKIE_NAME]
  const phoneNumber = req.body[PHONE_NUMBER_INPUT_FIELD_NAME]

  const errors = {}

  const validPhoneNumber = validatePhoneNumber(phoneNumber)
  if (!validPhoneNumber.valid) {
    errors[PHONE_NUMBER_INPUT_FIELD_NAME] = validPhoneNumber.message
  }

  if (!lodash.isEmpty(errors)) {
    return res.render('registration/phone-number', { errors, phoneNumber })
  }

  try {
    await adminusersClient.updateInvitePhoneNumber(sessionData.code, phoneNumber)
    await adminusersClient.sendOtp(sessionData.code)

    res.redirect(paths.register.smsCode)
  } catch (err) {
    next(err)
  }
}

function showSmsSecurityCodePage (req, res) {
  res.render('registration/sms-code', { redactedPhoneNumber: '*******1111' })
}

function showResendSecurityCodePage (req, res) {
  res.render('registration/resend-code')
}

function showSuccessPage (req, res) {
  res.render('registration/success')
}

module.exports = {
  showPasswordPage,
  submitPasswordPage,
  showChooseSignInMethodPage,
  submitChooseSignInMethodPage,
  showAuthenticatorAppPage,
  submitAuthenticatorAppPage,
  showPhoneNumberPage,
  submitPhoneNumberPage,
  showSmsSecurityCodePage,
  showResendSecurityCodePage,
  showSuccessPage
}
