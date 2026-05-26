# EC2 Deployment Guide

This guide walks you through getting the app running on an AWS EC2 instance from scratch.
No prior server experience needed — follow the steps in order.

> **Corporate / Company deployment?** Read this first:
> - **Do not assign a public IP to the EC2 instance.** Keep it in a private subnet. Access it from within your company VPN or via a bastion host / AWS Systems Manager.
> - **Do not open ports to `0.0.0.0/0`.** Restrict all inbound rules to your company's VPN CIDR range or your AWS internal security groups only.
> - **Use HTTPS, not HTTP.** Put an Application Load Balancer (ALB) in front and attach an ACM certificate. Never expose port 3000 directly to the internet.
> - **Use a domain name, not an IP address.** Your company's DNS or a Route 53 private hosted zone should resolve to the ALB or the instance's private IP. This is what goes in `NEXTAUTH_URL`.
> - **Use SSM Session Manager for shell access** instead of opening port 22. No key file, no open SSH port, full audit trail. See Part 3.1.

---

## Part 1 — Things to do BEFORE touching EC2

### 1.1 — Make sure your code is pushed to GitHub

Everything on EC2 will come from your Git repo.

```bash
git add .
git commit -m "ready for ec2"
git push origin main
```

### 1.2 — Enable Bedrock model access in AWS Console

The AI won't work unless you turn on the Claude model in Bedrock.

1. Go to: **AWS Console → Amazon Bedrock → Model access** (left sidebar)
2. Click **Manage model access**
3. Find **Anthropic → Claude 3 Sonnet** and tick it
4. Click **Save changes** — it activates within a minute

### 1.3 — Create an S3 bucket for file uploads

1. Go to: **AWS Console → S3 → Create bucket**
2. Name it: `dim-wiz-uploads` (or anything — just note the name)
3. Region: `us-east-1` (or wherever your EC2 will be)
4. Leave everything else as default → **Create bucket**

---

## Part 2 — Create the EC2 Instance

### 2.1 — Launch a new instance

1. Go to: **AWS Console → EC2 → Launch Instance**
2. Fill in:
   - **Name:** `modelling-agent`
   - **AMI:** Ubuntu Server 22.04 LTS (free tier eligible)
   - **Instance type:** `t3.medium` (the app needs a bit of RAM to build)
   - **Key pair:** For corporate use, select **"Proceed without a key pair"** — you will use SSM Session Manager for shell access instead (see Part 3.1). If your company requires a key pair for compliance, create one and store it in your company's secrets vault.
3. Under **Network settings:**
   - Place the instance in your **private subnet** (not a public subnet)
   - **Do not** tick "Auto-assign public IP"
   - **Do not** tick "Allow HTTP traffic from the internet" or "Allow HTTPS traffic from the internet" — traffic should enter via an ALB, not the instance directly
4. Click **Launch instance**

### 2.2 — Configure the Security Group

Create (or update) the security group for your instance. For a corporate deployment, **no port should be open to `0.0.0.0/0`**.

**Inbound rules you need:**

| Rule | Port | Source | Why |
|---|---|---|---|
| Custom TCP | `3000` | Your ALB's security group (preferred) or your VPN CIDR (e.g. `10.x.x.x/16`) | App traffic comes from the load balancer, not the internet |
| SSH (only if not using SSM) | `22` | Your company's VPN CIDR range only | Shell access — omit entirely if using SSM |

> **How to find your VPN CIDR:** Ask your IT/network team for the internal IP range. It typically looks like `10.0.0.0/8` or `172.16.0.0/12`. Never use `0.0.0.0/0` for a company deployment.

**If using an ALB (recommended):**
- Create a separate security group for the ALB that accepts `443` from `0.0.0.0/0`
- The EC2 security group accepts port `3000` only from the ALB's security group
- This way the instance is never directly reachable from the internet

### 2.3 — Create and attach an IAM Role for Bedrock access

This lets the EC2 instance talk to Bedrock without needing secret keys in a file.

1. Go to: **AWS Console → IAM → Roles → Create role**
2. Trusted entity: **AWS service → EC2**
3. Add these permissions:
   - `AmazonBedrockFullAccess`
   - `AmazonS3FullAccess`
   - `AmazonSSMManagedInstanceCore` ← **required for SSM Session Manager shell access**
4. Name it: `ec2-modelling-agent-role` → **Create role**
5. Go back to EC2 → select your instance → **Actions → Security → Modify IAM role**
6. Pick `ec2-modelling-agent-role` → **Update IAM role**

> With this role attached you do NOT need `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` in your env file.

---

## Part 3 — Connect to EC2 and Set Up the Server

### 3.1 — Connect to your instance (SSM Session Manager — recommended for corporate)

**No SSH key needed. No port 22 needed. Works from within your company network.**

1. Go to: **AWS Console → EC2 → Instances** → select your instance
2. Click **Connect** → choose the **Session Manager** tab → click **Connect**

A browser-based terminal opens. You are now inside the server.

> **Prerequisite:** The IAM role attached to the instance must include `AmazonSSMManagedInstanceCore` (added in Step 2.3). The SSM Agent comes pre-installed on Ubuntu 22.04.

**Alternative — SSH (only if your company requires it and port 22 is open to your VPN):**

