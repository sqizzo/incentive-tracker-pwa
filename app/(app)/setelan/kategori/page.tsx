import type { Metadata } from "next"

import { CategoryManager } from "@/components/app/category-manager"
import { getCategories } from "@/lib/data"

export const metadata: Metadata = { title: "Kategori Service" }

export default async function CategoriesPage() {
  const categories = await getCategories()
  return <CategoryManager categories={categories} />
}
