# مخططات معمارية نظام Al-Zahra Smart ERP

## 1. الهيكل المعماري المستهدف (Clean Architecture)

```mermaid
graph TB
    subgraph Presentation[Presentation Layer]
        UI[UI Components]
        Pages[Page Components]
        Hooks[React Hooks]
    end

    subgraph Application[Application Layer]
        UseCases[Use Cases]
        DTO[DTOs]
        AppServices[Application Services]
    end

    subgraph Domain[Domain Layer]
        Entities[Entities]
        VO[Value Objects]
        DomainEvents[Domain Events]
        RepoInterfaces[Repository Interfaces]
    end

    subgraph Infrastructure[Infrastructure Layer]
        API[API Layer]
        Persistence[Persistence]
        External[External Services]
    end

    UI --> Hooks
    Hooks --> UseCases
    UseCases --> Entities
    UseCases --> RepoInterfaces
    AppServices --> DomainEvents
    RepoInterfaces --> Persistence
    Persistence --> API
    API --> External
```

## 2. تدفق البيانات الجديد (مع Event-Driven AI)

```mermaid
sequenceDiagram
    participant User
    participant AIChat as AI Chat
    participant EventBus as Event Bus
    participant Domains as Domain Modules
    participant DB as Database

    User->>AIChat: طلب إضافة منتج
    AIChat->>AIChat: parseAction()
    AIChat->>EventBus: emit(AI_ADD_PRODUCT)
    EventBus->>Domains: dispatch to Inventory
    Domains->>DB: insert product
    Domains-->>EventBus: success
    EventBus-->>AIChat: done
    AIChat-->>User: ✅ تم إضافة المنتج
```

## 3. هرمية مفاتيح React Query الموحدة

```mermaid
graph TD
    Root[Query Keys Root]
    
    Sales[Sales Keys]
    Inventory[Inventory Keys]
    Accounting[Accounting Keys]
    Parties[Parties Keys]
    
    SalesList[Lists]
    SalesDetail[Details]
    SalesStats[Stats]
    
    InvProducts[Products]
    InvWarehouses[Warehouses]
    InvStock[Stock]
    
    Root --> Sales
    Root --> Inventory
    Root --> Accounting
    Root --> Parties
    
    Sales --> SalesList
    Sales --> SalesDetail
    Sales --> SalesStats
    
    Inventory --> InvProducts
    Inventory --> InvWarehouses
    Inventory --> InvStock
```

## 4. نظام معالجة الأخطاء الموحد

```mermaid
graph TD
    ErrorSource[Error Source]
    
    Validation[Validation Error]
    API[API Error]
    Business[Business Error]
    
    AppError[AppError Class]
    
    Handler[Error Handler]
    Logger[Logger]
    Toast[Toast Notification]
    Boundary[Error Boundary]
    
    ErrorSource --> Validation
    ErrorSource --> API
    ErrorSource --> Business
    
    Validation --> AppError
    API --> AppError
    Business --> AppError
    
    AppError --> Handler
    Handler --> Logger
    Handler --> Toast
    Handler --> Boundary
```

## 5. معمارية AI المستقلة

```mermaid
graph TB
    subgraph AI[AI Module]
        Core[AI Core Engine]
        Providers[Providers]
        Features[AI Features]
        Plugins[Plugin System]
    end

    subgraph ProvidersList[AI Providers]
        Gemini[Google Gemini]
        OpenRouter[OpenRouter]
        Local[Local Models]
    end

    subgraph Events[Event System]
        EventBus[Event Bus]
        Handlers[Event Handlers]
    end

    subgraph Domains[Domain Modules]
        Sales[Sales]
        Inventory[Inventory]
        Accounting[Accounting]
        Parties[Parties]
    end

    Core --> Providers
    Providers --> Gemini
    Providers --> OpenRouter
    Providers --> Local
    
    Features --> EventBus
    EventBus --> Handlers
    Handlers --> Sales
    Handlers --> Inventory
    Handlers --> Accounting
    Handlers --> Parties
    
    Plugins --> Core
```

## 6. تدفق Error Handling الموحد

```mermaid
sequenceDiagram
    participant Component
    participant Hook
    participant Service
    participant API
    participant ErrorHandler

    Component->>Hook: useMutation
    Hook->>Service: call service
    Service->>API: supabase call
    API-->>Service: error
    Service->>ErrorHandler: throw AppError
    ErrorHandler-->>Hook: return [null, error]
    Hook-->>Component: onError callback
    Component->>Component: showToast(error.message)
```

## 7. Type Safety Flow

```mermaid
graph LR
    DB[(Database)] -->|supabase gen types| Types[database.types.ts]
    Types --> Domain[Domain Types]
    Types --> API[API Types]
    Domain --> Services
    API --> Services
    Services --> Hooks
    Hooks --> Components
    
    style Types fill:#90EE90
    style Domain fill:#87CEEB
    style API fill:#87CEEB
```

## 8. Before/After Comparison

### Before (Current State)
```mermaid
graph TB
    subgraph Before[الحالة الحالية - ارتباط عالي]
        AI1[AI Actions]
        S1[Sales Service]
        I1[Inventory Service]
        P1[Parties Service]
        B1[Bonds Service]
        E1[Expenses Service]
        
        AI1 --> S1
        AI1 --> I1
        AI1 --> P1
        AI1 --> B1
        AI1 --> E1
    end
```

### After (Target State)
```mermaid
graph TB
    subgraph After[الحالة المستهدفة - Event Driven]
        AI2[AI Actions]
        EB[Event Bus]
        S2[Sales Handler]
        I2[Inventory Handler]
        P2[Parties Handler]
        B2[Bonds Handler]
        E2[Expenses Handler]
        
        AI2 --> EB
        EB --> S2
        EB --> I2
        EB --> P2
        EB --> B2
        EB --> E2
    end
```

## 9. API Contract Standardization

```mermaid
graph LR
    subgraph BeforeAPI[Before - Mixed Patterns]
        B1[return data directly]
        B2[{data, error}]
        B3[throw error]
        B4[return null on error]
    end

    subgraph AfterAPI[After - Unified Pattern]
        A1[ApiResponse<T>]
        A2[{data, error, success}]
        A3[Consistent metadata]
    end

    BeforeAPI -->|Standardize| AfterAPI
```

## 10. Migration Timeline

```mermaid
gantt
    title خطة التنفيذ الزمنية
    dateFormat  YYYY-MM-DD
    section المرحلة 1
    Type Safety           :a1, 2026-03-01, 14d
    Error Handling        :a2, after a1, 7d
    API Contracts         :a3, after a2, 7d
    section المرحلة 2
    AI Decoupling         :b1, after a3, 7d
    Query Keys            :b2, after b1, 7d
    Naming Conventions    :b3, after b2, 7d
    section المرحلة 3
    Clean Architecture    :c1, after b3, 14d
    AI Architecture       :c2, after c1, 7d
    Testing               :c3, after c2, 7d
```
