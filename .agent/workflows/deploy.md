---
description: Stage, commit, push, build, and deploy the application
---

// turbo-all
1. Stage all changes
```bash
git add . > deploy_git_add.log 2>&1
```

2. Commit changes with timestamp
```bash
git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')" > deploy_git_commit.log 2>&1 || echo "No changes to commit"
```

3. Push changes to remote
```bash
git push > deploy_git_push.log 2>&1
```

4. Build Docker images
```bash
docker compose build > deploy_docker_build.log 2>&1
```

5. Deploy application (recreate containers)
```bash
docker compose up -d > deploy_docker_up.log 2>&1
```
