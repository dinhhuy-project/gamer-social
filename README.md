# Cấu trúc thư mục — Gamer Social Network

```
gamer-social/
├── prisma/
│   ├── schema.prisma               # Toàn bộ data model
│   ├── migrations/                 # Auto-generated bởi prisma migrate
│   └── seed.ts                     # Seed tags, admin account
│
├── public/
│   ├── icons/
│   └── og-image.png
│
└── src/
    ├── app/                        # Next.js App Router
    │   │
    │   ├── (auth)/                 # Route group — không có layout chung
    │   │   ├── login/
    │   │   │   └── page.tsx
    │   │   ├── register/
    │   │   │   └── page.tsx
    │   │   └── layout.tsx          # Layout tối giản: chỉ logo + form
    │   │
    │   ├── (main)/                 # Route group — có sidebar + topbar
    │   │   ├── layout.tsx          # Shell: <Sidebar /> + <Topbar /> + {children}
    │   │   │
    │   │   ├── feed/
    │   │   │   └── page.tsx        # Bảng tin chính
    │   │   │
    │   │   ├── explore/
    │   │   │   └── page.tsx        # Khám phá bài viết, tìm kiếm theo tag
    │   │   │
    │   │   ├── posts/
    │   │   │   └── [id]/
    │   │   │       └── page.tsx    # Chi tiết bài viết + comment
    │   │   │
    │   │   ├── marketplace/
    │   │   │   ├── page.tsx        # Danh sách bài đăng mua bán (approved)
    │   │   │   └── [id]/
    │   │   │       └── page.tsx    # Chi tiết bài đăng + nút "Liên hệ ngay"
    │   │   │
    │   │   ├── messages/
    │   │   │   ├── page.tsx        # Danh sách conversations (inbox)
    │   │   │   └── [conversationId]/
    │   │   │       └── page.tsx    # Giao diện chat
    │   │   │
    │   │   ├── profile/
    │   │   │   └── [username]/
    │   │   │       └── page.tsx    # Trang cá nhân người dùng
    │   │   │
    │   │   ├── saved/
    │   │   │   └── page.tsx        # Bài viết đã lưu
    │   │   │
    │   │   ├── notifications/
    │   │   │   └── page.tsx        # Tất cả notifications
    │   │   │
    │   │   └── settings/
    │   │       ├── page.tsx        # Cài đặt tài khoản chung
    │   │       └── membership/
    │   │           └── page.tsx    # Đăng ký / gia hạn hội viên
    │   │
    │   ├── admin/                  # Route group riêng cho admin
    │   │   ├── layout.tsx          # Guard: chỉ role = 'admin' mới qua
    │   │   ├── page.tsx            # Dashboard tổng quan
    │   │   ├── listings/
    │   │   │   └── page.tsx        # Duyệt bài đăng marketplace
    │   │   ├── transactions/
    │   │   │   └── page.tsx        # Theo dõi giao dịch
    │   │   └── users/
    │   │       └── page.tsx        # Quản lý người dùng
    │   │
    │   └── api/                    # Route Handlers (REST API)
    │       │
    │       ├── auth/
    │       │   └── callback/
    │       │       └── route.ts    # Supabase OAuth callback
    │       │
    │       ├── me/
    │       │   └── route.ts        # GET /api/me — current user profile
    │       │
    │       ├── users/
    │       │   └── [username]/
    │       │       ├── route.ts         # GET profile công khai
    │       │       └── follow/
    │       │           └── route.ts     # POST/DELETE follow
    │       │
    │       ├── posts/
    │       │   ├── route.ts             # GET (feed/search) | POST (tạo bài)
    │       │   └── [id]/
    │       │       ├── route.ts         # GET | PATCH | DELETE
    │       │       ├── reactions/
    │       │       │   └── route.ts     # POST/DELETE react
    │       │       ├── comments/
    │       │       │   └── route.ts     # GET | POST
    │       │       └── save/
    │       │           └── route.ts     # POST/DELETE lưu bài
    │       │
    │       ├── comments/
    │       │   └── [id]/
    │       │       ├── route.ts         # PATCH | DELETE
    │       │       └── reactions/
    │       │           └── route.ts     # POST/DELETE react
    │       │
    │       ├── tags/
    │       │   └── route.ts             # GET danh sách tags
    │       │
    │       ├── conversations/
    │       │   ├── route.ts             # GET (inbox) | POST (tạo conversation)
    │       │   └── [id]/
    │       │       ├── route.ts         # GET chi tiết conversation
    │       │       ├── messages/
    │       │       │   └── route.ts     # GET (lịch sử) | POST (gửi tin)
    │       │       ├── confirm-trade/
    │       │       │   └── route.ts     # POST — xác nhận bắt đầu GD
    │       │       └── complete-trade/
    │       │           └── route.ts     # POST (admin) — hoàn thành / huỷ GD
    │       │
    │       ├── notifications/
    │       │   ├── route.ts             # GET danh sách
    │       │   └── read-all/
    │       │       └── route.ts         # POST — đánh dấu tất cả đã đọc
    │       │
    │       ├── membership/
    │       │   ├── checkout/
    │       │   │   └── route.ts         # POST — tạo link PayOS
    │       │   └── status/
    │       │       └── route.ts         # GET — kiểm tra hội viên còn hiệu lực
    │       │
    │       ├── admin/
    │       │   └── listings/
    │       │       └── [id]/
    │       │           └── review/
    │       │               └── route.ts # PATCH — approve / reject
    │       │
    │       └── webhooks/
    │           └── payos/
    │               └── route.ts         # POST — PayOS payment webhook
    │
    ├── components/                 # Shared UI components
    │   │
    │   ├── ui/                     # shadcn/ui primitives (Button, Input, Dialog…)
    │   │   ├── button.tsx
    │   │   ├── input.tsx
    │   │   ├── dialog.tsx
    │   │   ├── avatar.tsx
    │   │   ├── badge.tsx
    │   │   ├── dropdown-menu.tsx
    │   │   ├── tabs.tsx
    │   │   ├── sonner.tsx (toast)
    │   │   └── ...
    │   │
    │   ├── layout/                 # Shell components
    │   │   ├── Sidebar.tsx
    │   │   ├── Topbar.tsx
    │   │   ├── MobileNav.tsx
    │   │   └── NotificationBell.tsx
    │   │
    │   ├── post/                   # Mọi thứ liên quan đến bài đăng
    │   │   ├── PostCard.tsx        # Card hiển thị trên feed
    │   │   ├── PostDetail.tsx      # View đầy đủ của 1 bài
    │   │   ├── PostForm.tsx        # Form tạo / sửa bài (regular + marketplace)
    │   │   ├── PostActions.tsx     # Like, comment, save, share icons
    │   │   ├── PostMedia.tsx       # Hiển thị ảnh/video
    │   │   ├── PostTagList.tsx     # Danh sách tags gắn vào bài
    │   │   └── PostShareModal.tsx
    │   │
    │   ├── comment/
    │   │   ├── CommentList.tsx
    │   │   ├── CommentItem.tsx     # Hỗ trợ nested (parent + replies)
    │   │   └── CommentForm.tsx
    │   │
    │   ├── reaction/
    │   │   ├── ReactionBar.tsx     # Hiển thị tổng số + loại reaction
    │   │   └── ReactionPicker.tsx  # Popup chọn emoji cảm xúc
    │   │
    │   ├── marketplace/
    │   │   ├── ListingCard.tsx     # Card bài đăng mua bán trên danh sách
    │   │   ├── ListingDetail.tsx   # View chi tiết + nút "Liên hệ ngay"
    │   │   ├── ListingForm.tsx     # Form tạo bài đăng marketplace
    │   │   ├── ListingBadge.tsx    # Badge trạng thái (Chờ duyệt / Đã duyệt…)
    │   │   └── TradeConfirmButton.tsx  # Nút "Bắt đầu giao dịch" trong chat
    │   │
    │   ├── chat/
    │   │   ├── ConversationList.tsx    # Inbox — danh sách cuộc trò chuyện
    │   │   ├── ConversationItem.tsx    # 1 dòng trong inbox
    │   │   ├── ChatWindow.tsx          # Khung chat chính
    │   │   ├── MessageBubble.tsx       # Bubble tin nhắn
    │   │   ├── MessageInput.tsx        # Ô nhập + gửi tin nhắn
    │   │   ├── ChatHeader.tsx          # Header: avatar + tên + trạng thái GD
    │   │   └── TradeBanner.tsx         # Banner thông báo trạng thái giao dịch
    │   │
    │   ├── profile/
    │   │   ├── ProfileHeader.tsx       # Cover + avatar + bio + nút follow
    │   │   ├── ProfileStats.tsx        # Số followers, following, bài đăng
    │   │   └── FollowButton.tsx
    │   │
    │   ├── notification/
    │   │   ├── NotificationList.tsx
    │   │   └── NotificationItem.tsx    # Render theo type (reaction/comment/tx…)
    │   │
    │   ├── membership/
    │   │   ├── MembershipCard.tsx      # Thẻ hiển thị trạng thái hội viên
    │   │   ├── MembershipBadge.tsx     # Badge nhỏ hiển thị cạnh username
    │   │   └── CheckoutButton.tsx      # Nút thanh toán → tạo link PayOS
    │   │
    │   └── common/
    │       ├── UserAvatar.tsx          # Avatar + fallback initials
    │       ├── UserCard.tsx            # Mini card khi hover username
    │       ├── EmptyState.tsx          # Màn hình rỗng tái sử dụng
    │       ├── LoadingSpinner.tsx
    │       ├── InfiniteScroll.tsx      # Wrapper infinite loading
    │       ├── ImageUpload.tsx         # Upload ảnh lên Supabase Storage
    │       └── ConfirmDialog.tsx       # Dialog xác nhận hành động nguy hiểm
    │
    ├── hooks/                      # Custom React hooks
    │   ├── auth/
    │   │   ├── useUser.ts              # Current user + profile từ context
    │   │   └── useRequireAuth.ts       # Redirect nếu chưa đăng nhập
    │   │
    │   ├── posts/
    │   │   ├── usePosts.ts             # Fetch + infinite load danh sách bài
    │   │   ├── usePost.ts              # Fetch 1 bài
    │   │   └── usePostMutations.ts     # create / update / delete / react / save
    │   │
    │   ├── comments/
    │   │   └── useComments.ts          # Fetch + tạo / xoá comment
    │   │
    │   ├── chat/
    │   │   ├── useConversations.ts     # Fetch inbox
    │   │   ├── useMessages.ts          # Fetch lịch sử + send
    │   │   └── useRealtimeMessages.ts  # Subscribe Supabase Realtime
    │   │
    │   ├── notifications/
    │   │   ├── useNotifications.ts
    │   │   └── useRealtimeNotifications.ts
    │   │
    │   ├── membership/
    │   │   └── useMembership.ts        # Kiểm tra status + expires_at
    │   │
    │   └── common/
    │       ├── useIntersectionObserver.ts  # Infinite scroll trigger
    │       ├── useDebounce.ts
    │       └── useLocalStorage.ts
    │
    ├── lib/                        # Utilities & service clients
    │   │
    │   ├── prisma.ts               # Prisma Client singleton
    │   │
    │   ├── supabase/
    │   │   ├── client.ts           # Browser client (Client Components)
    │   │   ├── server.ts           # Server client (Server Components / API)
    │   │   └── admin.ts            # Service role client (webhooks, admin ops)
    │   │
    │   ├── payos/
    │   │   └── client.ts           # PayOS SDK instance + helper functions
    │   │
    │   ├── validations/            # Zod schemas — dùng chung client + server
    │   │   ├── post.schema.ts
    │   │   ├── comment.schema.ts
    │   │   ├── user.schema.ts
    │   │   ├── message.schema.ts
    │   │   └── membership.schema.ts
    │   │
    │   ├── services/               # Business logic thuần (không phụ thuộc HTTP)
    │   │   ├── membership.service.ts   # isActiveMember(), getExpiresAt()
    │   │   ├── notification.service.ts # createNotification() helper
    │   │   ├── post.service.ts         # getFeed(), searchPosts()
    │   │   ├── conversation.service.ts # getOrCreateConversation()
    │   │   └── trade.service.ts        # confirmTrade(), addAdminToChat()
    │   │
    │   ├── utils/
    │   │   ├── cn.ts               # clsx + tailwind-merge
    │   │   ├── format.ts           # formatDate, formatCurrency, formatNumber
    │   │   ├── slug.ts             # generateSlug()
    │   │   └── upload.ts           # uploadToSupabaseStorage()
    │   │
    │   └── constants/
    │       ├── routes.ts           # ROUTES.feed, ROUTES.profile(username)…
    │       ├── query-keys.ts       # React Query cache keys
    │       └── config.ts           # MEMBERSHIP_PRICE, COMMISSION_RATE…
    │
    ├── providers/                  # React Context Providers
    │   ├── AuthProvider.tsx        # User session + profile context
    │   ├── QueryProvider.tsx       # React Query (TanStack Query) setup
    │   └── ToastProvider.tsx       # Global toast notifications
    │
    ├── types/                      # TypeScript type definitions
    │   ├── database.types.ts       # Tự gen từ Supabase CLI (supabase gen types)
    │   ├── api.types.ts            # Request / Response types cho API routes
    │   └── ui.types.ts             # Props types cho components
    │
    └── middleware.ts               # Auth guard + role check cho routes
```

