module.exports = {
  created: {
    triggers: ['created'],
    canMoveTo: {
      payment_pending: {
        access: ['client']
      },
      cancelled: {
        access: ['client', 'waiter', 'manager']
      }
    },
    start: true
  },
  payment_pending: {
    triggers: ['payment_pending'],
    canMoveTo: {
      paid: {
        access: ['system']
      },
      payment_failed: {
        access: ['system']
      }
    },
    payment: true
  },
  payment_failed: {
    triggers: ['payment_failed'],
    canMoveTo: {
      payment_pending: {
        access: ['client']
      },
      cancelled: {
        access: ['client', 'waiter', 'manager']
      }
    },
    paymentFailed: true
  },
  paid: {
    triggers: ['paid'],
    canMoveTo: {
      preparing: {
        access: ['chef']
      },
      cancelled: {
        access: ['client', 'waiter', 'manager']
      }
    },
    decrementStock: true,
    paid: true
  },
  preparing: {
    canMoveTo: {
      ready_to_serve: {
        access: ['chef']
      },
      cancelled: {
        access: ['chef']
      }
    }
  },
  ready_to_serve: {
    canMoveTo: {
      served: {
        access: ['waiter']
      },
      cancelled: {
        access: ['chef', 'waiter']
      }
    }
  },
  served: {
    canMoveTo: {
      return_pending: {
        access: ['client', 'waiter', 'manager']
      },
      cancelled: {
        access: ['waiter', 'manager']
      }
    }
  },
  return_pending: {
    canMoveTo: {
      returned: {
        access: ['waiter', 'manager']
      },
      cancelled: {
        access: ['waiter', 'manager']
      }
    }
  },
  returned: {
    canMoveTo: {
      preparing: {
        access: ['chef']
      },
      cancelled: {
        access: ['chef', 'manager']
      }
    }
  },
  cancelled: {
    canMoveTo: {
      pending_refund: {
        access: ['waiter', 'manager']
      }
    },
    incrementStock: true
  },
  pending_refund: {
    triggers: ['pending_refund'],
    canMoveTo: {
      refund_failed: {
        access: ['system']
      },
      refunded: {
        access: ['system']
      }
    },
    refund: true
  },
  refund_failed: {
    triggers: ['refund_failed'],
    canMoveTo: {
      pending_refund: {
        access: ['waiter', 'manager']
      },
      cancelled: {
        access: ['waiter', 'manager']
      }
    },
    refundFailed: true
  },
  refunded: {
    triggers: ['refunded'],
    refunded: true
  }
}
