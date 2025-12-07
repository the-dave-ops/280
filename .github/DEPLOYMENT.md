# Deployment Setup Instructions

This project uses GitHub Actions to automatically deploy to a remote server via SSH.

## Required GitHub Secrets

You need to configure the following secrets in your GitHub repository:

### How to Add Secrets:
1. Go to your GitHub repository
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each of the following secrets:

### Required Secrets:

#### `SSH_HOST`
- **Description**: The IP address or hostname of your remote server
- **Example**: `192.168.1.100` or `myserver.example.com`

#### `SSH_USERNAME`
- **Description**: The SSH username to connect to the remote server
- **Example**: `ubuntu`, `root`, or your server username

#### `SSH_PRIVATE_KEY`
- **Description**: The private SSH key for authentication
- **How to get it**:
  ```bash
  # On your local machine, generate an SSH key pair if you don't have one:
  ssh-keygen -t ed25519 -C "github-actions-deploy"
  
  # Copy the PRIVATE key (keep this secret!):
  cat ~/.ssh/id_ed25519
  
  # Copy the PUBLIC key to your remote server:
  ssh-copy-id -i ~/.ssh/id_ed25519.pub username@your-server-ip
  ```
- **Note**: Copy the entire private key including the header and footer:
  ```
  -----BEGIN OPENSSH PRIVATE KEY-----
  ...
  -----END OPENSSH PRIVATE KEY-----
  ```

#### `SSH_PORT` (Optional)
- **Description**: SSH port number (defaults to 22 if not set)
- **Example**: `22` or `2222`

#### `PROJECT_PATH`
- **Description**: The absolute path to your project directory on the remote server
- **Example**: `/home/ubuntu/280-new-3` or `/var/www/optometry-app`

## Deployment Workflow

### Automatic Deployment
The workflow automatically triggers when you push to the `main` branch:
```bash
git push origin main
```

### Manual Deployment
You can also trigger deployment manually:
1. Go to your GitHub repository
2. Click on **Actions** tab
3. Select **Deploy to Production** workflow
4. Click **Run workflow** button
5. Select the branch and click **Run workflow**

## What the Workflow Does

1. **Connects to remote server** via SSH
2. **Navigates to project directory** (`$PROJECT_PATH`)
3. **Stops running containers**: `docker compose down`
4. **Pulls latest code**: `git pull`
5. **Rebuilds and starts containers**: `docker compose up --build -d`

## Troubleshooting

### Permission Denied
- Make sure the SSH public key is added to `~/.ssh/authorized_keys` on the remote server
- Check that the private key in GitHub secrets is correct and complete

### Docker Command Not Found
- Ensure Docker and Docker Compose are installed on the remote server
- Make sure the SSH user has permission to run Docker commands (add user to `docker` group):
  ```bash
  sudo usermod -aG docker $USER
  ```

### Git Pull Fails
- Ensure the remote server has git installed
- Make sure the repository is properly cloned on the remote server
- Check that the SSH user has read permissions for the project directory

### Path Not Found
- Verify the `PROJECT_PATH` secret points to the correct directory
- Ensure the path is absolute (starts with `/`)

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Use SSH keys** instead of passwords
3. **Limit SSH key permissions** - create a dedicated key for deployments
4. **Use a dedicated deployment user** on the remote server with minimal permissions
5. **Enable firewall** on the remote server and only allow necessary ports

## Example Setup on Remote Server

```bash
# 1. Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 2. Clone the repository
cd /home/ubuntu
git clone https://github.com/your-username/your-repo.git 280-new-3
cd 280-new-3

# 3. Create .env file with your configuration
cp .env.example .env
nano .env

# 4. Initial deployment
docker compose up -d
```

## Monitoring Deployments

- View deployment status in the **Actions** tab of your GitHub repository
- Check logs for each deployment run
- Monitor your application logs on the remote server:
  ```bash
  docker compose logs -f
  ```
