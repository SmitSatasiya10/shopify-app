export const GET_ORDERS = `#graphql
  query getOrders($first: Int!) {
    orders(first: $first, reverse: true) {
      edges {
        node {
          id
          name
          createdAt
          totalPriceSet {
            presentmentMoney {
              amount
              currencyCode
            }
          }
          displayFulfillmentStatus
          displayFinancialStatus
          customer {
            firstName
            lastName
            email
          }
          fulfillments {
            trackingInfo {
              number
              url
              company
            }
          }
        }
      }
    }
  }
`;
