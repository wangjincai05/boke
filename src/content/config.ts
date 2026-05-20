import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    categories: z.array(z.string()).default([]),
    image: z.string().optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    series: z.object({
      name: z.string(),
      order: z.number(),
    }).optional(),
  }),
});

export const collections = { blog };