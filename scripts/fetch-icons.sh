
#!/usr/bin/env bash
set -euo pipefail
mkdir -p public/icons/aws
cat <<EOF
Download the official AWS Architecture Icons (quarterly package) from:
  https://aws.amazon.com/architecture/icons/
Unzip and copy a minimal subset of SVGs into:
  public/icons/aws/Networking/Amazon-VPC.svg
  public/icons/aws/Networking/Amazon-VPC-Subnet.svg
  public/icons/aws/Networking/Amazon-VPC-Security-Group.svg
  public/icons/aws/Compute/Amazon-EC2.svg
  public/icons/aws/Storage/Amazon-S3.svg
EOF
