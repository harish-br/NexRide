const { onRequest } = require("firebase-functions/v2/https");
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Cashfree } = require('cashfree-pg');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

const app = express();

// Enable CORS and JSON parsing
app.use(cors({ origin: true }));
app.use(express.json());

// CONFIGURATION
const APP_ID = process.env.CASHFREE_APP_ID;
const SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const ENVIRONMENT = process.env.CASHFREE_ENV || 'SANDBOX';

// Initialize Cashfree SDK
Cashfree.XClientId = APP_ID;
Cashfree.XClientSecret = SECRET_KEY;

// Auto-detect environment from key type
const isProdKey = SECRET_KEY && SECRET_KEY.startsWith('cfsk_ma_prod');
const FINAL_ENV = (ENVIRONMENT.toUpperCase() === 'PRODUCTION' || isProdKey) ? 'PRODUCTION' : 'SANDBOX';

Cashfree.Environment = FINAL_ENV === 'PRODUCTION'
    ? Cashfree.Environment.PRODUCTION
    : Cashfree.Environment.SANDBOX;

console.log(`[Backend] Cashfree initialized in ${FINAL_ENV} mode (Key: ${isProdKey ? 'PROD' : 'TEST'})`);

// Middleware to log requests
app.use((req, res, next) => {
    console.log(`[Backend] Request: ${req.method} ${req.url}`);
    next();
});

/**
 * 1. Create Order API
 */
const createOrderHandler = async (req, res) => {
    try {
        const { amount, customer_id, customer_phone, customer_name, customer_email } = req.body;

        if (!APP_ID || !SECRET_KEY) {
            return res.status(500).json({ error: "Missing Cashfree Credentials in backend" });
        }

        const orderId = "order_" + Date.now();
        
        // Construct return URL
        const returnUrl = req.body.return_url || "https://nexridein.web.app";
        const separator = returnUrl.includes('?') ? '&' : '?';

        const request = {
            order_id: orderId,
            order_amount: Number(amount),
            order_currency: "INR",
            customer_details: {
                customer_id: customer_id || "user_" + Date.now(),
                customer_phone: customer_phone || "9999999999",
                customer_name: customer_name || "Guest User",
                customer_email: customer_email || "guest@nexride.co.in"
            },
            order_meta: {
                return_url: `${returnUrl}${separator}order_id=${orderId}`
            },
            order_note: "NexRide Ticket Booking"
        };

        console.log(`[Backend] Creating order: ${orderId} for amount: ${amount}`);
        
        const response = await Cashfree.PGCreateOrder("2023-08-01", request);
        
        res.json({
            order_id: orderId,
            payment_session_id: response.data.payment_session_id
        });

    } catch (error) {
        const errMsg = error.response?.data?.message || error.message;
        console.error("[Backend] Order creation failed:", errMsg);
        res.status(500).json({ error: "Order creation failed", message: errMsg });
    }
};

app.post('/api/create-cashfree-order', createOrderHandler);
app.post('/create-cashfree-order', createOrderHandler); // Fallback

/**
 * 2. Verify Payment API
 */
const verifyPaymentHandler = async (req, res) => {
    try {
        const { orderId } = req.params;
        const response = await Cashfree.PGOrderFetchPayments("2023-08-01", orderId);
        
        const successfulPayment = Array.isArray(response.data)
            ? response.data.find(p => p.payment_status === 'SUCCESS')
            : null;

        if (successfulPayment) {
            res.json({ status: 'SUCCESS', payment: successfulPayment });
        } else {
            const orderDetails = await Cashfree.PGOrderFetchDetails("2023-08-01", orderId);
            if (orderDetails.data.order_status === 'PAID') {
                res.json({ status: 'SUCCESS', order: orderDetails.data });
            } else {
                res.json({ status: 'PENDING_OR_FAILED', data: response.data });
            }
        }
    } catch (error) {
        console.error("[Backend] Verification failed:", error.message);
        res.status(500).json({ error: "Verification failed", message: error.message });
    }
};

app.get('/api/verify-payment/:orderId', verifyPaymentHandler);
app.get('/verify-payment/:orderId', verifyPaymentHandler); // Fallback

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', environment: FINAL_ENV });
});

// Export the Express app as a Firebase Function
exports.nexrideApi = onRequest({
    memory: "256MiB",
    timeoutSeconds: 60,
    cors: true,
    region: "us-central1"
}, app);
