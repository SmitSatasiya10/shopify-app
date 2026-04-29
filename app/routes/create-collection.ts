import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const productIds = formData.getAll("productIds[]");
  const title = formData.get("title") as string;

  //  Create collection
  const collectionRes = await admin.graphql(
    `mutation CreateCollection($title: String!) {
      collectionCreate(input: { title: $title }) {
        collection { id }
        userErrors { message }
      }
    }`,
    {
      variables: { title },
    }
  );

  const collectionData: any = await collectionRes.json();
  const collectionId =
    collectionData.data.collectionCreate.collection.id;

  // Add products
  await admin.graphql(
    `mutation AddProducts($id: ID!, $products: [ID!]!) {
      collectionAddProducts(id: $id, productIds: $products) {
        userErrors { message }
      }
    }`,
    {
      variables: {
        id: collectionId,
        products: productIds,
      },
    }
  );

  return { success: true };
};