export type Block = {
  id: string;
  originalId?: string; // Para mantener el ID original cuando se carga en el canvas
  title: string;
  sku?: string;
  price?: string;
  packSize?: string;
  description?: string;
  bannerImage?: string;
  imageSrc?: string;

  imageOffsetY?: number;
  imageOffsetX?: number;
  imageScale?: number;

  newBadgePosition?: "left" | "right";
  contentOffsetX?: number;
  contentOffsetY?: number;
  blockSpacing?: number;
  blockHeight?: number;
  descriptionWidth?: number;

  template:
    | "category_banner"
    | "single_product"
    | "zig_product"
    | "promo_banner";

  visible: boolean;
};
