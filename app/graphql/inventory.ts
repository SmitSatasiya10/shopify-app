// ---------------- ENABLE INVENTORY TRACKING ----------------
export const ENABLE_TRACKING = `#graphql
mutation enableTracking($id: ID!) {
  inventoryItemUpdate(id: $id, input: { tracked: true }) {
    inventoryItem { id }
  }
}
`;

