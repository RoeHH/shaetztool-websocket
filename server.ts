import { serve } from "https://deno.land/std@0.166.0/http/server.ts";
import { Server } from "https://deno.land/x/socket_io@0.2.0/mod.ts";
import { Application, Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
 
 
const app = new Application();
 
interface User {
  id: string,
  name: string,
  vote: number | undefined
};
 
let intervalFinished = false;
const kv = await Deno.openKv();
const router = new Router();
 
let users: unknown[];
 
router
  .get("/vote/:team", async (context) => {
    if (!intervalFinished) {
      const users = [];
      const iter = await kv.list({ prefix: ["user", context.params.team]});
      for await (const res of iter) users.push(res.value);
      context.response.body = JSON.stringify(users);
    }
  })
  .post("/vote/:team/:name/:vote", async (context) => {
    if (intervalFinished) {
      const { team, name, vote } = context.params;
      const user: User = {
        id: crypto.randomUUID(),
        name: name,
        vote: Number(vote)
      };
 
      const result = await kv.set(["user", team, name], user);
      context.response.body = "voted";
    }
  })
  .post("/vote/:team/start", async (context) => {
    const iter = await kv.list({ prefix: ["user", context.params.team]});
    for await (const res of iter) kv.delete(res.key);

    console.log(context.params.team, "hello");
    const team = context.params.team;
    intervalFinished = true;
    let count = 5;
    const timer = setInterval(function() {
      console.log(count);
      io.local.emit(team, count)
      if (count === 0) {
        clearInterval(timer);
        intervalFinished = false;
      }
      count--;
    }, 1000);
    context.response.body = "started";
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
 