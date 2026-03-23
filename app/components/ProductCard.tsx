"use client";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock_quantity: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: number) => void;
}

export default function ProductCard({
  product,
  onAddToCart,
}: ProductCardProps) {
  // Use default coffee image if no image_url is provided
  const imageUrl = product.image_url || "/coffee-default.webp";

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to default image if the provided image fails to load
            e.currentTarget.src = "/coffee-default.webp";
          }}
        />
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-3">{product.description}</p>

        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-green-600">
            ${product.price.toFixed(2)}
          </span>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              Stock: {product.stock_quantity}
            </span>
            <button
              onClick={() => onAddToCart(product.id)}
              disabled={product.stock_quantity === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