---

## Sơ đồ phụ thuộc giữa các layers

```
pages (app/)
    │  gọi hooks
    ▼
hooks/
    │  gọi fetch (API routes) hoặc Supabase Realtime
    ▼
app/api/  (Route Handlers)
    │  gọi services
    ▼
lib/services/
    │  gọi Prisma / Supabase Admin
    ▼
prisma.ts / supabase/admin.ts
    │
    ▼
PostgreSQL (Supabase)
```

**Quy tắc quan trọng:**

- `components/` không được import từ `app/api/` — chỉ giao tiếp qua `hooks/`
- `lib/services/` không được dùng `createClient` (browser) — chỉ dùng `prisma` hoặc `supabase/admin`
- `lib/validations/` được import bởi cả Route Handlers (server) lẫn components (client) để validate form
- `lib/constants/` chứa giá trị không đổi, không có logic

---

## Quy ước đặt tên file

| Loại            | Convention                      | Ví dụ                    |
| --------------- | ------------------------------- | ------------------------ |
| React Component | PascalCase.tsx                  | `PostCard.tsx`           |
| Hook            | camelCase với tiền tố `use`     | `useMessages.ts`         |
| Service         | camelCase với hậu tố `.service` | `trade.service.ts`       |
| Zod schema      | camelCase với hậu tố `.schema`  | `post.schema.ts`         |
| Route Handler   | `route.ts`                      | `app/api/posts/route.ts` |
| Type file       | camelCase với hậu tố `.types`   | `api.types.ts`           |
| Utility         | camelCase                       | `format.ts`, `cn.ts`     |
