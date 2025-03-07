import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../../utils/Auth.js";

const prisma = new PrismaClient();

export const taskResolvers = {
  Query: {
    getTasks: async (parent, args, context, info) => {
      try {
        const { where = {}, orderBy = {}, limit = 10, offset = 0 } = args;
        const token = context.headers.authorization?.split(" ")[1];
        const user = verifyToken(token);

        if (!user) throw new Error("User not found");
        const options = {
          id: where.id_in ? { in: where.id_in } : undefined,
          title: where.title_contains
            ? { contains: where.title_contains }
            : undefined,
          desc: where.desc_contains
            ? { contains: where.desc_contains }
            : undefined,
          completed: where.completed ? where.completed : undefined,
        };
        const whereCondition =
          user.role === "ADMIN"
            ? {
                ...options,
                userId: where.userId ? { in: where.userId } : undefined,
              }
            : {
                ...options,
                userId: user.id,
              };

        const tasks = await prisma.task.findMany({
          where: whereCondition,
          orderBy: Object.entries(orderBy).map(([key, value]) => ({
            [key]: value,
          })),
          take: limit,
          skip: offset,
        });

        return {
          success: true,
          message: "Tasks fetched successfully",
          tasks,
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
          data: [],
        };
      }
    },
  },

  Mutation: {
    createTask: async (parent, args, context, info) => {
      try {
        console.log("createTask");
        const token = context.headers.authorization?.split(" ")[1];
        const user = verifyToken(token);
        if (!user) throw new Error("Access Denied");
        const { title, desc } = args.input;
        // console.log(title);
        // console.log(desc);

        const newTask = await prisma.task.create({
          data: { title: title, desc: desc, userId: user.id },
        });
        return {
          success: true,
          message: "Task addess successfully",
          data:[newTask],
        };
      } catch (error) {
        console.log(error.message);
        return {
          success: false,
          message: error.message,
          data: [],
        };
      }
    },

    updateTask: async (parent, args, context, info) => {
      try {
        const token = context.headers.authorization?.split(" ")[1];
        const user = verifyToken(token);
        if (!user) throw new Error("Access Denied");

        const taskId = args.id;

        const task = await prisma.task.update({
          where: {
            id: taskId,
            ...(user.role !== "ADMIN" && { userId: user.id }),
          },
          data: { ...args.input },
        });
        return {
          success: true,
          message: "Task Updated successfully",
          data: [task],
        };
      } catch (error) {
        const errorObj = {
          success: false,
          message: error.message,
          data: [],
        };
        if (error.code === "P2025") {
          errorObj.message = "Task not found or access denied";
        }
        console.log(error.message);
        return errorObj;
      }
    },

    deleteTask: async (parent, args, context, info) => {
      try {
        const token = context.headers.authorization?.split(" ")[1];
        const user = verifyToken(token);

        if (!user) throw new Error("Access Denied");

        const taskId = args.id;

        await prisma.task.delete({
          where: {
            id: taskId,
            ...(user.role !== "ADMIN" && { userId: user.id }),
          },
        });
        return {
          success: true,
          message: "Task deleted successfully",
        };
      } catch (error) {
        const errorObj = {
          success: false,
          message: error.message,
        };
        if (error.code === "P2025") {
          errorObj.message = "Task not found or access denied";
        }
        console.log(error.message);
        return errorObj;
      }
    },
  },
};
