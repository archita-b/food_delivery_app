# Food delivery app API documentation

This API allows customers to order food from their favourite restaurants
and get them delivered.

**Endpoints**

### 1. List of menu items

**Endpoint**: `GET /items`
**Description**: Lists menu items available.

#### Response:

**success**:

**status**: `200 OK`

```json
[
  {
    "id": 1,
    "name": "Margherita Pizza",
    "type": "veg",
    "price": "12.99"
  },
  {
    "id": 2,
    "name": "Pepperoni Pizza",
    "type": "non-veg",
    "price": "15.99"
  },
  {
    "id": 3,
    "name": "Vegan Burger",
    "type": "vegan",
    "price": "10.50"
  }
]
```

---

### 2. Placing an order from a restaurant

**Endpoint**: `POST /users/orders`
**Description**: A customer places an order with one or more items.

#### Parameters:

- `item_id`: id of the item ordered.
- `quantity`: number of the item in that order.

#### Response:

**success**:

**status**: `201 Created`

```json
{
  "order_id": 3,
  "customer_id": 3,
  "items": [
    {
      "item_id": 1,
      "quantity": 1
    },
    {
      "item_id": 3,
      "quantity": 2
    }
  ],
  "delivery_partner_id": null,
  "kitchen_id": 1,
  "order_status": "confirmed",
  "created_at": "2025-02-28T07:19:28.250Z"
}
```

**errors**:

**status**: `400 Bad Request`

```json
{
  "error": "Items are required."
}
```

**status**: `409 Conflict`

```json
{
  "error": "One or more items are out of stock."
}
```

---

### 3. Cancelling an order

**Endpoint**: `DELETE /users/orders/${id}`
**Description**: Cancells a placed order.

#### Response:

**success**:

**status**: `204 No Content`

**errors**:

**status**: `400 Bad Request`

```json
{
  "error": "Order ID is missing."
}
```

**status**: `404 Not Found`

```json
{
  "error": "Order does not exist."
}
```

**status**: `403 Forbidden`

```json
{
  "error": "Cancellation window has expired."
}
```
