const express = require('express');
const { google } = require('googleapis');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

dotenv.config(); // Load environment variables from .env

const app = express();
const port = 8000;

// OAuth 2 configuration
const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
);

// Initialize the Google Calendar API
const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

app.get('/', (req, res) => {
    res.send('Hello World');
});

// Define the scope of access for the Google Calendar API.
const scopes = ['https://www.googleapis.com/auth/calendar'];

app.get('/auth', (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',  // Ensures a refresh token is returned
        scope: scopes,
    });
    res.redirect(url);
});

app.get('/auth/redirect', async (req, res) => {
    try {
        const { tokens } = await oauth2Client.getToken(req.query.code);
        oauth2Client.setCredentials(tokens);

        // Store the tokens securely for future use
        console.log('Tokens received:', tokens);

        res.send('Authentication successful! You can now create events.');
    } catch (error) {
        console.error('Error retrieving tokens:', error);
        res.status(500).send('Authentication failed');
    }
});

const event = {
    summary: 'Test User',
    location: 'Google Meet',
    description: 'Demo event.',
    start: {
        dateTime: '2024-08-16T20:55:00+05:30',
        timeZone: 'Asia/Kolkata',
    },
    end: {
        dateTime: '2024-08-16T21:55:00+05:30',
        timeZone: 'Asia/Kolkata',
    },
    colorId: 1,
    conferenceData: {
        createRequest: {
            requestId: uuidv4(),
        },
    },
    attendees: [
        { email: 'test@gmail.com' },
    ],
};

app.get('/create-event', async (req, res) => {
    try {
        // Ensure that the OAuth2 client has the necessary credentials
        if (!oauth2Client.credentials || !oauth2Client.credentials.access_token) {
            return res.status(401).send('Not authenticated. Please authenticate first.');
        }

        const result = await calendar.events.insert({
            calendarId: 'primary',
            conferenceDataVersion: 1,
            sendUpdates: 'all',
            resource: event,
        });

        res.send({
            status: 200,
            message: 'Event created',
            link: result.data.hangoutLink,
        });
    } catch (err) {
        console.error('Error creating event:', err);
        res.status(500).send('Error creating event');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
