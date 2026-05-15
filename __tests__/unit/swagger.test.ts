import { getApiDocs } from '../../lib/swagger';
import { createSwaggerSpec } from 'next-swagger-doc';

jest.mock('next-swagger-doc', () => ({
  createSwaggerSpec: jest.fn().mockReturnValue({
    openapi: '3.0.0',
    info: { title: 'Promoty REST API' },
    paths: {}
  })
}));

describe('getApiDocs', () => {
  it('should call createSwaggerSpec with correct definition and return spec', async () => {
    const spec = await getApiDocs();

    expect(createSwaggerSpec).toHaveBeenCalledWith(expect.objectContaining({
      apiFolder: 'app/api/v1',
      definition: expect.objectContaining({
        openapi: '3.0.0',
        info: expect.objectContaining({
          title: 'Promoty REST API',
          version: '1.0',
        }),
        servers: expect.arrayContaining([
          expect.objectContaining({ url: '/' })
        ])
      })
    }));

    expect(spec).toEqual({
      openapi: '3.0.0',
      info: { title: 'Promoty REST API' },
      paths: {}
    });
  });
});
