import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MoonBloom API",
      version: "1.0.0",
      description: "API REST para la aplicación MoonBloom de seguimiento de ciclo menstrual",
    },
    servers: [{ url: "http://localhost:3000", description: "Servidor local" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Token JWT obtenido al hacer login. Formato: Bearer <token>",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
          description: "Token JWT almacenado en cookie httpOnly",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string", enum: ["user", "admin"] },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Cycle: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            startDate: { type: "string", format: "date" },
            endDate: { type: "string", format: "date" },
            durationDays: { type: "number" },
            notes: { type: "string" },
          },
        },
        DailyLog: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            cycleId: { type: "string" },
            date: { type: "string", format: "date" },
            mood: {
              type: "string",
              enum: ["feliz", "triste", "ansiosa", "tranquila", "enojada", "cansada", "sensible", "normal"],
            },
            symptoms: { type: "array", items: { type: "string" } },
            flow: { type: "number", minimum: 1, maximum: 5 },
            notes: { type: "string" },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: { type: "number" },
            limit: { type: "number" },
            total: { type: "number" },
            pages: { type: "number" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
