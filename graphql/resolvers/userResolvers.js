import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateToken, verifyToken } from "../../utils/Auth.js";

const prisma = new PrismaClient();

export const userResolvers = {
  Query: {
    getUsers: async (parent, args, context, info) => {
      try {
        const { where = {}, orderBy = {}, limit = 10, offset = 0 } = args;
        const token = context.headers.authorization?.split(" ")[1];
        const user = verifyToken(token);

        if (!user) throw new Error("User not found");

        const whereCondition =
          user.role === "ADMIN"
            ? {
                id: where.id_in ? { in: where.id_in } : undefined,
                role: where.role,
                name: where.name_contains
                  ? { contains: where.name_contains }
                  : undefined,
                email: where.email_contains
                  ? { contains: where.email_contains }
                  : undefined,
              }
            : { id: user.id };

        const data = await prisma.user.findMany({
          where: whereCondition,
          orderBy: Object.entries(orderBy).map(([key, value]) => ({
            [key]: value,
          })),
          take: limit,
          skip: offset,
        });
        console.log(data);
        
        return {
          success: true,
          message: "User fetched successfully",
          data,
        };
      } catch (error) {
        console.log(error.message);
        return {
          success: false,
          message: error.message,
          data:[]
        };
      }
    },
  },

  Mutation: {
    createUser: async (parent, args, context, info) => {
      try {
        const { name, email, password, role } = args.input;
        const hashedPassword = await bcrypt.hash(password, 10);
        const data = await prisma.user.create({
          data: { name, email, password: hashedPassword, role },
        });
        return {
          success: true,
          message: "User added successfully",
          data:[data],
        };
      } catch (error) {
        console.log(error.message);
        return {
          success: false,
          message: error.message,
          data:[]
        };
      }
    },

    loginUser: async (parent, args, context, info) => {
      try {
        // console.log(context);
        // const token=context.headers.authorization?.split(" ")[1];
        // console.log(token);

        // console.log(args.input);
        // console.log(args.input.email);

        const { email, password } = args.input;

        const user = await prisma.user.findFirst({ where: { email } });

        if (!user) throw new Error("User not found");

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) throw new Error("Invalid credentials");

        return {
          success: true,
          message:'User login successfully',
          token: generateToken(user),
          user
        };
      } catch (error) {
        console.log(error.message);
        return {
          success: false,
          message: error.message,
          token:null,
          user:null
        };
      }
    },

    updateUser: async (parent, args, context, info) => {
      try {
        const token = context.headers.authorization?.split(" ")[1];
        const id = args.id;
        const user = verifyToken(token);
        if (user.role !== "ADMIN" && user.id !== id)
          throw new Error("Access Denied");

        const data = await prisma.user.update({
          where: { id },
          data: { ...args.input },
        });
        return {
          success: true,
          message: "User Updated successfully",
          data:[data],
        };
      } catch (error) {
        console.log(error.message);
        return {
          success: false,
          message: error.message,
          data:[]
        };
      }
    },

    deleteUser: async (parent, args, context, info) => {
      try {
        const token = context.headers.authorization?.split(" ")[1];
        const id = args.id;
        const user = verifyToken(token);
        if (user.role !== "ADMIN" && user.id !== id)
          throw new Error("Access Denied");

        await prisma.user.delete({ where: { id } });
        return {
          success: true,
          message: "User deleted successfully",
        };
      } catch (error) {
        console.log(error.message);
        return {
          success: false,
          message: error.message,
        };
      }
    },
  },
};
