export async function getLocationId(admin: any) {
  const res = await admin.graphql(`
    {
      locations(first: 1) {
        edges {
          node { id }
        }
      }
    }
  `);

  const json = await res.json();
  return json.data.locations.edges[0].node.id;
}

export async function activateInventory(
  admin: any,
  inventoryItemId: string,
  locationId: string
) {
  return admin.graphql(
    `#graphql
    mutation activateInventory($inventoryItemId: ID!, $locationId: ID!) {
      inventoryActivate(
        inventoryItemId: $inventoryItemId
        locationId: $locationId
      ) {
        inventoryLevel { id }
        userErrors { message }
      }
    }`,
    { variables: { inventoryItemId, locationId } }
  );
}

export async function setInventoryQuantity(
  admin: any,
  inventoryItemId: string,
  locationId: string,
  quantity: number
) {
  return admin.graphql(
    `#graphql
    mutation adjustInventory($input: InventoryAdjustQuantitiesInput!) {
      inventoryAdjustQuantities(input: $input) {
        userErrors { message }
      }
    }`,
    {
      variables: {
        input: {
          reason: "correction",
          name: "available",
          changes: [
            {
              inventoryItemId,
              locationId,
              delta: quantity,
            },
          ],
        },
      },
    }
  );
}