# Sổ thu chi cá nhân

## Chạy ứng dụng

1. Giải nén file ZIP, mở **thư mục SoThuChi chứa file server.mjs** trong VS Code.
2. Chọn Terminal → New Terminal. Kiểm tra Node.js bằng `node -v`. Ứng dụng cần Node.js 22.13 trở lên.
3. Gõ `node server.mjs` và nhấn Enter. Mở http://127.0.0.1:3020. Giữ Terminal mở trong khi sử dụng, nhấn Ctrl+C để dừng.
4. Trường hợp Terminal đang ở thư mục cha, nhập `cd .\SoThuChi` trước khi chạy. Nếu báo EADDRINUSE, dùng PowerShell gõ `$env:PORT = 3021`, tiếp theo `node server.mjs`, rồi mở http://127.0.0.1:3021.

Ứng dụng sử dụng Node.js và SQLite, không cần chạy npm install. Mỗi bản giải nén là một bản riêng và sử dụng file database trong chính thư mục đó.

## Các chức năng

- Nhấn **Thêm giao dịch**, nhập tên, loại, danh mục, số tiền, ngày, trạng thái và ghi chú. Số tiền là số nguyên dương, đơn vị đồng.
- Bấm biểu tượng bút để sửa, dấu X để xóa và xác nhận. Chọn trạng thái ngay tại mỗi dòng.
- **Dự kiến** là khoản chưa thu hoặc chưa chi. **Đã thực hiện** là khoản đã phát sinh.
- Bộ lọc tìm kiếm, tháng, loại và trạng thái tác động đến danh sách, thẻ tổng quan và trang thống kê. Khi mới mở, ứng dụng lọc theo tháng hiện tại. Bấm **Xóa bộ lọc** để xem tất cả thời gian.
- Tổng thu và tổng chi chỉ tính các giao dịch **Đã thực hiện** thuộc bộ lọc hiện tại. Chênh lệch = tổng thu − tổng chi. Đây là chênh lệch giao dịch đã ghi trong phạm vi lọc. Ứng dụng chưa theo dõi số dư đầu kỳ hay số dư từng ví.
- Chọn **Thống kê** ở menu để xem số giao dịch và tổng tiền theo danh mục, loại. Bảng này chỉ tính giao dịch đã thực hiện thuộc bộ lọc hiện tại.
- Có sẵn bảy giao dịch mẫu. Khi đã xóa dữ liệu mẫu, ứng dụng không tự thêm lại.

## Xem và minh chứng database

Database được lưu tại `SoThuChi/data/thu_chi.sqlite`. Trong VS Code, dùng tiện ích **SQLite Viewer**, bấm file này và chọn bảng **transactions**. Sau khi thêm, sửa hoặc xóa từ web, bấm nút mũi tên vòng tròn trong SQLite Viewer để tải lại. Chụp ảnh bảng cùng cây thư mục data để minh chứng.

Các cột gồm id (mã), title (tên), kind (income: thu, expense: chi), category (danh mục), amount (đồng), transaction_date (ngày), status (planned: dự kiến, completed: đã thực hiện), note (ghi chú), created_at và updated_at. Cấu trúc tạo bảng nằm trong `schema.sql`. Bảng app_settings đánh dấu đã khởi tạo dữ liệu mẫu.

Câu SQL tham khảo khi dùng công cụ hỗ trợ truy vấn SQLite:

```sql
SELECT title, kind, amount, transaction_date, status FROM transactions ORDER BY transaction_date DESC;
SELECT kind, SUM(amount) AS tong_tien FROM transactions WHERE status = 'completed' GROUP BY kind;
```

## Cách trình bày

1. Mở Tổng quan, giới thiệu tổng thu, tổng chi và chênh lệch của các giao dịch đã thực hiện trong tháng đang lọc.
2. Thêm một khoản chi dự kiến 100.000 đồng. Kiểm tra khoản này xuất hiện trong danh sách và tổng chi chưa đổi.
3. Chuyển sang Đã thực hiện. Tổng chi tăng 100.000 đồng và chênh lệch giảm 100.000 đồng. Mở Thống kê để xem danh mục tương ứng.
4. Sửa thông tin, tải lại trang và đối chiếu dữ liệu trong bảng transactions. Cuối cùng xóa bản ghi thử và xác nhận.
5. Ba ảnh giao diện trong thư mục Minh_chung minh họa bảng tổng quan, biểu mẫu và thống kê. Khi nộp, bạn có thể tự chụp thêm ảnh dữ liệu thực tế của mình.

