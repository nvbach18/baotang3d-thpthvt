# baotang3d-thpthvt

## Sử dụng bảo tàng

Mở trang chủ của dự án để vào thẳng bảo tàng ảo. Để chạy bản này offline trên Windows, đặt toàn bộ tệp dự án cùng thư mục; thư viện Three.js, mô hình, video và ảnh tư liệu chiến dịch chống quân Thanh trong `assets` đã có sẵn. Nhấp đúp `run-local.bat` để chạy máy chủ cục bộ; trình duyệt sẽ mở bảo tàng tại `http://127.0.0.1:8766/museum-fixed.html`.

Để tắt máy chủ, đóng cửa sổ PowerShell được mở cùng bảo tàng. Không mở trực tiếp tệp HTML bằng `file://`, vì trình duyệt chặn việc tải mô hình 3D và video theo chính sách bảo mật.

Để tạo lại gói ZIP sau khi thay đổi dữ liệu dự án, chạy `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\build-offline-package.ps1`.