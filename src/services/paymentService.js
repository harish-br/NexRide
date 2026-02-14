import { load } from '@cashfreepayments/cashfree-js';

class PaymentService {
    constructor() {
        this.cashfree = null;
        this.initPromise = this.initialize();
    }

    async initialize() {
        try {
            this.cashfree = await load({
                mode: "sandbox" // TEST mode
            });
            console.log("[PaymentService] Cashfree SDK loaded in SANDBOX mode");
            return this.cashfree;
        } catch (error) {
            console.error("[PaymentService] Failed to load Cashfree SDK:", error);
            throw error;
        }
    }

    async createOrder(amount) {
        try {
            console.log("[PaymentService] Creating order for amount:", amount);

            if (!amount || isNaN(amount)) {
                throw new Error("Invalid amount provided");
            }

            const response = await fetch('/api/create-cashfree-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: Number(amount),
                    customer_id: 'guest_' + Date.now(),
                    customer_phone: '9999999999',
                    customer_name: 'Guest User',
                    customer_email: 'guest@nexride.co.in',
                    return_url: window.location.origin + window.location.pathname
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error("[PaymentService] Server Error:", errText);
                throw new Error(`Payment initialization failed: ${errText}`);
            }

            const data = await response.json();
            console.log("[PaymentService] Order created:", data);

            if (!data.payment_session_id) {
                throw new Error("No payment session ID received");
            }

            return data.payment_session_id;
        } catch (error) {
            console.error("[PaymentService] Create order failed:", error);
            throw error;
        }
    }

    async doPayment(sessionId) {
        try {
            await this.initPromise; // Ensure SDK is loaded

            if (!this.cashfree) {
                throw new Error("Cashfree SDK not initialized");
            }

            console.log("[PaymentService] Initiating Cashfree checkout:", sessionId);

            await this.cashfree.checkout({
                paymentSessionId: sessionId,
                redirectTarget: "_self" // Redirect in same window
            });

            console.log("[PaymentService] Checkout initiated, redirecting...");
        } catch (error) {
            console.error("[PaymentService] Payment failed:", error);
            throw error;
        }
    }

    async verifyPayment(orderId) {
        try {
            console.log("[PaymentService] Verifying payment for order:", orderId);

            const response = await fetch(`/api/verify-payment/${orderId}`);

            if (!response.ok) {
                throw new Error("Payment verification failed");
            }

            const data = await response.json();
            console.log("[PaymentService] Verification result:", data);

            return data;
        } catch (error) {
            console.error("[PaymentService] Verification failed:", error);
            throw error;
        }
    }
}

export default new PaymentService();
