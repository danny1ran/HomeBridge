# Open HomeBridge in Visual Studio Code

1. Extract this ZIP to a normal folder.
2. In VS Code, select File > Open Folder and choose HomeBridge (the folder containing package.json).
3. Install Node.js 22 and pnpm 11.25.0 if they are not already installed.
4. Open Terminal > New Terminal and run:

```sh
pnpm install
pnpm dev:client
```

Open the local URL printed in the terminal. This starts the interface with fictional sample rentals. No Supabase credentials are needed for this preview.

## Enable accounts and bookings

Follow README.md to create Supabase, run supabase/migrations/001_homebridge.sql, and configure authentication redirects. Copy .env.example to a new file named .env using VS Code, then fill in your project URL and public key.

Run `pnpm dev` to start both the frontend and backend. Never put a service-role key in a VITE_ variable.

## Main files

- client/src/public-pages.tsx: landing, browsing, and property pages
- client/src/discovery-preview.tsx: sidebar and map-style Discover layout
- client/src/styles.css: colors, fonts, and responsive styles
- client/src/motion.tsx: scroll and FAQ animations
- server/src/app.ts: API
- supabase/migrations/001_homebridge.sql: database setup

## Check and build

```sh
pnpm test
pnpm build
```

This package includes the latest Discover property-page correction. Dependencies and generated builds are omitted; pnpm install restores dependencies from the included lockfile. The included .openai/hosting.json belongs to the existing hosted HomeBridge site; it is not needed to run locally.

## Chat simulation
The floating HomeBridge guide is a scripted UI demo. No messages are sent to AI services, no files are uploaded, and no contract analysis occurs. Edit client/src/chat-assistant.tsx to change the sample conversations.
