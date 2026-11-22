# Website quản lý và đặt mua phim

Sinh viên: **Nguyễn Anh Tuấn** — MSSV **33221020508**.

Website cho phép quản lý danh mục phim và thể loại, xem thông tin phim, thêm phim vào giỏ hàng và đặt hàng với thông tin giao hàng. Đây là bài tập ASP.NET Core MVC, sử dụng .NET 10, Entity Framework Core, SQL Server, ASP.NET Core Identity, session, Bootstrap và jQuery. Dự án có chức năng gửi email xác nhận qua Gmail SMTP sau khi lưu đơn hàng.

Các chức năng chính:

- Xem, thêm, sửa, xóa phim và thể loại; tải lên ảnh phim.
- Thêm, xóa và cập nhật số lượng phim trong giỏ hàng lưu bằng session.
- Nhập thông tin giao hàng, lưu hóa đơn và chi tiết đơn hàng, hiển thị kết quả checkout.
- Có giao diện đăng ký, đăng nhập của ASP.NET Core Identity.

## Tình hình triển khai

Dự án website quản lý và đặt mua phim đã được hoàn thiện, kiểm thử trên
máy cá nhân và triển khai công khai trên Somee:

- Website: http://uehptudw33221020508.somee.com
- Mã nguồn được lưu trong thư mục `ASP-CORE/SourceCode` của repository.

Các nội dung đã thực hiện:

- Xây dựng giao diện website và cá nhân hóa theo thông tin sinh viên.
- Xây dựng chức năng hiển thị, quản lý phim và thể loại phim.
- Xây dựng các chức năng tài khoản người dùng.
- Xây dựng giỏ hàng: thêm phim, cập nhật số lượng và xóa sản phẩm.
- Xây dựng chức năng thanh toán, nhập thông tin giao hàng và lưu đơn hàng.
- Kết nối ứng dụng với cơ sở dữ liệu và thực hiện các migration cần thiết.
- Xây dựng chức năng gửi email xác nhận sau khi đặt hàng.
- Publish ứng dụng và triển khai website lên Somee.

Khi kiểm thử trên máy cá nhân trước khi triển khai, chức năng gửi email
xác nhận đơn hàng hoạt động. Sau khi triển khai lên Somee, website vẫn
ghi nhận và lưu đơn hàng, nhưng email xác nhận chưa được gửi thành công.

Nguyên nhân cần tiếp tục kiểm tra. Một khả năng là cấu hình tài khoản
email được lưu trong User Secrets trên máy cá nhân không tự động đi kèm
bản publish, nên ứng dụng trên Somee chưa nhận được thông tin cần thiết.
Ngoài ra, cần kiểm tra xác thực tài khoản gửi và khả năng kết nối SMTP
từ hosting trước khi kết luận nguyên nhân.

Hướng khắc phục là cấu hình thông tin gửi email an toàn trên môi trường
hosting, kiểm tra nhật ký ứng dụng và xác nhận kết nối tới dịch vụ SMTP.
Thông tin đăng nhập và mật khẩu ứng dụng không được đưa lên repository.

## Cấu trúc

```text
ASP-CORE/
├── README.md
├── .gitignore
└── SourceCode/
    ├── Controllers/       # Xử lý phim, thể loại và checkout
    ├── Data/              # EF Core DbContext
    ├── Extension/         # Session và email SMTP
    ├── Migrations/        # Các migration EF Core
    ├── Models/            # Phim, thể loại, hóa đơn, giao hàng
    ├── Views/             # Razor views
    ├── Areas/             # Cấu hình view cho Identity
    ├── Validation/        # Kiểm tra dữ liệu
    ├── wwwroot/           # CSS, JavaScript, thư viện và ảnh
    ├── Properties/        # Cấu hình chạy cục bộ
    ├── appsettings.example.json
    └── Program.cs, 33221020508_NguyenAnhTuan.csproj
```

## Cấu hình và chạy

1. Cài .NET SDK 10 và SQL Server; tạo hoặc chọn một SQL Server có tài khoản đủ quyền tạo cơ sở dữ liệu và áp dụng migration. Mở terminal trong `ASP-CORE/SourceCode`.
2. Sao chép `appsettings.example.json` thành `appsettings.json`, rồi thay `ConnectionStrings:DefaultConnection` bằng chuỗi kết nối SQL Server của bạn. Ví dụ dùng Windows Authentication trên máy cục bộ: `Server=localhost;Database=MvcMovieSample;Trusted_Connection=True;TrustServerCertificate=True`. Điều chỉnh server và phương thức xác thực theo môi trường. File `appsettings.json` đã được bỏ qua bởi Git. Không đưa thông tin kết nối thật vào file mẫu.
3. Cấu hình email là tùy chọn: đặt `Email:Address` và `Email:AppPassword` bằng User Secrets trong môi trường Development, hoặc dùng biến môi trường tương ứng `Email__Address` và `Email__AppPassword`. Nếu không cấu hình, đơn hàng vẫn được lưu nhưng email không được gửi. Không đưa thông tin thật vào repository.
4. Khôi phục thư viện, cài công cụ EF nếu cần và áp dụng migration:

   ```powershell
   dotnet restore
   dotnet tool install --global dotnet-ef --version 10.*
   dotnet ef database update
   ```

   Nếu đã cài `dotnet-ef`, cập nhật lên phiên bản 10 tương thích thay vì cài lại. Các lệnh EF dùng cấu hình Development và cần kết nối SQL Server hợp lệ. Migration tạo cấu trúc cơ sở dữ liệu; bản nộp không kèm dữ liệu mẫu.
5. Chạy `dotnet run`, sau đó mở địa chỉ hiển thị trong terminal. Để cấu hình email bằng User Secrets, có thể chạy `dotnet user-secrets set "Email:Address" "<địa chỉ Gmail>"` và `dotnet user-secrets set "Email:AppPassword" "<mật khẩu ứng dụng>"` cục bộ. User Secrets dành cho phát triển; môi trường triển khai cần cơ chế cấu hình bí mật riêng.

Không commit cơ sở dữ liệu, cấu hình cá nhân, mật khẩu hoặc kết quả build/publish. Ảnh trong `wwwroot/images` được giữ cùng mã nguồn, nhưng dữ liệu phim liên kết tới ảnh cần được tạo trong cơ sở dữ liệu của môi trường chạy.
