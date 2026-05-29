import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'app/api/v1', 
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Promoty REST API',
        version: '1.0',
        description: 'Comprehensive REST API documentation for programmatic access and MCP server integrations.',
      },
      servers: [
        {
          url: '/', // Relative path
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'API Key',
            description: 'Provide your API key in the Authorization header as Bearer <key>',
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
  });
  return spec;
};
