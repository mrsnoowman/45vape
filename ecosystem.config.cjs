module.exports = {
  apps: [
    {
      name: "45vape",
      cwd: "/home/USER/45vape-next",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      max_memory_restart: "512M",
    },
  ],
};
