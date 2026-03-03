# Deployment & Testing

**Backend does not store any files.** It only creates rooms (code + token), validates join, and relays WebRTC signaling. All file and text data goes peer-to-peer between the two users.

---

## Why not full Vercel?

**The backend cannot run on Vercel.** Vercel is serverless (short-lived functions). This app needs a **persistent Node server** for Socket.IO (WebSockets). So:

- **Frontend (React):** Deploy on **Vercel**.
- **Backend (Node + Express + Socket.IO):** Deploy on **Render**, **Railway**, **Fly.io**, or any host that runs a long-lived Node process.

---

## 1. Deploy backend (e.g. Render)

1. Push your repo to GitHub.
2. Go to [render.com](https://render.com) → New → Web Service.
3. Connect the repo, set:
   - **Root directory:** `server`
   - **Build:** `npm install`
   - **Start:** `node src/index.js` or `npm start`
   - **Environment:**
     - `NODE_ENV` = `production`
     - `CORS_ORIGIN` = `https://your-vercel-app.vercel.app` (your frontend URL; add after deploying frontend)
4. Deploy. Note the backend URL (e.g. `https://your-app-name.onrender.com`).

---

## 2. Deploy frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) → New Project → Import your repo.
2. Set **Root Directory** to `client`.
3. **Environment variables:**
   - `REACT_APP_SERVER_URL` = `https://your-app-name.onrender.com` (no trailing slash; the backend URL from step 1).
4. Deploy. Vercel will run `npm run build` and serve the React app.

---

## 3. Point backend at frontend

1. In Render, open your backend service → Environment.
2. Set `CORS_ORIGIN` = `https://your-vercel-app.vercel.app` (your actual Vercel URL).
3. Redeploy the backend so CORS allows the frontend origin.

---

## 4. Testing

**Local (both on same machine):**

1. Terminal 1: `cd server && npm run dev`
2. Terminal 2: `cd client && npm start`
3. Open http://localhost:3000 in two browser windows (or one normal + one incognito).
4. Window 1: Create Room → copy room code + token. Window 2: paste code + token → Join. Send text and a small file; confirm both arrive. No files are stored on the server.

**Production:**

1. Open your Vercel URL in two devices/browsers.
2. Create room on one, join on the other with code + token.
3. If “Failed to fetch” or socket errors: check `REACT_APP_SERVER_URL` and `CORS_ORIGIN`; ensure backend is running and URL has no trailing slash.

**WebRTC:** If two users behind strict NATs cannot connect, you’d need a TURN server (not set up here). For most home/office networks, STUN (default) is enough.

---

## Env summary

| Where    | Variable                 | Example / use |
|----------|--------------------------|----------------|
| Vercel   | `REACT_APP_SERVER_URL`   | `https://your-backend.onrender.com` |
| Render   | `CORS_ORIGIN`            | `https://your-app.vercel.app`       |
| Render   | `PORT`                   | Set automatically by Render         |

---

## Optional: backend + client in one repo on Render

If you want one URL and no CORS setup: use **only Render**, build the client and serve it from the same server (your server already has the `express.static` and `app.get('*', ...)` for production). Set Root to repo root, build client in `client`, build server, and start server; set the server to serve `client/build`. Then you don’t need Vercel or `REACT_APP_SERVER_URL`; the app runs at the Render URL only.
