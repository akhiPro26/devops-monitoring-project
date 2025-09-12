declare module "swagger-jsdoc" {
  import { OpenAPIV3 } from "openapi-types";

  namespace swaggerJSDoc {
    interface Options {
      definition: OpenAPIV3.Document;
      apis: string[];
    }
  }

  function swaggerJSDoc(options: swaggerJSDoc.Options): OpenAPIV3.Document;
  export = swaggerJSDoc;
}
