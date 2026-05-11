// WARNING
// DO NOT CHANGE THIS FILE UNLESS YOU ARE SURE OF WHAT YOU ARE DOING
module.exports = {
  admin: {
    allowed: '*',
    notAllowed: []
  },
  customer: {
    allowed: [
      'signup',
      'login',
      'changePassword'
    ],
    notAllowed: []
  },
  everyone: {
    allowed: [
      'signup',
      'login',
      'resetPassword'
    ],
    notAllowed: []
  }
}
