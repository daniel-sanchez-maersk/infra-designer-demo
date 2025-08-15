
# Infra Designer – drag & drop AWS → Terraform (VPC, Subnet, SG, EC2, S3)

This is a self-contained, containerized app that lets end‑users **drag & drop AWS resource icons** (VPC, Subnet, Security Group, EC2, S3) and generate **Terraform** behind the scenes.

- Runs locally in a single container (Podman on ARM64 Macs).  
- Stylish CSS, no library names appear in the GUI.  
- Resources are shown as **AWS icons** (see `scripts/fetch-icons.sh`).  
- **AWS naming rules** enforced client‑side for S3 and Security Groups; conservative checks for others.  
- Supports **temporary AWS session credentials** and profiles (`~/.aws`).  
- Includes **Destroy All** action and **auto S3 suffixes** for global uniqueness.

## Versions pinned
- **Node.js**: 22 (Active LTS as of Aug 2025).  
- **TypeScript**: 5.9.x  
- **Terraform CLI**: 1.12.2  
- **Terraform AWS Provider**: 6.8.0

> You can bump versions by editing the Dockerfile `ARG TF_VERSION` and `package.json`.

## Quick start (Podman on Apple Silicon)

```bash
# 1) (Optional) Fetch official AWS Architecture Icons into public/icons/aws
bash scripts/fetch-icons.sh

# 2) Build ARM64 image
podman build --platform=linux/arm64 -t infra-designer .

# 3) Run with your AWS profile or session credentials
podman run --rm -p 3000:3000   -e AWS_REGION=eu-west-1   -e AWS_PROFILE=default   -v $HOME/.aws:/home/node/.aws:ro   -v $PWD/state:/app/.tfwork   infra-designer

# If you use temporary creds instead of profile, pass them explicitly:
# -e AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY -e AWS_SESSION_TOKEN
```

Open http://localhost:3000 and drag AWS icons to the canvas. Select a block to name it. Click **Plan**, **Apply**, or **Destroy All**.

## Notes
- **Icons**: We do not redistribute AWS icons. Run `scripts/fetch-icons.sh` to download the official pack and place a subset into `public/icons/aws/`. The app will render icons from there and never shows library names.
- **State**: Terraform state is stored under `/app/.tfwork` (mounted from `./state` outside the container).
- **Profiles & sessions**: The Terraform AWS provider natively reads `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, **`AWS_SESSION_TOKEN`**, and `AWS_PROFILE`.
- **VPC topology**: The generator creates one VPC (10.0.0.0/16), one public subnet (10.0.1.0/24) if at least one Subnet block exists, an Internet Gateway and public route table, SGs, EC2 instances (Amazon Linux 2023 x86_64), and S3 buckets with random suffixes.

