const { PrismaClient, TaskStatus, TaskPriority, ProjectRole } = require('@prisma/client');

const g = globalThis;

const prisma = g.prisma instanceof PrismaClient ? g.prisma : new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  g.prisma = prisma;
}

module.exports = {
  prisma,
  PrismaClient,
  TaskStatus,
  TaskPriority,
  ProjectRole,
};
