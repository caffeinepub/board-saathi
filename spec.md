# Specification

## Summary
**Goal:** Upgrade the parent–student live chat in Board Saathi with real-time messaging features, replacing the localStorage-based system with an ICP Motoko backend and a polled React frontend.

**Planned changes:**
- Add Motoko stable state for messages (senderId, senderRole, messageText, timestamp, read flag) with `sendMessage`, `getMessages`, and `markMessagesRead` update/query functions.
- Add Motoko stable state for presence (`lastSeen`, `isOnline`) with `updatePresence` and `getPresence` functions, and typing state with `setTyping` and `getTypingStatus`.
- Replace localStorage chat in `ParentDashboard.tsx` and `StudentMessagesPage.tsx` with React Query polling (1-second interval) against the Motoko backend for real-time message delivery.
- Display online/offline presence in the chat header: green dot + "Online" if active within 60 seconds, grey dot + "Last seen HH:MM" otherwise; update presence every 30 seconds.
- Show a "User is typing…" animated ellipsis indicator when the remote party is typing, cleared after 3 seconds of inactivity.
- Display a formatted timestamp (HH:MM AM/PM) under each bubble, date separators between day groups, and auto-scroll to the latest message.
- Redesign chat UI with modern bubbles (outgoing right/primary colour, incoming left/neutral), avatar initials, pinned input bar, fully mobile responsive layout.
- Show in-app toast notifications for new messages when the chat panel is not focused; fire browser push notifications when `document.visibilityState` is hidden.
- Add network error handling: "Connection lost – retrying…" banner, automatic retry with exponential backoff (up to 3 times), and a manual Retry button on persistent failure.
- Update the unread message badge in `Layout.tsx` to use the backend unread count instead of localStorage.

**User-visible outcome:** Parents and students experience a modern, near-real-time chat with typing indicators, presence status, timestamped and date-grouped messages, push/toast notifications for new messages, and reliable error recovery — all backed by the ICP Motoko canister.
