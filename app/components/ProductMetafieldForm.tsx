import { Form } from "react-router";

interface ProductMetafieldFormProps {
  products: any[];
  success?: boolean;
  error?: string;
}

export function ProductMetafieldForm({ products, success, error }: ProductMetafieldFormProps) {
  return (
    <s-section heading="Manage Product Custom Data">
      <Form method="post">
        <s-stack direction="block" gap="base">
          <div>
            <s-text>Select Product:</s-text>
            <select name="productId" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px', marginTop: '5px' }}>
              {products.length > 0 ? products.map((p: any) => (
                <option key={p.node.id} value={p.node.id}>
                  {p.node.title}
                </option>
              )) : (
                <option value="">No products found</option>
              )}
            </select>
          </div>

          <div>
            <s-text>Note:</s-text>
            <input name="note" placeholder="Enter custom note" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px', marginTop: '5px' }} />
          </div>

          <div>
            <s-text>Rating (1-5):</s-text>
            <input name="rating" type="number" min="1" max="5" placeholder="Enter rating" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px', marginTop: '5px' }} />
          </div>

          <div>
            <s-text>Featured Product:</s-text>
            <select name="featured" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px', marginTop: '5px' }}>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <s-button type="submit" variant="primary">Save Metafields</s-button>
        </s-stack>
      </Form>
      
      {success && (
        <div style={{ marginTop: '1rem' }}>
          <s-box padding="base" borderRadius="base">
            <s-text tone="success">✅ Saved successfully!</s-text>
          </s-box>
        </div>
      )}

      {error && (
        <div style={{ marginTop: '1rem' }}>
          <s-box padding="base" borderRadius="base">
            <s-text tone="critical">Error: {error}</s-text>
          </s-box>
        </div>
      )}
    </s-section>
  );
}
