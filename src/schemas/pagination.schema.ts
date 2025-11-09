import { z } from 'zod';

export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(-1).default(50), // -1 = get all
});

export type PaginationInput = z.infer<typeof paginationSchema>;
