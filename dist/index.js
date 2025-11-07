import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { env } from "hono/adapter";
const app = new Hono();
app.get("/", (c) => {
    return c.text("Hello Hono!");
});
app.get("/env", (c) => {
    const { GEMINI } = env(c);
    return c.json({ GEMINI });
});
serve({
    fetch: app.fetch,
    port: 3000,
}, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
});
