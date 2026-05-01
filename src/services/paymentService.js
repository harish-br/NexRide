import { load } from '@cashfreepayments/cashfree-js';

// Configuration (App ID is safe to expose, Secret is strictly on the backend)
const CASHFREE_APP_ID = '896041d8f54dee23374b874529140698';
const CASHFREE_ENV    = 'sandbox'; // Set to 'production' for live payments

class PaymentService {
    constructor() {
        this.cashfree = null;
        this.initPromise = this.initialize();
    }

    async initialize() {
        try {
            this.cashfree = await load({ mode: CASHFREE_ENV });
            console.log(`[PaymentService] Cashfree SDK loaded in ${CASHFREE_ENV.toUpperCase()} mode`);
            return this.cashfree;
        } catch (error) {
            console.error('[PaymentService] Failed to load Cashfree SDK:', error);
            throw error;
        }
    }

    /**
     * Creates a Cashfree order by calling our SECURE Firebase Function backend.
     * This ensures the Secret Key is never exposed to the client.
     */
    async createOrder(amount) {
        if (!amount || isNaN(amount)) throw new Error('Invalid amount provided');

        console.log('[PaymentService] Requesting payment session from backend...');

        const response = await fetch('/api/create-cashfree-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: Number(amount),
                customer_id: 'guest_' + Date.now(),
                customer_phone: '9999999999',
                customer_name: 'NexRide Guest',
                customer_email: 'guest@nexride.co.in',
                return_url: window.location.origin + window.location.pathname
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Unknown server error' }));
            console.error('[PaymentService] Backend error:', err);
            throw new Error(err.error || `Order creation failed (${response.status})`);
        }

        const data = await response.json();
        console.log('[PaymentService] Order session received:', data);

        if (!data.payment_session_id) {
            throw new Error('No payment_session_id in backend response');
        }

        return data.payment_session_id;
    }

    async doPayment(sessionId) {
        await this.initPromise;

        if (!this.cashfree) throw new Error('Cashfree SDK not initialized');

        console.log('[PaymentService] Initiating secure checkout...');

        await this.cashfree.checkout({
            paymentSessionId: sessionId,
            redirectTarget: '_self'
        });
    }

    /**
     * Verifies payment status via the SECURE backend.
     */
    async verifyPayment(orderId) {
        console.log(`[PaymentService] Verifying payment for order: ${orderId}`);
        
        const response = await fetch(`/api/verify-payment/${orderId}`);

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || 'Payment verification failed');
        }

        const data = await response.json();
        console.log('[PaymentService] Verification result:', data);
        return data;
    }
}

export default new PaymentService();
