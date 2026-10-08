import { db } from "@/lib/db";
import type { Locale } from "@/lib/business-rules";
import { localizedName, localizedDescription } from "@/lib/localized";
import { isValidSlug, slugify } from "@/lib/slug";
import { ConflictError, NotFoundError } from "@/lib/errors";

export interface CategoryDTO {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  icon: string | null;
  sortOrder: number;
  active: boolean;
  description: string;
  subcategories: {
    id: string;
    slug: string;
    name: string;
    image: string | null;
    active: boolean;
    sortOrder: number;
  }[];
}

export interface AdminCategoryDTO {
  id: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  nameEn: string;
  descriptionFr: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  image: string | null;
  icon: string | null;
  active: boolean;
  sortOrder: number;
  metaTitle: string | null;
  metaDescription: string | null;
  productCount: number;
  subcategories: AdminSubcategoryDTO[];
}

export interface AdminSubcategoryDTO {
  id: string;
  categoryId: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  nameEn: string;
  descriptionFr: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  image: string | null;
  active: boolean;
  sortOrder: number;
  metaTitle: string | null;
  metaDescription: string | null;
  productCount: number;
}

// ── Public queries ────────────────────────────────────────────

/** Active categories (+ active subcategories) for header menu and homepage. */
export async function getNavigationCategories(locale: Locale): Promise<CategoryDTO[]> {
  const categories = await db.category.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: {
      subcategories: { where: { active: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: localizedName(category, locale),
    image: category.image,
    icon: category.icon,
    sortOrder: category.sortOrder,
    active: category.active,
    description: localizedDescription(category, locale),
    subcategories: category.subcategories.map((sub) => ({
      id: sub.id,
      slug: sub.slug,
      name: localizedName(sub, locale),
      image: sub.image,
      active: sub.active,
      sortOrder: sub.sortOrder,
    })),
  }));
}

export async function getCategoryBySlug(slug: string, locale: Locale) {
  const category = await db.category.findFirst({
    where: { slug, active: true },
    include: {
      subcategories: { where: { active: true }, orderBy: { sortOrder: "asc" } },
    },
  });
  if (!category) return null;

  return {
    id: category.id,
    slug: category.slug,
    name: localizedName(category, locale),
    description: localizedDescription(category, locale),
    image: category.image,
    metaTitle: category.metaTitle,
    metaDescription: category.metaDescription,
    subcategories: category.subcategories.map((sub) => ({
      id: sub.id,
      slug: sub.slug,
      name: localizedName(sub, locale),
      image: sub.image,
    })),
  };
}

export async function getSubcategoryBySlug(slug: string, locale: Locale) {
  const subcategory = await db.subcategory.findFirst({
    where: { slug, active: true },
    include: { category: true },
  });
  if (!subcategory || !subcategory.category.active) return null;

  return {
    id: subcategory.id,
    slug: subcategory.slug,
    name: localizedName(subcategory, locale),
    description: localizedDescription(subcategory, locale),
    image: subcategory.image,
    metaTitle: subcategory.metaTitle,
    metaDescription: subcategory.metaDescription,
    category: {
      id: subcategory.category.id,
      slug: subcategory.category.slug,
      name: localizedName(subcategory.category, locale),
    },
  };
}

// ── Admin queries ─────────────────────────────────────────────

export async function listCategoriesAdmin(): Promise<AdminCategoryDTO[]> {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      subcategories: {
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { products: true } } },
      },
      _count: { select: { products: true } },
    },
  });

  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    nameFr: category.nameFr,
    nameAr: category.nameAr,
    nameEn: category.nameEn,
    descriptionFr: category.descriptionFr,
    descriptionAr: category.descriptionAr,
    descriptionEn: category.descriptionEn,
    image: category.image,
    icon: category.icon,
    active: category.active,
    sortOrder: category.sortOrder,
    metaTitle: category.metaTitle,
    metaDescription: category.metaDescription,
    productCount: category._count.products,
    subcategories: category.subcategories.map((sub) => ({
      id: sub.id,
      categoryId: sub.categoryId,
      slug: sub.slug,
      nameFr: sub.nameFr,
      nameAr: sub.nameAr,
      nameEn: sub.nameEn,
      descriptionFr: sub.descriptionFr,
      descriptionAr: sub.descriptionAr,
      descriptionEn: sub.descriptionEn,
      image: sub.image,
      active: sub.active,
      sortOrder: sub.sortOrder,
      metaTitle: sub.metaTitle,
      metaDescription: sub.metaDescription,
      productCount: sub._count.products,
    })),
  }));
}

// ── Admin mutations ───────────────────────────────────────────

