# baotang3d-thpthvt

## Chạy bảo tàng offline trên Windows

Tải gói `bao-tang-ao-3d-offline.zip` từ trang chủ GitHub Pages và giải nén toàn bộ vào một thư mục. Gói đã kèm thư viện Three.js và GLTFLoader trong `vendor/three`, các mô hình và video. Nhấp đúp `run-local.bat` để chạy máy chủ cục bộ; trình duyệt sẽ mở bảo tàng tại `http://127.0.0.1:8766/museum-fixed.html`. Sau khi tải và giải nén, có thể ngắt Internet.

Để tắt máy chủ, đóng cửa sổ PowerShell được mở cùng bảo tàng. Không mở trực tiếp tệp HTML bằng `file://`, vì trình duyệt chặn việc tải mô hình 3D và video theo chính sách bảo mật.

Để tạo lại gói ZIP sau khi thay đổi dữ liệu dự án, chạy `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\build-offline-package.ps1`.