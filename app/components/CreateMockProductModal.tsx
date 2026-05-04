import { useState } from "react";

export function CreateMockProduct({ fetcher }: { fetcher: any }) {
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";

  const [productData, setProductData] = useState({
    name: "",
    quantity: "10",
    rating: "5",
    description: "Premium product description.",
  });

  const handleCreate = () => {
    const formData = new FormData();
    
    formData.append("name", productData.name);
    formData.append("quantity", productData.quantity);
    formData.append("rating", productData.rating);
    formData.append("description", productData.description);
    fetcher.submit(formData, {
      method: "post",
      action: "/app?index", 
    });
  };

  return (
    <>
      {/* BUTTON */}
      <s-button
        slot="primary-action"
        variant="primary"
        commandFor="product-modal"
        {...(isLoading ? { loading: true } : {})}
      >
        Generate Mock Product 
      </s-button>

      {/* MODAL */}
      <s-modal id="product-modal" heading="Generate New Product">
        <s-stack direction="block" gap="base">
          <s-text-field
            label="Product Name"
            value={productData.name}
            onChange={(e: any) =>
              setProductData({
                ...productData,
                name: e.currentTarget.value,
              })
            }
          />

          <s-text-field
            label="Quantity"
            value={productData.quantity}
            onChange={(e: any) =>
              setProductData({
                ...productData,
                quantity: e.currentTarget.value,
              })
            }
          />

          <s-text-field
            label="Rating (1-5)"
            value={productData.rating}
            onChange={(e: any) =>
              setProductData({
                ...productData,
                rating: e.currentTarget.value,
              })
            }
          />

          <s-text-field
            label="Description"
            value={productData.description}
            onChange={(e: any) =>
              setProductData({
                ...productData,
                description: e.currentTarget.value,
              })
            }
          />
        </s-stack>

        <s-button
          slot="secondary-actions"
          commandFor="product-modal"
          command="--hide"
        >
          Cancel
        </s-button>

        <s-button
          slot="primary-action"
          variant="primary"
          commandFor="product-modal"
          command="--hide"
          onClick={handleCreate}
          {...(isLoading ? { loading: true } : {})}
        >
          Create Product
        </s-button>
      </s-modal>
    </>
  );
}
