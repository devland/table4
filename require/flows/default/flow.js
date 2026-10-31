module.exports = {
  created: {
    label: 'created',
    triggers: ['created'],
    canMoveTo: {
      payment_pending: {
        access: ['client']
      },
      cancelled: {
        access: ['client', 'waiter', 'manager']
      }
    },
    start: true,
    decrementStock: true
  },
  payment_pending: {
    label: 'payment_pending',
    triggers: ['payment_pending'],
    canMoveTo: {
      paid: {
        access: ['system']
      },
      payment_failed: {
        access: ['system']
      }
    }
  },
  payment_failed: {
    label: 'payment_failed',
    triggers: ['payment_failed'],
    canMoveTo: {
      payment_pending: {
        access: ['client']
      },
      cancelled: {
        access: ['client', 'waiter', 'manager']
      }
    }
  },
  paid: {
    label: 'paid',
    triggers: ['paid'],
    canMoveTo: {
      preparing: {
        access: ['chef']
      },
      cancelled: {
        access: ['client', 'waiter', 'manager']
      }
    }
  },
  preparing: {
    label: 'preparing',
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
    label: 'ready_to_serve',
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
    label: 'served',
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
    label: 'return_pending',
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
    label: 'returned',
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
    label: 'cancelled',
    canMoveTo: {
      pending_refund: {
        access: ['waiter', 'manager']
      }
    },
    incrementStock: true
  },
  pending_refund: {
    label: 'pending_refund',
    triggers: ['pending_refund'],
    canMoveTo: {
      refund_failed: {
        access: ['system']
      },
      refunded: {
        access: ['system']
      }
    }
  },
  refund_failed: {
    label: 'refund_failed',
    triggers: ['refund_failed']
  },
  refunded: {
    label: 'refunded',
    triggers: ['refunded']
  }
}
