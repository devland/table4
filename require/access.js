// WARNING
// DO NOT CHANGE THIS FILE UNLESS YOU ARE SURE OF WHAT YOU ARE DOING
module.exports = {
  admin: ['*'],
  user: [
    'changePassword',
    'sendEmailChangeCode',
    'changeEmail'
  ],
  everyone: [
    'signup',
    'login',
    'sendPasswordResetCode',
    'resetPassword'
  ]
}
