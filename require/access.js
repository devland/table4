// WARNING
// DO NOT CHANGE THIS FILE UNLESS YOU ARE SURE OF WHAT YOU ARE DOING
module.exports = {
  everyone: [
    'signup',
    'login',
    'sendPasswordResetCode',
    'resetPassword',
    'getCart',
    'updateCart',
    'createOrder',
    'getOrder'
  ],
  client: [
    'changePassword',
    'sendEmailChangeCode',
    'changeEmail',
    'getOwnUser',
    'getOwnOrders'
  ],
  waiter: [
    'changePassword',
    'sendEmailChangeCode',
    'changeEmail',
    'getOwnUser',
    'getOwnOrders',
    'findOrders',
    'updateOrderStatus'
  ],
  chef: [
    'changePassword',
    'sendEmailChangeCode',
    'changeEmail',
    'getOwnUser',
    'getOwnOrders',
    'findOrders',
    'updateOrderStatus'
  ],
  manager: [
    'changePassword',
    'sendEmailChangeCode',
    'changeEmail',
    'getOwnUser',
    'getUsers',
    'getOwnOrders',
    'findOrders',
    'updateOrderStatus'
  ],
  admin: ['*']
}