export interface CategoryInput {
  nameFr: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  descriptionFr?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  image?: string | null;
  icon?: string | null;
  active?: boolean;
  sortOrder?: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

function normalizeSlug(slug: string): string {
  const value = slugify(slug);
  if (!isValidSlug(value)) {
    throw new ConflictError("Slug must contain only lowercase letters, numbers and dashes");
  }
  return value;
}

export async function createCategory(input: CategoryInput) {
  const slug = normalizeSlug(input.slug);
  const existing = await db.category.findUnique({ where: { slug } });
  if (existing) throw new ConflictError(`A category with slug "${slug}" already exists`);

  return db.category.create({
    data: {
      nameFr: input.nameFr.trim(),
      nameAr: input.nameAr.trim(),
      nameEn: input.nameEn.trim(),
      slug,
      descriptionFr: input.descriptionFr ?? null,
      descriptionAr: input.descriptionAr ?? null,
      descriptionEn: input.descriptionEn ?? null,
      image: input.image ?? null,
      icon: input.icon ?? null,
      active: input.active ?? true,
      sortOrder: input.sortOrder ?? 0,
      metaTitle: input.metaTitle ?? null,
      metaDescription: input.metaDescription ?? null,
    },
  });
}

export async function updateCategory(id: string, input: Partial<CategoryInput>) {
  const category = await db.category.findUnique({ where: { id } });
  if (!category) throw new NotFoundError("Category not found");

  let slug = category.slug;
  if (input.slug !== undefined) {
    slug = normalizeSlug(input.slug);
    const clash = await db.category.findFirst({ where: { slug, NOT: { id } } });
    if (clash) throw new ConflictError(`A category with slug "${slug}" already exists`);
  }

  return db.category.update({
    where: { id },
    data: {
      ...(input.nameFr !== undefined ? { nameFr: input.nameFr.trim() } : {}),
      ...(input.nameAr !== undefined ? { nameAr: input.nameAr.trim() } : {}),
      ...(input.nameEn !== undefined ? { nameEn: input.nameEn.trim() } : {}),
      ...(input.slug !== undefined ? { slug } : {}),
      ...(input.descriptionFr !== undefined ? { descriptionFr: input.descriptionFr } : {}),
      ...(input.descriptionAr !== undefined ? { descriptionAr: input.descriptionAr } : {}),
      ...(input.descriptionEn !== undefined ? { descriptionEn: input.descriptionEn } : {}),
      ...(input.image !== undefined ? { image: input.image } : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.metaTitle !== undefined ? { metaTitle: input.metaTitle } : {}),
      ...(input.metaDescription !== undefined ? { metaDescription: input.metaDescription } : {}),
    },
  });
}

export async function deleteCategory(id: string): Promise<void> {
  const category = await db.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true, subcategories: true } } },
  });
  if (!category) throw new NotFoundError("Category not found");

  if (category._count.products > 0) {
    throw new ConflictError(
      `This category still contains ${category._count.products} product(s). Move or delete them first, or deactivate the category instead.`,
    );
  }

  await db.category.delete({ where: { id } });
}

export async function reorderCategories(ids: string[]): Promise<void> {
  await db.$transaction(
    ids.map((id, index) =>
      db.category.update({ where: { id }, data: { sortOrder: index } }),
    ),
  );
}

export interface SubcategoryInput {
  categoryId: string;
  nameFr: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  descriptionFr?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  image?: string | null;
  active?: boolean;
  sortOrder?: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export async function createSubcategory(input: SubcategoryInput) {
  const parent = await db.category.findUnique({ where: { id: input.categoryId } });
  if (!parent) throw new NotFoundError("Parent category not found");

  const slug = normalizeSlug(input.slug);
  const existing = await db.subcategory.findUnique({ where: { slug } });
  if (existing) throw new ConflictError(`A subcategory with slug "${slug}" already exists`);

  return db.subcategory.create({
    data: {
      categoryId: input.categoryId,
      nameFr: input.nameFr.trim(),
      nameAr: input.nameAr.trim(),
      nameEn: input.nameEn.trim(),
      slug,
      descriptionFr: input.descriptionFr ?? null,
      descriptionAr: input.descriptionAr ?? null,
      descriptionEn: input.descriptionEn ?? null,
      image: input.image ?? null,
      active: input.active ?? true,
      sortOrder: input.sortOrder ?? 0,
      metaTitle: input.metaTitle ?? null,
      metaDescription: input.metaDescription ?? null,
    },
  });
}

export async function updateSubcategory(id: string, input: Partial<SubcategoryInput>) {
  const subcategory = await db.subcategory.findUnique({ where: { id } });
  if (!subcategory) throw new NotFoundError("Subcategory not found");

  let slug = subcategory.slug;
  if (input.slug !== undefined) {
    slug = normalizeSlug(input.slug);
    const clash = await db.subcategory.findFirst({ where: { slug, NOT: { id } } });
    if (clash) throw new ConflictError(`A subcategory with slug "${slug}" already exists`);
  }

  return db.subcategory.update({
    where: { id },
    data: {
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      ...(input.nameFr !== undefined ? { nameFr: input.nameFr.trim() } : {}),
      ...(input.nameAr !== undefined ? { nameAr: input.nameAr.trim() } : {}),
      ...(input.nameEn !== undefined ? { nameEn: input.nameEn.trim() } : {}),
      ...(input.slug !== undefined ? { slug } : {}),
      ...(input.descriptionFr !== undefined ? { descriptionFr: input.descriptionFr } : {}),
      ...(input.descriptionAr !== undefined ? { descriptionAr: input.descriptionAr } : {}),
      ...(input.descriptionEn !== undefined ? { descriptionEn: input.descriptionEn } : {}),
      ...(input.image !== undefined ? { image: input.image } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.metaTitle !== undefined ? { metaTitle: input.metaTitle } : {}),
      ...(input.metaDescription !== undefined ? { metaDescription: input.metaDescription } : {}),
    },
  });
}

export async function deleteSubcategory(id: string): Promise<void> {
  const subcategory = await db.subcategory.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!subcategory) throw new NotFoundError("Subcategory not found");

  if (subcategory._count.products > 0) {
    throw new ConflictError(
      `This subcategory still contains ${subcategory._count.products} product(s).`,
    );
  }

  await db.subcategory.delete({ where: { id } });
}

export async function reorderSubcategories(categoryId: string, ids: string[]): Promise<void> {
  await db.$transaction(
    ids.map((id, index) =>
      db.subcategory.update({ where: { id }, data: { sortOrder: index, categoryId } }),
    ),
  );
}
