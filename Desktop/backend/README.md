# AI-Powered Career Mentor Backend

This is the backend for an AI-powered career mentor application. It is built with Node.js, Express, and MongoDB.

## Features

- User authentication with JWT
- AI-powered conversation with Gemini
- Twilio integration for voice calls
- Persistent conversation and call logs

## Prerequisites

- Node.js
- MongoDB
- Twilio account
- Gemini API key

## Getting Started

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the root directory and add the following:
    ```
    API_KEY=<Your Gemini API Key>
    TWILIO_ACCOUNT_SID=<Your Twilio Account SID>
    TWILIO_AUTH_TOKEN=<Your Twilio Auth Token>
    TWILIO_PHONE_NUMBER=<Your Twilio Phone Number>
    JWT_SECRET=<Your JWT Secret>
    MONGODB_URI=<Your MongoDB URI>
    PORT=3000
    BASE_URL=http://localhost:3000
    ```
4.  Start the server:
    ```bash
    npm start
    ```

## API Endpoints

### Authentication

-   `POST /api/signup`
-   `POST /api/login`
-   `GET /api/me`
-   `POST /api/logout`

### AI

-   `POST /api/generate-question`
-   `POST /api/generate-roadmaps`

### Twilio

-   `POST /api/start-call`
-   `POST /api/voice`
-   `POST /api/respond`

## Docker

To run the application in a Docker container, first build the image:

```bash
docker build -t career-mentor-backend .
```

Then, run the container:

```bash
docker run -p 3000:3000 -d career-mentor-backend
```
