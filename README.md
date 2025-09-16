# Faker Dev Notes

## Test mode (no Steam auth)

Enable guest testing so each browser tab is treated as a different test user without Steam:

1. Create a `.env` with:

```
TEST_MODE=true
SESSION_SECRET=dev_secret_change_me
DOMAIN=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/faker
```

2. Start the server:

```
npm start
```

3. Open multiple tabs to `http://localhost:3000`. Each tab/session will auto-login as a unique guest (e.g., "Guest 4821"). All HTTP routes and Socket.IO connections work as if authenticated.

To disable, set `TEST_MODE=false` (or remove it) to restore Steam authentication.

## CS2 Server Integration

This app can control a CS2 dedicated server using `cs2-multiserver`'s `cs2-server` launcher. See the upstream project for setup and prerequisites: [dasisdormax/cs2-multiserver](https://github.com/dasisdormax/cs2-multiserver).

Environment variables:

- CS2_SERVER_BIN: path or name of the `cs2-server` launcher (default `cs2-server`)
- CS2_INSTANCE: instance selector, e.g. `@lan01` (default `@lan01`)
- CS2_WORKDIR: working directory where the script should run (optional)
- CS2_DEFAULT_MAP: default map for cold start (default `de_inferno`)

Behavior:

- When a lobby forms, the server is started in the background to hide startup latency.
- After map veto completes, the server runs `changelevel <map>` to switch maps without a restart.

