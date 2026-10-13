export function subscriptionCheckout(api: {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
}, priceId: string): Promise<{ url: string }>;
