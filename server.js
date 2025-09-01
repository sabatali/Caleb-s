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
    res.render('form');
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
        // const { prompt, linkedUrl } = req.body;

        // Validate required fields
        // if (!prompt || !linkedUrl) {
        //     return res.status(400).json({
        //         error: 'Both prompt and linkedUrl are required',
        //         received: { prompt, linkedUrl }
        //     });
        // }

        const prompt = `
You are an outbound growth consultant for Blue Equinox. Your task is to generate a full 9-email sequence plus a LinkedIn message that combines a sophisticated, value-driven cadence with deep, human-sounding personalization.
Guardrails
DO NOT ask for permission to send a link (provide links directly).


DO NOT use cliché sales phrases ("touching base," "just checking in").


DO NOT use overly formal or apologetic language. Tone should be confident and peer-to-peer.


Each email must have a single clear CTA.


Every new thread (Email 1, Email 4, Email 7) must open with a personalized observation using provided prospect/company/context data.


Core Offers & Assets
Primary Offer: "No-Cost Engine" (IPA model) for a 9-person growth team.


4-Pillar System: People, Tools, Services, White-Labeling.


Assets:


Whitepaper (IPA financing model)


E-Book ("MSP Growth Playbook")


Blog: "Why Most MSP Marketing Falls Short"


Blog: "MSP Sales Best Practices"


Proof Points: EBITDA case study, partner ecosystem (Coro, Actifile, etc.).


Structure
Part 1: Thread 1 (Emails 1–3)
Personalized hook + IPA Whitepaper (50–70 words)


Pipeline outcome benefit (60–90 words)


Financial proof via EBITDA case study (70–100 words)


Part 2: Thread 2 (Emails 4–6)
 4. Personalized hook + Deep Dive (Pillars 1 & 2) + E-Book (100–130 words)
 5. Deep Dive (Pillars 3 & 4) (90–120 words)
 6. Ecosystem & credibility (80–110 words)
Part 3: Standalone (Emails 7–9)
 7. Personalized marketing angle + Marketing Blog (50–70 words)
 8. Personalized sales angle + Sales Blog (50–70 words)
 9. Recap all resources + gentle close (70–100 words)
LinkedIn Message:
 One short, conversational LinkedIn note that references the prospect’s post or role, introduces the “No-Cost Engine,” and drops one direct resource link.
Output Requirement
Return results in the following JSON structure (fill in fields with generated text):
{
  "emails": [
    { "id": 1, "subject": "", "body": "" },
    { "id": 2, "subject": "", "body": "" },
    { "id": 3, "subject": "", "body": "" },
    { "id": 4, "subject": "", "body": "" },
    { "id": 5, "subject": "", "body": "" },
    { "id": 6, "subject": "", "body": "" },
    { "id": 7, "subject": "", "body": "" },
    { "id": 8, "subject": "", "body": "" },
    { "id": 9, "subject": "", "body": "" }
  ],
  "linkedin_message": {
    "body": ""
  }
}
        `;
        const linkedUrl = "linkedin.com/in/nimracontentdesigner/"

        console.log('📥 Received webhook data:', { prompt, linkedUrl });

        // Prepare data for n8n webhook
        const webhookData = {
            prompt: prompt,
            linkedUrl: linkedUrl,
            timestamp: new Date().toISOString(),
            source: 'nodejs-webhook'
        };
        console.log("🚀 ~ webhookData:", webhookData)

        // Forward to n8n webhook
        const n8nWebhookUrl = 'https://blueequinox.app.n8n.cloud/webhook-test/test';

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
    console.log("✅ Got result from n8n ======================== ============================")
    console.log("✅ Got result from n8n =======================:", req.body);
    console.log("✅ Got result from n8n ======================== ============================")

    // Store the result
    latestResult = req.body;

    // You can store result in DB, notify frontend, etc.
    res.json({ received: true });
});

app.get('/latest-result', (req, res) => {
    res.json(latestResult);
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
