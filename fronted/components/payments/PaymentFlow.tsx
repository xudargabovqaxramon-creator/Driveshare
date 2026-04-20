'use client';

import { useState, useRef, useEffect } from 'react';
import { Booking, BookingStatus, PaymentProvider } from '@/types';
import { useCreatePayment, useProcessPayment } from '@/hooks/usePayments';
import { Button, Select } from '@/components/ui';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { CreditCard, CheckCircle2, XCircle, Loader2, ShieldAlert } from 'lucide-react';
import { useRole } from '@/hooks/useRole';
import { useQueryClient } from '@tanstack/react-query';
import { BOOKING_KEYS } from '@/hooks/useBookings';
import { PAYMENT_KEYS } from '@/hooks/usePayments';

interface PaymentFlowProps {
  booking: Booking;
}

type FlowStep = 'initiate' | 'processing' | 'success' | 'failed';

export function PaymentFlow({ booking }: PaymentFlowProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useRole();

  const [provider, setProvider] = useState<PaymentProvider>(PaymentProvider.MANUAL);
  const [step, setStep] = useState<FlowStep>('initiate');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Payment ID stored after step 1 — used if user retries step 2
  const paymentIdRef = useRef<string | null>(null);

  // Double-payment guard — once processing starts, lock the flow
  const isLockedRef = useRef(false);

  const createPayment = useCreatePayment();
  const processPayment = useProcessPayment();

  // ── Ownership guard ─────────────────────────────────────────────────────
  // Never allow a different user to pay someone else's booking
  const isOwner = user?.id === booking.userId;

  // ── Status guard ────────────────────────────────────────────────────────
  // Only render the pay form if status is exactly AWAITING_PAYMENT
  const canPay =
    isOwner && booking.status === BookingStatus.AWAITING_PAYMENT && !booking.payment;

  // ── Auto-detect if payment already exists ─────────────────────────────
  useEffect(() => {
    if (booking.payment) {
      setStep('success');
    }
  }, [booking.payment]);

  const handlePay = async (simulateFailure = false) => {
    // Hard lock — absolutely prevents second call
    if (isLockedRef.current) return;
    isLockedRef.current = true;
    setStep('processing');
    setErrorMsg('');

    try {
      let paymentId = paymentIdRef.current;

      // Step 1: Create payment record (only if we haven't already)
      if (!paymentId) {
        const payment = await createPayment.mutateAsync({
          bookingId: booking.id,
          amount: booking.totalPrice,
          provider,
        });
        paymentId = payment.id;
        paymentIdRef.current = paymentId;
      }

      // Step 2: Process / confirm
      const processed = await processPayment.mutateAsync({
        id: paymentId,
        simulateFailure,
      });

      if (processed.status === 'completed') {
        setStep('success');
        toast.success('Payment successful! Your booking is confirmed.');
        // Invalidate both queries so the UI reflects the new state
        await qc.invalidateQueries({ queryKey: BOOKING_KEYS.all });
        await qc.invalidateQueries({ queryKey: PAYMENT_KEYS.all });
      } else {
        throw new Error(`Payment status: ${processed.status}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment error. Please try again.';
      setErrorMsg(msg);
      setStep('failed');
      // Release lock on failure so user can retry
      isLockedRef.current = false;
    }
  };

  // ── Ownership / status gate ─────────────────────────────────────────────
  if (!isOwner) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/20">
          <ShieldAlert size={28} className="text-red-500" />
        </div>
        <p className="font-display text-xl font-semibold text-zinc-900 dark:text-white">
          Access Denied
        </p>
        <p className="text-sm text-zinc-500">You can only pay for your own bookings.</p>
      </div>
    );
  }

  if (!canPay && step !== 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
          <ShieldAlert size={28} className="text-zinc-400" />
        </div>
        <p className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
          Payment Not Available
        </p>
        <p className="text-sm text-zinc-500">
          This booking is not awaiting payment. Status:{' '}
          <span className="font-medium capitalize">{booking.status}</span>
        </p>
        <Button variant="secondary" onClick={() => router.push('/dashboard/bookings')}>
          Back to Bookings
        </Button>
      </div>
    );
  }

  // ── Processing state ────────────────────────────────────────────────────
  if (step === 'processing') {
    return (
      <div className="flex flex-col items-center gap-5 py-12 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-400" />
        <div>
          <p className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
            Processing payment…
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Please do not close this page or press back.
          </p>
        </div>
        <div className="space-y-1 text-xs text-zinc-400">
          <p>Step 1: Creating payment record</p>
          <p>Step 2: Confirming with provider</p>
        </div>
      </div>
    );
  }

  // ── Success state ───────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="flex flex-col items-center gap-5 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/20">
          <CheckCircle2 size={36} className="text-emerald-500" />
        </div>
        <div>
          <p className="font-display text-xl font-semibold text-zinc-900 dark:text-white">
            Payment Successful!
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Your booking is confirmed. Check your notifications for updates.
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/bookings')} size="lg">
          View My Bookings
        </Button>
      </div>
    );
  }

  // ── Failed state ────────────────────────────────────────────────────────
  if (step === 'failed') {
    return (
      <div className="flex flex-col items-center gap-5 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/20">
          <XCircle size={36} className="text-red-500" />
        </div>
        <div>
          <p className="font-display text-xl font-semibold text-zinc-900 dark:text-white">
            Payment Failed
          </p>
          <p className="mt-2 text-sm text-zinc-500">{errorMsg || 'Your payment could not be processed.'}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => router.push('/dashboard/bookings')}>
            Back to Bookings
          </Button>
          {/* Retry picks up from paymentIdRef — skips step 1 if record already created */}
          <Button onClick={() => { setStep('initiate'); isLockedRef.current = false; }}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // ── Initiate state ──────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Amount summary */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Amount due
        </p>
        <p className="font-display text-3xl font-700 text-zinc-900 dark:text-white">
          {formatPrice(booking.totalPrice)}
        </p>
        {booking.car && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {booking.car.brand} {booking.car.name}
          </p>
        )}
      </div>

      {/* Payment method */}
      <Select
        label="Payment Method"
        value={provider}
        onChange={(e) => setProvider(e.target.value as PaymentProvider)}
        options={[
          { value: PaymentProvider.MANUAL, label: '💳 Card (Manual)' },
          { value: PaymentProvider.STRIPE, label: '🔵 Stripe' },
          { value: PaymentProvider.PAYPAL, label: '🟡 PayPal' },
        ]}
      />

      {/* Demo card form */}
      <div className="space-y-3 rounded-2xl border border-zinc-200 p-5 dark:border-zinc-700">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <CreditCard size={16} />
          Card Details (Demo)
        </div>
        <input
          type="text"
          readOnly
          defaultValue="4242 4242 4242 4242"
          className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            readOnly
            defaultValue="12/28"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
          />
          <input
            type="text"
            readOnly
            defaultValue="123"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          size="lg"
          className="w-full"
          onClick={() => handlePay(false)}
          disabled={isLockedRef.current}
        >
          Pay {formatPrice(booking.totalPrice)}
        </Button>
        {process.env.NODE_ENV === 'development' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handlePay(true)}
            className="w-full text-xs text-zinc-400"
          >
            🧪 Simulate Failure (dev only)
          </Button>
        )}
      </div>

      <p className="text-center text-xs text-zinc-400">
        By paying you agree to the{' '}
        <span className="underline underline-offset-2">Terms of Service</span>.
        This is a demo — no real charges will be made.
      </p>
    </div>
  );
}
