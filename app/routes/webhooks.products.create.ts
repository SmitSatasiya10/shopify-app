import { authenticate } from "../shopify.server";
import { ensureMetafieldDefinitions, setProductDefaultMetafields } from "../utils/metafields.server";

export const action = async ({ request }: any) => {
  const { admin, payload } = await authenticate.webhook(request);

  if (!admin) {
    console.log("No admin in webhook");
    return new Response("No admin", { status: 401 });
  }

  const productId = payload.id;

  try {
    await ensureMetafieldDefinitions(admin);

    await setProductDefaultMetafields(admin, productId);

  } catch (error) {
    console.error("Webhook error:", error);
  }

  return new Response();
};