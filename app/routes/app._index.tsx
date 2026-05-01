import { useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

import { StatsGrid } from "../components/StatsGrid";
import { ActionSection } from "../components/ActionSection";
import { TaskBox } from "../components/TaskBox";
import { RevenueChart } from "../components/RevenueChart";
import { CreateMockProduct } from "../components/CreateMockProductModal";
import {
  getLocationId,
  activateInventory,
  setInventoryQuantity,
} from "../utils/inventory.server";
import { GET_PRODUCTS, CREATE_PRODUCT } from "../graphql/product";
import { ENABLE_TRACKING } from "../graphql/inventory";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const productResponse = await admin.graphql(GET_PRODUCTS);

  const pData: any = await productResponse.json();
  const products = pData.data?.products?.edges || [];

  const totalProducts = products.length;
  let totalRating = 0;
  let ratedCount = 0;
  let featuredCount = 0;
  let lowRatedCount = 0;

  const tasks: any[] = [];
  const productRatingsMap: Record<string, number> = {};

  products.forEach(({ node }: any) => {
    if (node.rating?.value) {
      const val = parseInt(node.rating.value, 10);
      totalRating += val;
      ratedCount++;
      if (val < 3) lowRatedCount++;
      productRatingsMap[node.id] = val;
    }
    if (node.featured?.value === "true") featuredCount++;

    const missing = [];
    if (!node.rating?.value) missing.push("Rating");
    if (!node.note?.value || node.note.value.length < 5) missing.push("Note");

    if (missing.length > 0) {
      tasks.push({
        id: node.id,
        title: node.title,
        issue: missing.join(", "),
      });
    }
  });

  const avgRating =
    ratedCount > 0 ? (totalRating / ratedCount).toFixed(1) : "0.0";

  const chartData = [
    { rating: 1, revenue: 0 },
    { rating: 2, revenue: 0 },
    { rating: 3, revenue: 0 },
    { rating: 4, revenue: 0 },
    { rating: 5, revenue: 0 },
  ];

  return {
    stats: { totalProducts, avgRating, featuredCount, lowRatedCount },
    tasks: tasks.slice(0, 5),
    chartData,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const formData = await request.formData();
  const intent = formData.get("actionType");
  const name = formData.get("name") as string;
  const quantity = parseInt((formData.get("quantity") as string) || "0");
  const rating = formData.get("rating") as string;
  const description = formData.get("description") as string;

  try {
    const response = await admin.graphql(CREATE_PRODUCT, {
      variables: {
        product: {
          title: name || "New Product",
          descriptionHtml: description || "",
        },
      },
    });

    const json: any = await response.json();
    const product = json.data?.productCreate?.product;

    if (!product?.id) {
      return { error: "Product creation failed" };
    }

    const variant = product.variants.edges[0]?.node;
    const inventoryItemId = variant.inventoryItem.id;

    // ✅ NEW CLEAN INVENTORY FLOW
    await admin.graphql(ENABLE_TRACKING, {
      variables: { id: inventoryItemId },
    });

    const locationId = await getLocationId(admin);

    if (!locationId) {
      return { error: "No location found" };
    }
    await activateInventory(admin, inventoryItemId, locationId);

    await setInventoryQuantity(admin, inventoryItemId, locationId, quantity);

    // metafields (unchanged)
    await import("../utils/metafields.server").then(async (m) => {
      await m.setProductMetafields(admin, product.id, {
        rating: rating || "1",
        featured: "false",
        note: description || "Created via app",
      });
    });

    return { product };
  } catch (e: any) {
    return { error: e.message };
  }
};

export default function Index() {
  const { stats, tasks, chartData } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();

  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";

  useEffect(() => {
    if ((fetcher.data as any)?.product?.id) {
      shopify.toast.show("Product created successfully!");
    }

    if ((fetcher.data as any)?.error) {
      shopify.toast.show(`Error: ${(fetcher.data as any).error}`, {
        isError: true,
      });
    }
  }, [fetcher.data, shopify]);

  const syncMetafields = () =>
    fetcher.submit({ actionType: "sync" }, { method: "POST" });

  return (
    <s-page heading="Strategic Revenue Dashboard">
      <CreateMockProduct fetcher={fetcher} />

      <StatsGrid stats={stats} />

      <div style={{ marginBottom: "2rem" }}>
        <RevenueChart data={chartData} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <ActionSection
          onSync={syncMetafields}
          product={(fetcher.data as any)?.product}
          error={(fetcher.data as any)?.error}
          isLoading={isLoading}
        />
        <TaskBox tasks={tasks} />
      </div>

      <s-section slot="aside" heading="Navigation">
        <s-stack direction="block" gap="base">
          <s-link href="/app/metafield">Manual Data Editor</s-link>
        </s-stack>
      </s-section>
    </s-page>
  );
}
