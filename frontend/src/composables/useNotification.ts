import { reactive } from 'vue'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface Notification {
  id: string
  type: NotificationType
  message: string
  timeout?: number
}

const state = reactive<{
  notifications: Notification[]
}>({
  notifications: [],
})

export function useNotification() {
  function notify(message: string, type: NotificationType = 'info', timeout: number = 5000) {
    const id = Math.random().toString(36).substring(2, 9)
    const notification: Notification = { id, type, message, timeout }
    
    state.notifications.push(notification)
    
    if (timeout > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, timeout)
    }
  }

  function removeNotification(id: string) {
    const index = state.notifications.findIndex((n) => n.id === id)
    if (index !== -1) {
      state.notifications.splice(index, 1)
    }
  }

  return {
    notifications: state.notifications,
    notify,
    removeNotification,
    success: (msg: string) => notify(msg, 'success'),
    error: (msg: string) => notify(msg, 'error'),
    info: (msg: string) => notify(msg, 'info'),
    warning: (msg: string) => notify(msg, 'warning'),
  }
}
