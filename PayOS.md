# PayOS membership payment flow

Tài liệu này mô tả luồng thanh toán hiện tại cho tính năng trở thành member bằng PayOS, cùng với các trường hợp người dùng không thanh toán hoặc hủy thanh toán.

## 1. Tổng quan

Hiện tại, luồng thanh toán được triển khai ở ba lớp chính:

- UI: trang cài đặt membership tại [src/app/(main)/settings/page.tsx](<src/>app/(main)/settings/page.tsx>)
- API route: [src/app/api/membership/checkout/route.ts](src/app/api/membership/checkout/route.ts), [src/app/api/membership/confirm/route.ts](src/app/api/membership/confirm/route.ts) và [src/app/api/webhooks/payos/route.ts](src/app/api/webhooks/payos/route.ts)
- Service/business logic: [src/lib/services/membership.service.ts](src/lib/services/membership.service.ts)

## 2. Luồng thanh toán chính

### 2.1 Bắt đầu tạo phiên thanh toán

Khi người dùng nhấn nút “Thanh toán membership” trên trang cài đặt, hàm `handleStartMembership` trong [src/app/(main)/settings/page.tsx](<src/app/(main)/settings/page.tsx>) sẽ:

1. Tạo `returnUrl` dựa trên URL hiện tại và thêm tham số `tab=membership`.
2. Gọi `membershipCheckout.mutateAsync({ returnUrl })`.
3. Hook `useMembershipCheckout` trong [src/hooks/membership/useMembership.ts](src/hooks/membership/useMembership.ts) sẽ gửi request POST tới API [src/app/api/membership/checkout/route.ts](src/app/api/membership/checkout/route.ts).

API checkout sẽ:

- xác thực người dùng hiện tại,
- gọi `membershipService.createMembershipPaymentSession(current.id, parsed.returnUrl)` trong [src/lib/services/membership.service.ts](src/lib/services/membership.service.ts).

Trong service này, chức năng `createMembershipPaymentSession` sẽ:

- tạo một bản ghi `member_payments` với trạng thái `pending`,
- gọi PayOS để tạo phiên thanh toán,
- lấy `checkoutUrl`, `paymentRef` và thời gian hết hạn (`checkoutExpiresAt`),
- cập nhật lại bản ghi payment với `payment_ref`.

Sau đó, UI sẽ nhận về:

- `checkoutUrl`: đường dẫn mở PayOS,
- `paymentRef`: mã tham chiếu giao dịch,
- `checkoutExpiresAt`: thời điểm phiên checkout hết hạn.

### 2.2 Người dùng mở PayOS và thanh toán

Sau khi nhận được `checkoutUrl`, hàm `handleOpenCheckout` trong [src/app/(main)/settings/page.tsx](<src/app/(main)/settings/page.tsx>) sẽ mở link PayOS bằng `window.open(...)`.

Nếu người dùng thanh toán thành công, PayOS sẽ quay lại `returnUrl` và URL có thể mang các tham số như:

- `paymentRef`
- `paymentLinkId`
- `id`
- `orderCode`
- `status`

Trang settings có một effect trong [src/app/(main)/settings/page.tsx](<src/app/(main)/settings/page.tsx>) để đọc các tham số trên URL. Nếu phát hiện thông tin thanh toán, nó sẽ tự động gọi `membershipConfirm.mutateAsync({ paymentRef })` thông qua hook `useConfirmMembershipPayment` từ [src/hooks/membership/useMembership.ts](src/hooks/membership/useMembership.ts).

### 2.3 Xác nhận thanh toán thủ công hoặc tự động

Có hai cách xác nhận thanh toán hiện tại:

1. Tự động sau khi quay lại từ PayOS
   - Thực hiện trong `useEffect` ở [src/app/(main)/settings/page.tsx](<src/app/(main)/settings/page.tsx>).
   - Nếu URL có `paymentRef` và trạng thái phù hợp, hệ thống tự gọi API xác nhận.

2. Thủ công bằng nút “Xác nhận thanh toán”
   - Hàm `handleConfirmPayment` trong [src/app/(main)/settings/page.tsx](<src/app/(main)/settings/page.tsx>) sẽ đọc `paymentRef` từ input và gọi API xác nhận.

API xác nhận ở [src/app/api/membership/confirm/route.ts](src/app/api/membership/confirm/route.ts) sẽ:

- kiểm tra auth của người dùng,
- gọi `membershipService.confirmMembershipPaymentForUser(current.id, parsed.paymentRef)`.

Trong service [src/lib/services/membership.service.ts](src/lib/services/membership.service.ts), hàm `confirmMembershipPayment` sẽ:

