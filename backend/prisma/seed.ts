import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { Brand, Category, Coupon, Order, Product, User } from "@/types";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "torque123";

/**
 * Reaproveita o seed do front (alias @/* -> ../src/*). Os arquivos do front são
 * interpretados como CommonJS pelo tsx (o front não declara "type":"module"),
 * então usamos import dinâmico com fallback de interop (.default) para extrair
 * os exports nomeados de forma robusta — sem duplicar os dados.
 */
function pick<T>(mod: Record<string, unknown>, key: string): T {
  const direct = mod[key];
  if (direct !== undefined) return direct as T;
  const def = mod.default as Record<string, unknown> | undefined;
  return def?.[key] as T;
}

async function main() {
  const brands = pick<Brand[]>(await import("@/data/brands"), "brands");
  const categories = pick<Category[]>(await import("@/data/categories"), "categories");
  const products = pick<Product[]>(await import("@/data/products"), "products");
  const coupons = pick<Coupon[]>(await import("@/data/coupons"), "coupons");
  const accountMod = await import("@/data/account");
  const demoUser = pick<User>(accountMod, "demoUser");
  const demoOrders = pick<Order[]>(accountMod, "demoOrders");

  console.log("Limpando tabelas…");
  // Ordem reversa de dependência.
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.productTag.deleteMany();
  await prisma.productSpec.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.seller.deleteMany();
  await prisma.newsletterSubscriber.deleteMany();

  console.log("Marcas…");
  await prisma.brand.createMany({
    data: brands.map((b) => ({ id: b.id, name: b.name, slug: b.slug, logoUrl: b.logoUrl })),
  });

  console.log("Vendedores…");
  const sellers = new Map(products.map((p) => [p.seller.id, p.seller]));
  await prisma.seller.createMany({
    data: [...sellers.values()].map((s) => ({
      id: s.id,
      name: s.name,
      rating: s.rating,
      official: s.official,
    })),
  });

  console.log("Categorias…");
  await prisma.category.createMany({
    data: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parentSlug: c.parentSlug ?? null,
      imageUrl: c.imageUrl,
      description: c.description ?? null,
    })),
  });

  console.log("Cupons…");
  await prisma.coupon.createMany({
    data: coupons.map((c) => ({
      code: c.code.toUpperCase(),
      type: c.type,
      value: c.value,
      minSubtotal: c.minSubtotal ?? null,
      description: c.description,
    })),
  });

  console.log(`Produtos (${products.length})…`);
  for (const p of products) {
    await prisma.product.create({
      data: {
        id: p.id,
        name: p.name,
        slug: p.slug,
        brandId: p.brandId,
        sellerId: p.seller.id,
        categorySlug: p.categorySlug,
        subcategorySlug: p.subcategorySlug ?? null,
        listPrice: p.listPrice,
        price: p.price,
        ref: p.ref,
        shortDescription: p.shortDescription,
        description: p.description,
        rating: p.rating,
        reviewCount: p.reviewCount,
        totalStock: p.totalStock,
        freeShipping: p.freeShipping,
        offerEndsAt: p.offerEndsAt ? new Date(p.offerEndsAt) : null,
        soldCount: p.soldCount,
        createdAt: new Date(p.createdAt),
        images: { create: p.images.map((url, i) => ({ url, position: i })) },
        specs: { create: p.specs.map((s, i) => ({ label: s.label, value: s.value, position: i })) },
        tags: { create: p.tags.map((tag) => ({ tag })) },
        variants: {
          create: p.variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            stock: v.stock,
            imageUrl: v.imageUrl ?? null,
            color: v.options.color ?? null,
            size: v.options.size ?? null,
          })),
        },
        reviews: {
          create: p.reviews.map((r) => ({
            id: r.id,
            author: r.author,
            rating: r.rating,
            title: r.title,
            comment: r.comment,
            date: new Date(r.date),
            verified: r.verified,
          })),
        },
      },
    });
  }

  console.log("Usuário demo + endereços + pedidos…");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await prisma.user.create({
    data: {
      name: demoUser.name,
      email: demoUser.email.toLowerCase(),
      passwordHash,
      role: "admin", // usuário demo é administrador (acessa /admin)
      cpf: demoUser.cpf ?? null,
      phone: demoUser.phone ?? null,
      addresses: {
        create: demoUser.addresses.map((a) => ({
          label: a.label,
          recipient: a.recipient,
          cep: a.cep,
          street: a.street,
          number: a.number,
          complement: a.complement ?? null,
          district: a.district,
          city: a.city,
          state: a.state,
          isDefault: a.isDefault ?? false,
        })),
      },
    },
  });

  for (const o of demoOrders) {
    await prisma.order.create({
      data: {
        number: o.number,
        userId: user.id,
        status: o.status,
        subtotal: o.subtotal,
        discount: o.discount,
        shipping: o.shipping,
        total: o.total,
        payment: o.payment,
        shippingLabel: o.shippingLabel,
        addressSnapshot: JSON.stringify(o.address),
        createdAt: new Date(o.createdAt),
        items: {
          create: o.items.map((it) => ({
            productId: it.productId,
            name: it.name,
            imageUrl: it.imageUrl,
            variantLabel: it.variantLabel ?? null,
            unitPrice: it.unitPrice,
            quantity: it.quantity,
          })),
        },
      },
    });
  }

  console.log(`\n✅ Seed concluído.`);
  console.log(`   Login demo: ${demoUser.email} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
