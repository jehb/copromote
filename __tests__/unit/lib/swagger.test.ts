import { getApiDocs } from '../../../lib/swagger';
import { createSwaggerSpec } from 'next-swagger-doc';

// Mock next-swagger-doc
jest.mock('next-swagger-doc', () => ({
  createSwaggerSpec: jest.fn(),
}));

describe('getApiDocs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call createSwaggerSpec with correct configuration', async () => {
    const mockSpec = { openapi: '3.0.0', info: { title: 'Test API' } };
    (createSwaggerSpec as jest.Mock).mockReturnValue(mockSpec);

    const result = await getApiDocs();

    expect(createSwaggerSpec).toHaveBeenCalledTimes(1);
    expect(createSwaggerSpec).toHaveBeenCalledWith({
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
    expect(result).toEqual(mockSpec);
  });
});
