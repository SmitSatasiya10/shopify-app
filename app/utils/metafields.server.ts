export const METAFIELD_DEFINITIONS = [
  {
    namespace: "custom",
    key: "note",
    name: "Note",
    type: "single_line_text_field",
    ownerType: "PRODUCT",
  },
  {
    namespace: "custom",
    key: "rating",
    name: "Rating",
    type: "number_integer",
    ownerType: "PRODUCT",
  },
  {
    namespace: "custom",
    key: "featured",
    name: "Featured",
    type: "boolean",
    ownerType: "PRODUCT",
  },
  
];

/* Ensures that the required metafield definitions exist in the shop and are PINNED.
 */

export async function ensureMetafieldDefinitions(admin: any) {
  console.log("Checking/Creating/Pinning Metafield Definitions...");

  for (const definition of METAFIELD_DEFINITIONS) {
    try {
      const createResponse: any = await admin.graphql(
        `mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
          metafieldDefinitionCreate(definition: $definition) {
            createdDefinition { id name }
            userErrors { field message code }
          }
        }`,
        { variables: { definition } }
      );

      const createResult: any = await createResponse.json();
      const createErrors = createResult.data?.metafieldDefinitionCreate?.userErrors;
      let definitionId = createResult.data?.metafieldDefinitionCreate?.createdDefinition?.id;

      if (createErrors && createErrors.length > 0) {
        if (createErrors.some((e: any) => e.code === "TAKEN")) {
          console.log(`Metafield definition for ${definition.key} already exists. Fetching ID...`);
          const findResponse: any = await admin.graphql(
            `query findDefinition($namespace: String!, $key: String!) {
              metafieldDefinitions(first: 1, ownerType: PRODUCT, namespace: $namespace, key: $key) {
                edges { node { id } }
              }
            }`,
            { variables: { namespace: definition.namespace, key: definition.key } }
          );
          const findResult = await findResponse.json();
          definitionId = findResult.data?.metafieldDefinitions?.edges[0]?.node?.id;
        }
      }

      if (definitionId) {
        console.log(`Pinning metafield definition ${definition.key} (${definitionId})...`);
        await admin.graphql(
          `mutation metafieldDefinitionPin($definitionId: ID!) {
            metafieldDefinitionPin(definitionId: $definitionId) {
              userErrors { message }
            }
          }`,
          { variables: { definitionId } }
        );
      }
    } catch (error) {
      console.error(`Exception ensuring metafield definition ${definition.key}:`, error);
    }
  }
}

/**
 * Syncs product tags based on metafield values.
 */
export async function syncProductTags(admin: any, productId: string, rating: number | string, featured: boolean | string) {
  const isTopRated = Number(rating) >= 4;
  const isFeatured = String(featured) === "true";

  try {
    const queryResponse = await admin.graphql(`
      query getTags($id: ID!) {
        product(id: $id) { tags }
      }
    `, { variables: { id: productId } });

    const queryData = await queryResponse.json();
    let tags = queryData.data?.product?.tags || [];

    // Logistic for Top-Rated
    if (isTopRated && !tags.includes("Top-Rated")) tags.push("Top-Rated");
    if (!isTopRated && tags.includes("Top-Rated")) tags = tags.filter((t: string) => t !== "Top-Rated");

    // Logistic for Featured
    if (isFeatured && !tags.includes("Featured")) tags.push("Featured");
    if (!isFeatured && tags.includes("Featured")) tags = tags.filter((t: string) => t !== "Featured");

    await admin.graphql(`
      mutation updateTags($id: ID!, $tags: [String!]) {
        productUpdate(input: { id: $id, tags: $tags }) {
          product { id tags }
        }
      }
    `, { variables: { id: productId, tags } });

    console.log(`🏷 Tags synced for product ${productId}: ${tags.join(", ")}`);
  } catch (error) {
    console.error(" Error syncing product tags:", error);
  }
}

/**
 * Sets default metafields for a product.
 */
export async function setProductDefaultMetafields(admin: any, productId: string) {
  const rating = Math.floor(Math.random() * 5) + 1;
  const featured = Math.random() > 0.5;
  const note = "-";

  console.log(`Setting default metafields for product ${productId}`);
  const formattedId = productId.startsWith("gid://") ? productId : `gid://shopify/Product/${productId}`;

  try {
    const response = await admin.graphql(
      `mutation setMetafield($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          userErrors { message field }
        }
      }`,
      {
        variables: {
          metafields: [
            { ownerId: formattedId, namespace: "custom", key: "note", type: "single_line_text_field", value: note },
            { ownerId: formattedId, namespace: "custom", key: "rating", type: "number_integer", value: String(rating) },
            { ownerId: formattedId, namespace: "custom", key: "featured", type: "boolean", value: String(featured) },
          ],
        },
      }
    );

    const result = await response.json();
    if (result.data?.metafieldsSet?.userErrors?.length > 0) {
      console.error(`Store Error for ${productId}:`, result.data.metafieldsSet.userErrors);
    } else {
      await syncProductTags(admin, formattedId, rating, featured);
      console.log(`Success for ${productId}`);
    }
  } catch (error) {
    console.error("Exception setting metafields:", error);
  }
}

/**
 * Initializes metafields for all products.
 */
export async function initializeAllProducts(admin: any) {
  console.log("Initializing metafields for all products...");
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    try {
      const response: any = await admin.graphql(
        `query getProducts($cursor: String) {
          products(first: 50, after: $cursor) {
            pageInfo { hasNextPage endCursor }
            edges { node { id } }
          }
        }`,
        { variables: { cursor } }
      );
      const data: any = await response.json();
      const products = data.data?.products?.edges || [];
      for (const edge of products) {
        await setProductDefaultMetafields(admin, edge.node.id);
      }
      hasNextPage = data.data?.products?.pageInfo?.hasNextPage;
      cursor = data.data?.products?.pageInfo?.endCursor;
    } catch (error) {
      console.error(" Error during initialization:", error);
      hasNextPage = false;
    }
  }
}

/**
 * Sets specific metafield values for a product.
 */
export async function setProductMetafields(
  admin: any,
  productId: string,
  values: { note: string; rating: string; featured: string }
) {
  try {
    const response: any = await admin.graphql(
      `mutation setMetafield($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { id key value }
          userErrors { message }
        }
      }`,
      {
        variables: {
          metafields: [
            { ownerId: productId, namespace: "custom", key: "note", type: "single_line_text_field", value: values.note },
            { ownerId: productId, namespace: "custom", key: "rating", type: "number_integer", value: values.rating },
            { ownerId: productId, namespace: "custom", key: "featured", type: "boolean", value: values.featured },
          ],
        },
      }
    );

    await syncProductTags(admin, productId, values.rating, values.featured);
    return await response.json();
  } catch (error) {
    console.error(" Exception setting manual metafields:", error);
    throw error;
  }
}
