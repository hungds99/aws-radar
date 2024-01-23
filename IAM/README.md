# Khởi đầu với AWS Cloud với IAM

## Overview

IAM là một trong những chủ đề quan trọng nhất trong AWS. Nó là một trong dịch vụ đầu tiên mà bạn cần phải nắm vững khi bắt đầu với AWS.

Vậy IAM là gì? IAM là viết tắt của Identity and Access Management. Nó là một dịch vụ quản lý quyền và cho phép bạn quản lý người dùng truy cập vào các tài nguyên AWS. Hiểu đơn giản là khi bạn muốn vào nhà một ai đó thì cần phải được chủ nhà cho phép.

Các thành phần chính trong IAM:

- IAM user: là một thực thể được xác định bởi một tên đăng nhập và mật khẩu. Người dùng này có thể được sử dụng để đăng nhập vào AWS Management Console và truy cập vào các tài nguyên AWS.
- IAM groups:
- IAM roles: Được xác định bởi một tên và một tập hợp các quyền truy cập. Nó không có bất kỳ thông tin xác thực nào và được sử dụng để cung cấp quyền truy cập .
- IAM policies: là đơn vị nhỏ nhất trong IAM được định nghĩa bằng cú pháp JSON. Nó được gán cho user, group hoặc role.

Khi tạo mới một tài khoản trên AWS, thì tài khoản đó được xem là tài khoản root. Nó được quyền truy cập vào tất cả dịch vụ trên AWS.
