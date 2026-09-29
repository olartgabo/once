import { z } from "zod";

export const itemSchema = z
  .object({
    description: z.string().trim().min(1).max(120),
    quantity: z.number().int().min(1).max(1000),
    unitPrice: z
      .number()
      .finite()
      .min(0)
      .max(100000)
      .refine(
        (value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.000001,
        "Use at most two decimal places",
      ),
  })
  .strict();
export const invoiceSchema = z
  .object({
    customer: z.enum(["Acme Robotics", "Globex Research", "Meridian Studio"]),
    terms: z.enum(["NET_15", "NET_30", "NET_60"]),
    items: z.array(itemSchema).min(1).max(8),
  })
  .strict();
export const scenarioSchema = z
  .object({
    seed: z.number().int().min(0).max(2147483647),
    level: z.number().int().min(0).max(4),
  })
  .strict();
export function totalCents(items: z.infer<typeof itemSchema>[]): number {
  return items.reduce(
    (sum, item) => sum + item.quantity * Math.round(item.unitPrice * 100),
    0,
  );
}
