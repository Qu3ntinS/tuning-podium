import { Elysia } from "elysia";
import { prisma } from "../lib/prisma.js";

export const prismaPlugin = new Elysia({ name: "prisma" }).decorate("prisma", prisma);
