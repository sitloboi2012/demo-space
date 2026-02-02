import { z } from 'zod';
import { insertReviewSchema, insertDocumentSchema, insertComplianceItemSchema, reviews, documents, complianceItems } from './schema';

export type CreateReviewRequest = z.infer<typeof insertReviewSchema>;

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  reviews: {
    list: {
      method: 'GET' as const,
      path: '/api/reviews',
      responses: {
        200: z.array(z.custom<typeof reviews.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/reviews/:id',
      responses: {
        200: z.custom<typeof reviews.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/reviews',
      input: insertReviewSchema,
      responses: {
        201: z.custom<typeof reviews.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  documents: {
    list: {
      method: 'GET' as const,
      path: '/api/reviews/:reviewId/documents',
      responses: {
        200: z.array(z.custom<typeof documents.$inferSelect>()),
      },
    },
    upload: {
      method: 'POST' as const,
      path: '/api/reviews/:reviewId/documents',
      // For prototype, we just verify the file name/type match the requirements
      input: insertDocumentSchema.omit({ reviewId: true }),
      responses: {
        201: z.custom<typeof documents.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/documents/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    }
  },
  compliance: {
    list: {
      method: 'GET' as const,
      path: '/api/reviews/:reviewId/compliance',
      responses: {
        200: z.array(z.custom<typeof complianceItems.$inferSelect>()),
      },
    },
    generate: {
      method: 'POST' as const,
      path: '/api/reviews/:reviewId/compliance/generate',
      // This triggers the AI analysis
      responses: {
        201: z.array(z.custom<typeof complianceItems.$inferSelect>()),
        400: errorSchemas.validation,
      },
    }
  },
  icd: {
    generate: {
      method: 'POST' as const,
      path: '/api/reviews/:reviewId/icd/generate',
      responses: {
        200: z.object({ icd: z.string() }),
        400: errorSchemas.validation,
      },
    }
  },
  negotiation: {
    summarize: {
      method: 'POST' as const,
      path: '/api/summarize-negotiation',
      input: z.object({
        emailThread: z.string(),
        requirement: z.string(),
      }),
      responses: {
        200: z.object({
          summary: z.string(),
          hasWaiver: z.boolean(),
          waiverType: z.string().optional(),
        }),
        400: errorSchemas.validation,
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
