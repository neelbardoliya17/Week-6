import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateToken, verifyToken } from "../../utils/Auth.js";

const prisma = new PrismaClient();

export const userResolvers = {
  Query: {
    getUsers: async (_, __, { req }) => {
      try {
        const user = verifyToken(req);
        if (user.role !== "ADMIN") throw new Error("Access Denied");

        return await prisma.user.find();
      } catch (error) {
        throw new Error(error.message);
      }
    },

    getUser: async (_, { id }, { req }) => {
      try {
        const user = verifyToken(req);
        if (user.role !== "ADMIN" && user.id !== id)
          throw new Error("Access Denied");

        return await prisma.user.findUnique({ where: { id } });
      } catch (error) {
        throw new Error(error.message);
      }
    },
  },

  Mutation: {
    createUser: async (parent, args, context, info) => {
      try {
        const { name, email, password, role } = args.input;
        const hashedPassword = await bcrypt.hash(password, 10);
        return await prisma.user.create({
          data: { name, email, password: hashedPassword, role },
        });
      } catch (error) {
        throw new Error(error.message);
      }
    },

    loginUser: async (parent, args, context, info) => {
      try {
        // console.log(context);
        // const token=context.headers.authorization?.split(" ")[1];
        // console.log(token);

        console.log(args.input);
        console.log(args.input.email);

        const { email, password } = args.input;

        const user = await prisma.user.findFirst({ where: { email } });

        if (!user) throw new Error("User not found");

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) throw new Error("Invalid credentials");

        return { token: generateToken(user), user };
      } catch (error) {
        throw new Error(error.message);
      }
    },

    updateUser: async (parent, args, context, info) => {
      try {
        const token = context.headers.authorization?.split(" ")[1];
        const id = args.id;
        const user = verifyToken(token);
        if (user.role !== "ADMIN" && user.id !== id)
          throw new Error("Access Denied");

        return await prisma.user.update({
          where: { id },
          data: { ...args.input },
        });
      } catch (error) {
        throw new Error(error.message);
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
        return "User deleted successfully";
      } catch (error) {
        throw new Error(error.message);
      }
    },
  },
};
