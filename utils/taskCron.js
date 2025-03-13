import { PrismaClient } from "@prisma/client";
import { Queue, Worker } from "bullmq";
import { createClient } from "redis";


const redis=new createClient({
  username:'default',
  password:process.env.REDIS_PASSWORD,
  socket:{
    host:process.env.REDIS_HOST,
    port:process.env.REDIS_PORT
  }
});
await redis.connect();

const prisma = new PrismaClient();


const taskQueue = new Queue("taskQueue", { connection:{
  host:process.env.REDIS_HOST,
  password:process.env.REDIS_PASSWORD,
  port:process.env.REDIS_PORT
} });

const taskJob = async () => {
  const take = 10;
  let skip = 0;
  let flag = true;
  try {
    do {
      const users = await prisma.user.findMany({
        include: {
          _count: {
            select: { tasks: true },
          },
          tasks: {
            where: { completed: false },
          },
        },
        take,
        skip,
      });

      if (users.length < take) flag = false;
      else skip += take;

      for (const user of users) {
        // const pendingTasks=user.tasks.filter((task)=>{
        //   return task.completed=false;
        // })
        // const completedTasks=user.tasks.filter((task)=>{
        //   return task.completed=true;
        // })
        const pendingTask = user.tasks.length;
        console.log(`\n User Id:${user.id}`);
        console.log(`User name:${user.name}`);
        console.log(`Pending tasks:${pendingTask}`);
        console.log(`Completed tasks:${user._count.tasks - pendingTask}`);
      }
    } while (flag);
  } catch (error) {
    console.log("Error occured:", error.message);
  }
};

const taskWorker = new Worker(
  "taskQueue",
  async () => {
    console.log("Processing tasks:");
    await taskJob();
  },
  { connection:{
    host:process.env.REDIS_HOST,
    password:process.env.REDIS_PASSWORD,
    port:process.env.REDIS_PORT
  }}
);

async function setUpJob()
{
  await taskQueue.add(
    "taskJob",
    {},
    {
      repeat: { cron: "*/2 * * * *" },
      delay:{}
    }
  );
  console.log("Job added successfully");
}

(async () => {
  await setUpJob();
})();

export { taskQueue, taskWorker };
