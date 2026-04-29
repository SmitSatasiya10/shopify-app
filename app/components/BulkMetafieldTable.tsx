import { useFetcher } from "react-router";
import { useState, useEffect } from "react";
import { CreateMockProduct } from "./CreateMockProductModal";
import { useMemo } from "react";

export function BulkMetafieldTable({ products }: { products: any[] }) {
  const createFetcher = useFetcher();
  const bulkFetcher = useFetcher();
  const isLoading =
    ["loading", "submitting"].includes(createFetcher.state) &&
    createFetcher.formMethod === "POST";

  const [loadingAi, setLoadingAi] = useState<string | null>(null);
  const [editingIds, setEditingIds] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [isBulkOptimizing, setIsBulkOptimizing] = useState(false);
  const [search, setSearch] = useState("");
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [collectionName, setCollectionName] = useState("");

  // -------------------------
  // STATE
  // -------------------------
  const [titles, setTitles] = useState<Record<string, string>>(
    Object.fromEntries(products.map((p) => [p.id, p.title])),
  );

  const [quantities, setQuantities] = useState<Record<string, string>>(
    Object.fromEntries(
      products.map((p) => [p.id, String(p.inventoryQuantity ?? "0")]),
    ),
  );

  const [notes, setNotes] = useState<Record<string, string>>(
    Object.fromEntries(products.map((p) => [p.id, p.note || ""])),
  );

  const [ratings, setRatings] = useState<Record<string, string>>(
    Object.fromEntries(products.map((p) => [p.id, p.rating || ""])),
  );

  const [featured, setFeatured] = useState<Record<string, boolean>>(
    Object.fromEntries(products.map((p) => [p.id, p.featured === "true"])),
  );

  useEffect(() => {
    setTitles(Object.fromEntries(products.map((p) => [p.id, p.title])));
    setQuantities(
      Object.fromEntries(
        products.map((p) => [p.id, String(p.inventoryQuantity ?? "0")]),
      ),
    );
    setNotes(Object.fromEntries(products.map((p) => [p.id, p.note || ""])));
    setRatings(Object.fromEntries(products.map((p) => [p.id, p.rating || ""])));
    setFeatured(
      Object.fromEntries(products.map((p) => [p.id, p.featured === "true"])),
    );
  }, [products]);

  // -------------------------
  // DERIVED
  // -------------------------
  const selectedIds = Object.keys(selected).filter((id) => selected[id]);
  const hasSelection = selectedIds.length > 0;

  // -------------------------
  // SAVE
  // -------------------------
  const handleSave = () => {
    const formData = new FormData();

    // ✅ OLD QUANTITY (for backend calculation)
    products.forEach((p: any) => {
      formData.append(`oldQuantity[${p.id}]`, String(p.inventoryQuantity ?? 0));

      if (p.inventoryItemId) {
        formData.append(`inventoryItemId[${p.id}]`, p.inventoryItemId);
      }

      if (p.locationId) {
        formData.append(`locationId[${p.id}]`, p.locationId);
      }
    });

    // TITLE
    Object.entries(titles).forEach(([id, value]) => {
      formData.append(`title[${id}]`, value);
    });

    // QUANTITY (NEW VALUE)
    Object.entries(quantities).forEach(([id, value]) => {
      formData.append(`quantity[${id}]`, value);
    });

    // METAFIELDS
    Object.entries(notes).forEach(([id, value]) => {
      formData.append(`note[${id}]`, value);
    });

    Object.entries(ratings).forEach(([id, value]) => {
      formData.append(`rating[${id}]`, value);
    });

    Object.entries(featured).forEach(([id, value]) => {
      formData.append(`featured[${id}]`, value ? "true" : "false");
    });

    bulkFetcher.submit(formData, { method: "post" });
  };

  // -------------------------
  // AI
  // -------------------------
  const fetchSuggestion = async (productName: string) => {
    const response = await fetch("/api/ai", {
      method: "POST",
      body: JSON.stringify({ productName }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    return data.suggestion || "";
  };

  const handleCreateCollection = () => {
    if (!selectedIds.length || !collectionName.trim()) return;

    const formData = new FormData();

    selectedIds.forEach((id) => {
      formData.append("productIds[]", id);
    });

    formData.append("title", collectionName);

    bulkFetcher.submit(formData, {
      method: "post",
      action: "/create-collection",
    });

    // reset
    setShowCollectionModal(false);
    setCollectionName("");
  };

  const getAiSuggestion = async (productId: string, productName: string) => {
    setLoadingAi(productId);

    const suggestion = await fetchSuggestion(productName);

    setNotes((prev) => ({
      ...prev,
      [productId]: suggestion,
    }));

    setLoadingAi(null);
  };

  // -------------------------
  // BULK AI
  // -------------------------
  const flashOptimize = async () => {
    if (isBulkOptimizing) return;
    setIsBulkOptimizing(true);

    for (const product of products) {
      const productId = product.id;

      if (!notes[productId]) {
        setLoadingAi(productId);

        const suggestion = await fetchSuggestion(product.title);

        setNotes((prev) => ({
          ...prev,
          [productId]: suggestion,
        }));

        await new Promise((r) => setTimeout(r, 200));
      }
    }

    setLoadingAi(null);
    setIsBulkOptimizing(false);
  };

  // Filter
  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.title.toLowerCase().includes(search.toLowerCase()),
    );
  }, [products, search]);

  const collectionHandler = () => {
    console.log("collection");
  };

  // -------------------------
  // UI
  // -------------------------
  return (
    <>
      {/* HEADER */}
      <CreateMockProduct fetcher={createFetcher} />
      {/* TABLE */}
      <s-section padding="none">
        <s-stack
          direction="inline"
          justifyContent="space-between"
          alignItems="center"
          padding="base"
        >
          {/* LEFT SEARCH */}
          <s-stack direction="block">
            <s-text-field
              placeholder="search"
              icon="search"
              autocomplete="off"
              value={search}
              onInput={(e: any) => setSearch(e.target.value)}
            />
          </s-stack>

          {/* RIGHT BUTTONS  */}
          {hasSelection && (
            <s-stack direction="inline" gap="small">
              <s-button
                variant="primary"
                onClick={() => setShowCollectionModal(true)}
                commandFor="modal"
              >
                Create Collection
              </s-button>
              <s-button
                variant="secondary"
                onClick={() => {
                  const map: Record<string, boolean> = {};
                  selectedIds.forEach((id: string) => (map[id] = true));
                  setEditingIds(map);
                }}
              >
                Bulk Edit
              </s-button>

              <s-button onClick={() => setSelected({})}>Clear</s-button>

              <s-button
                variant="primary"
                disabled={bulkFetcher.state !== "idle"}
                onClick={handleSave}
              >
                {bulkFetcher.state !== "idle" ? "Saving..." : "Apply Changes"}
              </s-button>

              <s-button onClick={() => setEditingIds({})}>Done All</s-button>
            </s-stack>
          )}
        </s-stack>
        <s-table>
          <s-table-header-row>
            <s-table-header>Select</s-table-header>
            <s-table-header>PRODUCT</s-table-header>
            <s-table-header>QUANTITY</s-table-header>
            <s-table-header>RATING</s-table-header>
            <s-table-header>FEATURE</s-table-header>
            <s-table-header>ACTION</s-table-header>
          </s-table-header-row>

          <s-table-body>
            {filteredProducts.map((product: any) => {
              const isEditing = !!editingIds[product.id];

              return (
                <s-table-row key={product.id}>
                  {/* SELECT */}
                  <s-table-cell>
                    <s-checkbox
                      checked={!!selected[product.id]}
                      onChange={(e: any) =>
                        setSelected({
                          ...selected,
                          [product.id]: e.target.checked,
                        })
                      }
                    />
                  </s-table-cell>

                  {/* PRODUCT */}
                  <s-table-cell>
                    {isEditing ? (
                      <s-text-field
                        value={titles[product.id]}
                        onInput={(e: any) =>
                          setTitles({
                            ...titles,
                            [product.id]: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <s-heading lineClamp={2}>{titles[product.id]}</s-heading>
                    )}
                  </s-table-cell>

                  {/* QUANTITY */}
                  <s-table-cell>
                    {isEditing ? (
                      <s-number-field
                        value={quantities[product.id]}
                        onInput={(e: any) => {
                          setQuantities((prev) => ({
                            ...prev,
                            [product.id]: String(e.target.value),
                          }));
                        }}
                      />
                    ) : (
                      <s-text>{quantities[product.id] || "—"}</s-text>
                    )}
                  </s-table-cell>

                  {/* RATING */}
                  <s-table-cell>
                    {isEditing ? (
                      <s-number-field
                        value={ratings[product.id]}
                        onInput={(e: any) =>
                          setRatings({
                            ...ratings,
                            [product.id]: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <s-text>{ratings[product.id] || "—"}</s-text>
                    )}
                  </s-table-cell>

                  {/* FEATURE */}
                  <s-table-cell>
                    {isEditing ? (
                      <s-checkbox
                        checked={featured[product.id]}
                        onChange={(e: any) =>
                          setFeatured({
                            ...featured,
                            [product.id]: e.target.checked,
                          })
                        }
                      />
                    ) : featured[product.id] ? (
                      <s-text>✔</s-text>
                    ) : (
                      <s-text>—</s-text>
                    )}
                  </s-table-cell>

                  {/* ACTION */}
                  <s-table-cell>
                    {isEditing ? (
                      <s-button
                        onClick={() =>
                          setEditingIds((prev) => {
                            const updated = { ...prev };
                            delete updated[product.id];
                            return updated;
                          })
                        }
                      >
                        Done
                      </s-button>
                    ) : (
                      <s-button
                        onClick={() =>
                          setEditingIds({
                            ...editingIds,
                            [product.id]: true,
                          })
                        }
                      >
                        Edit
                      </s-button>
                    )}
                  </s-table-cell>
                </s-table-row>
              );
            })}
          </s-table-body>
        </s-table>
      </s-section>

      {showCollectionModal && (
        <s-modal id="modal">
          <s-box padding="base">
            <s-stack direction="block" gap="base">
              <s-heading>Create Collection</s-heading>

              <s-text-field
                label="Collection Name"
                value={collectionName}
                onInput={(e: any) => setCollectionName(e.target.value)}
              />

              <s-stack direction="inline" gap="small">
                <s-button
                  variant="primary"
                  onClick={handleCreateCollection}
                  disabled={!collectionName.trim()}
                >
                  Create
                </s-button>

                <s-button onClick={() => setShowCollectionModal(false)}>
                  Cancel
                </s-button>
              </s-stack>
            </s-stack>
          </s-box>
        </s-modal>
      )}
    </>
  );
}
