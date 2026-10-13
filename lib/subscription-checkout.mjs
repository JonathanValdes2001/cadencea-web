/** Resolve the next billing destination; errors must never fall back to purchase. */
export async function subscriptionCheckout(api, priceId) {
  const subscription = await api.get('/billing/subscription-status');
  if (!subscription || typeof subscription.plan !== 'string') {
    throw new Error('Unable to verify your subscription. Please try again.');
  }
  const openPortal = () => api.post('/billing/create-portal-session');
  if (subscription.plan !== 'free' &&
      !['canceled', 'incomplete_expired'].includes(subscription.status?.split(' ')[0])) {
    return openPortal();
  }
  try {
    return await api.post('/billing/create-checkout-session', { price_id: priceId });
  } catch (error) {
    // Stripe may know about a subscription before our webhook has updated the
    // local account. The API's 409 is authoritative; never retry as a purchase.
    if (error?.status === 409) return openPortal();
    throw error;
  }
}
