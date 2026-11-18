import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// A year-month string such as "2026-04", or the word "present" / "ongoing".
const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM');
const endDate = z.union([yearMonth, z.literal('present'), z.literal('ongoing')]);

const picture = (image: () => z.ZodTypeAny) =>
  z.object({ src: image(), alt: z.string().min(1) });

// One folder per project under src/content/projects/<slug>/ with an index.md,
// its images beside it. The folder name is the URL slug.
const projects = defineCollection({
  loader: glob({ pattern: '*/index.md', base: './src/content/projects', generateId: ({ entry }) => entry.split('/')[0] }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      tagline: z.string(),
      summary: z.string(),
      role: z.string().optional(),
      team: z.string(),
      dates: z.object({ start: yearMonth, end: endDate }),
      status: z.enum(['Shipped', 'In use', 'In progress', 'Archived']),
      repo: z.string().url().optional(),
      private: z.boolean().default(false),
      demo: z.string().url().optional(),
      stack: z.array(z.string()).max(6),
      cover: picture(image),
      // The card's photo strip: exactly three photos, cropped to the centre
      // when narrow. Defaults to the first three collage photos.
      frames: z.array(picture(image)).length(3).optional(),
      // Rows of the card's stats ledger (label left, value right). The stack
      // is appended as the last row automatically. One row may take the accent.
      stats: z.array(z.object({ label: z.string(), value: z.string(), accent: z.boolean().default(false) })).min(1).max(4),
      collage: z.array(picture(image)).length(4),
      order: z.number(),
      draft: z.boolean().default(false),
    }),
});

// One YAML file per role under src/content/experience/. Delete the file to
// remove the role; entries sort themselves newest start date first.
const experience = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/experience' }),
  schema: ({ image }) =>
    z.object({
      role: z.string().optional(),
      org: z.string(),
      dates: z.object({ start: yearMonth, end: endDate }),
      photo: picture(image),
      // Most logos/photos sit in the standard 4px-radius square tile; a
      // round brand mark (like Reaxe's circular badge) can opt into a full
      // circle crop instead so it reads as the actual logo shape.
      photoShape: z.enum(['square', 'circle']).default('square'),
      bullets: z.array(z.string()).max(3).default([]),
    }),
});

export const collections = { projects, experience };
