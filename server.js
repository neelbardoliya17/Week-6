process.on('uncaughtException',(error)=>{
  console.log("Uncaught Exception:",error.message);
  console.log(error.stack);
  process.exit(1);
});

process.on('unhandledRejection',(reason,promise)=>{
  console.log(reason);
  console.log(`Unhandle Promise rejection`,promise);
  process.exit(1);
})


import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import bodyParser from "body-parser";
import  typeDefs  from "./graphql/schemas/typeDefs.js";
import { userResolvers } from "./graphql/resolvers/userResolvers.js";
import { taskResolvers } from "./graphql/resolvers/taskResolvers.js";
// import { PrismaClient } from "@prisma/client";
import {taskQueue,taskWorker} from "./utils/taskCron.js";

// const prisma = new PrismaClient();

const app = express();
const server = new ApolloServer({
  typeDefs,
  resolvers: [userResolvers, taskResolvers],
  context: ({ req }) => ({ req }),
});

// (async function  (params) {
//   const data=await prisma.task.findMany();
//   console.log(data);
  
// })();

await server.start();
app.use(bodyParser.json());
app.use("/graphql", expressMiddleware(server, {
    context: async ({ req }) => ({
      headers: req.headers,
    }),
  }),);

app.listen(5000, () => console.log("Server running on http://localhost:5000/graphql"));
