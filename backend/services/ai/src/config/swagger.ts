import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AI Service API",
      version: "1.0.0",
      description: "Swagger docs for AI microservice",
    },
    servers: [
      {
        url: "http://localhost:3003", // replace with service URL or env variable
      },
    ],
    paths: {}, // <-- add this
  },
  apis: ["./src/routes/*.ts"], // path to your route files
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