- tìm bản ghi thanh toán bằng `payment_ref`,
- kiểm tra trạng thái hiện tại,
- gọi PayOS để verify giao dịch,
- nếu trạng thái là thành công thì cập nhật `member_payments.status = confirmed`,
- cập nhật `users.role = member`,
- thiết lập `expires_at` dựa trên thời gian hiện tại và số ngày membership.

## 3. Các trường hợp không thanh toán hoặc hủy thanh toán

### 3.1 Người dùng chưa hoàn tất thanh toán

Nếu người dùng mở PayOS nhưng không thanh toán, hoặc đóng tab trước khi hoàn tất:

- bản ghi `member_payments` vẫn ở trạng thái `pending`,
- hệ thống không tự động nâng role thành member,
- khi gọi xác nhận sau đó, service sẽ kiểm tra thời gian hết hạn của phiên checkout.

Hiện tại, thời gian checkout được giới hạn bằng `CHECKOUT_TIMEOUT_MS` trong [src/lib/services/membership.service.ts](src/lib/services/membership.service.ts), tức khoảng 10 phút. Nếu quá hạn:

- payment sẽ bị cập nhật thành `failed`,
- API trả về lỗi `408` với thông báo “Phiên checkout đã hết hạn sau 10 phút”.

### 3.2 Người dùng hủy thanh toán trên PayOS

Khi người dùng hủy giao dịch từ PayOS, webhook ở [src/app/api/webhooks/payos/route.ts](src/app/api/webhooks/payos/route.ts) sẽ nhận trạng thái từ PayOS. Nếu trạng thái là các giá trị như `failed`, `cancelled`, `declined`, `error`, hệ thống sẽ gọi `membershipService.markMembershipPaymentFailed(paymentRef)`.

Chức năng `markMembershipPaymentFailed` trong [src/lib/services/membership.service.ts](src/lib/services/membership.service.ts) sẽ cập nhật bản ghi payment thành `failed`.

> Lưu ý: hiện tại, luồng UI không có một hành động riêng biệt “hủy thanh toán” trực tiếp trên giao diện; việc xử lý hủy chủ yếu dựa vào webhook hoặc việc xác nhận thất bại sau khi PayOS trả về trạng thái không thành công.

### 3.3 Thanh toán không được xác nhận dù đã có paymentRef

Nếu người dùng nhập `paymentRef` nhưng giao dịch chưa được PayOS xác nhận, hàm `confirmMembershipPayment` sẽ:

- verify giao dịch với PayOS,
- nhận thấy status không phải “confirmed/success/completed/paid”,
- cập nhật payment status thành `failed`,
- trả về lỗi `402`.

## 4. Các hàm và file liên quan

- UI khởi tạo thanh toán: `handleStartMembership` trong [src/app/(main)/settings/page.tsx](<src/app/(main)/settings/page.tsx>)
- UI mở checkout: `handleOpenCheckout` trong [src/app/(main)/settings/page.tsx](<src/app/(main)/settings/page.tsx>)
- UI xác nhận thanh toán: `handleConfirmPayment` trong [src/app/(main)/settings/page.tsx](<src/app/(main)/settings/page.tsx>)
- Tự động xác nhận khi quay lại từ PayOS: effect URL params trong [src/app/(main)/settings/page.tsx](<src/app/(main)/settings/page.tsx>)
- Hook tạo checkout: `useMembershipCheckout` trong [src/hooks/membership/useMembership.ts](src/hooks/membership/useMembership.ts)
- Hook xác nhận payment: `useConfirmMembershipPayment` trong [src/hooks/membership/useMembership.ts](src/hooks/membership/useMembership.ts)
- API tạo checkout: [src/app/api/membership/checkout/route.ts](src/app/api/membership/checkout/route.ts)
- API xác nhận: [src/app/api/membership/confirm/route.ts](src/app/api/membership/confirm/route.ts)
- Webhook PayOS: [src/app/api/webhooks/payos/route.ts](src/app/api/webhooks/payos/route.ts)
- Logic nghiệp vụ chính: `createMembershipPaymentSession`, `confirmMembershipPayment`, `confirmMembershipPaymentForUser`, `markMembershipPaymentFailed` trong [src/lib/services/membership.service.ts](src/lib/services/membership.service.ts)
- Validation input: [src/lib/validations/membership.schema.ts](src/lib/validations/membership.schema.ts)

## 5. Kết luận

Luồng hiện tại đang hoạt động theo mô hình:

1. Tạo payment session ở backend.
2. Người dùng mở PayOS để thanh toán.
3. Hệ thống xác nhận giao dịch tự động hoặc thủ công bằng `paymentRef`.
4. Nếu giao dịch thành công, user được nâng lên role `member` và membership được gia hạn.
5. Nếu hủy hoặc không thanh toán, payment sẽ được đánh dấu `failed` sau webhook hoặc sau khi hết hạn phiên checkout.
