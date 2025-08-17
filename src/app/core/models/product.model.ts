export interface Product {
    productId: number;
    productName: string;
    description: string;
    price: number;
    stock: number;
    categoryId: number;
    imageUrl?: string;
    images?: string[];
    createdDate: Date;
    isActive: boolean;
}
