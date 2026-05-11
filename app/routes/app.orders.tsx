import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { GET_ORDERS } from "../graphql/order";
import { useState, useMemo } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(GET_ORDERS, {
    variables: { first: 50 },
  });

  const json: any = await response.json();
  const orders = json.data?.orders?.edges?.map((edge: any) => edge.node) || [];

  return { orders };
};

export default function OrdersPage() {
  const { orders } = useLoaderData<typeof loader>();
  const [filterMissing, setFilterMissing] = useState(false);
  const [search, setSearch] = useState("");

  const processedOrders = useMemo(() => {
    return orders.filter((order: any) => {
      const hasTracking = order.fulfillments?.some(
        (f: any) => f.trackingInfo?.some((t: any) => t.number)
      );

      const status = order.displayFulfillmentStatus?.toUpperCase();
      const isFulfilled = status === "FULFILLED" || status === "PARTIALLY_FULFILLED";
      const isMissingTracking = isFulfilled && !hasTracking;

      const customerName = order.customer
        ? `${order.customer.firstName} ${order.customer.lastName}`.toLowerCase()
        : "";

      const matchesSearch =
        order.name.toLowerCase().includes(search.toLowerCase()) ||
        customerName.includes(search.toLowerCase());

      if (filterMissing) {
        return isMissingTracking && matchesSearch;
      }
      return matchesSearch;
    });
  }, [orders, filterMissing, search]);

  return (
    <s-page heading="Order Tracking">
      <s-section>
        <s-stack direction="inline" justifyContent="space-between" alignItems="center" padding="base">
          <s-stack direction="block" gap="small">
            <s-text-field
              placeholder="Search by order or customer..."
              value={search}
              onInput={(e: any) => setSearch(e.target.value)}
              icon="search"
            />
          </s-stack>

          <s-stack direction="inline" gap="base" alignItems="center">
            <s-text>Filter by:</s-text>
            <s-button
              variant={filterMissing ? "primary" : "secondary"}
              onClick={() => setFilterMissing(!filterMissing)}
            >
              {filterMissing ? "Showing Missing Tracking" : "Show Missing Tracking"}
            </s-button>
          </s-stack>
        </s-stack>

        <s-table>
          <s-table-header-row>
            <s-table-header>Order</s-table-header>
            <s-table-header>Date</s-table-header>
            <s-table-header>Customer</s-table-header>
            <s-table-header>Total</s-table-header>
            <s-table-header>Fulfillment</s-table-header>
            <s-table-header>Tracking</s-table-header>
            <s-table-header>Action</s-table-header>
          </s-table-header-row>

          <s-table-body>
            {processedOrders.length === 0 ? (
              <s-table-row>
                <s-table-cell>
                  <s-box padding="base" text-align="center">
                    <s-text>No orders found.</s-text>
                  </s-box>
                </s-table-cell>
              </s-table-row>
            ) : (
              processedOrders.map((order: any) => {
                const hasTracking = order.fulfillments?.some(
                  (f: any) => f.trackingInfo?.some((t: any) => t.number)
                );
                const status = order.displayFulfillmentStatus?.toUpperCase();
                const isFulfilled = status === "FULFILLED" || status === "PARTIALLY_FULFILLED";
                const isMissingTracking = isFulfilled && !hasTracking;

                const trackingNumber = order.fulfillments?.[0]?.trackingInfo?.[0]?.number || "N/A";

                return (
                  <s-table-row key={order.id}>
                    <s-table-cell>
                      <s-text><strong>{order.name}</strong></s-text>
                    </s-table-cell>
                    <s-table-cell>
                      <s-text>{new Date(order.createdAt).toLocaleDateString()}</s-text>
                    </s-table-cell>
                    <s-table-cell>
                      <s-text>{order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : "No Customer"}</s-text>
                    </s-table-cell>
                    <s-table-cell>
                      <s-text>
                        {order.totalPriceSet.presentmentMoney.amount} {order.totalPriceSet.presentmentMoney.currencyCode}
                      </s-text>
                    </s-table-cell>
                    <s-table-cell>
                      <s-badge
                        tone={isFulfilled ? "success" : "warning"}
                      >
                        {order.displayFulfillmentStatus}
                      </s-badge>
                    </s-table-cell>
                    <s-table-cell>
                      {isMissingTracking ? (
                        <s-badge tone="critical">Missing Tracking</s-badge>
                      ) : (
                        <s-text>{trackingNumber}</s-text>
                      )}
                    </s-table-cell>
                    <s-table-cell>
                      <s-link href={`shopify://admin/orders/${order.id.split("/").pop()}`}>
                        <s-button variant="secondary">View in Admin</s-button>
                      </s-link>
                    </s-table-cell>
                  </s-table-row>
                );
              })
            )}
          </s-table-body>
        </s-table>
      </s-section>

      <s-section slot="aside" heading="Tracking Health">
        <s-stack direction="block" gap="base">
          <s-text>
            Orders missing tracking numbers after fulfillment can lead to customer complaints and lost packages.
          </s-text>
          <s-text>
            Tip: Use the "Missing Tracking" filter to quickly identify orders that need attention.
          </s-text>
        </s-stack>
      </s-section>
    </s-page>
  );
}
