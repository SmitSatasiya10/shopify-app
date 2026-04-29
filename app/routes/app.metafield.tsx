import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { setProductMetafields } from "../utils/metafields.server";
import { BulkMetafieldTable } from "../components/BulkMetafieldTable";

// ---------------- LOADER ----------------
export const loader = async ({ request }: any) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    {
      products(first: 20) {
        edges {
          node {
            id
            title

            variants(first: 1) {
              edges {
                node {
                  inventoryItem {
                    id
                    inventoryLevels(first: 10) {
                      edges {
                        node {
                          location { id }
                          quantities(names: ["available"]) { quantity }
                        }
                      }
                    }
                  }
                }
              }
            }

            note: metafield(namespace: "custom", key: "note") { value }
            rating: metafield(namespace: "custom", key: "rating") { value }
            featured: metafield(namespace: "custom", key: "featured") { value }
          }
        }
      }
    }
  `);

  const data: any = await response.json();

  const products =
    data.data?.products?.edges?.map((e: any) => {
      const variant = e.node.variants?.edges?.[0]?.node;
      const inventoryLevel =
        variant?.inventoryItem?.inventoryLevels?.edges?.[0]?.node;

      return {
        id: e.node.id,
        title: e.node.title,

        inventoryQuantity: Number(
          inventoryLevel?.quantities?.[0]?.quantity ?? 0,
        ),

        inventoryItemId: variant?.inventoryItem?.id ?? null,
        locationId: inventoryLevel?.location?.id ?? null,

        note: e.node.note?.value ?? "",
        rating: e.node.rating?.value ?? "",
        featured: e.node.featured?.value ?? "",
      };
    }) || [];

  return { products };
};

// ---------------- ACTION ----------------
export const action = async ({ request }: any) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const titles: Record<string, string> = {};
  const notes: Record<string, string> = {};
  const ratings: Record<string, string> = {};
  const featured: Record<string, string> = {};
  const quantities: Record<string, string> = {};
  const oldQuantities: Record<string, string> = {};
  const inventoryItemIds: Record<string, string> = {};
  const locationIds: Record<string, string> = {};

  // ---------------- PARSE FORM ----------------
  for (const [key, value] of formData.entries()) {
    const str = String(value);

    const match = key.match(/\[(.*)\]/);
    const id = match?.[1];
    if (!id) continue;

    if (key.startsWith("title[")) titles[id] = str;
    if (key.startsWith("note[")) notes[id] = str;
    if (key.startsWith("rating[")) ratings[id] = str;
    if (key.startsWith("featured[")) featured[id] = str;
    if (key.startsWith("quantity[")) quantities[id] = str;
    if (key.startsWith("oldQuantity[")) oldQuantities[id] = str;
    if (key.startsWith("inventoryItemId[")) inventoryItemIds[id] = str;
    if (key.startsWith("locationId[")) locationIds[id] = str;
  }

  try {
    const productIds = Object.keys({
      ...titles,
      ...notes,
      ...ratings,
      ...featured,
      ...quantities,
    });

    await Promise.all(
      productIds.map(async (productId) => {
        const oldQty = Number(oldQuantities[productId] || 0);
        const newQty = Number(quantities[productId] || 0);
        const delta = newQty - oldQty;

        return Promise.all([
          // ---------------- METAFIELDS ----------------
          setProductMetafields(admin, productId, {
            note: notes[productId] || "",
            rating: ratings[productId] || "0",
            featured: featured[productId] || "false",
          }),

          // ---------------- TITLE ----------------
          titles[productId]
            ? admin.graphql(
                `mutation updateProduct($input: ProductInput!) {
                  productUpdate(input: $input) {
                    product { id }
                    userErrors { message }
                  }
                }`,
                {
                  variables: {
                    input: {
                      id: productId,
                      title: titles[productId],
                    },
                  },
                },
              )
            : Promise.resolve(),

          // ---------------- INVENTORY DELTA FIX ----------------
          delta !== 0 &&
          inventoryItemIds[productId] &&
          locationIds[productId]
            ? admin.graphql(
                `mutation adjustInventory($input: InventoryAdjustQuantitiesInput!) {
                  inventoryAdjustQuantities(input: $input) {
                    userErrors { field message }
                  }
                }`,
                {
                  variables: {
                    input: {
                      reason: "correction",
                      name: "available",
                      changes: [
                        {
                          inventoryItemId: inventoryItemIds[productId],
                          locationId: locationIds[productId],
                          delta,
                        },
                      ],
                    },
                  },
                },
              )
            : Promise.resolve(),
        ]);
      }),
    );

    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { error: error.message };
  }
};

// ---------------- PAGE ----------------
export default function MetafieldPage() {
  const { products } = useLoaderData<any>();

  return (
    <s-page heading="Bulk Product Manager">
      <BulkMetafieldTable products={products} />
    </s-page>
  );
}