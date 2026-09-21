import React, { useEffect, useState } from 'react';
import { Check, CreditCard } from 'lucide-react';
import { createSubscriptionTransaction, fetchSubscription, fetchSubscriptionPlans } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function RecruiterSubscriptionPage() {
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyPlan, setBusyPlan] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([fetchSubscriptionPlans(), fetchSubscription()])
      .then(([loadedPlans, loadedSubscription]) => {
        setPlans(loadedPlans);
        setSubscription(loadedSubscription);
      })
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  const startCheckout = async (plan) => {
    setBusyPlan(plan.id);
    setMessage('');
    try {
      const result = await createSubscriptionTransaction(plan.id, `web-${plan.id}-${Date.now()}`);
      setMessage(result.message || 'Checkout transaction created. Connect your payment provider to complete payment.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusyPlan(null);
    }
  };

  if (loading) return <LoadingSpinner label="Loading subscription plans..." />;

  return (
    <div className="space-y-6 font-sans text-[#14181C] dark:text-slate-50">
      <section className="rounded-2xl border border-[#14181C]/10 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <p className="font-data text-xs tracking-[0.2em] text-[#0E7C66]">RECRUITER PLANS</p>
        <h1 className="mt-2 font-display text-2xl font-semibold">Subscription and billing</h1>
        <p className="mt-2 text-sm text-[#5B6660] dark:text-slate-400">
          Choose a plan. Payment confirmation is completed by the configured provider webhook.
        </p>
        {subscription && <p className="mt-4 text-sm text-[#0E7C66]">Current status: {subscription.status}</p>}
        {message && <p className="mt-4 rounded-lg bg-[#E1F5EE] px-4 py-3 text-sm text-[#085041]">{message}</p>}
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.id} className="rounded-2xl border border-[#14181C]/10 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold">{plan.name}</h2>
            <p className="mt-3 font-data text-3xl font-semibold">{plan.currency} {plan.amount}</p>
            <p className="mt-1 text-sm text-[#5B6660] dark:text-slate-400">per {plan.billing_interval}</p>
            <p className="mt-4 text-sm text-[#5B6660] dark:text-slate-400">{plan.description}</p>
            <ul className="mt-5 space-y-2 text-sm">
              {(plan.features || []).map((feature) => (
                <li key={feature} className="flex items-center gap-2"><Check className="h-4 w-4 text-[#0E7C66]" />{feature}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => startCheckout(plan)}
              disabled={busyPlan === plan.id}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0E7C66] px-4 py-3 text-sm font-medium text-white hover:bg-[#0B6553] disabled:opacity-60"
            >
              <CreditCard className="h-4 w-4" />
              {busyPlan === plan.id ? 'Creating checkout...' : 'Choose plan'}
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}
