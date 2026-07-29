export type ProductCategory =
  | "liquid"
  | "pod"
  | "mod"
  | "atomizer"
  | "accessories";

export type ProductDTO = {
  id: number;
  slug: string;
  name: string;
  brand: string;
  brandSlug: string;
  category: string;
  subcategory: string | null;
  description: string;
  image: string;
  gallery: string[];
  featured: boolean;
  variants: {
    id: number;
    nic: string | null;
    stock: number;
    price: number;
    discountPercent: number;
    effectivePrice: number;
  }[];
  minPrice: number;
  hasDiscount: boolean;
  totalStock: number;
};