```bash
# Move the key file and restrict permissions
chmod 400 ~/Downloads/modelling-agent-key.pem

# SSH in using the instance's PRIVATE IP (not public — there is no public IP)
ssh -i ~/Downloads/modelling-agent-key.pem ubuntu@PRIVATE_IP
```

### 3.2 — Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # should print v20.x.x
```

### 3.3 — Install PM2 (keeps the app running after you log out)

```bash
sudo npm install -g pm2
```

### 3.4 — Install Git

```bash
sudo apt-get install -y git
```

---

## Part 4 — Deploy the App

### 4.1 — Clone your repo

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git app
cd app
```

### 4.2 — Create the environment file

```bash
nano .env.local
```

Paste the following — replace the values marked with `YOUR_`:

```
DATABASE_URL="file:./prisma/prod.db"
NEXTAUTH_SECRET="YOUR_RANDOM_SECRET_HERE"
NEXTAUTH_URL="https://YOUR_INTERNAL_DOMAIN_OR_ALB_DNS"
AWS_REGION="us-east-1"
S3_BUCKET_NAME="dim-wiz-uploads"
```

> **`NEXTAUTH_URL` for corporate deployments:**
> - If behind an ALB with a domain name: `https://dimwiz.yourcompany.internal`
> - If accessed directly on the private network without a domain: `http://PRIVATE_IP:3000`
> - **Never use a public IP here.** NextAuth uses this URL for redirect callbacks — if it doesn't match where users actually browse to, login will fail.

> **How to generate NEXTAUTH_SECRET:** Run this on your LOCAL machine and copy the output:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```
> For a company deployment, consider storing this secret in **AWS Secrets Manager** and injecting it at startup rather than writing it to a file on disk.

Save the file: press `Ctrl + X` → `Y` → Enter

### 4.3 — Install dependencies

```bash
npm install
```

This will take 1–2 minutes.

### 4.4 — Set up the database

```bash
npx prisma migrate deploy
```

This creates all the database tables in `prisma/prod.db`.

### 4.5 — Build the app

```bash
npm run build
```

This will take 2–3 minutes. You should see "✓ Compiled successfully" at the end.

### 4.6 — Start the app with PM2

```bash
pm2 start npm --name "modelling-agent" -- start
pm2 save
pm2 startup   # follow the printed instruction to auto-start on reboot
```

### 4.7 — Open the app

Navigate to the app in your browser. The URL depends on your setup:

- **Via ALB + domain name (recommended):** `https://dimwiz.yourcompany.internal`
- **Via private IP on your VPN:** `http://PRIVATE_IP:3000`

You should see the login page.

> You will NOT have a public IP to visit. If you cannot reach the app, confirm you are connected to the company VPN and that the security group allows your IP range.

---

## Part 5 — Keeping it Running

### Check if the app is running
```bash
pm2 status
```

### View live logs (useful if something breaks)
```bash
pm2 logs modelling-agent
```

### Restart the app
```bash
pm2 restart modelling-agent
```

### Pull code changes and redeploy
```bash
cd ~/app
git pull origin main
npm install           # only needed if package.json changed
npm run build
pm2 restart modelling-agent
```

---

## Part 6 — Troubleshooting

| Problem | What to check |
|---|---|
| Page doesn't load | Are you on the company VPN? Is the security group allowing your IP range? Is the ALB healthy? |
| AI doesn't respond | Is Claude enabled in Bedrock Model Access? Is the IAM role attached? |
| Login redirect fails | Does `NEXTAUTH_URL` exactly match the URL you are browsing to (including `https://` vs `http://`)? |
| File upload fails | Does the S3 bucket exist? Is the IAM role attached? |
| "Cannot connect to DB" | Run `npx prisma migrate deploy` again |
| App crashes after reboot | Run `pm2 startup` and follow its instruction |
| Can't connect via SSM | Is `AmazonSSMManagedInstanceCore` in the IAM role? Is the instance running? |

---

## Quick Reference — What Each Env Variable Does

| Variable | What it does |
|---|---|
| `DATABASE_URL` | Where the app's own database is stored (users, projects, state) |
| `NEXTAUTH_SECRET` | Secret key that signs login sessions — must be random and private |
| `NEXTAUTH_URL` | The full URL of your app — NextAuth redirects use this |
| `AWS_REGION` | Which AWS region to use for Bedrock and S3 |
| `S3_BUCKET_NAME` | Name of the S3 bucket where uploaded files are stored |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Only needed if NOT using an IAM role on the instance |

---

## Part 7 — Corporate Network Architecture (Reference)

This shows what the setup looks like in a company environment vs. a personal/demo setup.

```
PERSONAL/DEMO:
  Internet → EC2 Public IP :3000

CORPORATE:
  Company VPN → ALB (HTTPS :443) → EC2 Private IP :3000
                                         ↑
                               No public IP on this instance
                               Access via SSM or bastion only
```

**What you need to sort out with your IT/Cloud team:**

| Item | What to ask for |
|---|---|
| VPC & private subnet | Which VPC and subnet should the EC2 sit in? |
| ALB | Can you provision an ALB to front the app? What port and certificate? |
| Internal DNS | What hostname should the app be reachable at? (goes in `NEXTAUTH_URL`) |
| VPN CIDR | What IP range do internal users come from? (goes in the security group rule) |
| S3 bucket | Should you create it, or does the cloud team provision it? |
| Bedrock region | Is Bedrock access approved in your org's AWS account? Which region? |
