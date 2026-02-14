const { onRequest } = require("firebase-functions/v2/https");
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Cashfree } = require('cashfree-pg');

const app = express();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));
app.use(express.json());

// CONFIGURATION - Load from environment variables
const APP_ID = process.env.CASHFREE_APP_ID;
const SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const ENVIRONMENT = process.env.CASHFREE_ENV || 'SANDBOX';

// Initialize Cashfree
Cashfree.XClientId = APP_ID;
Cashfree.XClientSecret = SECRET_KEY;
Cashfree.Environment = ENVIRONMENT === 'PRODUCTION'
    ? Cashfree.Environment.PRODUCTION
    : Cashfree.Environment.SANDBOX;

console.log(`Initializing Cashfree in ${ENVIRONMENT} mode`);
console.log("Cashfree Config Check:", { appIdPresent: !!APP_ID, secretPresent: !!SECRET_KEY });

// 1. Create Order API
app.post('/api/create-cashfree-order', async (req, res) => {
    try {
        const { amount, customer_id, customer_phone, customer_name, customer_email } = req.body;

        if (!APP_ID || !SECRET_KEY) {
            console.error("Cashfree Creds Missing");
            return res.status(500).json({ error: "Server misconfigured: Missing Payment Credentials" });
        }

        if (!amount || isNaN(amount)) {
            return res.status(400).json({ error: "Invalid amount provided" });
        }

        const orderId = `ORDER_${Date.now()}`;
        const returnUrlBase = req.body.return_url || `${req.protocol}://${req.get('host')}`;
        // Robust check for existing query params
        const separator = returnUrlBase.includes('?') ? '&' : '?';
        const returnUrl = `${returnUrlBase}${separator}order_id=${orderId}`;

        const request = {
            order_amount: Number(amount),
            order_currency: 'INR',
            order_id: orderId,
            customer_details: {
                customer_id: customer_id || 'guest_' + Date.now(),
                customer_phone: customer_phone || '9999999999',
                customer_name: customer_name || 'Guest User',
                customer_email: customer_email || 'guest@nexride.co.in'
            },
            order_meta: {
                return_url: returnUrl
            },
            order_note: "NexRide Ticket Booking"
        };

        console.log("Creating Cashfree order:", { orderId, amount: request.order_amount });
        const response = await Cashfree.PGCreateOrder("2023-08-01", request);
        console.log("Order Created:", response.data);
        res.json(response.data);

    } catch (error) {
        console.error("Error creating order:", error.response?.data?.message || error.message);
        if (error.response?.data) {
            console.error("Cashfree API Validation Error:", JSON.stringify(error.response.data));
        }
        res.status(500).json({ error: error.response?.data?.message || error.message });
    }
});

// 2. Verify Payment API
app.get('/api/verify-payment/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;

        console.log("Verifying payment for order:", orderId);
        const response = await Cashfree.PGOrderFetchPayments("2023-08-01", orderId);
        console.log("Payment Verification:", response.data);

        // Check if any payment is SUCCESS
        const successfulPayment = Array.isArray(response.data)
            ? response.data.find(payment => payment.payment_status === 'SUCCESS')
            : null;

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
        if (error.response?.data) {
            console.error("Cashfree API Verification Error:", JSON.stringify(error.response.data));
        }
        res.status(500).json({ error: error.response?.data?.message || error.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'NexRide API is running', mode: ENVIRONMENT });
});

// Export as V2 Function
exports.nexrideApi = onRequest({
    serviceAccount: "nexridein@appspot.gserviceaccount.com",
    cors: true,
    region: "us-central1"
}, app);
