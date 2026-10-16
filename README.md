# baotang3d-thpthvt

## Chạy bảo tàng offline trên Windows

Bản dự án đã kèm thư viện Three.js và GLTFLoader trong `vendor/three`. Nhấp đúp `run-local.bat` để chạy máy chủ cục bộ; trình duyệt sẽ mở bảo tàng tại `http://127.0.0.1:8766/museum-fixed.html`. Sau khi có đủ các tệp dự án, có thể ngắt Internet.

Để tắt máy chủ, đóng cửa sổ PowerShell được mở cùng bảo tàng. Không mở trực tiếp tệp HTML bằng `file://`, vì trình duyệt chặn việc tải mô hình 3D và video theo chính sách bảo mật.