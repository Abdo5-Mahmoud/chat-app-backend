# GoingChats Backend

The Node.js API and Socket.IO server for GoingChats. It handles authentication, user profiles, chat discovery, message persistence, online presence, and real-time delivery/read events.

## Stack

- Node.js with Express
- MongoDB and Mongoose
- Socket.IO
- JWT authentication
- Joi validation
- Cloudinary/Multer uploads and Nodemailer email delivery

## Requirements

- Node.js 18 or newer
- MongoDB connection string
- SMTP, Cloudinary, and Google OAuth credentials when using those features

## Setup

```bash
npm install
```

The server loads `src/config/.env.dev`. Create that file locally with values appropriate for your environment:

```env
PORT_NUMBER=5000
MONGO_URI=mongodb://127.0.0.1:27017/goingchats
USER_ACCESS_TOKEN=replace-with-a-long-secret
USER_REFRESH_TOKEN=replace-with-a-long-secret
ADMIN_ACCESS_TOKEN=replace-with-a-long-secret
ADMIN_REFRESH_TOKEN=replace-with-a-long-secret
SALT_ROUNDS=10
MOOD=DEV
WEB_CLIENT_ID=your-google-oauth-client-id
EMAIL_USER=your-smtp-user
EMAIL_PASSWORD=your-smtp-password
CLOUD_NAME=your-cloudinary-cloud-name
CLOUD_API_KEY=your-cloudinary-api-key
CLOUD_API_SECRET=your-cloudinary-api-secret
```

Never commit real secrets. Configure the frontend `VITE_BASE_URL` to this server's URL, for example `http://localhost:5000`.

## Scripts

```bash
npm run dev    # start with Node watch mode
npm start      # start normally
```

## HTTP routes

All protected routes require an authorization token.

| Route | Purpose |
| --- | --- |
| `/auth` | signup, email confirmation, OTP resend, password login, Google login |
| `/user` | profile, users, friendship actions, profile image upload |
| `/chat` | list conversations and chat operations |
| `/messages/:roomId` | retrieve messages for a conversation |
| `/room` | group/room functionality |

## Socket events

| Client event | Server behavior |
| --- | --- |
| `sendMessage` | validates input, creates/finds the conversation, saves the message, and acknowledges the result |
| `viewedMessages` | marks delivered messages in a chat as seen |

| Server event | Payload / behavior |
| --- | --- |
| `messageSent` | `{ chat, message }` for the sending client |
| `receiveMessage` | `{ chat, message }` for an online recipient |
| `messageError` | send failure with a message and status code |
| `messagesDelivered` | messages delivered after a user reconnects |
| `messagesSeen` | read status update for the sender |
| `getOnlineUsers`, `userOnline`, `userOffline` | presence updates |

## First-message behavior

When `sendMessage` has no room ID, the server creates or finds a one-to-one chat using a stable `conversationKey`. The operation uses an upsert and a duplicate-key retry to protect against simultaneous first messages. It then populates the participants before emitting the chat, allowing clients to render names and avatars immediately.

## Project layout

```text
src/
  DB/          database connection, models, and query helpers
  middleware/  authentication and validation middleware
  modules/     auth, user, chats, messages, rooms, and socket features
  utils/       security, responses, uploads, email, and pagination helpers
```
