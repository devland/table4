// WARNING
// DO NOT CHANGE THIS FILE UNLESS YOU ARE SURE OF WHAT YOU ARE DOING
module.exports = {
  admin: ['*'],
  customer: [
    'changePassword'
  ],
  everyone: [
    'signup',
    'login',
    'sendResetCode',
    'resetPassword'
  ]
}
