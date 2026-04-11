# Prisma Markdown

## Structure

```mermaid
erDiagram
"users" {
  String id PK
  String email UK
  DateTime emailVerified "nullable"
  String name UK
  String passwordHash
  String phone UK "nullable"
  DateTime birthday "nullable"
  Gender gender "nullable"
  Role role
  Boolean isActivated
  String activationToken UK "nullable"
  String provider "nullable"
  String providerId UK "nullable"
  String avatarUrl "nullable"
  DateTime createdAt
  DateTime updatedAt
  String resetPasswordToken UK "nullable"
  DateTime resetPasswordExpires "nullable"
  String twoFactorSecret "nullable"
  Boolean is2FAEnabled
  String defaultAddress "nullable"
  Float defaultLat "nullable"
  Float defaultLng "nullable"
}
"tokens" {
  String id PK
  String refreshToken UK
  String userId FK
  DateTime createdAt
}
"Brand" {
  String id PK
  String name UK
  String country
  String slug UK
  String image "nullable"
  DateTime createdAt
  DateTime updatedAt
}
"Motorcycle" {
  String id PK
  String model
  String slug UK
  String brandId FK
  MotoCategory category
  Int year
  Int displacement
  Float power "nullable"
  Int topSpeed "nullable"
  Float fuelConsumption "nullable"
  String engineType "nullable"
  String fuelSystem "nullable"
  CoolingType coolingSystem "nullable"
  GearboxType gearbox "nullable"
  TransmissionType transmission "nullable"
  String frontTyre "nullable"
  String rearTyre "nullable"
  String frontBrakes "nullable"
  String rearBrakes "nullable"
  String colors
  StarterType starter "nullable"
  String comments "nullable"
  Float rating
  Int price
  String siteCategoryId FK
  DateTime createdAt
  DateTime updatedAt
}
"SiteCategory" {
  String id PK
  String name UK
  String slug UK
  String imageUrl "nullable"
  String description "nullable"
  DateTime createdAt
  DateTime updatedAt
}
"ProductImage" {
  String id PK
  String url
  Boolean isMain
  String motorcycleId FK
  DateTime createdAt
}
"Favorite" {
  String id PK
  String userId FK
  String motorcycleId FK
  DateTime createdAt
}
"Warehouse" {
  String id PK
  String name UK
  String city
  Float lat
  Float lng
}
"Stock" {
  String id PK
  String motorcycleId FK
  String warehouseId FK
  Int quantity
  Int reserved
}
"Order" {
  String id PK
  Int orderNumber UK
  String userId FK
  OrderStatus status
  String address
  Float deliveryLat
  Float deliveryLng
  Float distance
  Float deliveryCost
  DateTime estimatedDate
  Float totalPrice
  String paymentId UK "nullable"
  String paymentStatus "nullable"
  String paymentUrl "nullable"
  String warehouseId FK
  DateTime createdAt
  DateTime updatedAt
}
"OrderItem" {
  String id PK
  String orderId FK
  String motorcycleId FK
  Int quantity
  Float priceAtOrder
}
"PersonalDiscount" {
  String id PK
  String userId FK
  String motorcycleId FK
  Int discountPercent
  DateTime createdAt
  DateTime expiresAt
}
"PromoCode" {
  String id PK
  String code UK
  Int discountAmount
  Boolean isActive
  DateTime createdAt
  DateTime expiresAt
  Int usedCount
}
"UsedPromo" {
  String id PK
  String userId FK
  String promoCodeId FK
  DateTime usedAt
}
"support_tickets" {
  String id PK
  String userId FK "nullable"
  String lastName
  String firstName
  String email
  String phone "nullable"
  TicketCategory category
  String description
  TicketStatus status
  DateTime createdAt
  DateTime updatedAt
  String answer "nullable"
  DateTime answeredAt "nullable"
}
"support_attachments" {
  String id PK
  String ticketId FK
  String fileUrl
  String fileType
  String originalName
  Int size "nullable"
}
"tokens" }o--|| "users" : user
"Motorcycle" }o--|| "Brand" : brand
"Motorcycle" }o--|| "SiteCategory" : siteCategory
"ProductImage" }o--|| "Motorcycle" : motorcycle
"Favorite" }o--|| "users" : user
"Favorite" }o--|| "Motorcycle" : motorcycle
"Stock" }o--|| "Motorcycle" : motorcycle
"Stock" }o--|| "Warehouse" : warehouse
"Order" }o--|| "users" : user
"Order" }o--|| "Warehouse" : warehouse
"OrderItem" }o--|| "Order" : order
"OrderItem" }o--|| "Motorcycle" : motorcycle
"PersonalDiscount" }o--|| "users" : user
"PersonalDiscount" }o--|| "Motorcycle" : motorcycle
"UsedPromo" }o--|| "users" : user
"UsedPromo" }o--|| "PromoCode" : promoCode
"support_tickets" }o--o| "users" : user
"support_attachments" }o--|| "support_tickets" : ticket
```

