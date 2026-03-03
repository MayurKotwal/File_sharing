# Code review: P2P file + text sharing (qtext.io-style)

## Current behavior (no backend file storage)

- **Server:** Only creates rooms (4-letter code + token), validates join (roomId + token), and relays WebRTC signaling (offer/answer/ice). No file storage.
- **Client:** Create room → get code + token; join with code + token → same room. First peer = offerer (creates data channel), second = answerer. Text and files go over one WebRTC data channel; files are sent as base64 in JSON.

So **yes, file sharing without storing on the backend is already how it works** — only the connection is mediated; data is P2P.

---

## What you have vs what you want

| Goal | Status |
|------|--------|
| Token-based (like qtext.io) | Done: create gives code + token; join needs both. |
| 4-digit code | Currently 4-letter (A–Z). For 4 digits, change `generateRoomCode()` to use `'0123456789'` and 4 chars. |
| 1 sender, others enter code to receive files | Done for 2 users. For 3+ users see below. |
| No backend file storage | Done. |

---

## Two users vs multiple users

- **Current:** Exactly **2 users** per room (`room.connections.size >= 2` and one offer/one answer). Fits “1 sender, 1 receiver.”
- **Multi-user (1 sender, N receivers):** You’d need one of:
  - **Option A – Star:** Sender is the only offerer; each receiver has a separate peer connection with the sender. Server keeps roomId + token and allows N joiners; signaling relays offer/answer/ice per peer (e.g. include `targetSocketId` in signaling).
  - **Option B – Mesh:** Every peer connects to every other (N*(N-1)/2 connections). More complex signaling and connection state.

For “mostly files” and “one shares, others receive,” Option A (star, sender = hub) is the right model.

---

## What you’ll need to implement multi-user (1 sender, N receivers)

1. **Server**
   - Remove or raise the “room is full” limit (e.g. allow e.g. 2–10 peers).
   - Signaling: when sender sends offer/answer/ice, include a `targetSocketId` (or similar) so the server forwards only to that peer. When a new peer joins, sender creates a new RTCPeerConnection + data channel for that peer.
   - Optional: explicit “sender” vs “receiver” role (e.g. first in room = sender, rest = receivers).

2. **Client**
   - **Sender:** Maintain a map of `peerId → { RTCPeerConnection, DataChannel }`. On `user-joined` (new socket in room), create new PC + offer, send offer with `targetSocketId`. Handle multiple answers and ICE per peer.
   - **Receiver:** Unchanged: one PC, wait for offer from sender, create answer, receive files on one data channel.
   - **UI:** Sender sees “Receivers: 2” or list of joined peers; receivers see “Connected to sender” and file list.

3. **File transfer**
   - **Current:** Whole file as base64 in one JSON message. Fine for small files; for large files it can hit memory and message size limits.
   - **Better:** Chunk files (e.g. 16 KB), send chunks with sequence numbers and fileId; reassemble on receiver. Same idea for both 2-user and multi-user; for multi-user the sender sends chunks over each receiver’s data channel.

---

## Bugs fixed in code

- **App.js:** Removed stray `server.listen(...)` at the bottom (invalid in React app).
- **server/src/index.js:** Removed call to undefined `findAvailablePort()`; server now listens on `process.env.PORT || 5000`. If port 5000 is in use, set `PORT=5001` (or kill the process on 5000) before starting.

---

## Small UI bug (optional)

- In **Room.js**, the “Shared Files” list uses `<DeleteIcon />` for the action that actually **downloads** the file. Prefer a download icon (e.g. `GetApp` or `Download`) for that button.

---

## Summary

- **Can it be done?** Yes. Your app already does P2P file + text with no backend storage and token-based rooms.
- **2 users:** Already supported; use 4-letter (or 4-digit) code + token.
- **Multi-user (1 sender, N receivers):** Needs server signaling with target peer id, sender maintaining multiple peer connections and data channels, and optional chunked file transfer for large files.
