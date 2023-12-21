import { serve } from "https://deno.land/std@0.166.0/http/server.ts";
import { Server } from "https://deno.land/x/socket_io@0.2.0/mod.ts";
import { Application, Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";

const app = new Application();

const router = new Router();
router
  .get("/book", (context) => {
    io.local.emit("rigi", "world");

    context.response.body = "count";
  })
  .post("/vote", (context) => {
    context.response.body = "count";
  });

const io = new Server({cors: {origin: "*"}});

const handler = io.handler(async (req) => {
  return await app.handle(req) || new Response(null, { status: 403 });
});

app.use(router.routes());
app.use(oakCors({ origin: "*" }));

await serve(handler, {
  port: 3001,
});

