// ---------------- GET PRODUCTS (Dashboard Loader) ----------------
export const GET_PRODUCTS = `#graphql
query getProducts {
  products(first: 250) {
    edges {
      node {
        id
        title
        rating: metafield(namespace: "custom", key: "rating") { value }
        featured: metafield(namespace: "custom", key: "featured") { value }
        note: metafield(namespace: "custom", key: "note") { value }
      }
    }
  }
}
`;

// ---------------- CREATE PRODUCT ----------------
export const CREATE_PRODUCT = `#graphql
mutation populateProduct($product: ProductCreateInput!) {
  productCreate(product: $product) {
    product {
      id
      variants(first: 1) {
        edges {
          node {
            id
            inventoryItem {
              id
            }
          }
        }
      }
    }
    userErrors { message }
  }
}
`;

