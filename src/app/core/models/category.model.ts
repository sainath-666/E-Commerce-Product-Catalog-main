export interface Category {
    categoryId: number;
    categoryName: string;
    parentCategoryId?: number;
    imageUrl?: string;
    isActive: boolean;
    subCategories?: Category[];
}
