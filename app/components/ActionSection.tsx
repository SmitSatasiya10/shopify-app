import { useAppBridge } from "@shopify/app-bridge-react";

interface ActionSectionProps {
  onSync: () => void;
  product?: any;
  error?: string;
  isLoading: boolean;
}

export function ActionSection({ onSync, product, error, isLoading }: ActionSectionProps) {
  const shopify = useAppBridge();

  return (
    <s-section heading="Quick Actions">
      <s-paragraph>
        Manage your store's custom data and definitions. 
      </s-paragraph>
      <div style={{ marginTop: '1rem' }}>
        <s-button onClick={onSync}>Sync/Fix Metafield Definitions</s-button>
      </div>
      
      {product && (
        <div style={{ marginTop: '1rem' }}>
           <s-box padding="base" borderWidth="base" borderRadius="base">
             <s-text>Product Created!</s-text>
             <div style={{ marginTop: '0.5rem' }}>
               <s-button onClick={() => shopify.intents.invoke?.("edit:shopify/Product", { value: product.id })}>
                  View Product
               </s-button>
             </div>
           </s-box>
        </div>
      )}

      {error && (
         <div style={{ marginTop: '1rem' }}>
           <s-box padding="base" borderRadius="base">
             <s-text tone="critical">Failed to create product: {error}</s-text>
           </s-box>
         </div>
      )}
    </s-section>
  );
}
