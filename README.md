# Food delivery app API documentation

This API allows customers to order food from their favourite restaurants
and get them delivered.

**Endpoints**

### 1. List of menu items

**Endpoint**: `GET /items`
**Description**: List menu items available.

#### Response:

**success**:

**status**: `200 OK`

```json
[
  {
    "id": 1,
    "name": "",
    "type": "",
    "price":
  },
  {
    "id": 2,
    "name": "",
    "type": "",
    "price":
  },
  {
    "id": 3,
    "name": "",
    "type": "",
    "price":
  }
]
```

---

### 2. Placing an order from a restaurant

**Endpoint**: `POST /users/orders`
**Description**: A customer orders item(s).

#### Parameters:

- `kitchen_id`: id of the kitchen item(s) ordered from.
- `item_id`: id of the item ordered.
- `num_of_items`: number of the item in that order.
- `price`: price of the item ordered.

#### Response:

**success**:

**status**: `201 Created`

```json
{
    "id": 1,
    "customer_id": ,
    "driver_id": ,
    "status": "",
    "items_ordered": ,
    "total_price":
}
```

---

### 3. Cancelling an order

**Endpoint**: `DELETE /users/orders/${id}`
**Description**: Cancells a placed order.

#### Response:

**success**:

**status**: `204 No Content`
