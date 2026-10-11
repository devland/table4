// WARNING
// DO NOT CHANGE THIS FILE UNLESS YOU ARE SURE OF WHAT YOU ARE DOING
module.exports = {
  admin: ['*'],
  client: [
    'changePassword',
    'sendEmailChangeCode',
    'changeEmail'
  ],
  waiter: [],
  chef: [],
  manager: [],
  everyone: [
    'signup',
    'login',
    'sendPasswordResetCode',
    'resetPassword',
    'getCart',
    'updateCart',
    'createOrder'
  ]
}
