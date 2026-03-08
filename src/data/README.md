# Product Library Documentation

## Structure

The product library is organized by brands. Each brand contains an array of products.

### File: `library.json`

```json
{
  "brands": [
    {
      "id": "brand-id",
      "name": "Brand Display Name",
      "products": [ /* array of product blocks */ ]
    }
  ]
}
```

## Adding a New Product

Add a new product object to the `products` array within the appropriate brand:

```json
{
  "id": "lib-sku-code",
  "title": "Product Full Title",
  "sku": "SKU_CODE",
  "imageSrc": "/images/products/sku-code.png",
  "imageOffsetY": -36,
  "imageOffsetX": -20,
  "imageScale": 1.05,
  "price": "$6.50/ea. $78.00/cs.",
  "packSize": "12/9.87 oz.",
  "description": "Full product description...",
  "template": "zig_product",
  "visible": true
}
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique identifier (use `lib-{sku}` format) |
| `title` | string | ✅ | Product full name |
| `sku` | string | ✅ | Product SKU code |
| `imageSrc` | string | ✅ | Path to product image |
| `imageOffsetY` | number | ❌ | Vertical image position adjustment (px) |
| `imageOffsetX` | number | ❌ | Horizontal image position adjustment (px) |
| `imageScale` | number | ❌ | Image scale factor (default: 1.0) |
| `price` | string | ✅ | Price information |
| `packSize` | string | ✅ | Package size/quantity |
| `description` | string | ✅ | Product description |
| `template` | string | ✅ | Layout template (`zig_product`, `category_banner`, etc.) |
| `visible` | boolean | ✅ | Initial visibility (usually `true`) |

## Adding a New Brand

To add a new brand, append a new object to the `brands` array:

```json
{
  "id": "new-brand",
  "name": "New Brand Name",
  "products": []
}
```

## Image Management

Place product images in: `/public/images/products/`

Example: `/public/images/products/tc25.png`

## Campaign Storage

- **Library**: `src/data/library.json` (source of truth for all products)
- **Current Campaign**: Auto-saved to browser localStorage
- **Export**: Downloads campaign as JSON file
- **Import**: Upload previously exported campaign JSON

## Workflow

1. Edit `library.json` to add/modify products
2. Place product images in `/public/images/products/`
3. Refresh browser - new products appear in sidebar
4. Drag products from library to campaign
5. Export campaign when done for backup/sharing
