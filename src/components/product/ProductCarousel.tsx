import type { Product } from "@/types";
import { Carousel } from "@/components/ui/Carousel";
import { ProductCard } from "./ProductCard";

export function ProductCarousel({ products }: { products: Product[] }) {
  return (
    <Carousel itemClassName="w-[16.5rem] sm:w-[18rem]">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </Carousel>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
