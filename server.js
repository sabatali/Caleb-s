const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', './views');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/form', (req, res) => {
    res.render('form');
});

app.get('/result', (req, res) => {
    res.render('result', { result: null });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.get('/api/hello', (req, res) => {
    res.json({
        message: 'Hello from the API!',
        data: {
            name: 'Node.js App',
            version: '1.0.0'
        }
    });
});

// Webhook endpoint for n8n integration
app.post('/webhook', async (req, res) => {
    try {


        const { prompt, linkedUrl, model } = req.body;

        // Validate required fields
        if (!prompt || !linkedUrl || !model) {
            return res.status(400).json({
                error: 'prompt, linkedUrl, and model are required',
                received: { prompt, linkedUrl, model }
            });
        }

        console.log('📥 Received webhook data:', { prompt, linkedUrl, model });

        // Clear previous results when new request comes in
        latestResult = null;

        // Prepare data for n8n webhook
        const webhookData = {
            prompt: prompt,
            linkedUrl: linkedUrl,
            model: model,
            timestamp: new Date().toISOString(),
            source: 'nodejs-webhook'
        };
        console.log("🚀 ~ webhookData:", webhookData)

        // Forward to n8n webhook
        // const n8nWebhookUrl = 'https://blueequinox.app.n8n.cloud/webhook-test/test';  Test
        const n8nWebhookUrl = 'https://blueequinox.app.n8n.cloud/webhook/test';     // production

        console.log('🔄 Forwarding to n8n webhook:', n8nWebhookUrl);
        console.log('📤 Sending data:', JSON.stringify(webhookData, null, 2));

        const response = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'NodeJS-Webhook-Client/1.0'
            },
            body: JSON.stringify(webhookData)
        });

        const responseData = await response.text();

        console.log('✅ n8n Webhook Response Status:', response.status);
        console.log('📤 n8n Webhook Response:', responseData);

        // Log response headers for debugging
        console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));

        // Send response back to client
        res.json({
            success: true,
            message: 'Data forwarded to n8n webhook successfully',
            n8nResponse: {
                status: response.status,
                data: responseData
            },
            originalData: webhookData
        });

    } catch (error) {
        console.error('❌ Webhook Error:', error);
        res.status(500).json({
            error: 'Failed to process webhook',
            message: error.message
        });
    }
});

// POST route example
app.post('/api/data', (req, res) => {
    const { name, message } = req.body;

    if (!name || !message) {
        return res.status(400).json({
            error: 'Name and message are required'
        });
    }

    res.json({
        success: true,
        received: {
            name,
            message,
            timestamp: new Date().toISOString()
        }
    });
});

// Store the latest result globally (in production, use a database)
let latestResult = null;

app.post("/n8n-result", (req, res) => {
    const timestamp = new Date().toISOString();
    console.log(`✅ Got result from n8n [${timestamp}] ======================== ============================`)
    console.log("✅ Got result from n8n =======================:", req.body);
    console.log("✅ Got result from n8n ======================== ============================")

    // Only store non-empty results
    if (req.body && Object.keys(req.body).length > 0) {
        console.log("📝 Storing result (non-empty)");
        latestResult = req.body;
    } else {
        console.log("⚠️ Ignoring empty result");
    }

    // You can store result in DB, notify frontend, etc.
    res.json({ received: true });
});

app.get('/latest-result', (req, res) => {
    console.log('📤 Serving latest result:', latestResult ? 'Found result' : 'No result stored');
    res.json({
        hasResult: latestResult !== null,
        result: latestResult,
        timestamp: new Date().toISOString()
    });
});


// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        availableRoutes: [
            'GET /',
            'GET /health',
            'GET /api/hello',
            'POST /api/data',
            'POST /webhook'
        ]
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📊 Health check available at http://localhost:${PORT}/health`);
    console.log(`🔧 API endpoint available at http://localhost:${PORT}/api/hello`);
    console.log(`🔗 Webhook endpoint available at http://localhost:${PORT}/webhook`);
});
