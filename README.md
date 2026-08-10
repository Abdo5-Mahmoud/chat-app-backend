# GoingChats Backend

The GoingChats backend is an Express and Socket.IO service for authenticated one-to-one messaging. It exposes REST endpoints for account and profile operations, persists chat data in MongoDB, and uses Socket.IO for real-time delivery, read receipts, and presence.

## Contents

- [Architecture](#architecture)
- [Setup](#setup)
- [Features](#features)
- [HTTP API](#http-api)
- [Socket events](#socket-events)
- [Important scenarios](#important-scenarios)
- [Project layout](#project-layout)

## Architecture

```text
React client
  |  REST: signup, login, profiles, lists, message history
  v
Express routers -> middleware -> feature services -> Mongoose models -> MongoDB
  ^                                                   |
  |                 Socket.IO events                  |
  +---------------------------------------------------+
```

The application is organized by responsibility:

- **Routers** map HTTP paths to feature services.
- **Middleware** validates request data and authenticates JWTs.
- **Services** apply business rules, perform database operations, and build responses.
- **Models** define `User`, `Chat`, `Message`, and `Room` persistence.
- **Socket services** authenticate sockets, track online users, create messages, and update delivery/read state.
- **Utilities** provide JWT, hashing, email, upload, response, and database helper functionality.

## Stack

- Node.js with Express
- MongoDB with Mongoose
- Socket.IO
- JWT and bcrypt
- Joi validation
- Nodemailer for OTP email
- Cloudinary and Multer for profile images
- Google OAuth token verification

## Setup

Requirements: Node.js 18+, MongoDB, and credentials for any enabled SMTP, Cloudinary, or Google OAuth features.

```bash
cd Backend
npm install
npm run dev
```

The server loads `src/config/.env.dev`. Create it locally; never commit credentials.

```env
PORT_NUMBER=5000
MONGO_URI=mongodb://127.0.0.1:27017/goingchats
USER_ACCESS_TOKEN=long-user-access-secret
USER_REFRESH_TOKEN=long-user-refresh-secret
ADMIN_ACCESS_TOKEN=long-admin-access-secret
ADMIN_REFRESH_TOKEN=long-admin-refresh-secret
SALT_ROUNDS=10
MOOD=DEV
WEB_CLIENT_ID=google-oauth-client-id
EMAIL_USER=smtp-user
EMAIL_PASSWORD=smtp-password
CLOUD_NAME=cloudinary-name
CLOUD_API_KEY=cloudinary-key
CLOUD_API_SECRET=cloudinary-secret
```

Scripts:

```bash
npm run dev  # Node watch mode
npm start    # normal server start
```

## Features

### Account registration and OTP confirmation

`POST /auth/signup` validates registration data, hashes the password, creates an unconfirmed system account, then sends a four-digit confirmation OTP.
`PATCH /auth/confirmEmail` validates the OTP and confirms the account. OTPs expire after five minutes, invalid attempts are limited to five then you wait for 5 minutes for next attempts.
`POST /auth/resendOtp` issues a new code.

### Password and Google login

`POST /auth/login` verifies a confirmed system account and returns a signed access token.
`POST /auth/loginWithGmail` verifies the Google credential against `WEB_CLIENT_ID`, creates a Google user on first sign-in, or returns a token for the existing Google user. A system account cannot silently sign in through Google using the same email.

### Authentication and logout

Protected REST calls use `authorization: BEARER <token>`; the scheme is case-normalized.
`POST /auth/logout` records a credential-change timestamp, invalidating access tokens issued before it.
Socket connections supply `Bearer <token>` in the Socket.IO auth payload and are disconnected when authentication fails.

### Users, profiles, friendships, and blocking

Authenticated users can view their profile, discover confirmed users, view profiles, manage friend requests, block users, and upload a profile image. User discovery excludes people blocked in either direction. Messaging also rejects blocked relationships.

### Chats and messages

Chats store two participants and a stable sorted `conversationKey`. The first message atomically finds or creates the chat; later messages validate both participants and the room ID. Messages require a room, sender, receiver, and text. Message history is returned only to chat participants.

### Rooms

The backend contains create, list, get, and owner-delete room APIs. The present frontend does not expose the group-room interface, so this remains an API capability.

## HTTP API

All routes except signup, confirmation, resend OTP, and login require a valid JWT.

| Method       | Path                            | Description                                         |
| ------------ | ------------------------------- | --------------------------------------------------- |
| POST         | `/auth/signup`                  | Create a system account and send confirmation OTP   |
| PATCH        | `/auth/confirmEmail`            | Confirm email with OTP                              |
| POST         | `/auth/resendOtp`               | Send a fresh confirmation OTP                       |
| POST         | `/auth/login`                   | Password login                                      |
| POST         | `/auth/loginWithGmail`          | Google credential login                             |
| POST         | `/auth/logout`                  | Invalidate active access tokens                     |
| GET          | `/user/profile`                 | Current user profile                                |
| GET          | `/user/getAllUsers`             | Discover available users                            |
| GET          | `/user/:userId`                 | View an allowed user profile                        |
| PATCH        | `/user/addFriend/:friendId`     | Send/accept a friend request                        |
| PATCH        | `/user/acceptRequest/:friendId` | Accept a request                                    |
| PATCH        | `/user/removeFriend/:friendId`  | Remove friendship                                   |
| PATCH        | `/user/blockUser/:friendId`     | Block a user                                        |
| PATCH        | `/user/updateImage`             | Upload a profile image                              |
| GET          | `/chat/allChats`                | List the current user's chats                       |
| GET          | `/chat/:id`                     | Retrieve an existing chat with a participant        |
| DELETE       | `/chat/:friendId`               | Delete a chat and its messages                      |
| GET          | `/messages/:roomId`             | Retrieve the latest messages for an authorized chat |
| POST         | `/room`                         | Create a room                                       |
| GET          | `/room/all`                     | List rooms                                          |
| GET / DELETE | `/room/:roomId`                 | Read or delete a room                               |

## Socket events

### Connection scenario

1. Client connects with `auth.authorization = "Bearer <token>"`.
2. Server validates the token and user; invalid sockets receive `connectError` then disconnect.
3. A valid client receives `getOnlineUsers`; other clients receive `userOnline`.
4. Previously sent offline messages are marked delivered and their senders receive `messagesDelivered`.

### Client-to-server events

| Event            | Payload                            | Server result                                                                                        |
| ---------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `sendMessage`    | `{ message, roomId?, receiverId }` | Validates users/blocking/chat, persists data, emits results, and calls the acknowledgement callback. |
| `viewedMessages` | `{ roomId }`                       | Marks delivered messages in that room as seen.                                                       |

### Server-to-client events

| Event                        | Payload                       | Scenario                                                                           |
| ---------------------------- | ----------------------------- | ---------------------------------------------------------------------------------- |
| `messageSent`                | `{ chat, message }`           | Sent to the sender after a successful save.                                        |
| `receiveMessage`             | `{ chat, message }`           | Sent to an online recipient.                                                       |
| `messageError`               | `{ message, statusCode }`     | Sent when a message request fails validation or persistence.                       |
| `messagesDelivered`          | `{ messages }`                | Sender is notified when offline messages are delivered after recipient reconnects. |
| `messagesSeen`               | `{ message: "Seen", roomId }` | Sender is notified when recipient reads delivered messages.                        |
| `getOnlineUsers`             | `string[]`                    | Initial online-user snapshot.                                                      |
| `userOnline` / `userOffline` | `{ userId }`                  | Presence change.                                                                   |
| `connectError`               | `{ message }`                 | Socket authentication failure before disconnect.                                   |

## Important scenarios

### First message to a person with no chat

The client sends `sendMessage` without `roomId`. The server creates or upserts the chat using `conversationKey`, saves the message, populates the participants, then returns the same `{ chat, message }` contract to both sides. This lets the sender replace its temporary draft chat and lets the receiver add the conversation to the sidebar.

### Recipient offline

The message is stored with `sent` status. On the recipient's next authenticated socket connection, the server marks it delivered and notifies the sender with `messagesDelivered`.

### Recipient reads a message

The client emits `viewedMessages`. The server changes delivered messages in that room to `seen` and notifies the other participant with `messagesSeen`.

### Invalid/unauthorized action

Invalid OTPs, blocked messages, invalid recipients, unauthorized rooms, and invalid sockets are rejected with an error response/event. Message sending also returns `{ ok: false, error }` through its acknowledgement callback.

## Project layout

```text
src/
  app.controller.js       Express bootstrap and router registration
  DB/                     connection, models, and database helpers
  middleware/             JWT authentication and Joi validation
  modules/
    auth/                 signup, OTP, password and Google login, logout
    user/                 profiles, friends, blocking, image upload
    chats/                chat list, lookup, and deletion
    messages/             authorized message history
    room/                 room APIs
    socket/               Socket.IO authentication, events, and message state
  utils/                  email, security, uploads, response helpers
```

## Operational notes

- CORS is currently permissive for development. Restrict allowed origins in production.
- The current online-user map stores one socket ID per user. Use a set of socket IDs when multi-device delivery is required.
- Run the frontend against this server by setting `VITE_BASE_URL` to the backend URL.