### `users`

Properties as follows:

- `id`:
- `email`:
- `emailVerified`:
- `name`:
- `passwordHash`:
- `phone`:
- `birthday`:
- `gender`:
- `role`:
- `isActivated`:
- `activationToken`:
- `provider`:
- `providerId`:
- `avatarUrl`:
- `createdAt`:
- `updatedAt`:
- `resetPasswordToken`:
- `resetPasswordExpires`:
- `twoFactorSecret`:
- `is2FAEnabled`:
- `defaultAddress`:
- `defaultLat`:
- `defaultLng`:

### `tokens`

Properties as follows:

- `id`:
- `refreshToken`:
- `userId`:
- `createdAt`:

### `Brand`

Properties as follows:

- `id`:
- `name`:
- `country`:
- `slug`:
- `image`:
- `createdAt`:
- `updatedAt`:

### `Motorcycle`

Properties as follows:

- `id`:
- `model`:
- `slug`:
- `brandId`:
- `category`:
- `year`:
- `displacement`:
- `power`:
- `topSpeed`:
- `fuelConsumption`:
- `engineType`:
- `fuelSystem`:
- `coolingSystem`:
- `gearbox`:
- `transmission`:
- `frontTyre`:
- `rearTyre`:
- `frontBrakes`:
- `rearBrakes`:
- `colors`:
- `starter`:
- `comments`:
- `rating`:
- `price`:
- `siteCategoryId`:
- `createdAt`:
- `updatedAt`:

### `SiteCategory`

Properties as follows:

- `id`:
- `name`:
- `slug`:
- `imageUrl`:
- `description`:
- `createdAt`:
- `updatedAt`:

### `ProductImage`

Properties as follows:

- `id`:
- `url`:
- `isMain`:
- `motorcycleId`:
- `createdAt`:

### `Favorite`

Properties as follows:

- `id`:
- `userId`:
- `motorcycleId`:
- `createdAt`:

### `Warehouse`

Properties as follows:

- `id`:
- `name`:
- `city`:
- `lat`:
- `lng`:

### `Stock`

Properties as follows:

- `id`:
- `motorcycleId`:
- `warehouseId`:
- `quantity`:
- `reserved`:

### `Order`

Properties as follows:

- `id`:
- `orderNumber`:
- `userId`:
- `status`:
- `address`:
- `deliveryLat`:
- `deliveryLng`:
- `distance`:
- `deliveryCost`:
- `estimatedDate`:
- `totalPrice`:
- `paymentId`:
- `paymentStatus`:
- `paymentUrl`:
- `warehouseId`:
- `createdAt`:
- `updatedAt`:

### `OrderItem`

Properties as follows:

- `id`:
- `orderId`:
- `motorcycleId`:
- `quantity`:
- `priceAtOrder`:

### `PersonalDiscount`

Properties as follows:

- `id`:
- `userId`:
- `motorcycleId`:
- `discountPercent`:
- `createdAt`:
- `expiresAt`:

### `PromoCode`

Properties as follows:

- `id`:
- `code`:
- `discountAmount`:
- `isActive`:
- `createdAt`:
- `expiresAt`:
- `usedCount`:

### `UsedPromo`

Properties as follows:

- `id`:
- `userId`:
- `promoCodeId`:
- `usedAt`:

### `support_tickets`

Properties as follows:

- `id`:
- `userId`:
- `lastName`:
- `firstName`:
- `email`:
- `phone`:
- `category`:
- `description`:
- `status`:
- `createdAt`:
- `updatedAt`:
- `answer`:
- `answeredAt`:

### `support_attachments`

Properties as follows:

- `id`:
- `ticketId`:
- `fileUrl`:
- `fileType`:
- `originalName`:
- `size`:
