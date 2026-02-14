import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Cashfree } from 'cashfree-pg';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(fileURLToPath(import.meta.url), '../../.env') });

const app = express();
const PORT = 3000; // Using 3000 as backend, Vite usually on 5173

app.use(cors());
app.use(express.json());

// Initialize Cashfree
Cashfree.XClientId = process.env.CASHFREE_APP_ID;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
Cashfree.Environment = Cashfree.Environment.SANDBOX; // Default to Sandbox/Test

if (process.env.CASHFREE_ENV === 'PRODUCTION') {
    Cashfree.Environment = Cashfree.Environment.PRODUCTION;
}

console.log(`Initializing Cashfree in ${Cashfree.Environment === Cashfree.Environment.PRODUCTION ? 'PRODUCTION' : 'SANDBOX'} mode`);

// 1. Create Order API
app.post('/api/create-cashfree-order', async (req, res) => {
    try {
        const { amount, customer_id, customer_phone, customer_name, customer_email } = req.body;

        const orderId = `ORDER_${Date.now()}`;

        const request = {
            order_amount: amount,
            order_currency: 'INR',
            order_id: orderId,
            customer_details: {
                customer_id: customer_id || 'USER_123',
                customer_phone: customer_phone || '9999999999',
                customer_name: customer_name || 'Guest User',
                customer_email: customer_email || 'guest@example.com'
            },
            order_meta: {
                return_url: `http://localhost:5173/payment-status?order_id=${orderId}`
                // Note: Frontend should handle this return_url route or parameter
            },
            order_note: "NexRide Ticket Booking"
        };

        const response = await Cashfree.PGCreateOrder("2023-08-01", request);

        console.log("Order Created:", response.data);
        res.json(response.data);

    } catch (error) {
        console.error("Error creating order:", error.response?.data?.message || error.message);
        res.status(500).json({ error: error.response?.data?.message || error.message });
    }
});

// 2. Verify Payment API
app.get('/api/verify-payment/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const response = await Cashfree.PGOrderFetchPayments("2023-08-01", orderId);

        console.log("Payment Verification:", response.data);
        // Logic to check if any payment is SUCCESS
        const successfulPayment = response.data.find(payment => payment.payment_status === 'SUCCESS');

        if (successfulPayment) {
            res.json({ status: 'SUCCESS', payment: successfulPayment });
        } else {
            // Check order status as fallback
            const orderResponse = await Cashfree.PGOrderFetchDetails("2023-08-01", orderId);
            if (orderResponse.data.order_status === 'PAID') {
                res.json({ status: 'SUCCESS', order: orderResponse.data });
            } else {
                res.json({ status: 'PENDING_OR_FAILED', data: response.data });
            }
        }

    } catch (error) {
        console.error("Error verifying payment:", error.response?.data?.message || error.message);
        res.status(500).json({ error: error.response?.data?.message || error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
