const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')

const inviteFixtures = require('../../../test/fixtures/invite.fixtures')
const { RESTClientError, ExpiredInviteError } = require('../../errors')
const { paths } = require('../../routes')
const registrationController = require('./registration.controller')

const inviteCode = 'a-code'
let req, res, next

const qrCodeDataUrl = 'data:image/png;base64,somedata'

describe('Registration', () => {
  beforeEach(() => {
    req = {
      register_invite: {
        code: inviteCode,
        email: 'foo@example.com'
      }
    }
    res = {
      redirect: sinon.spy(),
      render: sinon.spy()
    }
    next = sinon.spy()
  })

  describe('show the password page', () => {
    it('should redirect to security codes page when password is already set for invite', async () => {
      const inviteWithPasswordSet = inviteFixtures.validInviteResponse({ password_set: true })
      const controller = getControllerWithMockedAdminusersClient({
        getValidatedInvite: () => Promise.resolve(inviteWithPasswordSet)
      })

      await controller.showPasswordPage(req, res, next)
      sinon.assert.calledWith(res.redirect, paths.register.securityCodes)
      sinon.assert.notCalled(next)
      sinon.assert.notCalled(res.render)
    })

    it('should render password page when password is not set for invite', async () => {
      const inviteWithPasswordNotSet = inviteFixtures.validInviteResponse({ password_set: false })
      const controller = getControllerWithMockedAdminusersClient({
        getValidatedInvite: () => Promise.resolve(inviteWithPasswordNotSet)
      })

      await controller.showPasswordPage(req, res, next)
      sinon.assert.calledWith(res.render, 'registration/password')
      sinon.assert.notCalled(next)
      sinon.assert.notCalled(res.redirect)
    })

    it('should call next with an error if adminusers returns an error', async () => {
      const error = new Error('error from adminusers')
      const controller = getControllerWithMockedAdminusersClient({
        getValidatedInvite: () => Promise.reject(error)
      })

      await controller.showPasswordPage(req, res, next)
      sinon.assert.calledWith(next, error)
      sinon.assert.notCalled(res.render)
      sinon.assert.notCalled(res.redirect)
    })
  })

  describe('submit the password page', () => {
    it('should render the password page with an error when both password fields are empty', async () => {
      req.body = {
        password: '',
        'repeat-password': ''
      }
      await registrationController.submitPasswordPage(req, res, next)

      sinon.assert.calledWith(res.render, 'registration/password', {
        errors: {
          password: 'Enter a password',
          'repeat-password': 'Re-type your password'
        }
      })
    })

    it('should render the password page with an error when the password does not meet the requirements', async () => {
      req.body = {
        password: 'too-short',
        'repeat-password': 'too-short'
      }
      await registrationController.submitPasswordPage(req, res, next)

      sinon.assert.calledWith(res.render, 'registration/password', {
        errors: {
          password: 'Password must be 10 characters or more'
        }
      })
    })

    it('should render the password page with an error when the password is valid but the repeat password field is blank', async () => {
      req.body = {
        password: 'this-is-long-enough',
        'repeat-password': ''
      }
      await registrationController.submitPasswordPage(req, res, next)

      sinon.assert.calledWith(res.render, 'registration/password', {
        errors: {
          'repeat-password': 'Re-type your password'
        }
      })
    })

    it('should render the password page with an error when the repeat password field does not match', async () => {
      req.body = {
        password: 'this-is-long-enough',
        'repeat-password': 'something-else'
      }
      await registrationController.submitPasswordPage(req, res, next)

      sinon.assert.calledWith(res.render, 'registration/password', {
        errors: {
          password: 'Enter same password in both fields',
          'repeat-password': 'Enter same password in both fields'
        }
      })
    })

    it('should call next with an error if adminusers returns an error', async () => {
      const validPassword = 'this-is-long-enough'
      req.body = {
        password: validPassword,
        'repeat-password': validPassword
      }

      const error = new Error('error from adminusers')
      const updateInvitePasswordSpy = sinon.spy(() => Promise.reject(error))
      const controller = getControllerWithMockedAdminusersClient({
        updateInvitePassword: updateInvitePasswordSpy
      })

      await controller.submitPasswordPage(req, res, next)
      sinon.assert.calledWith(updateInvitePasswordSpy, inviteCode, validPassword)
      sinon.assert.calledWith(next, error)
      sinon.assert.notCalled(res.render)
      sinon.assert.notCalled(res.redirect)
    })

    it('should redirect to next page if updated password successfully', async () => {
      const validPassword = 'this-is-long-enough'
      req.body = {
        password: validPassword,
        'repeat-password': validPassword
      }

      const updateInvitePasswordSpy = sinon.spy(() => Promise.resolve())
      const controller = getControllerWithMockedAdminusersClient({
        updateInvitePassword: updateInvitePasswordSpy
      })

      await controller.submitPasswordPage(req, res, next)
      sinon.assert.calledWith(updateInvitePasswordSpy, inviteCode, validPassword)
      sinon.assert.calledWith(res.redirect, paths.register.securityCodes)
      sinon.assert.notCalled(next)
      sinon.assert.notCalled(res.render)
    })
  })

  describe('submit the choose how to get security codes page', () => {
    it('should render page with an error when an option is not selected', () => {
      req.body = {
        'sign-in-method': ''
      }
      registrationController.submitChooseSignInMethodPage(req, res)
      sinon.assert.calledWith(res.render, 'registration/get-security-codes', {
        errors: {
          'sign-in-method': 'You need to select an option'
        }
      })
      sinon.assert.notCalled(res.redirect)
    })

    it('should redirect to the phone number page when SMS is chosen', () => {
      req.body = {
        'sign-in-method': 'SMS'
      }
      registrationController.submitChooseSignInMethodPage(req, res)
      sinon.assert.calledWith(res.redirect, paths.register.phoneNumber)
      sinon.assert.notCalled(res.render)
    })

    it('should redirect to the authenticator app page when APP is chosen', () => {
      req.body = {
        'sign-in-method': 'APP'
      }
      registrationController.submitChooseSignInMethodPage(req, res)
      sinon.assert.calledWith(res.redirect, paths.register.authenticatorApp)
      sinon.assert.notCalled(res.render)
    })
  })

  describe('show the authenticator app page', () => {
    it('should call next with an error if adminusers returns an error', async () => {
      const error = new Error('error from adminusers')
      const controller = getControllerWithMockedAdminusersClient({
        getValidatedInvite: () => Promise.reject(error)
      })

      await controller.showAuthenticatorAppPage(req, res, next)
      sinon.assert.calledWith(next, error)
      sinon.assert.notCalled(res.render)
      sinon.assert.notCalled(res.redirect)
    })

    it('should render the page when invite successfully retrieved from adminusers', async () => {
      const otpKey = 'ANEXAMPLESECRETSECONDFACTORCODE1'
      const invite = inviteFixtures.validInviteResponse({ otp_key: otpKey })
      const controller = getControllerWithMockedAdminusersClient({
        getValidatedInvite: () => Promise.resolve(invite)
      })

      await controller.showAuthenticatorAppPage(req, res, next)
      sinon.assert.calledWith(res.render, 'registration/authenticator-app', {
        prettyPrintedSecret: 'ANEX AMPL ESEC RETS ECON DFAC TORC ODE1',
        qrCodeDataUrl,
        errors: undefined
      })
      sinon.assert.notCalled(next)
      sinon.assert.notCalled(res.redirect)

      expect(req.register_invite).to.not.have.property('recovered')
    })

    it('should render the page with errors if there is a recovered object in the session', async () => {
      const sessionErrors = { 'key': 'An error' }
      req.register_invite.recovered = { errors: sessionErrors }

      const otpKey = 'ANEXAMPLESECRETSECONDFACTORCODE1'
      const invite = inviteFixtures.validInviteResponse({ otp_key: otpKey })
      const controller = getControllerWithMockedAdminusersClient({
        getValidatedInvite: () => Promise.resolve(invite)
      })

      await controller.showAuthenticatorAppPage(req, res, next)
      sinon.assert.calledWith(res.render, 'registration/authenticator-app', {
        prettyPrintedSecret: 'ANEX AMPL ESEC RETS ECON DFAC TORC ODE1',
        qrCodeDataUrl,
        errors: sessionErrors
      })
      sinon.assert.notCalled(next)
      sinon.assert.notCalled(res.redirect)

      expect(req.register_invite).to.not.have.property('recovered')
    })
  })

  describe('submit the authenticator app page', () => {
    it('should call redirect with an error in the session when the OTP code fails validation', async () => {
      req.body = {
        code: 'aaa'
      }

      await registrationController.submitAuthenticatorAppPage(req, res, next)
      sinon.assert.calledWith(res.redirect, paths.register.authenticatorApp)
      sinon.assert.notCalled(next)

      expect(req.register_invite).to.have.property('recovered').to.deep.equal({
        errors: {
          code: 'The code must be 6 numbers'
        }
      })
    })

    it('should redirect to login when OTP code is valid', async () => {
      const otpCode = '123 456'
      const expectedSanitisedOtpCode = '123456'
      req.body = {
        code: otpCode
      }

      const userExternalId = 'a-user-id'
      const completeInviteResponse = inviteFixtures.validInviteCompleteResponse({
        user_external_id: userExternalId
      })
      const verifyOtpForInviteSpy = sinon.spy(() => Promise.resolve())
      const completeInviteSpy = sinon.spy(() => Promise.resolve(completeInviteResponse))
      const controller = getControllerWithMockedAdminusersClient({
        verifyOtpForInvite: verifyOtpForInviteSpy,
        completeInvite: completeInviteSpy
      })

      await controller.submitAuthenticatorAppPage(req, res, next)
      sinon.assert.calledWith(verifyOtpForInviteSpy, inviteCode, expectedSanitisedOtpCode)
      sinon.assert.calledWith(completeInviteSpy, inviteCode)
      sinon.assert.calledWith(res.redirect, paths.registerUser.logUserIn)
      sinon.assert.notCalled(next)

      expect(req.register_invite).to.have.property('userExternalId').to.equal(userExternalId)
    })

    it('should call redirect with an error in the session when adminusers returns a 401', async () => {
      const otpCode = '123456'
      req.body = {
        code: otpCode
      }

      const verifyOtpForInviteSpy = sinon.spy(() => Promise.reject(new RESTClientError('Error', 'adminusers', 401)))
      const completeInviteSpy = sinon.spy(() => Promise.resolve())
      const controller = getControllerWithMockedAdminusersClient({
        verifyOtpForInvite: verifyOtpForInviteSpy,
        completeInvite: completeInviteSpy
      })

      await controller.submitAuthenticatorAppPage(req, res, next)
      sinon.assert.calledWith(verifyOtpForInviteSpy, inviteCode, otpCode)
      sinon.assert.notCalled(completeInviteSpy)
      sinon.assert.calledWith(res.redirect, paths.register.authenticatorApp)
      sinon.assert.notCalled(next)

      expect(req.register_invite).to.have.property('recovered').to.deep.equal({
        errors: {
          code: 'The security code you entered is not correct, try entering it again or wait for your authenticator app to give you a new code'
        }
      })
    })

    it('should call next with an error when adminusers returns a 410 when verifying the OTP code', async () => {
      const otpCode = '123456'
      req.body = {
        code: otpCode
      }

      const verifyOtpForInviteSpy = sinon.spy(() => Promise.reject(new RESTClientError('Error', 'adminusers', 410)))
      const completeInviteSpy = sinon.spy(() => Promise.resolve())
      const controller = getControllerWithMockedAdminusersClient({
        verifyOtpForInvite: verifyOtpForInviteSpy,
        completeInvite: completeInviteSpy
      })

      await controller.submitAuthenticatorAppPage(req, res, next)
      sinon.assert.calledWith(verifyOtpForInviteSpy, inviteCode, otpCode)
      sinon.assert.notCalled(completeInviteSpy)
      sinon.assert.calledWith(next, sinon.match.instanceOf(ExpiredInviteError))
      sinon.assert.notCalled(res.redirect)
    })

    it('should call next with an error when adminusers returns a 410 when completing the invite', async () => {
      const otpCode = '123456'
      req.body = {
        code: otpCode
      }

      const verifyOtpForInviteSpy = sinon.spy(() => Promise.resolve())
      const completeInviteSpy = sinon.spy(() => Promise.reject(new RESTClientError('Error', 'adminusers', 410)))
      const controller = getControllerWithMockedAdminusersClient({
        verifyOtpForInvite: verifyOtpForInviteSpy,
        completeInvite: completeInviteSpy
      })

      await controller.submitAuthenticatorAppPage(req, res, next)
      sinon.assert.calledWith(verifyOtpForInviteSpy, inviteCode, otpCode)
      sinon.assert.calledWith(completeInviteSpy, inviteCode)
      sinon.assert.calledWith(next, sinon.match.instanceOf(ExpiredInviteError))
      sinon.assert.notCalled(res.redirect)
    })

    it('should call next with an error when adminusers returns an unexpected error', async () => {
      const otpCode = '123456'
      req.body = {
        code: otpCode
      }

      const error = new RESTClientError('Error', 'adminusers', 500)
      const verifyOtpForInviteSpy = sinon.spy(() => Promise.resolve())
      const completeInviteSpy = sinon.spy(() => Promise.reject(error))
      const controller = getControllerWithMockedAdminusersClient({
        verifyOtpForInvite: verifyOtpForInviteSpy,
        completeInvite: completeInviteSpy
      })

      await controller.submitAuthenticatorAppPage(req, res, next)
      sinon.assert.calledWith(verifyOtpForInviteSpy, inviteCode, otpCode)
      sinon.assert.calledWith(completeInviteSpy, inviteCode)
      sinon.assert.calledWith(next, error)
      sinon.assert.notCalled(res.redirect)
    })
  })

  describe('show the phone number page', () => {
    it('should render the page', () => {
      registrationController.showPhoneNumberPage(req, res, next)
      sinon.assert.calledWith(res.render, 'registration/phone-number')
      sinon.assert.notCalled(next)
    })
  })

  describe('submit the phone number page', () => {
    it('should render the phone number page with an error when the phone number is invalid', async () => {
      req.body = {
        phone: 'not-a-phone-number'
      }
      await registrationController.submitPhoneNumberPage(req, res, next)

      sinon.assert.calledWith(res.render, 'registration/phone-number', {
        errors: {
          phone: 'Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192'
        },
        phoneNumber: 'not-a-phone-number'
      })
      sinon.assert.notCalled(next)
      sinon.assert.notCalled(res.redirect)
    })

    it('should call next with an error if adminusers returns an error when patching telephone number', async () => {
      const validPhoneNumber = '+44 0808 157 0192'
      req.body = {
        phone: validPhoneNumber
      }

      const error = new Error('error from adminusers')
      const updateInvitePhoneNumberSpy = sinon.spy(() => Promise.reject(error))
      const controller = getControllerWithMockedAdminusersClient({
        updateInvitePhoneNumber: updateInvitePhoneNumberSpy
      })

      await controller.submitPhoneNumberPage(req, res, next)
      sinon.assert.calledWith(updateInvitePhoneNumberSpy, inviteCode, validPhoneNumber)
      sinon.assert.calledWith(next, error)
      sinon.assert.notCalled(res.render)
      sinon.assert.notCalled(res.redirect)
    })

    it('should call next with an error if adminusers returns an error when sending OTP', async () => {
      const validPhoneNumber = '+44 0808 157 0192'
      req.body = {
        phone: validPhoneNumber
      }

      const error = new Error('error from adminusers')
      const updateInvitePhoneNumberSpy = sinon.spy(() => Promise.resolve())
      const sendOtpSpy = sinon.spy(() => Promise.reject(error))
      const controller = getControllerWithMockedAdminusersClient({
        updateInvitePhoneNumber: updateInvitePhoneNumberSpy,
        sendOtp: sendOtpSpy
      })

      await controller.submitPhoneNumberPage(req, res, next)
      sinon.assert.calledWith(updateInvitePhoneNumberSpy, inviteCode, validPhoneNumber)
      sinon.assert.calledWith(sendOtpSpy, inviteCode)
      sinon.assert.calledWith(next, error)
      sinon.assert.notCalled(res.render)
      sinon.assert.notCalled(res.redirect)
    })

    it('should redirect to next page if updated phone number successfully', async () => {
      const validPhoneNumber = '+44 0808 157 0192'
      req.body = {
        phone: validPhoneNumber
      }

      const updateInvitePhoneNumberSpy = sinon.spy(() => Promise.resolve())
      const sendOtpSpy = sinon.spy(() => Promise.resolve())
      const controller = getControllerWithMockedAdminusersClient({
        updateInvitePhoneNumber: updateInvitePhoneNumberSpy,
        sendOtp: sendOtpSpy
      })

      await controller.submitPhoneNumberPage(req, res, next)
      sinon.assert.calledWith(updateInvitePhoneNumberSpy, inviteCode, validPhoneNumber)
      sinon.assert.calledWith(sendOtpSpy, inviteCode)
      sinon.assert.calledWith(res.redirect, paths.register.smsCode)
      sinon.assert.notCalled(next)
      sinon.assert.notCalled(res.render)
    })
  })
})

function getControllerWithMockedAdminusersClient (mockedAdminusersClient) {
  return proxyquire('./registration.controller.js', {
    '../../services/clients/adminusers.client': () => mockedAdminusersClient,
    'qrcode': { toDataURL: () => Promise.resolve(qrCodeDataUrl) }
  })
}
