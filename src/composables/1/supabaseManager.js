// Gerenciador de canais do Supabase
export class SupabaseManager {
  static subscriptions = {}
  
  static addSubscription(name, channel) {
    this.subscriptions[name] = channel
  }
  
  static getSubscription(name) {
    return this.subscriptions[name]
  }
  
  static removeSubscription(name) {
    delete this.subscriptions[name]
  }
}