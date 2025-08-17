export interface CartItem {
    cartItemId: number;
    sessionId: string;
    productId: number;
    quantity: number;
    addedDate: Date;
    product?: any;  // Will be populated with product details when needed
}
